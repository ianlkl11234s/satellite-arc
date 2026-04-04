/**
 * 衛星變軌偵測資料載入
 *
 * 從 Supabase 拉取 satellite_maneuvers view，
 * 回傳有軌道參數變化的衛星清單。
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface SatelliteManeuver {
  norad_id: number;
  name: string;
  constellation: string;
  orbit_type: string;
  prev_fetched_at: string;
  curr_fetched_at: string;
  prev_epoch: string;
  curr_epoch: string;
  delta_inclination: number;
  delta_eccentricity: number;
  delta_period_min: number;
  maneuver_type: "ALTITUDE_CHANGE" | "PLANE_CHANGE" | "SHAPE_CHANGE" | "NOMINAL";
  curr_inclination: number;
  curr_eccentricity: number;
  curr_period_min: number;
}

export const MANEUVER_TYPES: Record<string, { label: string; en: string; color: string }> = {
  ALTITUDE_CHANGE: { label: "高度變更", en: "Altitude", color: "#ff9800" },
  PLANE_CHANGE:    { label: "軌道面變更", en: "Plane", color: "#ce93d8" },
  SHAPE_CHANGE:    { label: "形狀變更", en: "Shape", color: "#4fc3f7" },
  NOMINAL:         { label: "正常", en: "Nominal", color: "#6B7280" },
};

export async function loadSatelliteManeuvers(): Promise<SatelliteManeuver[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase 未設定，跳過 maneuver 載入");
    return [];
  }

  const url = `${SUPABASE_URL}/rest/v1/satellite_maneuvers?select=*&maneuver_type=neq.NOMINAL&order=maneuver_type,name`;
  const resp = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!resp.ok) {
    console.warn(`Maneuver 載入失敗: ${resp.status}`);
    return [];
  }

  return resp.json();
}

export interface HistoricalTLE {
  norad_id: number;
  tle_line1: string;
  tle_line2: string;
  tle_epoch: string;
  fetched_at: string;
}

/** 載入特定衛星的歷史 TLE（最近 N 筆，按時間倒序） */
export async function loadHistoricalTLEs(noradId: number, limit = 10): Promise<HistoricalTLE[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  const url = `${SUPABASE_URL}/rest/v1/satellite_tle_history?norad_id=eq.${noradId}&select=norad_id,tle_line1,tle_line2,tle_epoch,fetched_at&order=fetched_at.desc&limit=${limit}`;
  const resp = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!resp.ok) return [];
  return resp.json();
}
