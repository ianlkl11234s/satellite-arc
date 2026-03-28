import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlobeView } from "./globe/GlobeView";
import type { SatellitePosition } from "./globe/GlobeScene";
import type { SatelliteTLE } from "./data/satelliteLoader";
import { loadSatelliteTLEs, convertSatellitesToFlights, loadSatelliteCatalog, type SatelliteCatalog } from "./data/satelliteLoader";
import { getSatelliteInfo, ORBIT_TYPE_LABELS } from "./data/satelliteInfo";
import { Sidebar } from "./components/Sidebar";

const SPEED_OPTIONS = [1, 10, 30, 60, 120, 300, 600];
const ALL_FILTER_TYPES = ["Starlink", "LEO", "MEO", "GEO", "HEO"];

const DEFAULT_COLORS: Record<string, string> = {
  Starlink: "#81d4fa",
  LEO: "#4fc3f7",
  MEO: "#ce93d8",
  GEO: "#ffb74d",
  HEO: "#ef5350",
};

function getFilterType(tle: SatelliteTLE): string {
  if (tle.constellation === "Starlink") return "Starlink";
  return tle.orbit_type;
}

export default function App() {
  const [tles, setTles] = useState<SatelliteTLE[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(60);
  const [playing, setPlaying] = useState(true);
  const [displayTime, setDisplayTime] = useState("");

  // 視覺參數
  const [showTrails, setShowTrails] = useState(true);
  const [showOrbits, setShowOrbits] = useState(false);
  const [orbitOpacity, setOrbitOpacity] = useState(0.35);
  const [orbScale, setOrbScale] = useState(1.0);
  const [orbOpacity, setOrbOpacity] = useState(0.9);
  const [trailLength, setTrailLength] = useState(8);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(ALL_FILTER_TYPES));
  const [colors, setColors] = useState<Record<string, string>>(DEFAULT_COLORS);

  // 進階篩選
  const allConstellations = useMemo(() => {
    const s = new Set<string>();
    for (const t of tles) s.add(t.constellation || "Other");
    return s;
  }, [tles]);
  const allCountries = useMemo(() => {
    const CONSTELLATION_COUNTRY: Record<string, string> = {
      Starlink: "美國", OneWeb: "英國", GPS: "美國", Galileo: "歐盟",
      BeiDou: "中國", GLONASS: "俄羅斯", Iridium: "美國", Globalstar: "美國",
      Orbcomm: "美國", Planet: "美國", Spire: "美國", COSMOS: "俄羅斯", Qianfan: "中國",
    };
    const s = new Set<string>();
    for (const t of tles) s.add(CONSTELLATION_COUNTRY[t.constellation] ?? "其他");
    return s;
  }, [tles]);
  const [visibleConstellations, setVisibleConstellations] = useState<Set<string>>(new Set<string>());
  const [visibleCountries, setVisibleCountries] = useState<Set<string>>(new Set<string>());

  // 初始化篩選（載入後設為全選）
  useEffect(() => {
    if (tles.length > 0 && visibleConstellations.size === 0) {
      setVisibleConstellations(new Set(allConstellations));
      setVisibleCountries(new Set(allCountries));
    }
  }, [tles.length, allConstellations, allCountries, visibleConstellations.size]);

  // 選中衛星
  const [selectedSat, setSelectedSat] = useState<SatellitePosition | null>(null);
  const [catalog, setCatalog] = useState<SatelliteCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // 模擬時間
  const simTimeRef = useRef(Date.now() / 1000);
  const speedRef = useRef(speed);
  const playingRef = useRef(playing);
  speedRef.current = speed;
  playingRef.current = playing;

  // 載入 TLE
  useEffect(() => {
    loadSatelliteTLEs()
      .then((data) => { setTles(data); setLoading(false); })
      .catch((err) => { setError(String(err)); setLoading(false); });
  }, []);

  // 軌道弧線
  const orbits = useMemo(() => {
    if (tles.length === 0) return [];
    const flights = convertSatellitesToFlights(tles, new Date(), 60, 20);
    const tleMap = new Map<string, string>();
    for (const tle of tles) tleMap.set(`sat_${tle.norad_id}`, getFilterType(tle));
    return flights.map((f) => ({
      path: f.path,
      orbitType: tleMap.get(f.fr24_id.replace(/_\d+$/, "")) ?? f.aircraft_type,
    }));
  }, [tles]);

  const getCurrentTime = useCallback(() => simTimeRef.current, []);

  // 時間推進
  useEffect(() => {
    let running = true;
    let lastReal = Date.now();
    const tick = () => {
      if (!running) return;
      const now = Date.now();
      if (playingRef.current) simTimeRef.current += ((now - lastReal) / 1000) * speedRef.current;
      lastReal = now;
      requestAnimationFrame(tick);
    };
    tick();
    const interval = setInterval(() => {
      const d = new Date(simTimeRef.current * 1000);
      setDisplayTime(d.toLocaleString("zh-TW", {
        timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
      }));
    }, 200);
    return () => { running = false; clearInterval(interval); };
  }, []);

  const toggleOrbitType = useCallback((type: string) => {
    setVisibleTypes((prev) => { const n = new Set(prev); if (n.has(type)) n.delete(type); else n.add(type); return n; });
  }, []);

  const toggleConstellation = useCallback((name: string) => {
    setVisibleConstellations((prev) => { const n = new Set(prev); if (n.has(name)) n.delete(name); else n.add(name); return n; });
  }, []);

  const toggleCountry = useCallback((country: string) => {
    setVisibleCountries((prev) => { const n = new Set(prev); if (n.has(country)) n.delete(country); else n.add(country); return n; });
  }, []);

  const handleColorChange = useCallback((type: string, color: string) => {
    setColors((prev) => ({ ...prev, [type]: color }));
  }, []);

  const handleSatelliteClick = useCallback((sat: SatellitePosition | null) => {
    setSelectedSat(sat);
    setCatalog(null);
    if (sat) {
      const noradId = parseInt(sat.id.replace("sat_", ""), 10);
      if (!isNaN(noradId)) {
        setCatalogLoading(true);
        loadSatelliteCatalog(noradId).then((c) => { setCatalog(c); setCatalogLoading(false); }).catch(() => setCatalogLoading(false));
      }
    }
  }, []);

  const visibleCount = useMemo(() => {
    return tles.filter((t) => visibleTypes.has(getFilterType(t))).length;
  }, [tles, visibleTypes]);

  if (loading) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#020208", color: "#fff", fontFamily: "monospace" }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#4fc3f7", animation: "pulse 1s ease-in-out infinite", marginBottom: 20 }} />
        <div style={{ fontSize: 16, opacity: 0.7 }}>Loading satellite data...</div>
        <style>{`@keyframes pulse { 0%,100% { opacity:0.3; transform:scale(0.8) } 50% { opacity:1; transform:scale(1.2) } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020208", color: "#ef5350", fontFamily: "monospace" }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <GlobeView
        tles={tles}
        orbits={orbits}
        getCurrentTime={getCurrentTime}
        visibleOrbitTypes={visibleTypes}
        showTrails={showTrails}
        showOrbits={showOrbits}
        orbitOpacity={orbitOpacity}
        orbScale={orbScale}
        onSatelliteClick={handleSatelliteClick}
        selectedId={selectedSat?.id ?? null}
      />

      {/* Icon Rail Sidebar */}
      <Sidebar
        tles={tles}
        visibleTypes={visibleTypes}
        onToggleType={toggleOrbitType}
        showTrails={showTrails}
        onShowTrailsChange={setShowTrails}
        showOrbits={showOrbits}
        onShowOrbitsChange={setShowOrbits}
        orbitOpacity={orbitOpacity}
        onOrbitOpacityChange={setOrbitOpacity}
        orbScale={orbScale}
        onOrbScaleChange={setOrbScale}
        trailLength={trailLength}
        onTrailLengthChange={setTrailLength}
        orbOpacity={orbOpacity}
        onOrbOpacityChange={setOrbOpacity}
        colors={colors}
        onColorChange={handleColorChange}
        visibleConstellations={visibleConstellations}
        onToggleConstellation={toggleConstellation}
        visibleCountries={visibleCountries}
        onToggleCountry={toggleCountry}
      />

      {/* Header（右移避開 sidebar） */}
      <div style={{ position: "absolute", top: 14, left: 60, zIndex: 10, pointerEvents: "none" }}>
        <h1 style={{ margin: 0, fontSize: 20, color: "#fff", fontFamily: "monospace", letterSpacing: 3, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
          Satellite Tracker
        </h1>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "monospace", marginTop: 3 }}>
          {visibleCount.toLocaleString()} / {tles.length.toLocaleString()} satellites
        </div>
      </div>

      {/* 選中衛星資訊（右側浮框） */}
      {selectedSat && (() => {
        const info = getSatelliteInfo(selectedSat.name);
        const orbitLabel = ORBIT_TYPE_LABELS[selectedSat.orbitType];
        const satColor = colors[selectedSat.orbitType] ?? DEFAULT_COLORS[selectedSat.orbitType] ?? "#4fc3f7";
        return (
          <div style={{
            position: "absolute", top: 8, right: 12, bottom: 80, width: 290, zIndex: 10,
            padding: "16px", overflowY: "auto",
            background: "rgba(8,8,20,0.75)", backdropFilter: "blur(16px)",
            borderRadius: 12, border: `1px solid ${satColor}44`,
            fontFamily: "monospace", fontSize: 12, color: "#fff",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedSat.name}</div>
                {info && <div style={{ fontSize: 13, color: satColor, marginTop: 2 }}>{info.zhName}</div>}
              </div>
              <button onClick={() => setSelectedSat(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, color: "#aaa", cursor: "pointer", padding: "2px 8px", fontSize: 11, flexShrink: 0 }}>x</button>
            </div>

            {info && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 10, lineHeight: 1.5 }}>
                {info.desc} · {info.country} · {info.purpose}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "5px 14px", opacity: 0.9 }}>
              <span style={{ opacity: 0.4 }}>NORAD ID</span>
              <span>{selectedSat.id.replace("sat_", "")}</span>
              <span style={{ opacity: 0.4 }}>軌道類型</span>
              <span><span style={{ color: satColor }}>{selectedSat.orbitType}</span>{orbitLabel && <span style={{ opacity: 0.5 }}> {orbitLabel.zh}</span>}</span>
              {orbitLabel && <><span style={{ opacity: 0.4 }}></span><span style={{ opacity: 0.35, fontSize: 10 }}>{orbitLabel.desc}</span></>}
              <span style={{ opacity: 0.4 }}>星座/系統</span>
              <span>{selectedSat.constellation || (info?.zhName ?? "—")}</span>

              {catalogLoading && <><span style={{ opacity: 0.4 }}>載入中</span><span style={{ opacity: 0.35 }}>...</span></>}

              {catalog && (
                <>
                  <span style={{ opacity: 0.4 }}>營運商</span><span>{catalog.operator ?? "—"}</span>
                  <span style={{ opacity: 0.4 }}>國家</span><span>{catalog.country_operator ?? info?.country ?? "—"}</span>
                  <span style={{ opacity: 0.4 }}>用途</span><span>{catalog.purpose ?? info?.purpose ?? "—"}</span>
                  {catalog.detailed_purpose && <><span style={{ opacity: 0.4 }}>詳細用途</span><span style={{ fontSize: 11 }}>{catalog.detailed_purpose}</span></>}
                  <span style={{ opacity: 0.4 }}>使用者</span><span>{catalog.users ?? "—"}</span>
                  {catalog.launch_date && <><span style={{ opacity: 0.4 }}>發射日期</span><span>{catalog.launch_date}</span></>}
                  {catalog.launch_mass_kg && <><span style={{ opacity: 0.4 }}>發射質量</span><span>{catalog.launch_mass_kg.toLocaleString()} kg</span></>}
                  {catalog.expected_lifetime_yrs && <><span style={{ opacity: 0.4 }}>預期壽命</span><span>{catalog.expected_lifetime_yrs} 年</span></>}
                  {catalog.contractor && <><span style={{ opacity: 0.4 }}>製造商</span><span style={{ fontSize: 11 }}>{catalog.contractor}</span></>}
                  {catalog.launch_vehicle && <><span style={{ opacity: 0.4 }}>發射載具</span><span style={{ fontSize: 11 }}>{catalog.launch_vehicle}</span></>}
                  {catalog.launch_site && <><span style={{ opacity: 0.4 }}>發射地點</span><span style={{ fontSize: 11 }}>{catalog.launch_site}</span></>}
                </>
              )}
              {!catalog && !catalogLoading && !info && <><span style={{ opacity: 0.4 }}>用途</span><span style={{ opacity: 0.35 }}>無 UCS 目錄資料</span></>}
              {!catalog && !catalogLoading && info && <><span style={{ opacity: 0.4 }}>用途</span><span>{info.purpose}</span><span style={{ opacity: 0.4 }}>國家</span><span>{info.country}</span></>}

              <span style={{ opacity: 0.4, marginTop: 6, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 6 }}>高度</span>
              <span style={{ marginTop: 6, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 6 }}>{selectedSat.altKm.toFixed(1)} km</span>
              <span style={{ opacity: 0.4 }}>緯度</span><span>{selectedSat.lat.toFixed(4)}°</span>
              <span style={{ opacity: 0.4 }}>經度</span><span>{selectedSat.lng.toFixed(4)}°</span>
            </div>
          </div>
        );
      })()}

      {/* 時間控制列 */}
      <div style={{
        position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10,
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 16px", background: "rgba(8,8,20,0.7)", backdropFilter: "blur(16px)",
        borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <button onClick={() => setPlaying((p) => !p)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, color: "#fff", padding: "4px 10px", cursor: "pointer", fontFamily: "monospace", fontSize: 13 }}>
          {playing ? "⏸" : "▶"}
        </button>
        <div style={{ display: "flex", gap: 3 }}>
          {SPEED_OPTIONS.map((s) => (
            <button key={s} onClick={() => setSpeed(s)} style={{
              background: speed === s ? "rgba(79,195,247,0.25)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${speed === s ? "rgba(79,195,247,0.5)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 4, color: speed === s ? "#4fc3f7" : "rgba(255,255,255,0.5)",
              padding: "3px 7px", cursor: "pointer", fontFamily: "monospace", fontSize: 10, minWidth: 32,
            }}>
              {s}x
            </button>
          ))}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.7)", minWidth: 130, textAlign: "center" }}>
          {displayTime}
        </div>
        <button onClick={() => { simTimeRef.current = Date.now() / 1000; }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, color: "rgba(255,255,255,0.4)", padding: "3px 8px", cursor: "pointer", fontFamily: "monospace", fontSize: 10 }}>
          NOW
        </button>
      </div>
    </div>
  );
}
