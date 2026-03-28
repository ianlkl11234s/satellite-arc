/**
 * 3D 地球 React 容器
 */

import { useEffect, useRef } from "react";
import { GlobeScene, type SatellitePosition } from "./GlobeScene";
import type { SatelliteTLE } from "../data/satelliteLoader";

interface GlobeViewProps {
  tles: SatelliteTLE[];
  orbits: Array<{ path: [number, number, number, number][]; orbitType: string }>;
  getCurrentTime: () => number;
  visibleOrbitTypes: Set<string>;
  showOrbits: boolean;
  orbitOpacity: number;
  orbScale: number;
  onSatelliteClick?: (sat: SatellitePosition | null) => void;
  selectedId: string | null;
}

export function GlobeView({
  tles,
  orbits,
  getCurrentTime,
  visibleOrbitTypes,
  showOrbits,
  orbitOpacity,
  orbScale,
  onSatelliteClick,
  selectedId,
}: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GlobeScene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const globe = new GlobeScene(containerRef.current);
    sceneRef.current = globe;

    // 點擊事件
    const canvas = globe.renderer.domElement;
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const sat = globe.pickSatellite(x, y, rect.width, rect.height);
      onSatelliteClick?.(sat);
    };
    canvas.addEventListener("click", onClick);

    return () => {
      canvas.removeEventListener("click", onClick);
      globe.dispose();
      sceneRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.getCurrentTime = getCurrentTime;
  }, [getCurrentTime]);

  useEffect(() => {
    if (sceneRef.current && tles.length > 0) sceneRef.current.setTLEs(tles);
  }, [tles]);

  useEffect(() => {
    if (sceneRef.current && orbits.length > 0) sceneRef.current.setOrbits(orbits);
  }, [orbits]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.setVisibleOrbitTypes(visibleOrbitTypes);
  }, [visibleOrbitTypes]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.setShowOrbits(showOrbits);
  }, [showOrbits]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.setOrbitOpacity(orbitOpacity);
  }, [orbitOpacity]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.setOrbScale(orbScale);
  }, [orbScale]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.setSelected(selectedId);
  }, [selectedId]);

  // 同步 onSatelliteClick ref（避免 effect 重新綁定）
  const onClickRef = useRef(onSatelliteClick);
  onClickRef.current = onSatelliteClick;

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "grab" }}
    />
  );
}
