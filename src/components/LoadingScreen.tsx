/**
 * 品牌化 Loading 畫面
 *
 * 設計稿：中央 icon + 標題 + 副標 + 進度條 + 版本
 */

interface LoadingScreenProps {
  /** 是否還在下載 TLE */
  loading: boolean;
  /** 已載入的 TLE 數量 */
  tleCount: number;
  /** 是否正在準備（計算 orbits） */
  preparing: boolean;
}

export function LoadingScreen({ loading, tleCount, preparing }: LoadingScreenProps) {
  const statusText = loading
    ? "正在載入 TLE 資料..."
    : preparing
    ? `正在準備 ${tleCount.toLocaleString()} 顆衛星...`
    : "即將進入...";

  // 進度估算（下載 0-70%、準備 70-100%）
  const progress = loading ? Math.min(tleCount / 120, 70) : preparing ? 85 : 100;

  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at center, #0a0e1a 0%, #020208 70%)",
      color: "#fff", fontFamily: "monospace",
    }}>
      <style>{`
        @keyframes loadingPulse {
          0%, 100% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes progressGlow {
          0% { box-shadow: 0 0 8px rgba(79,195,247,0.3); }
          50% { box-shadow: 0 0 20px rgba(79,195,247,0.6); }
          100% { box-shadow: 0 0 8px rgba(79,195,247,0.3); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Title */}
      <h1 style={{
        margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: 4,
        color: "#fff", textShadow: "0 2px 12px rgba(79,195,247,0.3)",
      }}>
        Satellite Tracker
      </h1>

      {/* Subtitle */}
      <div style={{
        fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6, letterSpacing: 1,
      }}>
        即時衛星追蹤與視覺化
      </div>

      {/* Progress bar */}
      <div style={{
        width: 280, height: 3, borderRadius: 2,
        background: "rgba(255,255,255,0.08)",
        marginTop: 32, overflow: "hidden",
        animation: "progressGlow 2s ease-in-out infinite",
      }}>
        <div style={{
          width: `${progress}%`,
          height: "100%",
          borderRadius: 2,
          background: "linear-gradient(90deg, #4fc3f7, #81d4fa, #4fc3f7)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s linear infinite",
          transition: "width 0.5s ease-out",
        }} />
      </div>

      {/* Status text */}
      <div style={{
        fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 12,
      }}>
        {statusText}
      </div>

      {/* Version */}
      <div style={{
        position: "absolute", bottom: 24,
        fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: 1,
      }}>
        v0.1 · Powered by CelesTrak
      </div>
    </div>
  );
}
