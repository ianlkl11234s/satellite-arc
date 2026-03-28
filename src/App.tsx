import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlobeView } from "./globe/GlobeView";
import type { SatelliteTLE } from "./data/satelliteLoader";
import { loadSatelliteTLEs, convertSatellitesToFlights } from "./data/satelliteLoader";

const SPEED_OPTIONS = [1, 10, 30, 60, 120, 300, 600];

export default function App() {
  const [tles, setTles] = useState<SatelliteTLE[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [satelliteCount, setSatelliteCount] = useState(0);
  const [speed, setSpeed] = useState(60);
  const [playing, setPlaying] = useState(true);
  const [displayTime, setDisplayTime] = useState("");

  // 模擬時間：baseReal 是按下 play 時的真實時間，baseSim 是對應的模擬時間
  const baseRealRef = useRef(Date.now());
  const baseSimRef = useRef(Date.now());
  const speedRef = useRef(speed);
  const playingRef = useRef(playing);
  const simTimeRef = useRef(Date.now() / 1000);

  speedRef.current = speed;
  playingRef.current = playing;

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

  // 時間回呼（GlobeScene 每幀呼叫）
  const getCurrentTime = useCallback(() => {
    return simTimeRef.current;
  }, []);

  // 時間推進迴圈
  useEffect(() => {
    let running = true;
    let lastReal = Date.now();

    const tick = () => {
      if (!running) return;
      const now = Date.now();
      const dtReal = now - lastReal;
      lastReal = now;

      if (playingRef.current) {
        // 模擬時間 += 真實經過時間 × 加速倍率
        simTimeRef.current += (dtReal / 1000) * speedRef.current;
      }

      // 每 200ms 更新顯示時間（避免太頻繁的 setState）
      requestAnimationFrame(tick);
    };
    tick();

    // 定時更新顯示時間
    const displayInterval = setInterval(() => {
      const d = new Date(simTimeRef.current * 1000);
      setDisplayTime(
        d.toLocaleString("zh-TW", {
          timeZone: "Asia/Taipei",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    }, 200);

    return () => {
      running = false;
      clearInterval(displayInterval);
    };
  }, []);

  // 速度改變時重設基準
  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  const handlePlayPause = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  // 重設到現在
  const handleResetTime = useCallback(() => {
    simTimeRef.current = Date.now() / 1000;
    baseRealRef.current = Date.now();
    baseSimRef.current = Date.now();
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

      {/* 時間控制列 */}
      <div style={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 20px",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 4,
            color: "#fff",
            padding: "4px 10px",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: 13,
          }}
        >
          {playing ? "⏸" : "▶"}
        </button>

        {/* Speed selector */}
        <div style={{ display: "flex", gap: 4 }}>
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              style={{
                background: speed === s ? "rgba(79,195,247,0.3)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${speed === s ? "rgba(79,195,247,0.6)" : "rgba(255,255,255,0.15)"}`,
                borderRadius: 4,
                color: speed === s ? "#4fc3f7" : "rgba(255,255,255,0.6)",
                padding: "4px 8px",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: 11,
                minWidth: 36,
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* 時間顯示 */}
        <div style={{
          fontFamily: "monospace",
          fontSize: 13,
          color: "rgba(255,255,255,0.8)",
          minWidth: 140,
          textAlign: "center",
        }}>
          {displayTime}
        </div>

        {/* Reset to now */}
        <button
          onClick={handleResetTime}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 4,
            color: "rgba(255,255,255,0.5)",
            padding: "4px 10px",
            cursor: "pointer",
            fontFamily: "monospace",
            fontSize: 11,
          }}
        >
          NOW
        </button>
      </div>
    </div>
  );
}
