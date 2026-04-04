/**
 * 3D 地球 React 容器
 */

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { GlobeScene, type SatellitePosition } from "./GlobeScene";
import type { SatelliteTLE } from "../data/satelliteLoader";
import type { LaunchPad, Launch } from "../data/launchLoader";

export interface CameraInfo {
  distance: number;
  azimuth: number;
  polar: number;
}

export type CameraPreset = "north_pole" | "south_pole" | "equator" | "overview" | "closeup";

interface GlobeViewProps {
  tles: SatelliteTLE[];
  orbits: Array<{ path: [number, number, number, number][]; orbitType: string }>;
  getCurrentTime: () => number;
  visibleOrbitTypes: Set<string>;
  showTrails: boolean;
  showOrbits: boolean;
  showDayNight?: boolean;
  orbitOpacity: number;
  orbScale: number;
  orbOpacity: number;
  trailLength: number;
  colors: Record<string, string>;
  visibleConstellations: Set<string>;
  visibleCountries: Set<string>;
  onSatelliteClick?: (sat: SatellitePosition | null) => void;
  selectedId: string | null;
  onCameraChange?: (info: CameraInfo) => void;
  cameraPreset?: CameraPreset | null;
  onPresetApplied?: () => void;
  followMode?: boolean;
  launchPads?: LaunchPad[];
  launches?: Launch[];
  showLaunchPads?: boolean;
  flyToTarget?: { lat: number; lng: number } | null;
  onFlyToDone?: () => void;
}

export interface GlobeViewHandle {
  findSatelliteById(id: string): SatellitePosition | null;
}

const CONSTELLATION_COUNTRY: Record<string, string> = {
  Starlink: "美國", OneWeb: "英國", GPS: "美國", Galileo: "歐盟",
  BeiDou: "中國", GLONASS: "俄羅斯", Iridium: "美國", Globalstar: "美國",
  Orbcomm: "美國", Planet: "美國", Spire: "美國", COSMOS: "俄羅斯", Qianfan: "中國",
};

export const GlobeView = forwardRef<GlobeViewHandle, GlobeViewProps>(function GlobeView({
  tles, orbits, getCurrentTime,
  visibleOrbitTypes, showTrails, showOrbits, showDayNight,
  orbitOpacity, orbScale, orbOpacity, trailLength,
  colors, visibleConstellations, visibleCountries,
  onSatelliteClick, selectedId, onCameraChange,
  cameraPreset, onPresetApplied, followMode,
  launchPads, launches, showLaunchPads,
  flyToTarget, onFlyToDone,
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GlobeScene | null>(null);
  const onClickRef = useRef(onSatelliteClick);
  const onCameraRef = useRef(onCameraChange);
  onClickRef.current = onSatelliteClick;
  onCameraRef.current = onCameraChange;

  useImperativeHandle(ref, () => ({
    findSatelliteById(id: string) {
      return sceneRef.current?.lastPositions.find((p) => p.id === id) ?? null;
    },
  }));

  useEffect(() => {
    if (!containerRef.current) return;
    const globe = new GlobeScene(containerRef.current);
    sceneRef.current = globe;

    const canvas = globe.renderer.domElement;
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sat = globe.pickSatellite(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
      onClickRef.current?.(sat);
    };
    canvas.addEventListener("click", onClick);

    // 相機變化回報
    globe.controls.addEventListener("change", () => {
      const pos = globe.camera.position;
      onCameraRef.current?.({
        distance: pos.length(),
        azimuth: Math.round(Math.atan2(pos.x, pos.z) * 180 / Math.PI),
        polar: Math.round(Math.asin(pos.y / pos.length()) * 180 / Math.PI),
      });
    });

    return () => {
      canvas.removeEventListener("click", onClick);
      globe.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => { if (sceneRef.current) sceneRef.current.getCurrentTime = getCurrentTime; }, [getCurrentTime]);
  useEffect(() => { if (sceneRef.current && tles.length > 0) sceneRef.current.setTLEs(tles); }, [tles]);
  useEffect(() => { if (sceneRef.current && orbits.length > 0) sceneRef.current.setOrbits(orbits); }, [orbits]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setVisibleOrbitTypes(visibleOrbitTypes); }, [visibleOrbitTypes]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setShowTrails(showTrails); }, [showTrails]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setShowOrbits(showOrbits); }, [showOrbits]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setShowDayNight(showDayNight ?? true); }, [showDayNight]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setOrbitOpacity(orbitOpacity); }, [orbitOpacity]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setOrbScale(orbScale); }, [orbScale]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setOrbOpacity(orbOpacity); }, [orbOpacity]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.trailLength = trailLength; }, [trailLength]);
  useEffect(() => { if (sceneRef.current) sceneRef.current.setSelected(selectedId); }, [selectedId]);

  // 進階篩選：constellation + country
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.constellationFilter = visibleConstellations;
    sceneRef.current.countryFilter = visibleCountries;
    sceneRef.current.countryMap = CONSTELLATION_COUNTRY;
  }, [visibleConstellations, visibleCountries]);

  // 顏色同步
  useEffect(() => {
    if (sceneRef.current) sceneRef.current.setColors(colors);
  }, [colors]);

  // 相機預設視角
  useEffect(() => {
    if (sceneRef.current && cameraPreset) {
      sceneRef.current.setCameraPreset(cameraPreset);
      onPresetApplied?.();
    }
  }, [cameraPreset, onPresetApplied]);

  // 追蹤模式
  useEffect(() => {
    if (sceneRef.current) sceneRef.current.setFollowMode(!!followMode);
  }, [followMode]);

  // 發射台
  useEffect(() => {
    if (sceneRef.current && launchPads && launchPads.length > 0) {
      sceneRef.current.setLaunchPads(launchPads, launches ?? []);
    }
  }, [launchPads, launches]);

  useEffect(() => {
    if (sceneRef.current) sceneRef.current.setShowLaunchPads(showLaunchPads ?? true);
  }, [showLaunchPads]);

  // 飛到指定座標
  useEffect(() => {
    if (sceneRef.current && flyToTarget) {
      sceneRef.current.flyToLatLng(flyToTarget.lat, flyToTarget.lng);
      onFlyToDone?.();
    }
  }, [flyToTarget, onFlyToDone]);

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "grab" }} />
  );
});
