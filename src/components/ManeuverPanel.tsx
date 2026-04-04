/**
 * 軌道分析面板
 *
 * 顯示變軌衛星清單，包含摘要統計與篩選。
 * 點擊可飛到對應衛星位置。
 */

import { useState, useMemo } from "react";
import { TrendingUp, ArrowUpDown, Circle } from "lucide-react";
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

function DeltaRow({ label, value, unit }: { label: string; value: number; unit: string }) {
  if (Math.abs(value) < 1e-6) return null;
  const sign = value > 0 ? "+" : "";
  const color = Math.abs(value) > 0.1 ? "#ff9800" : T.FG3;
  return (
    <span style={{ fontSize: 10, color, fontVariantNumeric: "tabular-nums" }}>
      {label}: {sign}{value.toFixed(4)}{unit}
    </span>
  );
}

function ManeuverCard({ m, onSelect }: { m: SatelliteManeuver; onSelect?: () => void }) {
  return (
    <div
      onClick={onSelect}
      style={{
        fontFamily: T.FONT,
        background: "rgba(255,255,255,0.03)",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        border: `1px solid ${T.BORDER}`,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
    >
      {/* 第一行：名稱 + 類型 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{
          fontSize: 12, fontWeight: 600, color: T.FG1, flex: 1,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {m.name}
        </span>
        <TypeBadge type={m.maneuver_type} />
      </div>

      {/* 第二行：星座 + 軌道類型 */}
      <div style={{ display: "flex", gap: 10, fontSize: 10, color: T.FG3, marginBottom: 4 }}>
        {m.constellation && (
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Circle size={6} fill={T.ACCENT} stroke="none" />
            {m.constellation}
          </span>
        )}
        <span>{m.orbit_type}</span>
      </div>

      {/* 第三行：Delta 值 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <DeltaRow label="ΔPeriod" value={m.delta_period_min} unit=" min" />
        <DeltaRow label="ΔInc" value={m.delta_inclination} unit="°" />
        <DeltaRow label="ΔEcc" value={m.delta_eccentricity} unit="" />
      </div>
    </div>
  );
}

interface ManeuverPanelProps {
  maneuvers: SatelliteManeuver[];
  onSelectSatellite?: (noradId: number) => void;
}

export function ManeuverPanel({ maneuvers, onSelectSatellite }: ManeuverPanelProps) {
  const [filter, setFilter] = useState<FilterType>("ALL");

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
            onClick={() => setFilter(f.key)}
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

      {/* 排序提示 */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.FG3, fontFamily: T.FONT }}>
        <ArrowUpDown size={10} />
        {filtered.length} 筆結果
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
