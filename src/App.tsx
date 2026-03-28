import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlobeView } from "./globe/GlobeView";
import type { SatelliteTLE } from "./data/satelliteLoader";
import { loadSatelliteTLEs, convertSatellitesToFlights } from "./data/satelliteLoader";

export default function App() {
  const [tles, setTles] = useState<SatelliteTLE[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [satelliteCount, setSatelliteCount] = useState(0);
  const timeRef = useRef(Date.now() / 1000);

  // 載入 TLE
  useEffect(() => {
    loadSatelliteTLEs()
      .then((data) => {
        console.log(`[satellite-art] 載入 ${data.length} 顆衛星 TLE`);
        setTles(data);
        setSatelliteCount(data.length);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[satellite-art] 載入失敗:", err);
        setError(String(err));
        setLoading(false);
      });
  }, []);

  // 計算軌道弧線（用於靜態渲染）
  const orbits = useMemo(() => {
    if (tles.length === 0) return [];
    const flights = convertSatellitesToFlights(tles, new Date(), 60, 20);
    return flights.map((f) => ({
      path: f.path,
      orbitType: f.aircraft_type,
    }));
  }, [tles]);

  // 時間回呼
  const getCurrentTime = useCallback(() => {
    return timeRef.current;
  }, []);

  // 即時時間更新
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      timeRef.current = Date.now() / 1000;
      requestAnimationFrame(tick);
    };
    tick();
    return () => { running = false; };
  }, []);

  // 統計
  const orbitStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const tle of tles) {
      stats[tle.orbit_type] = (stats[tle.orbit_type] ?? 0) + 1;
    }
    return stats;
  }, [tles]);

  if (loading) {
    return (
      <div style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#020208",
        color: "#fff",
        fontFamily: "monospace",
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: "50%", background: "#4fc3f7",
          animation: "pulse 1s ease-in-out infinite",
          marginBottom: 20,
        }} />
        <div style={{ fontSize: 16, opacity: 0.7 }}>Loading satellite data...</div>
        <style>{`@keyframes pulse { 0%,100% { opacity:0.3; transform:scale(0.8) } 50% { opacity:1; transform:scale(1.2) } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        width: "100vw", height: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#020208", color: "#ef5350", fontFamily: "monospace",
      }}>
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
      />

      {/* Header */}
      <div style={{
        position: "absolute",
        top: 16,
        left: 20,
        zIndex: 10,
        pointerEvents: "none",
      }}>
        <h1 style={{
          margin: 0,
          fontSize: 22,
          color: "#fff",
          fontFamily: "monospace",
          letterSpacing: 3,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        }}>
          Satellite Tracker
        </h1>
        <div style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          fontFamily: "monospace",
          marginTop: 4,
        }}>
          {satelliteCount} satellites tracked
        </div>
      </div>

      {/* 軌道統計 */}
      <div style={{
        position: "absolute",
        top: 16,
        right: 20,
        zIndex: 10,
        display: "flex",
        gap: 12,
        pointerEvents: "none",
      }}>
        {Object.entries(orbitStats).map(([type, count]) => (
          <div key={type} style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "monospace",
            fontSize: 11,
            color: "rgba(255,255,255,0.7)",
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background:
                type === "LEO" ? "#4fc3f7" :
                type === "MEO" ? "#ce93d8" :
                type === "GEO" ? "#ffb74d" :
                "#ef5350",
            }} />
            {type} {count}
          </div>
        ))}
      </div>

      {/* 操作提示 */}
      <div style={{
        position: "absolute",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        fontSize: 11,
        color: "rgba(255,255,255,0.3)",
        fontFamily: "monospace",
        pointerEvents: "none",
      }}>
        Drag to rotate · Scroll to zoom · Data from CelesTrak via Supabase
      </div>
    </div>
  );
}
