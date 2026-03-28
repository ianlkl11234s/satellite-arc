/**
 * 3D 地球 React 容器
 */

import { useEffect, useRef } from "react";
import { GlobeScene } from "./GlobeScene";
import type { SatelliteTLE } from "../data/satelliteLoader";

interface GlobeViewProps {
  tles: SatelliteTLE[];
  orbits: Array<{ path: [number, number, number, number][]; orbitType: string }>;
  getCurrentTime: () => number;
}

export function GlobeView({ tles, orbits, getCurrentTime }: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GlobeScene | null>(null);

  // 初始化場景
  useEffect(() => {
    if (!containerRef.current) return;
    const globe = new GlobeScene(containerRef.current);
    sceneRef.current = globe;
    return () => {
      globe.dispose();
      sceneRef.current = null;
    };
  }, []);

  // 同步時間回呼
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.getCurrentTime = getCurrentTime;
    }
  }, [getCurrentTime]);

  // 同步 TLE 資料
  useEffect(() => {
    if (sceneRef.current && tles.length > 0) {
      sceneRef.current.setTLEs(tles);
    }
  }, [tles]);

  // 同步軌道弧線
  useEffect(() => {
    if (sceneRef.current && orbits.length > 0) {
      sceneRef.current.setOrbits(orbits);
    }
  }, [orbits]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}
