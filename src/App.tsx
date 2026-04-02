import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlobeView, type CameraInfo, type CameraPreset } from "./globe/GlobeView";
import type { SatellitePosition } from "./globe/GlobeScene";
import type { SatelliteTLE } from "./data/satelliteLoader";
import { loadSatelliteTLEs, convertSatellitesToFlights, loadSatelliteCatalog, type SatelliteCatalog, CATEGORIES } from "./data/satelliteLoader";
import { getSatelliteInfo, ORBIT_TYPE_LABELS } from "./data/satelliteInfo";
import { loadUpcomingLaunches, loadLaunchPads, type Launch, type LaunchPad } from "./data/launchLoader";
import { Sidebar } from "./components/Sidebar";
import { useIsMobile } from "./hooks/useIsMobile";
import { LoadingScreen } from "./components/LoadingScreen";
import { InfoModal } from "./components/InfoModal";
import { SolarSystemView } from "./solarsystem/SolarSystemView";
import { SolarSidebar } from "./components/SolarSidebar";
import { loadAllSmallBodies, type SmallBody } from "./data/smallBodyLoader";
import { ViewModeToggle, type ViewMode } from "./components/ViewModeToggle";
import { Play, Pause, X, LocateFixed, ChevronDown, ChevronUp } from "lucide-react";

const SPEED_OPTIONS = [10, 60, 300, 600];
const SOLAR_SPEED_OPTIONS = [600, 3600, 86400, 604800]; // 10min, 1hr, 1day, 1week per second
const FONT = "'Inter', sans-serif";
const ALL_CATEGORIES = Object.keys(CATEGORIES);

// 從 CATEGORIES 建立初始色碼表
const DEFAULT_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORIES).map(([k, v]) => [k, v.color]),
);

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", fontFamily: FONT }}>
      <span style={{ width: 90, flexShrink: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{label}</span>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{value}</span>
    </div>
  );
}

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
  const [showDayNight, setShowDayNight] = useState(false);
  const [showLaunchPads, setShowLaunchPads] = useState(true);

  // 發射資料
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [launchPads, setLaunchPads] = useState<LaunchPad[]>([]);
  const [selectedLaunch, setSelectedLaunch] = useState<Launch | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [orbitOpacity, setOrbitOpacity] = useState(0.35);
  const [orbScale, setOrbScale] = useState(0.8);
  const [orbOpacity, setOrbOpacity] = useState(0.9);
  const [trailLength, setTrailLength] = useState(30);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set(ALL_CATEGORIES.filter(c => c !== "starlink" && c !== "debris")));
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
  const [visibleConstellations, setVisibleConstellations] = useState<Set<string> | null>(null);
  const [visibleCountries, setVisibleCountries] = useState<Set<string> | null>(null);

  // 初始化篩選（載入後設為全選）
  useEffect(() => {
    if (tles.length > 0 && visibleConstellations === null) {
      setVisibleConstellations(new Set(allConstellations));
      setVisibleCountries(new Set(allCountries));
    }
  }, [tles.length, allConstellations, allCountries, visibleConstellations]);

  // 相機
  const [cameraInfo, setCameraInfo] = useState<CameraInfo>({ distance: 6.2, azimuth: -1, polar: 36 });

  // 選中衛星
  const [selectedSat, setSelectedSat] = useState<SatellitePosition | null>(null);
  const [satCardExpanded, setSatCardExpanded] = useState(false);
  const [catalog, setCatalog] = useState<SatelliteCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // 相機控制
  const [cameraPreset, setCameraPreset] = useState<CameraPreset | null>(null);
  const [followMode, setFollowMode] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("earth");

  // 太陽系資料
  const [smallBodies, setSmallBodies] = useState<Record<string, SmallBody[]> | undefined>(undefined);

  // 太陽系參數
  const [solarOrbitOpacity, setSolarOrbitOpacity] = useState(0.3);
  const [solarPlanetScale, setSolarPlanetScale] = useState(1.0);
  const [solarGlowOpacity, setSolarGlowOpacity] = useState(0.6);
  const [solarShowLabels, setSolarShowLabels] = useState(true);
  const [solarShowOrbits, setSolarShowOrbits] = useState(true);
  const [solarShowAsteroidBelt, setSolarShowAsteroidBelt] = useState(true);
  const [solarVisibleClasses, setSolarVisibleClasses] = useState<Record<string, boolean>>({ MBA: true, TJN: true, NEO: true, TNO: true, CEN: true });
  const [solarParticleSize, setSolarParticleSize] = useState(0.12);
  const [solarParticleOpacity, setSolarParticleOpacity] = useState(0.5);

  const { isMobile } = useIsMobile();

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

  // 載入發射資料（非阻塞，背景載入）
  useEffect(() => {
    Promise.all([loadUpcomingLaunches(), loadLaunchPads()])
      .then(([l, p]) => { setLaunches(l); setLaunchPads(p); })
      .catch((err) => console.warn("Launch data load failed:", err));
  }, []);

  // 載入小天體資料（進入太陽系模式時載入一次）
  useEffect(() => {
    if (viewMode === "solar" && !smallBodies) {
      loadAllSmallBodies()
        .then((grouped) => {
          const total = Object.values(grouped).reduce((s, arr) => s + arr.length, 0);
          if (total > 0) {
            console.log(`Loaded ${total} small bodies:`, Object.entries(grouped).map(([k, v]) => `${k}=${v.length}`).join(", "));
            setSmallBodies(grouped);
          }
        })
        .catch((err) => console.warn("Small body load failed:", err));
    }
  }, [viewMode, smallBodies]);

  const filteredTles = useMemo(() => {
    return tles.filter((tle) => {
      if (!visibleCategories.has(tle.category)) return false;
      if (visibleConstellations !== null && !visibleConstellations.has(tle.constellation || "Other")) return false;
      if (visibleCountries !== null && !visibleCountries.has(tle.country_operator ?? "Unknown")) return false;
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
      const dtReal = Math.min((now - lastReal) / 1000, 1);   // cap 1s — 防止 tab 切回時瞬間跳太遠
      if (playingRef.current) simTimeRef.current += dtReal * speedRef.current;
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

  const soloCategory = useCallback((cat: string) => {
    setVisibleCategories((prev) => {
      // 如果已經是 solo 這個 category，恢復全部（不含 starlink 和 debris）
      if (prev.size === 1 && prev.has(cat)) {
        return new Set(ALL_CATEGORIES.filter(c => c !== "starlink" && c !== "debris"));
      }
      // 否則 solo：只顯示這個 category
      return new Set([cat]);
    });
  }, []);

  const toggleConstellation = useCallback((name: string) => {
    setVisibleConstellations((prev) => { const n = new Set(prev ?? []); if (n.has(name)) n.delete(name); else n.add(name); return n; });
  }, []);

  const toggleCountry = useCallback((country: string) => {
    setVisibleCountries((prev) => { const n = new Set(prev ?? []); if (n.has(country)) n.delete(country); else n.add(country); return n; });
  }, []);

  const handlePresetApplied = useCallback(() => setCameraPreset(null), []);
  const handleFlyToDone = useCallback(() => setFlyToTarget(null), []);

  const handleColorChange = useCallback((type: string, color: string) => {
    setColors((prev) => ({ ...prev, [type]: color }));
  }, []);

  const handleSatelliteClick = useCallback((sat: SatellitePosition | null) => {
    setSelectedSat(sat);
    setSatCardExpanded(false);
    setCatalog(null);
    if (!sat) setFollowMode(false);
    if (sat) {
      const noradId = parseInt(sat.id.replace("sat_", ""), 10);
      if (!isNaN(noradId)) {
        setCatalogLoading(true);
        loadSatelliteCatalog(noradId).then((c) => { setCatalog(c); setCatalogLoading(false); }).catch(() => setCatalogLoading(false));
      }
    }
  }, []);

  const visibleCount = filteredTles.length;

  // 淡出過渡：ready 後延遲移除 loading overlay
  const [showLoading, setShowLoading] = useState(true);
  const [loadingFading, setLoadingFading] = useState(false);

  useEffect(() => {
    if (ready && !loadingFading) {
      // 開始淡出
      setLoadingFading(true);
      const timer = setTimeout(() => setShowLoading(false), 600);
      return () => clearTimeout(timer);
    }
  }, [ready, loadingFading]);

  if (error) {
    return (
      <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020208", color: "#ef5350", fontFamily: FONT }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* Loading overlay — 蓋在主畫面上方，淡出過渡 */}
      {showLoading && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 100,
          opacity: loadingFading ? 0 : 1,
          transition: "opacity 0.5s ease-out",
          pointerEvents: loadingFading ? "none" : "auto",
        }}>
          <LoadingScreen loading={loading} tleCount={tles.length} preparing={!loading && tles.length > 0} />
        </div>
      )}
      {viewMode === "earth" ? (
        <GlobeView
          tles={tles}
          orbits={orbits}
          getCurrentTime={getCurrentTime}
          visibleOrbitTypes={visibleCategories}
          showTrails={showTrails}
          showOrbits={showOrbits}
          showDayNight={showDayNight}
          orbitOpacity={orbitOpacity}
          orbScale={orbScale}
          orbOpacity={orbOpacity}
          trailLength={trailLength}
          colors={colors}
          visibleConstellations={visibleConstellations ?? new Set()}
          visibleCountries={visibleCountries ?? new Set()}
          onSatelliteClick={handleSatelliteClick}
          selectedId={selectedSat?.id ?? null}
          onCameraChange={setCameraInfo}
          cameraPreset={cameraPreset}
          onPresetApplied={handlePresetApplied}
          followMode={followMode}
          launchPads={launchPads}
          launches={launches}
          showLaunchPads={showLaunchPads}
          flyToTarget={flyToTarget}
          onFlyToDone={handleFlyToDone}
        />
      ) : (
        <SolarSystemView
          getCurrentTime={getCurrentTime}
          orbitOpacity={solarOrbitOpacity}
          planetScale={solarPlanetScale}
          glowOpacity={solarGlowOpacity}
          showLabels={solarShowLabels}
          showOrbits={solarShowOrbits}
          showAsteroidBelt={solarShowAsteroidBelt}
          smallBodies={smallBodies}
          visibleClasses={solarVisibleClasses}
          particleSize={solarParticleSize}
          particleOpacity={solarParticleOpacity}
        />
      )}

      {/* Icon Rail Sidebar — 地球模式才顯示 */}
      {viewMode === "earth" && <Sidebar
        tles={tles}
        visibleCategories={visibleCategories}
        onToggleCategory={toggleCategory}
        onSoloCategory={soloCategory}
        showTrails={showTrails}
        onShowTrailsChange={setShowTrails}
        showOrbits={showOrbits}
        onShowOrbitsChange={setShowOrbits}
        showDayNight={showDayNight}
        onShowDayNightChange={setShowDayNight}
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
        visibleConstellations={visibleConstellations ?? new Set()}
        onToggleConstellation={toggleConstellation}
        visibleCountries={visibleCountries ?? new Set()}
        onToggleCountry={toggleCountry}
        onSelectAllConstellations={() => setVisibleConstellations(new Set(allConstellations))}
        onClearConstellations={() => setVisibleConstellations(new Set())}
        onSelectAllCountries={() => setVisibleCountries(new Set(allCountries))}
        onClearCountries={() => setVisibleCountries(new Set())}
        onInfoClick={() => setShowInfo(true)}
        onCameraPreset={(preset) => setCameraPreset(preset as CameraPreset)}
        showLaunchPads={showLaunchPads}
        onShowLaunchPadsChange={setShowLaunchPads}
        isMobile={isMobile}
        launches={launches}
        onFlyToLaunch={(lat, lng, launch) => {
          setFlyToTarget({ lat, lng });
          setSelectedLaunch(launch ?? null);
          // 取消衛星選取
          setSelectedSat(null);
          setCatalog(null);
          setFollowMode(false);
        }}
      />}

      {/* Solar System Sidebar */}
      {viewMode === "solar" && (
        <SolarSidebar
          orbitOpacity={solarOrbitOpacity}
          onOrbitOpacityChange={setSolarOrbitOpacity}
          planetScale={solarPlanetScale}
          onPlanetScaleChange={setSolarPlanetScale}
          glowOpacity={solarGlowOpacity}
          onGlowOpacityChange={setSolarGlowOpacity}
          showLabels={solarShowLabels}
          onShowLabelsChange={setSolarShowLabels}
          showOrbits={solarShowOrbits}
          onShowOrbitsChange={setSolarShowOrbits}
          showAsteroidBelt={solarShowAsteroidBelt}
          onShowAsteroidBeltChange={setSolarShowAsteroidBelt}
          visibleClasses={solarVisibleClasses}
          onToggleClass={(cls) => setSolarVisibleClasses((prev) => ({ ...prev, [cls]: !prev[cls] }))}
          classCounts={smallBodies ? Object.fromEntries(Object.entries(smallBodies).map(([k, v]) => [k, v.length])) : {}}
          particleSize={solarParticleSize}
          onParticleSizeChange={setSolarParticleSize}
          particleOpacity={solarParticleOpacity}
          onParticleOpacityChange={setSolarParticleOpacity}
          isMobile={isMobile}
        />
      )}

      {/* Header */}
      <div style={{ position: "absolute", top: isMobile ? 8 : 16, left: isMobile ? 12 : 76, zIndex: 10, pointerEvents: "none", fontFamily: FONT }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? 17 : 22, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>
          {viewMode === "earth" ? "Satellite Arc" : "Solar System"}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          {viewMode === "earth" ? (
            <>
              <span style={{ fontSize: isMobile ? 11 : 13, color: "rgba(255,255,255,0.7)" }}>{visibleCount.toLocaleString()} satellites</span>
              <span style={{ fontSize: isMobile ? 11 : 13, color: "rgba(255,255,255,0.3)" }}>·</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: isMobile ? 11 : 13, color: "rgba(255,255,255,0.5)" }}>8 planets</span>
              <span style={{ fontSize: isMobile ? 11 : 13, color: "rgba(255,255,255,0.3)" }}>·</span>
            </>
          )}
          <span style={{ fontSize: isMobile ? 11 : 13, color: "rgba(255,255,255,0.7)" }}>{displayTime}</span>
        </div>
        {!isMobile && viewMode === "earth" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>dist {cameraInfo.distance.toFixed(1)}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>az {cameraInfo.azimuth}°</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>el {cameraInfo.polar}°</span>
          </div>
        )}
      </div>

      {/* 右上角控制列 */}
      <div style={{
        position: "absolute", top: 16, right: 16, zIndex: 10,
        display: "flex", alignItems: "center", gap: 8, fontFamily: FONT,
      }}>
        {/* 模式切換 */}
        <ViewModeToggle mode={viewMode} onChange={(m) => {
          setViewMode(m);
          // 切換時自動調整速度到合適範圍
          if (m === "solar" && speed < 600) setSpeed(3600);
          if (m === "earth" && speed > 600) setSpeed(60);
        }} />

        {/* 追蹤模式 */}
        {viewMode === "earth" && selectedSat && (
          <button onClick={() => setFollowMode((f) => !f)} title={followMode ? "停止追蹤" : "追蹤衛星"} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            height: 32, padding: "0 14px", borderRadius: 8,
            border: `1px solid ${followMode ? "rgba(91,156,246,0.3)" : "rgba(255,255,255,0.06)"}`,
            background: followMode ? "rgba(91,156,246,0.15)" : "#12161ECC",
            backdropFilter: "blur(24px)",
            color: followMode ? "#5B9CF6" : "rgba(255,255,255,0.7)",
            cursor: "pointer", fontSize: 12, fontFamily: FONT, fontWeight: 500,
          }}>
            <LocateFixed size={14} />
            <span>{followMode ? "追蹤中" : "追蹤"}</span>
          </button>
        )}
      </div>

      {/* 選中衛星資訊卡 — 地球模式才顯示 */}
      {viewMode === "earth" && selectedSat && (() => {
        const info = getSatelliteInfo(selectedSat.name);
        const orbitLabel = ORBIT_TYPE_LABELS[selectedSat.orbitType];
        const catInfo = CATEGORIES[selectedSat.orbitType];
        const satColor = colors[selectedSat.orbitType] ?? catInfo?.color ?? "#5B9CF6";
        return (
          <div style={{
            position: "absolute", zIndex: 10,
            ...(isMobile
              ? { bottom: 58, left: 8, right: 8, maxHeight: "45vh", width: "auto" }
              : { top: 60, right: 16, width: 300, maxHeight: "calc(100vh - 140px)" }),
            overflowY: "auto",
            background: "#12161ECC", backdropFilter: "blur(24px)",
            borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)",
            fontFamily: FONT, fontSize: 13, color: "#fff",
          }}>
            {/* Card Header — 點擊展開/收起 */}
            <div
              style={{ padding: "16px 20px 12px", cursor: "pointer" }}
              onClick={() => setSatCardExpanded((v) => !v)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: satColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{selectedSat.name}</span>
                  </div>
                  {info && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{info.zhName}</div>}
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <div style={{
                    width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.4)",
                  }}>
                    {satCardExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedSat(null); }} style={{
                    width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6,
                    color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 0, flexShrink: 0,
                  }}>
                    <X size={12} />
                  </button>
                </div>
              </div>
              {info && (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                  {info.desc} · {info.country}
                </div>
              )}
            </div>

            {/* Card Body — 展開時才顯示 */}
            {satCardExpanded && (<>
            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

            <div style={{ padding: "12px 20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              <InfoRow label="NORAD ID" value={selectedSat.id.replace("sat_", "")} />
              <InfoRow label="Category" value={<><span style={{ color: satColor }}>{catInfo?.en ?? selectedSat.orbitType}</span>{catInfo && <span style={{ color: "rgba(255,255,255,0.3)" }}>（{catInfo.zh}）</span>}</>} />
              {orbitLabel && <InfoRow label="Orbit" value={orbitLabel.zh} />}
              <InfoRow label="Constellation" value={selectedSat.constellation || (info?.zhName ?? "—")} />

              {catalogLoading && <InfoRow label="Loading" value="..." />}

              {catalog && (
                <>
                  <InfoRow label="Operator" value={catalog.operator ?? "—"} />
                  <InfoRow label="Country" value={catalog.country_operator ?? info?.country ?? "—"} />
                  <InfoRow label="Purpose" value={catalog.purpose ?? info?.purpose ?? "—"} />
                  {catalog.detailed_purpose && <InfoRow label="Detail" value={catalog.detailed_purpose} />}
                  <InfoRow label="Users" value={catalog.users ?? "—"} />
                  {catalog.launch_date && <InfoRow label="Launched" value={catalog.launch_date} />}
                  {catalog.launch_mass_kg && <InfoRow label="Mass" value={`${catalog.launch_mass_kg.toLocaleString()} kg`} />}
                  {catalog.expected_lifetime_yrs && <InfoRow label="Lifetime" value={`${catalog.expected_lifetime_yrs} yrs`} />}
                  {catalog.contractor && <InfoRow label="Contractor" value={catalog.contractor} />}
                  {catalog.launch_vehicle && <InfoRow label="Vehicle" value={catalog.launch_vehicle} />}
                  {catalog.launch_site && <InfoRow label="Launch Site" value={catalog.launch_site} />}
                </>
              )}
              {!catalog && !catalogLoading && !info && <InfoRow label="Purpose" value={<span style={{ color: "rgba(255,255,255,0.3)" }}>No UCS catalog data</span>} />}
              {!catalog && !catalogLoading && info && (<><InfoRow label="Purpose" value={info.purpose} /><InfoRow label="Country" value={info.country} /></>)}

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "2px 0" }} />

              <InfoRow label="Altitude" value={`${selectedSat.altKm.toFixed(1)} km`} />
              <InfoRow label="Latitude" value={`${selectedSat.lat.toFixed(4)}°`} />
              <InfoRow label="Longitude" value={`${selectedSat.lng.toFixed(4)}°`} />
            </div>
            </>)}
          </div>
        );
      })()}

      {/* 選中發射任務資訊卡 — 地球模式才顯示 */}
      {viewMode === "earth" && selectedLaunch && (
        <div style={{
          position: "absolute", zIndex: 10,
          ...(isMobile
            ? { bottom: 58, left: 8, right: 8, maxHeight: "50vh", width: "auto" }
            : { top: 60, right: 16, width: 320, maxHeight: "calc(100vh - 140px)" }),
          overflowY: "auto",
          background: "#12161ECC", backdropFilter: "blur(24px)",
          borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)",
          padding: "16px 20px", fontFamily: FONT,
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
              {selectedLaunch.rocket_full_name || selectedLaunch.rocket_name}
            </span>
            <button onClick={() => setSelectedLaunch(null)} style={{
              width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 6, color: "#6B7280", cursor: "pointer", padding: 0,
            }}>
              <X size={11} />
            </button>
          </div>

          {selectedLaunch.mission_name && (
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginBottom: 2 }}>
              {selectedLaunch.mission_name}
            </div>
          )}

          {selectedLaunch.mission_description && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6, lineHeight: 1.5 }}>
              {selectedLaunch.mission_description}
            </div>
          )}

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "2px 0" }} />

          <InfoRow label="Status" value={
            <span style={{ color: selectedLaunch.status === "Go" ? "#4caf50" : selectedLaunch.status === "Success" ? "#4caf50" : "#ff9800" }}>
              {selectedLaunch.status_name || selectedLaunch.status}
            </span>
          } />
          {selectedLaunch.net && (
            <InfoRow label="NET" value={new Date(selectedLaunch.net).toLocaleString("zh-TW", {
              timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
              hour: "2-digit", minute: "2-digit", hour12: false,
            })} />
          )}
          <InfoRow label="Rocket" value={selectedLaunch.rocket_full_name || selectedLaunch.rocket_name} />
          {selectedLaunch.agency_name && <InfoRow label="Agency" value={selectedLaunch.agency_name} />}
          {selectedLaunch.orbit_name && <InfoRow label="Orbit" value={`${selectedLaunch.orbit_name}${selectedLaunch.orbit_abbrev ? ` (${selectedLaunch.orbit_abbrev})` : ""}`} />}
          {selectedLaunch.mission_type && <InfoRow label="Type" value={selectedLaunch.mission_type} />}
          {selectedLaunch.program_names && <InfoRow label="Program" value={selectedLaunch.program_names} />}

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "2px 0" }} />

          <InfoRow label="Pad" value={selectedLaunch.pad_name} />
          <InfoRow label="Location" value={selectedLaunch.location_name} />
          {selectedLaunch.probability != null && <InfoRow label="Probability" value={`${selectedLaunch.probability}%`} />}
          {selectedLaunch.weather_concerns && <InfoRow label="Weather" value={selectedLaunch.weather_concerns} />}

          {selectedLaunch.webcast_live && (
            <div style={{ marginTop: 4, fontSize: 11, color: "#f44336", fontWeight: 700 }}>● LIVE WEBCAST</div>
          )}

          {selectedLaunch.image_url && (
            <img src={selectedLaunch.image_url} alt="" style={{
              width: "100%", borderRadius: 8, marginTop: 8, opacity: 0.85,
            }} />
          )}
        </div>
      )}

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
            background: "#12161ECC", backdropFilter: "blur(24px)",
            borderRadius: 14, border: "1px solid rgba(91,156,246,0.3)",
          }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#5B9CF6", animation: "pulse 1s ease-in-out infinite" }} />
            <span style={{ fontSize: 14, fontFamily: FONT, color: "rgba(255,255,255,0.8)" }}>
              Recalculating...
            </span>
          </div>
        </div>
      )}

      {/* Timeline Bar */}
      <div style={{
        position: "absolute",
        bottom: isMobile ? 58 : 16,
        left: "50%", transform: "translateX(-50%)", zIndex: 10,
        display: "flex", alignItems: "center",
        gap: isMobile ? 6 : 10,
        height: isMobile ? 32 : 36,
        padding: isMobile ? "0 10px 0 4px" : "0 16px 0 6px",
        background: "#12161ECC", backdropFilter: "blur(24px)",
        borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)",
        fontFamily: FONT, maxWidth: isMobile ? "calc(100vw - 16px)" : undefined,
      }}>
        {/* Play/Pause */}
        <button onClick={() => setPlaying((p) => !p)} style={{
          width: isMobile ? 24 : 28, height: isMobile ? 24 : 28, borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(91,156,246,0.12)", border: "none",
          color: "#5B9CF6", cursor: "pointer", padding: 0, flexShrink: 0,
        }}>
          {playing ? <Pause size={isMobile ? 10 : 12} /> : <Play size={isMobile ? 10 : 12} />}
        </button>

        {/* Speed buttons — 地球模式用秒，太陽系模式用更大單位 */}
        <div style={{ display: "flex", gap: 2 }}>
          {(viewMode === "earth" ? SPEED_OPTIONS : SOLAR_SPEED_OPTIONS).map((s) => {
            const label = viewMode === "earth"
              ? `${s}x`
              : s >= 604800 ? `${s / 604800}w/s`
              : s >= 86400 ? `${s / 86400}d/s`
              : s >= 3600 ? `${s / 3600}h/s`
              : `${Math.round(s / 60)}m/s`;
            return (
              <button key={s} onClick={() => setSpeed(s)} style={{
                height: isMobile ? 20 : 24, minWidth: isMobile ? 26 : 30, padding: "0 4px",
                borderRadius: 6, border: "none",
                background: speed === s ? "rgba(91,156,246,0.12)" : "transparent",
                color: speed === s ? "#5B9CF6" : "rgba(255,255,255,0.35)",
                cursor: "pointer", fontFamily: FONT, fontSize: isMobile ? 10 : 11, fontWeight: 500,
              }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* 時間軸 slider — 地球±12小時，太陽系±2年 */}
        {!isMobile && (() => {
          const rangeHours = viewMode === "earth" ? 12 : 365 * 24; // ±12h or ±1year
          const stepSize = viewMode === "earth" ? 0.05 : 24; // 3min or 1day
          return (
            <input
              type="range"
              min={-rangeHours}
              max={rangeHours}
              step={stepSize}
              value={(() => {
                const diffHours = (simTimeRef.current - Date.now() / 1000) / 3600;
                return Math.max(-rangeHours, Math.min(rangeHours, diffHours));
              })()}
              onChange={(e) => {
                const hours = parseFloat(e.target.value);
                simTimeRef.current = Date.now() / 1000 + hours * 3600;
                setPlaying(false);
              }}
              style={{
                width: 180, height: 4, appearance: "none", WebkitAppearance: "none",
                background: "rgba(255,255,255,0.08)", borderRadius: 2,
                outline: "none", cursor: "pointer", flexShrink: 0,
                accentColor: "#5B9CF6",
              }}
            />
          );
        })()}

        {/* Time */}
        <span style={{ fontSize: isMobile ? 10 : 12, fontWeight: 500, color: "rgba(255,255,255,0.7)", minWidth: isMobile ? 70 : 100, textAlign: "center" }}>
          {displayTime}
        </span>

        {/* NOW */}
        <button onClick={() => { simTimeRef.current = Date.now() / 1000; }} style={{
          height: isMobile ? 20 : 24, padding: "0 8px", borderRadius: 6, border: "none",
          background: "rgba(91,156,246,0.12)", color: "#5B9CF6",
          cursor: "pointer", fontFamily: FONT, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, flexShrink: 0,
        }}>
          NOW
        </button>
      </div>

      {/* Info Modal */}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </div>
  );
}
