/**
 * 衛星資料載入與 SGP4 軌道計算
 *
 * 從 Supabase PostgREST 拉取 satellite_tle 表的 TLE 參數，
 * 用 satellite.js 在瀏覽器計算每顆衛星的即時位置與軌道弧線，
 * 轉換為 Flight 格式供現有渲染管線使用。
 *
 * 關鍵處理：
 * 1. 高度縮放：衛星高度 200-36,000 km，用 log 壓縮到航班等級（~10-50 km）
 * 2. 換日線斷開：軌道跨越 ±180° 時拆成多段 Flight，避免橫跨地圖的直線
 */

import * as satellite from "satellite.js";
import type { Flight, TrailPoint } from "../types";

// Supabase PostgREST 設定（從環境變數讀取）
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/** Supabase 回傳的 TLE 資料（含分類） */
export interface SatelliteTLE {
  norad_id: number;
  name: string;
  constellation: string;
  orbit_type: string; // LEO | MEO | GEO | HEO
  tle_line1: string;
  tle_line2: string;
  inclination: number;
  period_min: number;
  /** 用途分類 */
  category: string;
  /** UCS 營運國家 */
  country_operator: string | null;
}

/** 用途分類定義 */
export const CATEGORIES: Record<string, { en: string; zh: string; color: string }> = {
  starlink:   { en: "Starlink", zh: "星鏈", color: "#90caf9" },
  broadband:  { en: "Broadband", zh: "寬頻通訊", color: "#81d4fa" },
  phone:      { en: "Sat Phone / IoT", zh: "衛星電話/IoT", color: "#4fc3f7" },
  geo_comms:  { en: "GEO Comms", zh: "同步軌道通訊", color: "#ffb74d" },
  navigation: { en: "Navigation", zh: "導航定位", color: "#ce93d8" },
  earth_obs:  { en: "Earth Obs", zh: "地球觀測", color: "#81c784" },
  science:    { en: "Science", zh: "科學/太空站", color: "#fff176" },
  military:   { en: "Military", zh: "軍事/情報", color: "#ef5350" },
  tech_demo:  { en: "Tech Demo", zh: "技術展示", color: "#b0bec5" },
  other:      { en: "Other", zh: "其他", color: "#78909c" },
};

/** 顯示用標籤 */
export function categoryLabel(cat: string): string {
  const info = CATEGORIES[cat];
  if (!info) return cat;
  return info.zh;
}

/** 軌道類型 → 顏色對應（用於前端分色） */
export const ORBIT_COLORS: Record<string, string> = {
  LEO: "#4fc3f7",  // 淺藍
  MEO: "#ab47bc",  // 紫
  GEO: "#ffa726",  // 橘
  HEO: "#ef5350",  // 紅
};

/**
 * 衛星高度縮放：將 200-36,000 km 壓縮到視覺友善的範圍
 *
 * 航班高度約 10,000m (10km)，在 altExag=3 時渲染為 30,000m。
 * 衛星高度 400km-36,000km，如果不縮放會爆掉。
 *
 * 用 log 縮放讓不同軌道高度都看得出差異：
 *   LEO  400 km → ~12,000m 視覺高度
 *   MEO 20,000 km → ~30,000m
 *   GEO 36,000 km → ~35,000m
 */
function scaleAltitude(altMeters: number): number {
  const altKm = altMeters / 1000;
  if (altKm <= 0) return 0;
  // log 壓縮：log10(400) ≈ 2.6, log10(36000) ≈ 4.56
  // 映射到 8,000m ~ 40,000m 視覺範圍
  const logAlt = Math.log10(Math.max(altKm, 100));
  return (logAlt - 2.0) * 15000; // 2.0 → 0m, 4.56 → ~38,400m
}

/**
 * 從 Supabase 載入衛星 TLE 資料
 */
export async function loadSatelliteTLEs(): Promise<SatelliteTLE[]> {
  // 使用 satellite_classified view（含 category + country）
  const PAGE_SIZE = 5000;
  const baseUrl = `${SUPABASE_URL}/rest/v1/satellite_classified?select=norad_id,name,constellation,orbit_type,tle_line1,tle_line2,inclination,period_min,category,country_operator&order=norad_id`;
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    Prefer: "count=exact",
  };

  const allData: SatelliteTLE[] = [];
  let offset = 0;

  while (true) {
    const resp = await fetch(baseUrl, {
      headers: {
        ...headers,
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
      },
    });

    if (!resp.ok && resp.status !== 206) {
      throw new Error(`Failed to load satellite TLE: ${resp.status}`);
    }

    const page: SatelliteTLE[] = await resp.json();
    allData.push(...page);

    console.log(`[satellite] 載入 ${allData.length} 筆 TLE (offset=${offset})`);

    // 如果回傳不足一頁，代表已經拿完
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allData;
}

/**
 * 用 SGP4 計算衛星在指定時刻的地理位置
 */
function propagate(
  satrec: satellite.SatRec,
  date: Date,
): { lat: number; lng: number; altReal: number; altScaled: number } | null {
  const posVel = satellite.propagate(satrec, date);
  if (!posVel.position || typeof posVel.position === "boolean") return null;

  const gmst = satellite.gstime(date);
  const geo = satellite.eciToGeodetic(posVel.position, gmst);

  const altMeters = geo.height * 1000; // km → m

  return {
    lat: satellite.degreesLat(geo.latitude),
    lng: satellite.degreesLong(geo.longitude),
    altReal: altMeters,
    altScaled: scaleAltitude(altMeters),
  };
}

/**
 * 為一顆衛星計算軌道弧線
 */
function computeOrbitPath(
  satrec: satellite.SatRec,
  startTime: Date,
  durationMin: number,
  stepSec: number,
): TrailPoint[] {
  const points: TrailPoint[] = [];
  const totalSteps = Math.floor((durationMin * 60) / stepSec);

  for (let i = 0; i <= totalSteps; i++) {
    const t = new Date(startTime.getTime() + i * stepSec * 1000);
    const pos = propagate(satrec, t);
    if (!pos) continue;
    points.push([pos.lat, pos.lng, pos.altScaled, t.getTime() / 1000]);
  }

  return points;
}

/**
 * 在換日線（±180° 經度跳變）處拆分路徑
 *
 * 當兩個連續點的經度差 > 180°，表示跨越了換日線，
 * 需要在此處斷開成兩段 Flight，避免畫出橫跨整張地圖的直線。
 */
function splitAtDateline(path: TrailPoint[]): TrailPoint[][] {
  if (path.length < 2) return [path];

  const segments: TrailPoint[][] = [];
  let current: TrailPoint[] = [path[0]!];

  for (let i = 1; i < path.length; i++) {
    const prevLng = path[i - 1]![1];
    const currLng = path[i]![1];
    const diff = Math.abs(currLng - prevLng);

    if (diff > 180) {
      // 跨越換日線，斷開
      if (current.length >= 2) {
        segments.push(current);
      }
      current = [path[i]!];
    } else {
      current.push(path[i]!);
    }
  }

  if (current.length >= 2) {
    segments.push(current);
  }

  return segments;
}

/**
 * 將衛星 TLE 資料轉換為 Flight 格式
 *
 * 1. 計算軌道弧線（45 分鐘，約半圈 LEO）
 * 2. 在換日線處拆分成多段
 * 3. 高度用 log 縮放到航班等級
 */
export function convertSatellitesToFlights(
  tles: SatelliteTLE[],
  baseTime: Date,
  orbitMinutes = 45,
  stepSec = 20,
): Flight[] {
  const flights: Flight[] = [];
  const startUnix = baseTime.getTime() / 1000;
  const endUnix = startUnix + orbitMinutes * 60;

  for (const tle of tles) {
    try {
      const satrec = satellite.twoline2satrec(tle.tle_line1, tle.tle_line2);
      const fullPath = computeOrbitPath(satrec, baseTime, orbitMinutes, stepSec);
      if (fullPath.length < 2) continue;

      // 在換日線斷開
      const segments = splitAtDateline(fullPath);

      for (let segIdx = 0; segIdx < segments.length; segIdx++) {
        const path = segments[segIdx]!;
        if (path.length < 2) continue;

        flights.push({
          fr24_id: `sat_${tle.norad_id}${segIdx > 0 ? `_${segIdx}` : ""}`,
          callsign: tle.name,
          registration: String(tle.norad_id),
          aircraft_type: tle.orbit_type,
          origin_icao: tle.orbit_type,
          origin_iata: tle.orbit_type,
          dest_icao: tle.constellation || "SAT",
          dest_iata: tle.constellation || "SAT",
          dep_time: startUnix,
          arr_time: endUnix,
          status: "active",
          trail_points: path.length,
          path,
        });
      }
    } catch {
      continue;
    }
  }

  return flights;
}

/** UCS Satellite Catalog 資料 */
export interface SatelliteCatalog {
  norad_number: number;
  name: string;
  official_name: string | null;
  country_operator: string | null;
  operator: string | null;
  users: string | null;
  purpose: string | null;
  detailed_purpose: string | null;
  orbit_class: string | null;
  launch_date: string | null;
  launch_mass_kg: number | null;
  expected_lifetime_yrs: number | null;
  contractor: string | null;
  launch_site: string | null;
  launch_vehicle: string | null;
}

/**
 * 從 Supabase 載入 UCS 衛星目錄（用 NORAD ID 查詢單顆）
 */
export async function loadSatelliteCatalog(noradId: number): Promise<SatelliteCatalog | null> {
  const url = `${SUPABASE_URL}/rest/v1/satellite_catalog?norad_number=eq.${noradId}&limit=1`;
  const resp = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data[0] ?? null;
}

/**
 * 計算所有衛星在某個時刻的即時位置
 */
export function computeCurrentPositions(
  tles: SatelliteTLE[],
  time: Date,
): Array<{ id: string; lat: number; lng: number; alt: number; orbitType: string }> {
  const positions: Array<{
    id: string;
    lat: number;
    lng: number;
    alt: number;
    orbitType: string;
  }> = [];

  for (const tle of tles) {
    try {
      const satrec = satellite.twoline2satrec(tle.tle_line1, tle.tle_line2);
      const pos = propagate(satrec, time);
      if (!pos) continue;

      positions.push({
        id: `sat_${tle.norad_id}`,
        lat: pos.lat,
        lng: pos.lng,
        alt: pos.altScaled,
        orbitType: tle.orbit_type,
      });
    } catch {
      continue;
    }
  }

  return positions;
}
