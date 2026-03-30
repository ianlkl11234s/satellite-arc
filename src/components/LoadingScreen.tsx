/**
 * 品牌化 Loading 畫面
 */

import { useEffect, useState } from "react";

interface LoadingScreenProps {
  loading: boolean;
  tleCount: number;
  preparing: boolean;
}

export function LoadingScreen({ loading, tleCount, preparing }: LoadingScreenProps) {
  // 平滑進度動畫（避免卡在某個數字不動）
  const [displayProgress, setDisplayProgress] = useState(0);

  // 目標進度：下載 0-60%、準備 60-92%、完成 100%
  const targetProgress = loading
    ? Math.min((tleCount / 12000) * 60, 60)
    : preparing
    ? 60 + Math.min((Date.now() % 3000) / 3000 * 32, 32)
    : 100;

  useEffect(() => {
    const id = setInterval(() => {
      setDisplayProgress((prev) => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.3) return targetProgress;
        // 快速追趕，但不超過目標
        return prev + diff * 0.08;
      });
    }, 30);
    return () => clearInterval(id);
  }, [targetProgress]);

  // 準備階段每秒更新，讓進度持續動
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!preparing) return;
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [preparing]);

  const _ = tick; // keep reactive

  const statusText = loading
    ? `正在載入衛星資料... ${tleCount.toLocaleString()} 筆`
    : preparing
    ? `正在計算 ${tleCount.toLocaleString()} 顆衛星軌道...`
    : "準備完成，即將進入...";

  const stepItems = [
    { label: "連線 CelesTrak", done: tleCount > 0 },
    { label: "下載 TLE 資料", done: !loading },
    { label: "解析軌道參數", done: !loading && preparing },
    { label: "建構 3D 場景", done: !loading && !preparing },
  ];

  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at center, #0a0e1a 0%, #020208 70%)",
      color: "#fff", fontFamily: "'Inter', sans-serif",
      overflow: "hidden", position: "relative",
    }}>
      <style>{`
        @keyframes loadingPulse {
          0%, 100% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes orbit1 {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbit2 {
          0% { transform: rotate(120deg); }
          100% { transform: rotate(480deg); }
        }
        @keyframes orbit3 {
          0% { transform: rotate(240deg); }
          100% { transform: rotate(600deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes stepCheck {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* 背景軌道環動畫 */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        {[
          { size: 300, duration: 20, anim: "orbit1", opacity: 0.04 },
          { size: 220, duration: 15, anim: "orbit2", opacity: 0.06 },
          { size: 160, duration: 12, anim: "orbit3", opacity: 0.05 },
        ].map((ring, i) => (
          <div key={i} style={{
            position: "absolute",
            width: ring.size, height: ring.size,
            borderRadius: "50%",
            border: `1px solid rgba(91,156,246,${ring.opacity})`,
            animation: `${ring.anim} ${ring.duration}s linear infinite`,
          }}>
            {/* 軌道上的小光點 */}
            <div style={{
              position: "absolute", top: -3, left: "50%", marginLeft: -3,
              width: 6, height: 6, borderRadius: "50%",
              background: "#5B9CF6",
              boxShadow: `0 0 8px rgba(91,156,246,0.5)`,
              opacity: 0.7,
            }} />
          </div>
        ))}
      </div>

      {/* 脈衝核心 */}
      <div style={{
        width: 16, height: 16, borderRadius: "50%",
        background: "#5B9CF6",
        boxShadow: "0 0 24px rgba(91,156,246,0.6), 0 0 48px rgba(91,156,246,0.2)",
        marginBottom: 28,
        animation: "loadingPulse 2s ease-in-out infinite",
        zIndex: 1,
      }} />

      {/* Title */}
      <h1 style={{
        margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: -0.3,
        color: "#fff", textShadow: "0 2px 12px rgba(91,156,246,0.3)",
        zIndex: 1, animation: "fadeInUp 0.6s ease-out",
      }}>
        Satellite Tracker
      </h1>

      {/* Subtitle */}
      <div style={{
        fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6, letterSpacing: 0.5,
        zIndex: 1, animation: "fadeInUp 0.6s ease-out 0.1s both",
      }}>
        即時衛星追蹤與視覺化
      </div>

      {/* Progress bar */}
      <div style={{
        width: 320, height: 3, borderRadius: 2,
        background: "rgba(255,255,255,0.06)",
        marginTop: 32, overflow: "hidden", zIndex: 1,
      }}>
        <div style={{
          width: `${displayProgress}%`,
          height: "100%",
          borderRadius: 2,
          background: "linear-gradient(90deg, #5B9CF6, #81b4fa, #5B9CF6)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s linear infinite",
          transition: "width 0.1s linear",
        }} />
      </div>

      {/* 百分比 + 狀態文字 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        marginTop: 10, zIndex: 1,
        animation: "fadeInUp 0.6s ease-out 0.2s both",
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#5B9CF6", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(displayProgress)}%
        </span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          {statusText}
        </span>
      </div>

      {/* 步驟清單 */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 8,
        marginTop: 24, zIndex: 1,
        animation: "fadeInUp 0.6s ease-out 0.3s both",
      }}>
        {stepItems.map((step, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 11, color: step.done ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
            transition: "color 0.3s",
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: step.done ? "none" : "1px solid rgba(255,255,255,0.15)",
              background: step.done ? "rgba(91,156,246,0.2)" : "transparent",
              animation: step.done ? "stepCheck 0.3s ease-out" : "none",
              transition: "all 0.3s",
            }}>
              {step.done && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#5B9CF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      {/* Version */}
      <div style={{
        position: "absolute", bottom: 24,
        fontSize: 10, color: "rgba(255,255,255,0.12)", letterSpacing: 1,
        zIndex: 1,
      }}>
        v0.1 · Powered by CelesTrak
      </div>
    </div>
  );
}
