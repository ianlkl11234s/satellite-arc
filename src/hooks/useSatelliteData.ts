/**
 * 衛星資料管理 Hook
 *
 * 負責從 Supabase 載入 TLE，轉換為 Flight 格式，
 * 並在時間軸超出軌道計算範圍時自動重算。
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { Flight } from "../types";
import {
  loadSatelliteTLEs,
  convertSatellitesToFlights,
  type SatelliteTLE,
} from "../data/satelliteLoader";

/** 每次計算多少分鐘的軌道弧線 */
const ORBIT_DURATION_MIN = 120;
/** 軌道計算的時間步長（秒） */
const ORBIT_STEP_SEC = 30;

interface UseSatelliteDataReturn {
  satelliteFlights: Flight[];
  tleCount: number;
  loading: boolean;
  error: string | null;
  /** 根據新的 baseTime 重新計算軌道 */
  recompute: (baseTime: Date) => void;
}

export function useSatelliteData(enabled: boolean): UseSatelliteDataReturn {
  const [tles, setTles] = useState<SatelliteTLE[]>([]);
  const [satelliteFlights, setSatelliteFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const computeRangeRef = useRef<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

  // 載入 TLE（只在 enabled 變為 true 時載入一次）
  useEffect(() => {
    if (!enabled) return;
    if (tles.length > 0) return; // 已載入

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadSatelliteTLEs()
      .then((data) => {
        if (cancelled) return;
        console.log(`[satellite] 載入 ${data.length} 顆衛星 TLE`);
        setTles(data);

        // 立即計算當前時刻的軌道
        const now = new Date();
        const flights = convertSatellitesToFlights(
          data,
          now,
          ORBIT_DURATION_MIN,
          ORBIT_STEP_SEC,
        );
        console.log(`[satellite] 計算完成 ${flights.length} 條軌道`);
        setSatelliteFlights(flights);
        computeRangeRef.current = {
          start: now.getTime() / 1000,
          end: now.getTime() / 1000 + ORBIT_DURATION_MIN * 60,
        };
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[satellite] 載入失敗:", err);
        setError(String(err));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, tles.length]);

  // 重新計算軌道
  const recompute = useCallback(
    (baseTime: Date) => {
      if (tles.length === 0) return;

      const flights = convertSatellitesToFlights(
        tles,
        baseTime,
        ORBIT_DURATION_MIN,
        ORBIT_STEP_SEC,
      );
      setSatelliteFlights(flights);
      computeRangeRef.current = {
        start: baseTime.getTime() / 1000,
        end: baseTime.getTime() / 1000 + ORBIT_DURATION_MIN * 60,
      };
      console.log(
        `[satellite] 重新計算 ${flights.length} 條軌道 (${baseTime.toISOString()})`,
      );
    },
    [tles],
  );

  // 清除（disabled 時）
  useEffect(() => {
    if (!enabled) {
      setSatelliteFlights([]);
    }
  }, [enabled]);

  return {
    satelliteFlights,
    tleCount: tles.length,
    loading,
    error,
    recompute,
  };
}
