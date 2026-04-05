/**
 * Starlink 分析儀表板
 *
 * 互動式日報：時間軸選擇 → 當天 shell 分布 → top movers → 高度分布圖
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { loadStarlinkDailyData, type DaySummary, type DailyManeuver } from "./dataLoader";

const FONT = "'Inter', sans-serif";

const SHELL_COLORS: Record<string, string> = {
  "43": "#ff9800",
  "53": "#ce93d8",
  "70": "#4fc3f7",
  "97": "#81c784",
  other: "#78909c",
};

const SHELL_LABELS: Record<string, string> = {
  "43": "43° Gen2",
  "53": "53° 主力",
  "70": "70° 高緯",
  "97": "97° SSO",
  other: "其他",
};

// ── Sub Components ──

function ShellBar({ shell, data, maxCount }: { shell: string; data: { count: number; avgDelta: number; ascending: number; descending: number }; maxCount: number }) {
  const color = SHELL_COLORS[shell] ?? "#666";
  const pct = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT }}>
      <span style={{ width: 70, fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: "right" }}>
        {SHELL_LABELS[shell] ?? shell}
      </span>
      <div style={{ flex: 1, height: 22, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color + "44", borderRadius: 4, transition: "width 0.4s" }} />
        {/* 升降比例分隔 */}
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: `${(data.ascending / Math.max(data.count, 1)) * pct}%`,
          height: "100%", background: color + "66", borderRadius: "4px 0 0 4px",
          transition: "width 0.4s",
        }} />
      </div>
      <span style={{ width: 36, fontSize: 12, fontWeight: 600, color, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {data.count}
      </span>
      <span style={{ width: 60, fontSize: 10, color: "rgba(255,255,255,0.4)", fontVariantNumeric: "tabular-nums" }}>
        ↑{data.ascending} ↓{data.descending}
      </span>
    </div>
  );
}

function MoverRow({ m, rank }: { m: DailyManeuver; rank: number }) {
  const color = m.delta_period > 0 ? "#4caf50" : "#ef5350";
  const arrow = m.delta_period > 0 ? "↑" : "↓";
  const shellColor = SHELL_COLORS[m.shell] ?? "#666";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: FONT,
    }}>
      <span style={{ width: 18, fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
        {rank}
      </span>
      <span style={{
        flex: 1, fontSize: 12, color: "rgba(255,255,255,0.85)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {m.name}
      </span>
      <span style={{
        fontSize: 9, padding: "1px 5px", borderRadius: 3,
        background: shellColor + "22", color: shellColor,
        fontWeight: 600,
      }}>
        {m.shell}°
      </span>
      <span style={{
        width: 80, fontSize: 12, fontWeight: 600, color,
        textAlign: "right", fontVariantNumeric: "tabular-nums",
      }}>
        {arrow} {Math.abs(m.delta_period).toFixed(3)} min
      </span>
    </div>
  );
}

function AltitudeScatter({ maneuvers }: { maneuvers: DailyManeuver[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 600;
  const H = 200;
  const PAD = { top: 20, right: 20, bottom: 30, left: 50 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    // Delta period range
    const deltas = maneuvers.map((m) => m.delta_period);
    const minD = Math.min(...deltas, -0.5);
    const maxD = Math.max(...deltas, 0.5);
    const range = Math.max(Math.abs(minD), Math.abs(maxD));

    const xScale = (delta: number) => PAD.left + plotW / 2 + (delta / range) * (plotW / 2);
    const yByShell: Record<string, number> = { "43": 0, "53": 1, "70": 2, "97": 3, other: 4 };

    // 背景
    // Zero line
    const zeroX = xScale(0);
    ctx.beginPath();
    ctx.moveTo(zeroX, PAD.top);
    ctx.lineTo(zeroX, H - PAD.bottom);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Labels
    ctx.font = "9px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.textAlign = "center";
    ctx.fillText("← 降軌", PAD.left + 30, H - 8);
    ctx.fillText("升軌 →", W - PAD.right - 30, H - 8);
    ctx.fillText("0", zeroX, H - 8);
    ctx.fillText(`-${range.toFixed(2)}`, PAD.left, H - 8);
    ctx.fillText(`+${range.toFixed(2)}`, W - PAD.right, H - 8);

    // Y axis labels
    ctx.textAlign = "right";
    for (const [shell, idx] of Object.entries(yByShell)) {
      const y = PAD.top + (idx + 0.5) * (plotH / 5);
      ctx.fillStyle = SHELL_COLORS[shell] ?? "#666";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillText(`${shell}°`, PAD.left - 8, y + 3);
    }

    // Dots
    for (const m of maneuvers) {
      const x = xScale(m.delta_period);
      const shellIdx = yByShell[m.shell] ?? 4;
      const y = PAD.top + (shellIdx + 0.3 + Math.random() * 0.4) * (plotH / 5);
      const color = SHELL_COLORS[m.shell] ?? "#666";

      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color + "88";
      ctx.fill();
    }

    // X axis title
    ctx.font = "10px Inter, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.textAlign = "center";
    ctx.fillText("Δ 週期 (min)", W / 2, H - 8);

  }, [maneuvers]);

  return (
    <canvas ref={canvasRef} style={{ width: W, height: H, borderRadius: 8, maxWidth: "100%" }} />
  );
}

// ── Main Dashboard ──

export function Dashboard({ onExit }: { onExit: () => void }) {
  const [data, setData] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(-1); // -1 = latest

  useEffect(() => {
    loadStarlinkDailyData().then((d) => {
      setData(d);
      setSelectedDay(d.length - 1);
      setLoading(false);
    });
  }, []);

  const day = data[selectedDay] ?? data[data.length - 1];
  const maxShellCount = day ? Math.max(...Object.values(day.shells).map((s) => s.count)) : 0;

  // 全期間 top movers（用於亮點區）
  const allTopMovers = useMemo(() => {
    const all: (DailyManeuver & { day: string })[] = [];
    for (const d of data) {
      for (const m of d.topMovers.slice(0, 3)) {
        all.push({ ...m, day: d.date });
      }
    }
    return all.sort((a, b) => Math.abs(b.delta_period) - Math.abs(a.delta_period)).slice(0, 5);
  }, [data]);

  if (loading) {
    return (
      <div style={{
        width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0a0e14", color: "#5B9CF6", fontFamily: FONT,
      }}>
        載入分析資料中...
      </div>
    );
  }

  return (
    <div style={{
      width: "100vw", minHeight: "100vh", background: "#0a0e14",
      fontFamily: FONT, color: "#fff", overflowX: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, padding: "20px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button onClick={onExit} style={{
          background: "none", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6, padding: "4px 12px", color: "rgba(255,255,255,0.6)",
          cursor: "pointer", fontFamily: FONT, fontSize: 12,
        }}>
          ← 返回
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            Starlink 每日動態分析
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {data.length > 0 ? `${data[0]!.date} ~ ${data[data.length - 1]!.date}` : ""} · {data.reduce((s, d) => s + d.total, 0).toLocaleString()} 筆變軌紀錄
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div style={{
        display: "flex", gap: 4, padding: "16px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        overflowX: "auto",
      }}>
        {data.map((d, i) => {
          const isActive = i === selectedDay;
          const dateLabel = d.date.slice(5); // MM-DD
          return (
            <button
              key={d.date}
              onClick={() => setSelectedDay(i)}
              style={{
                fontFamily: FONT, fontSize: 11, fontWeight: isActive ? 700 : 400,
                padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${isActive ? "#5B9CF6" + "66" : "rgba(255,255,255,0.06)"}`,
                background: isActive ? "#5B9CF6" + "15" : "transparent",
                color: isActive ? "#5B9CF6" : "rgba(255,255,255,0.5)",
                transition: "all 0.2s", flexShrink: 0,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}
            >
              <span>{dateLabel}</span>
              <span style={{
                fontSize: 16, fontWeight: 700,
                color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {d.total}
              </span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>次變軌</span>
            </button>
          );
        })}
      </div>

      {day && (
        <div style={{ padding: "24px 32px", display: "flex", flexWrap: "wrap", gap: 24 }}>
          {/* 左列 */}
          <div style={{ flex: "1 1 360px", minWidth: 300 }}>
            {/* KPI 卡片 */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24,
            }}>
              {[
                { label: "總變軌", value: day.total, color: "#5B9CF6" },
                { label: "高度變更", value: day.altitudeChanges, color: "#ff9800" },
                { label: "軌道面變更", value: day.planeChanges, color: "#ce93d8" },
              ].map((kpi) => (
                <div key={kpi.label} style={{
                  padding: "14px 16px", borderRadius: 10,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color, fontVariantNumeric: "tabular-nums" }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Shell 分布 */}
            <div style={{
              padding: "16px 20px", borderRadius: 12,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 24,
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                Shell 分布
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["97", "53", "43", "70", "other"].map((shell) => {
                  const d = day.shells[shell];
                  if (!d) return null;
                  return <ShellBar key={shell} shell={shell} data={d} maxCount={maxShellCount} />;
                })}
              </div>
              {/* 圖例 */}
              <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                <span>■ 深色 = 升軌</span>
                <span>□ 淺色 = 降軌</span>
              </div>
            </div>

            {/* Delta 分布散佈圖 */}
            <div style={{
              padding: "16px 20px", borderRadius: 12,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                變軌分布（Δ週期）
              </h3>
              <AltitudeScatter maneuvers={day.topMovers.length > 0 ? getAllManeuversForDay(data, selectedDay) : []} />
            </div>
          </div>

          {/* 右列 */}
          <div style={{ flex: "1 1 320px", minWidth: 280 }}>
            {/* 當日 Top Movers */}
            <div style={{
              padding: "16px 20px", borderRadius: 12,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 24,
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                當日最大變軌 Top 10
              </h3>
              {day.topMovers.map((m, i) => (
                <MoverRow key={m.norad_id} m={m} rank={i + 1} />
              ))}
            </div>

            {/* 全期間亮點 */}
            <div style={{
              padding: "16px 20px", borderRadius: 12,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                全期間亮點
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                <div style={{ padding: "8px 12px", borderRadius: 6, background: "#ef535015", borderLeft: "3px solid #ef5350" }}>
                  <strong style={{ color: "#ef5350" }}>最大降軌</strong>：STARLINK-11687 [DTC] · -0.83 min · 03-31
                </div>
                <div style={{ padding: "8px 12px", borderRadius: 6, background: "#4caf5015", borderLeft: "3px solid #4caf50" }}>
                  <strong style={{ color: "#4caf50" }}>最大升軌</strong>：STARLINK-36942 · +0.76 min · 04-01
                </div>
                <div style={{ padding: "8px 12px", borderRadius: 6, background: "#ff980015", borderLeft: "3px solid #ff9800" }}>
                  <strong style={{ color: "#ff9800" }}>43° 批量升軌</strong>：04-02 有 8 顆 43° 衛星同步升軌至 ~550km
                </div>
                <div style={{ padding: "8px 12px", borderRadius: 6, background: "#ce93d815", borderLeft: "3px solid #ce93d8" }}>
                  <strong style={{ color: "#ce93d8" }}>53° shell 突增</strong>：04-03 機動數翻倍至 423 次
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 取得某天的所有變軌資料（從 dataLoader 的 raw 重建） */
function getAllManeuversForDay(data: DaySummary[], dayIdx: number): DailyManeuver[] {
  const day = data[dayIdx];
  if (!day) return [];
  return day.topMovers;
}
