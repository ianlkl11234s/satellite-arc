import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlobeView, type CameraInfo } from "./globe/GlobeView";
import type { SatellitePosition } from "./globe/GlobeScene";
import type { SatelliteTLE } from "./data/satelliteLoader";
import { loadSatelliteTLEs, convertSatellitesToFlights, loadSatelliteCatalog, type SatelliteCatalog, CATEGORIES } from "./data/satelliteLoader";
import { getSatelliteInfo, ORBIT_TYPE_LABELS } from "./data/satelliteInfo";
import { Sidebar } from "./components/Sidebar";
import { LoadingScreen } from "./components/LoadingScreen";

const SPEED_OPTIONS = [1, 10, 30, 60, 120, 300, 600];
const ALL_CATEGORIES = Object.keys(CATEGORIES);

// 從 CATEGORIES 建立初始色碼表
const DEFAULT_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORIES).map(([k, v]) => [k, v.color]),
);

export default function App() {
  const [tles, setTles] = useState<SatelliteTLE[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
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
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set(ALL_CATEGORIES));
  const [colors, setColors] = useState<Record<string, string>>(DEFAULT_COLORS);

  // 進階篩選
  const allConstellations = useMemo(() => {
    const s = new Set<string>();
    for (const t of tles) s.add(t.constellation || "Other");
    return s;
  }, [tles]);
  const allCountries = useMemo(() => {
    const s = new Set<string>();
    for (const t of tles) s.add(t.country_operator ?? "Unknown");
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

  // 相機
  const [cameraInfo, setCameraInfo] = useState<CameraInfo>({ distance: 3.5, azimuth: 0, polar: 8 });

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

  const filteredTles = useMemo(() => {
    return tles.filter((tle) => {
      if (!visibleCategories.has(tle.category)) return false;
      if (visibleConstellations.size > 0 && !visibleConstellations.has(tle.constellation || "Other")) return false;
      if (visibleCountries.size > 0 && !visibleCountries.has(tle.country_operator ?? "Unknown")) return false;
      return true;
    });
  }, [tles, visibleCategories, visibleConstellations, visibleCountries]);

  // 軌道弧線（非同步計算，避免凍結 UI）
  const [orbits, setOrbits] = useState<Array<{ path: [number, number, number, number][]; orbitType: string }>>([]);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (filteredTles.length === 0) {
      setOrbits([]);
      return;
    }

    setRecalculating(true);

    // 用 setTimeout 讓 UI 先渲染「重新計算中」overlay
    const timer = setTimeout(() => {
      const flights = convertSatellitesToFlights(filteredTles, new Date(), 60, 20);
      const tleMap = new Map<string, string>();
      for (const tle of filteredTles) tleMap.set(`sat_${tle.norad_id}`, tle.category);
      const result = flights.map((f) => ({
        path: f.path,
        orbitType: tleMap.get(f.fr24_id.replace(/_\d+$/, "")) ?? "other",
      }));
      setOrbits(result);
      setRecalculating(false);
      if (!ready) setReady(true);
    }, 50);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredTles]);

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

  const toggleCategory = useCallback((cat: string) => {
    setVisibleCategories((prev) => { const n = new Set(prev); if (n.has(cat)) n.delete(cat); else n.add(cat); return n; });
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

  const visibleCount = filteredTles.length;

  if (!ready && !error) {
    return <LoadingScreen loading={loading} tleCount={tles.length} preparing={!loading && tles.length > 0} />;
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
        visibleOrbitTypes={visibleCategories}
        showTrails={showTrails}
        showOrbits={showOrbits}
        orbitOpacity={orbitOpacity}
        orbScale={orbScale}
        orbOpacity={orbOpacity}
        trailLength={trailLength}
        colors={colors}
        visibleConstellations={visibleConstellations}
        visibleCountries={visibleCountries}
        onSatelliteClick={handleSatelliteClick}
        selectedId={selectedSat?.id ?? null}
        onCameraChange={setCameraInfo}
      />

      {/* Icon Rail Sidebar */}
      <Sidebar
        tles={tles}
        visibleCategories={visibleCategories}
        onToggleCategory={toggleCategory}
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
        onSelectAllConstellations={() => setVisibleConstellations(new Set(allConstellations))}
        onClearConstellations={() => setVisibleConstellations(new Set())}
        onSelectAllCountries={() => setVisibleCountries(new Set(allCountries))}
        onClearCountries={() => setVisibleCountries(new Set())}
      />

      {/* Header（右移避開 sidebar） */}
      <div style={{ position: "absolute", top: 10, left: 60, zIndex: 10, pointerEvents: "none" }}>
        <h1 style={{ margin: 0, fontSize: 22, color: "#fff", fontFamily: "monospace", letterSpacing: 3, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
          Satellite Tracker
        </h1>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "monospace", marginTop: 3, lineHeight: 1.6 }}>
          {visibleCount.toLocaleString()} satellites · {displayTime}<br />
          dist {cameraInfo.distance.toFixed(1)} az {cameraInfo.azimuth}° el {cameraInfo.polar}°
        </div>
      </div>

      {/* 選中衛星資訊（右側浮框） */}
      {selectedSat && (() => {
        const info = getSatelliteInfo(selectedSat.name);
        const orbitLabel = ORBIT_TYPE_LABELS[selectedSat.orbitType];
        const catInfo = CATEGORIES[selectedSat.orbitType];
        const satColor = colors[selectedSat.orbitType] ?? catInfo?.color ?? "#4fc3f7";
        return (
          <div style={{
            position: "absolute", top: 64, right: 12, width: 290, maxHeight: "calc(100vh - 140px)", zIndex: 10,
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
              <span style={{ opacity: 0.4 }}>Category</span>
              <span><span style={{ color: satColor }}>{catInfo?.en ?? selectedSat.orbitType}</span>{catInfo && <span style={{ opacity: 0.4 }}>（{catInfo.zh}）</span>}</span>
              {orbitLabel && <><span style={{ opacity: 0.4 }}>Orbit</span><span>{orbitLabel.zh}</span></>}
              <span style={{ opacity: 0.4 }}>Constellation</span>
              <span>{selectedSat.constellation || (info?.zhName ?? "—")}</span>

              {catalogLoading && <><span style={{ opacity: 0.4 }}>Loading</span><span style={{ opacity: 0.35 }}>...</span></>}

              {catalog && (
                <>
                  <span style={{ opacity: 0.4 }}>Operator</span><span>{catalog.operator ?? "—"}</span>
                  <span style={{ opacity: 0.4 }}>Country</span><span>{catalog.country_operator ?? info?.country ?? "—"}</span>
                  <span style={{ opacity: 0.4 }}>Purpose</span><span>{catalog.purpose ?? info?.purpose ?? "—"}</span>
                  {catalog.detailed_purpose && <><span style={{ opacity: 0.4 }}>Detail</span><span style={{ fontSize: 11 }}>{catalog.detailed_purpose}</span></>}
                  <span style={{ opacity: 0.4 }}>Users</span><span>{catalog.users ?? "—"}</span>
                  {catalog.launch_date && <><span style={{ opacity: 0.4 }}>Launched</span><span>{catalog.launch_date}</span></>}
                  {catalog.launch_mass_kg && <><span style={{ opacity: 0.4 }}>Mass</span><span>{catalog.launch_mass_kg.toLocaleString()} kg</span></>}
                  {catalog.expected_lifetime_yrs && <><span style={{ opacity: 0.4 }}>Lifetime</span><span>{catalog.expected_lifetime_yrs} yrs</span></>}
                  {catalog.contractor && <><span style={{ opacity: 0.4 }}>Contractor</span><span style={{ fontSize: 11 }}>{catalog.contractor}</span></>}
                  {catalog.launch_vehicle && <><span style={{ opacity: 0.4 }}>Vehicle</span><span style={{ fontSize: 11 }}>{catalog.launch_vehicle}</span></>}
                  {catalog.launch_site && <><span style={{ opacity: 0.4 }}>Launch Site</span><span style={{ fontSize: 11 }}>{catalog.launch_site}</span></>}
                </>
              )}
              {!catalog && !catalogLoading && !info && <><span style={{ opacity: 0.4 }}>Purpose</span><span style={{ opacity: 0.35 }}>No UCS catalog data</span></>}
              {!catalog && !catalogLoading && info && <><span style={{ opacity: 0.4 }}>Purpose</span><span>{info.purpose}</span><span style={{ opacity: 0.4 }}>Country</span><span>{info.country}</span></>}

              <span style={{ opacity: 0.4, marginTop: 6, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 6 }}>Altitude</span>
              <span style={{ marginTop: 6, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 6 }}>{selectedSat.altKm.toFixed(1)} km</span>
              <span style={{ opacity: 0.4 }}>Latitude</span><span>{selectedSat.lat.toFixed(4)}°</span>
              <span style={{ opacity: 0.4 }}>Longitude</span><span>{selectedSat.lng.toFixed(4)}°</span>
            </div>
          </div>
        );
      })()}

      {/* 重新計算 overlay */}
      {recalculating && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 30,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(2,2,8,0.5)", backdropFilter: "blur(4px)",
          pointerEvents: "none",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "16px 28px",
            background: "rgba(8,8,20,0.85)", backdropFilter: "blur(12px)",
            borderRadius: 10, border: "1px solid rgba(79,195,247,0.3)",
          }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#4fc3f7", animation: "pulse 1s ease-in-out infinite" }} />
            <span style={{ fontSize: 14, fontFamily: "monospace", color: "rgba(255,255,255,0.8)" }}>
              Recalculating...
            </span>
          </div>
        </div>
      )}

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
