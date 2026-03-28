import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlobeView } from "./globe/GlobeView";
import type { SatellitePosition } from "./globe/GlobeScene";
import type { SatelliteTLE } from "./data/satelliteLoader";
import { loadSatelliteTLEs, convertSatellitesToFlights } from "./data/satelliteLoader";
import { getSatelliteInfo, ORBIT_TYPE_LABELS } from "./data/satelliteInfo";

const SPEED_OPTIONS = [1, 10, 30, 60, 120, 300, 600];
const ALL_ORBIT_TYPES = ["LEO", "MEO", "GEO", "HEO"];

const ORBIT_COLORS: Record<string, string> = {
  LEO: "#4fc3f7",
  MEO: "#ce93d8",
  GEO: "#ffb74d",
  HEO: "#ef5350",
};

export default function App() {
  const [tles, setTles] = useState<SatelliteTLE[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(60);
  const [playing, setPlaying] = useState(true);
  const [displayTime, setDisplayTime] = useState("");

  // 視覺參數
  const [showOrbits, setShowOrbits] = useState(true);
  const [orbitOpacity, setOrbitOpacity] = useState(0.35);
  const [orbScale, setOrbScale] = useState(1.0);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(ALL_ORBIT_TYPES));
  const [showPanel, setShowPanel] = useState(true);

  // 選中衛星
  const [selectedSat, setSelectedSat] = useState<SatellitePosition | null>(null);

  // 模擬時間
  const simTimeRef = useRef(Date.now() / 1000);
  const speedRef = useRef(speed);
  const playingRef = useRef(playing);
  speedRef.current = speed;
  playingRef.current = playing;

  // 載入 TLE
  useEffect(() => {
    loadSatelliteTLEs()
      .then((data) => {
        setTles(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

  // 軌道弧線
  const orbits = useMemo(() => {
    if (tles.length === 0) return [];
    const flights = convertSatellitesToFlights(tles, new Date(), 60, 20);
    return flights.map((f) => ({
      path: f.path,
      orbitType: f.aircraft_type,
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
      if (playingRef.current) {
        simTimeRef.current += ((now - lastReal) / 1000) * speedRef.current;
      }
      lastReal = now;
      requestAnimationFrame(tick);
    };
    tick();
    const interval = setInterval(() => {
      const d = new Date(simTimeRef.current * 1000);
      setDisplayTime(d.toLocaleString("zh-TW", {
        timeZone: "Asia/Taipei",
        month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        hour12: false,
      }));
    }, 200);
    return () => { running = false; clearInterval(interval); };
  }, []);

  // 軌道類型切換
  const toggleOrbitType = useCallback((type: string) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleSatelliteClick = useCallback((sat: SatellitePosition | null) => {
    setSelectedSat(sat);
  }, []);

  // 統計
  const orbitStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const tle of tles) {
      stats[tle.orbit_type] = (stats[tle.orbit_type] ?? 0) + 1;
    }
    return stats;
  }, [tles]);

  const visibleCount = useMemo(() => {
    return tles.filter((t) => visibleTypes.has(t.orbit_type)).length;
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

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    top: 60,
    left: 16,
    zIndex: 10,
    width: 240,
    padding: "14px 16px",
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(12px)",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    fontFamily: "monospace",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
  };

  const sliderStyle: React.CSSProperties = {
    width: "100%",
    accentColor: "#4fc3f7",
    cursor: "pointer",
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <GlobeView
        tles={tles}
        orbits={orbits}
        getCurrentTime={getCurrentTime}
        visibleOrbitTypes={visibleTypes}
        showOrbits={showOrbits}
        orbitOpacity={orbitOpacity}
        orbScale={orbScale}
        onSatelliteClick={handleSatelliteClick}
        selectedId={selectedSat?.id ?? null}
      />

      {/* Header */}
      <div style={{ position: "absolute", top: 16, left: 20, zIndex: 10, pointerEvents: "none" }}>
        <h1 style={{ margin: 0, fontSize: 22, color: "#fff", fontFamily: "monospace", letterSpacing: 3, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
          Satellite Tracker
        </h1>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", marginTop: 4 }}>
          {visibleCount} / {tles.length} satellites
        </div>
      </div>

      {/* 設定按鈕 */}
      <button
        onClick={() => setShowPanel((p) => !p)}
        style={{
          position: "absolute", top: 16, left: 270, zIndex: 11,
          background: showPanel ? "rgba(79,195,247,0.2)" : "rgba(0,0,0,0.5)",
          border: `1px solid ${showPanel ? "rgba(79,195,247,0.5)" : "rgba(255,255,255,0.15)"}`,
          borderRadius: 6, padding: "6px 12px", cursor: "pointer",
          fontFamily: "monospace", fontSize: 11, color: "#fff",
        }}
      >
        {showPanel ? "Hide" : "Settings"}
      </button>

      {/* 控制面板 */}
      {showPanel && (
        <div style={panelStyle}>
          {/* 軌道類型篩選 */}
          <div style={labelStyle}>Orbit Type</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ALL_ORBIT_TYPES.map((type) => {
              const active = visibleTypes.has(type);
              const count = orbitStats[type] ?? 0;
              return (
                <label key={type} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleOrbitType(type)}
                    style={{ accentColor: ORBIT_COLORS[type], width: 14, height: 14 }}
                  />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ORBIT_COLORS[type], opacity: active ? 1 : 0.3 }} />
                  <span style={{ opacity: active ? 1 : 0.4, flex: 1 }}>{type} {ORBIT_TYPE_LABELS[type]?.zh ?? ""}</span>
                  <span style={{ opacity: 0.4, fontSize: 10 }}>{count}</span>
                </label>
              );
            })}
          </div>

          {/* 軌道線 */}
          <div style={labelStyle}>Orbits</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
            <input type="checkbox" checked={showOrbits} onChange={(e) => setShowOrbits(e.target.checked)} style={{ accentColor: "#4fc3f7", width: 14, height: 14 }} />
            Show orbit lines
          </label>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span>Opacity</span>
            <span style={{ opacity: 0.5 }}>{orbitOpacity.toFixed(2)}</span>
          </div>
          <input type="range" min={0.05} max={0.8} step={0.05} value={orbitOpacity} onChange={(e) => setOrbitOpacity(+e.target.value)} style={sliderStyle} />

          {/* 光點大小 */}
          <div style={labelStyle}>Satellites</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span>Point Size</span>
            <span style={{ opacity: 0.5 }}>{orbScale.toFixed(1)}x</span>
          </div>
          <input type="range" min={0.3} max={3} step={0.1} value={orbScale} onChange={(e) => setOrbScale(+e.target.value)} style={sliderStyle} />
        </div>
      )}

      {/* 選中衛星資訊 */}
      {selectedSat && (() => {
        const info = getSatelliteInfo(selectedSat.name);
        const orbitLabel = ORBIT_TYPE_LABELS[selectedSat.orbitType];
        return (
          <div style={{
            position: "absolute",
            top: 60,
            right: 16,
            zIndex: 10,
            width: 300,
            padding: "16px",
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(12px)",
            borderRadius: 10,
            border: `1px solid ${ORBIT_COLORS[selectedSat.orbitType] ?? "rgba(79,195,247,0.3)"}55`,
            fontFamily: "monospace",
            fontSize: 12,
            color: "#fff",
          }}>
            {/* 標題 */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{selectedSat.name}</div>
                {info && (
                  <div style={{ fontSize: 13, color: ORBIT_COLORS[selectedSat.orbitType] ?? "#4fc3f7", marginTop: 2 }}>
                    {info.zhName}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedSat(null)}
                style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, color: "#fff", cursor: "pointer", padding: "2px 8px", fontSize: 11, flexShrink: 0 }}
              >
                x
              </button>
            </div>

            {/* 描述 */}
            {info && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 10, lineHeight: 1.5 }}>
                {info.desc} · {info.country} · {info.purpose}
              </div>
            )}

            {/* 資訊表格 */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "5px 14px", opacity: 0.9 }}>
              <span style={{ opacity: 0.45 }}>NORAD ID</span>
              <span>{selectedSat.id.replace("sat_", "")}</span>

              <span style={{ opacity: 0.45 }}>軌道類型</span>
              <span>
                <span style={{ color: ORBIT_COLORS[selectedSat.orbitType] }}>{selectedSat.orbitType}</span>
                {orbitLabel && <span style={{ opacity: 0.5 }}> {orbitLabel.zh}</span>}
              </span>

              {orbitLabel && (
                <>
                  <span style={{ opacity: 0.45 }}></span>
                  <span style={{ opacity: 0.4, fontSize: 10 }}>{orbitLabel.desc}</span>
                </>
              )}

              <span style={{ opacity: 0.45 }}>星座/系統</span>
              <span>{selectedSat.constellation || (info?.zhName ?? "—")}</span>

              {info && (
                <>
                  <span style={{ opacity: 0.45 }}>用途</span>
                  <span>{info.purpose}</span>

                  <span style={{ opacity: 0.45 }}>國家</span>
                  <span>{info.country}</span>
                </>
              )}

              <span style={{ opacity: 0.45, marginTop: 4 }}>高度</span>
              <span style={{ marginTop: 4 }}>{selectedSat.altKm.toFixed(1)} km</span>

              <span style={{ opacity: 0.45 }}>緯度</span>
              <span>{selectedSat.lat.toFixed(4)}°</span>

              <span style={{ opacity: 0.45 }}>經度</span>
              <span>{selectedSat.lng.toFixed(4)}°</span>
            </div>
          </div>
        );
      })()}

      {/* 軌道統計（右上） */}
      <div style={{ position: "absolute", top: 16, right: 20, zIndex: 10, display: "flex", gap: 12, pointerEvents: "none" }}>
        {Object.entries(orbitStats).map(([type, count]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.7)", opacity: visibleTypes.has(type) ? 1 : 0.3 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: ORBIT_COLORS[type] }} />
            {type} {ORBIT_TYPE_LABELS[type]?.zh ?? ""} {count}
          </div>
        ))}
      </div>

      {/* 時間控制列 */}
      <div style={{
        position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 10,
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 20px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
        borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <button onClick={() => setPlaying((p) => !p)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 4, color: "#fff", padding: "4px 10px", cursor: "pointer", fontFamily: "monospace", fontSize: 13 }}>
          {playing ? "⏸" : "▶"}
        </button>
        <div style={{ display: "flex", gap: 4 }}>
          {SPEED_OPTIONS.map((s) => (
            <button key={s} onClick={() => setSpeed(s)} style={{
              background: speed === s ? "rgba(79,195,247,0.3)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${speed === s ? "rgba(79,195,247,0.6)" : "rgba(255,255,255,0.15)"}`,
              borderRadius: 4, color: speed === s ? "#4fc3f7" : "rgba(255,255,255,0.6)",
              padding: "4px 8px", cursor: "pointer", fontFamily: "monospace", fontSize: 11, minWidth: 36,
            }}>
              {s}x
            </button>
          ))}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 13, color: "rgba(255,255,255,0.8)", minWidth: 140, textAlign: "center" }}>
          {displayTime}
        </div>
        <button onClick={() => { simTimeRef.current = Date.now() / 1000; }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, color: "rgba(255,255,255,0.5)", padding: "4px 10px", cursor: "pointer", fontFamily: "monospace", fontSize: 11 }}>
          NOW
        </button>
      </div>
    </div>
  );
}
