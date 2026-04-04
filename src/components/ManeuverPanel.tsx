/**
 * 軌道分析面板
 *
 * 顯示變軌衛星清單，包含摘要統計、篩選、時間標記。
 * 點擊可飛到對應衛星位置，展開可看前後參數對比。
 */

import { useState, useMemo, useCallback } from "react";
import { TrendingUp, ArrowUpDown, Circle, Clock, ChevronDown, ChevronUp, Orbit, Zap } from "lucide-react";
import type { SatelliteManeuver } from "../data/maneuverLoader";
import { MANEUVER_TYPES } from "../data/maneuverLoader";

const T = {
  FONT: "'Inter', sans-serif",
  BG: "#12161ECC",
  BORDER: "rgba(255,255,255,0.06)",
  ACCENT: "#5B9CF6",
  FG1: "#FFFFFF",
  FG2: "rgba(255,255,255,0.7)",
  FG3: "rgba(255,255,255,0.45)",
  BG_ELEVATED: "rgba(255,255,255,0.04)",
};

type FilterType = "ALL" | "ALTITUDE_CHANGE" | "PLANE_CHANGE" | "SHAPE_CHANGE";

function TypeBadge({ type }: { type: string }) {
  const info = MANEUVER_TYPES[type] ?? MANEUVER_TYPES.NOMINAL;
  return (
    <span style={{
      fontSize: 10, fontFamily: T.FONT, fontWeight: 600,
      padding: "1px 6px", borderRadius: 3,
      background: info.color + "33", color: info.color,
      border: `1px solid ${info.color}55`,
    }}>
      {info.en}
    </span>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return "剛剛";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function CompareRow({ label, prev, curr, unit, precision }: {
  label: string; prev: number; curr: number; unit: string; precision: number;
}) {
  const delta = curr - prev;
  if (Math.abs(delta) < Math.pow(10, -precision - 1)) return null;
  const color = delta > 0 ? "#ff9800" : "#4caf50";
  const arrow = delta > 0 ? "↑" : "↓";
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: 10, fontFamily: T.FONT, gap: 4, padding: "2px 0" }}>
      <span style={{ width: 60, color: T.FG3, flexShrink: 0 }}>{label}</span>
      <span style={{ width: 70, color: T.FG3, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {prev.toFixed(precision)}{unit}
      </span>
      <span style={{ color, fontWeight: 600, width: 16, textAlign: "center" }}>{arrow}</span>
      <span style={{ width: 70, color: T.FG1, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {curr.toFixed(precision)}{unit}
      </span>
      <span style={{ color, fontSize: 9, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        ({delta > 0 ? "+" : ""}{delta.toFixed(precision)})
      </span>
    </div>
  );
}

/** 產生白話描述：這顆衛星做了什麼 */
function describeManeuver(m: SatelliteManeuver): string {
  const parts: string[] = [];

  // 週期/高度變化
  if (Math.abs(m.delta_period_min) > 0.01) {
    const approxAltKm = Math.abs(m.delta_period_min) * 27; // 粗估 LEO
    if (m.delta_period_min > 0) {
      parts.push(`軌道升高（≈+${approxAltKm.toFixed(0)} km），繞行速度變慢`);
    } else {
      parts.push(`軌道降低（≈-${approxAltKm.toFixed(0)} km），繞行速度變快`);
    }
  }

  // 傾角變化
  if (Math.abs(m.delta_inclination) > 0.005) {
    if (m.delta_inclination > 0) {
      parts.push("軌道面傾斜加大，可掃描更高緯度區域");
    } else {
      parts.push("軌道面傾斜縮小，更靠近赤道飛行");
    }
  }

  // 離心率變化
  if (Math.abs(m.delta_eccentricity) > 0.0005) {
    if (m.delta_eccentricity > 0) {
      parts.push("軌道變得更橢圓（最高點升高、最低點降低）");
    } else {
      parts.push("軌道變得更圓（高低點差距縮小）");
    }
  }

  return parts.length > 0 ? parts.join("；") : "微幅參數調整";
}

function ManeuverCard({ m, onSelect }: { m: SatelliteManeuver; onSelect?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const description = describeManeuver(m);
  const typeColor = MANEUVER_TYPES[m.maneuver_type]?.color ?? "#6B7280";

  return (
    <div
      style={{
        fontFamily: T.FONT,
        background: "rgba(255,255,255,0.03)",
        borderRadius: 6,
        padding: "8px 10px",
        border: `1px solid ${T.BORDER}`,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
    >
      {/* 第一行：名稱 + 類型（點擊飛到衛星） */}
      <div
        onClick={onSelect}
        style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, cursor: "pointer" }}
      >
        <span style={{
          fontSize: 12, fontWeight: 600, color: T.FG1, flex: 1,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {m.name}
        </span>
        <TypeBadge type={m.maneuver_type} />
      </div>

      {/* 第二行：星座 + 軌道類型 + 偵測時間 */}
      <div style={{ display: "flex", gap: 8, fontSize: 10, color: T.FG3, marginBottom: 4, alignItems: "center" }}>
        {m.constellation && (
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Circle size={6} fill={T.ACCENT} stroke="none" />
            {m.constellation}
          </span>
        )}
        <span>{m.orbit_type}</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
          <Clock size={9} />
          {formatRelativeTime(m.curr_fetched_at)}
        </span>
      </div>

      {/* 白話描述 */}
      <div style={{
        fontSize: 11, color: typeColor, lineHeight: 1.5,
        padding: "4px 8px", marginBottom: 4, borderRadius: 4,
        background: typeColor + "12",
        borderLeft: `2px solid ${typeColor}66`,
      }}>
        {description}
      </div>

      {/* 展開/收合按鈕 */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", gap: 4,
          cursor: "pointer", fontSize: 10, color: T.ACCENT,
          marginTop: 2,
        }}
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? "收合" : "查看數值對比"}
      </div>

      {/* 展開：前後參數對比 */}
      {expanded && (
        <div style={{
          marginTop: 6, padding: "6px 8px", borderRadius: 4,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${T.BORDER}`,
        }}>
          {/* 表頭 */}
          <div style={{ display: "flex", fontSize: 9, color: T.FG3, gap: 4, marginBottom: 4, fontFamily: T.FONT }}>
            <span style={{ width: 60 }} />
            <span style={{ width: 70, textAlign: "right" }}>變軌前</span>
            <span style={{ width: 16 }} />
            <span style={{ width: 70, textAlign: "right" }}>變軌後</span>
          </div>
          <CompareRow
            label="週期"
            prev={m.curr_period_min - m.delta_period_min}
            curr={m.curr_period_min}
            unit=" min" precision={2}
          />
          <CompareRow
            label="傾角"
            prev={m.curr_inclination - m.delta_inclination}
            curr={m.curr_inclination}
            unit="°" precision={2}
          />
          <CompareRow
            label="離心率"
            prev={m.curr_eccentricity - m.delta_eccentricity}
            curr={m.curr_eccentricity}
            unit="" precision={6}
          />
          {/* Epoch 時間 */}
          <div style={{ display: "flex", fontSize: 9, color: T.FG3, gap: 4, marginTop: 6, fontFamily: T.FONT }}>
            <span style={{ width: 60 }}>Epoch</span>
            <span>{m.prev_epoch}</span>
            <span style={{ color: T.ACCENT }}>→</span>
            <span>{m.curr_epoch}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface ManeuverPanelProps {
  maneuvers: SatelliteManeuver[];
  onSelectSatellite?: (noradId: number) => void;
  onShowGroupOrbits?: (maneuvers: SatelliteManeuver[], show: boolean) => void;
  onSpeedChange?: (speed: number) => void;
}

export function ManeuverPanel({ maneuvers, onSelectSatellite, onShowGroupOrbits, onSpeedChange }: ManeuverPanelProps) {
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [showOrbits, setShowOrbits] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALTITUDE_CHANGE: 0, PLANE_CHANGE: 0, SHAPE_CHANGE: 0 };
    for (const m of maneuvers) {
      if (c[m.maneuver_type] !== undefined) c[m.maneuver_type]++;
    }
    return c;
  }, [maneuvers]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return maneuvers;
    return maneuvers.filter((m) => m.maneuver_type === filter);
  }, [maneuvers, filter]);

  if (maneuvers.length === 0) {
    return (
      <div style={{ fontFamily: T.FONT, fontSize: 12, color: T.FG3, padding: "12px 0" }}>
        尚無變軌資料。資料累積 2 次以上 TLE 更新後即可偵測。
      </div>
    );
  }

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "ALL", label: `全部 (${maneuvers.length})` },
    { key: "ALTITUDE_CHANGE", label: `高度 (${counts.ALTITUDE_CHANGE})` },
    { key: "PLANE_CHANGE", label: `軌道面 (${counts.PLANE_CHANGE})` },
    { key: "SHAPE_CHANGE", label: `形狀 (${counts.SHAPE_CHANGE})` },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* 摘要統計 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 12px", borderRadius: 8,
        background: T.BG_ELEVATED, border: `1px solid ${T.BORDER}`,
      }}>
        <TrendingUp size={16} color={T.ACCENT} />
        <div style={{ fontFamily: T.FONT }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.FG1, fontVariantNumeric: "tabular-nums" }}>
            {maneuvers.length}
          </div>
          <div style={{ fontSize: 10, color: T.FG3 }}>顆衛星偵測到變軌</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {Object.entries(counts).map(([type, count]) => count > 0 && (
            <span key={type} style={{
              fontSize: 10, fontFamily: T.FONT, fontWeight: 600,
              padding: "2px 6px", borderRadius: 3,
              background: MANEUVER_TYPES[type].color + "22",
              color: MANEUVER_TYPES[type].color,
            }}>
              {count}
            </span>
          ))}
        </div>
      </div>

      {/* 篩選列 */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setFilter(f.key);
              // 篩選變更時更新群體軌道
              if (showOrbits) {
                const next = f.key === "ALL" ? maneuvers : maneuvers.filter((m) => m.maneuver_type === f.key);
                onShowGroupOrbits?.(next, true);
              }
            }}
            style={{
              fontFamily: T.FONT, fontSize: 10, fontWeight: 500,
              padding: "3px 8px", borderRadius: 10,
              border: `1px solid ${filter === f.key ? T.ACCENT + "66" : T.BORDER}`,
              background: filter === f.key ? T.ACCENT + "18" : "transparent",
              color: filter === f.key ? T.ACCENT : T.FG3,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 軌道顯示 + 加速控制 */}
      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => {
            const next = !showOrbits;
            setShowOrbits(next);
            onShowGroupOrbits?.(filtered, next);
          }}
          style={{
            fontFamily: T.FONT, fontSize: 10, fontWeight: 500,
            padding: "3px 8px", borderRadius: 10, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
            border: `1px solid ${showOrbits ? "#4fc3f7" + "66" : T.BORDER}`,
            background: showOrbits ? "#4fc3f7" + "18" : "transparent",
            color: showOrbits ? "#4fc3f7" : T.FG3,
            transition: "all 0.15s",
          }}
        >
          <Orbit size={10} />
          {showOrbits ? "隱藏軌道" : "顯示群體軌道"}
        </button>
        {showOrbits && (
          <button
            onClick={() => onSpeedChange?.(300)}
            style={{
              fontFamily: T.FONT, fontSize: 10, fontWeight: 500,
              padding: "3px 8px", borderRadius: 10, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
              border: `1px solid ${T.BORDER}`,
              background: "transparent",
              color: "#ff9800",
              transition: "all 0.15s",
            }}
          >
            <Zap size={10} />
            加速 300x
          </button>
        )}
      </div>

      {/* 結果計數 */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.FG3, fontFamily: T.FONT }}>
        <ArrowUpDown size={10} />
        {filtered.length} 筆結果 · 僅顯示變軌衛星
      </div>

      {/* 衛星清單 */}
      {filtered.map((m) => (
        <ManeuverCard
          key={m.norad_id}
          m={m}
          onSelect={() => onSelectSatellite?.(m.norad_id)}
        />
      ))}
    </div>
  );
}
