/**
 * 太陽系 React 容器
 */

import { useEffect, useRef } from "react";
import { SolarSystemScene } from "./SolarSystemScene";
import type { SmallBody } from "../data/smallBodyLoader";

export interface SolarSystemViewProps {
  getCurrentTime: () => number;
  orbitOpacity: number;
  planetScale: number;
  glowOpacity: number;
  showLabels: boolean;
  showOrbits: boolean;
  showAsteroidBelt: boolean;
  smallBodies?: Record<string, SmallBody[]>;
  visibleClasses: Record<string, boolean>;
  particleSize: number;
  particleOpacity: number;
}

export function SolarSystemView({
  getCurrentTime, orbitOpacity, planetScale,
  glowOpacity, showLabels, showOrbits, showAsteroidBelt,
  smallBodies, visibleClasses, particleSize, particleOpacity,
}: SolarSystemViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SolarSystemScene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const solar = new SolarSystemScene(containerRef.current);
    sceneRef.current = solar;

    return () => {
      solar.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => { if (sceneRef.current) sceneRef.current.getCurrentTime = getCurrentTime; }, [getCurrentTime]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setOrbitOpacity(orbitOpacity); }, [orbitOpacity]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setPlanetScale(planetScale); }, [planetScale]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setGlowOpacity(glowOpacity); }, [glowOpacity]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setShowLabels(showLabels); }, [showLabels]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setShowOrbits(showOrbits); }, [showOrbits]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setShowAsteroidBelt(showAsteroidBelt); }, [showAsteroidBelt]);
  useEffect(() => { if (sceneRef.current && smallBodies) sceneRef.current.setSmallBodies(smallBodies); }, [smallBodies]);
  useEffect(() => {
    if (!sceneRef.current) return;
    for (const [cls, vis] of Object.entries(visibleClasses)) {
      sceneRef.current.setClassVisibility(cls, vis);
    }
  }, [visibleClasses]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setParticleSize(particleSize); }, [particleSize]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setParticleOpacity(particleOpacity); }, [particleOpacity]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        cursor: "grab",
      }}
    />
  );
}
