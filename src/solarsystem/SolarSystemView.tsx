/**
 * 太陽系 React 容器
 */

import { useEffect, useRef } from "react";
import { SolarSystemScene } from "./SolarSystemScene";
import type { SmallBody } from "../data/smallBodyLoader";

export interface SolarSystemViewProps {
  getCurrentTime: () => number;
  planetScale: number;
  glowOpacity: number;
  showLabels: boolean;
  showAsteroidBelt: boolean;
  // 軌道分組
  showPlanetOrbits: boolean;
  planetOrbitOpacity: number;
  showHTCOrbits: boolean;
  htcOrbitOpacity: number;
  showJFCOrbits: boolean;
  jfcOrbitOpacity: number;
  // 小天體
  smallBodies?: Record<string, SmallBody[]>;
  visibleClasses: Record<string, boolean>;
  classSizes: Record<string, number>;
  classOpacities: Record<string, number>;
  classColors?: Record<string, string>;
  spectralMode: boolean;
  // 互動
  onBodyClick?: (name: string | null, smallBody?: SmallBody | null) => void;
  selectedBody?: string | null;
}

export function SolarSystemView({
  getCurrentTime, planetScale,
  glowOpacity, showLabels, showAsteroidBelt,
  showPlanetOrbits, planetOrbitOpacity,
  showHTCOrbits, htcOrbitOpacity,
  showJFCOrbits, jfcOrbitOpacity,
  smallBodies, visibleClasses, classSizes, classOpacities, classColors, spectralMode,
  onBodyClick, selectedBody,
}: SolarSystemViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SolarSystemScene | null>(null);
  const onClickRef = useRef(onBodyClick);
  onClickRef.current = onBodyClick;

  useEffect(() => {
    if (!containerRef.current) return;
    const solar = new SolarSystemScene(containerRef.current);
    sceneRef.current = solar;

    const canvas = solar.renderer.domElement;
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const body = solar.pickBody(
        e.clientX - rect.left, e.clientY - rect.top,
        rect.width, rect.height,
      );
      onClickRef.current?.(body, solar.lastPickedSmallBody);
    };
    canvas.addEventListener("click", onClick);

    return () => {
      canvas.removeEventListener("click", onClick);
      solar.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => { if (sceneRef.current) sceneRef.current.getCurrentTime = getCurrentTime; }, [getCurrentTime]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setPlanetScale(planetScale); }, [planetScale]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setGlowOpacity(glowOpacity); }, [glowOpacity]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setShowLabels(showLabels); }, [showLabels]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setShowAsteroidBelt(showAsteroidBelt); }, [showAsteroidBelt]);

  // 軌道分組
  useEffect(() => { if (sceneRef.current) sceneRef.current.setShowPlanetOrbits(showPlanetOrbits); }, [showPlanetOrbits]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setPlanetOrbitOpacity(planetOrbitOpacity); }, [planetOrbitOpacity]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setShowHTCOrbits(showHTCOrbits); }, [showHTCOrbits]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setHTCOrbitOpacity(htcOrbitOpacity); }, [htcOrbitOpacity]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setShowJFCOrbits(showJFCOrbits); }, [showJFCOrbits]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setJFCOrbitOpacity(jfcOrbitOpacity); }, [jfcOrbitOpacity]);

  // 小天體
  useEffect(() => {
    if (!sceneRef.current || !smallBodies) return;
    sceneRef.current.setSmallBodies(smallBodies);
    // setSmallBodies 用硬編碼預設值建立粒子，需要立即套用當前 state
    for (const [cls, size] of Object.entries(classSizes)) sceneRef.current.setClassSize(cls, size);
    for (const [cls, op] of Object.entries(classOpacities)) sceneRef.current.setClassOpacity(cls, op);
    if (classColors) for (const [cls, hex] of Object.entries(classColors)) sceneRef.current.setClassColors({ [cls]: hex });
    for (const [cls, vis] of Object.entries(visibleClasses)) sceneRef.current.setClassVisibility(cls, vis);
  }, [smallBodies]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!sceneRef.current) return;
    for (const [cls, vis] of Object.entries(visibleClasses)) sceneRef.current.setClassVisibility(cls, vis);
  }, [visibleClasses]);
  useEffect(() => {
    if (!sceneRef.current) return;
    for (const [cls, size] of Object.entries(classSizes)) sceneRef.current.setClassSize(cls, size);
  }, [classSizes]);
  useEffect(() => {
    if (!sceneRef.current) return;
    for (const [cls, op] of Object.entries(classOpacities)) sceneRef.current.setClassOpacity(cls, op);
  }, [classOpacities]);
  useEffect(() => { if (sceneRef.current && classColors) sceneRef.current.setClassColors(classColors); }, [classColors]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setSpectralMode(spectralMode); }, [spectralMode]);
  useEffect(() => { if (sceneRef.current && selectedBody) sceneRef.current.flyToBody(selectedBody); }, [selectedBody]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "grab" }}
    />
  );
}
