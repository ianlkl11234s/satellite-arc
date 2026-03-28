/**
 * 衛星追蹤側邊欄 — Icon Rail + 浮動面板
 *
 * 四個面板：
 * 1. 設定 — 軌道篩選 + 顯示開關 + 視覺參數
 * 2. 篩選圖層 — 依星座/國家/系統篩選
 * 3. 顏色 — 各軌道類型配色自訂
 * 4. 統計 — 預留
 */

import { useState, useMemo, type ReactNode } from "react";
import type { SatelliteTLE } from "../data/satelliteLoader";

/* ── Types ─────────────────────────────────────────────── */

type PanelId = "settings" | "filters" | "colors" | "stats";

export interface SidebarProps {
  tles: SatelliteTLE[];
  // 篩選
  visibleTypes: Set<string>;
  onToggleType: (type: string) => void;
  // 顯示
  showTrails: boolean;
  onShowTrailsChange: (v: boolean) => void;
  showOrbits: boolean;
  onShowOrbitsChange: (v: boolean) => void;
  // 視覺參數
  orbitOpacity: number;
  onOrbitOpacityChange: (v: number) => void;
  orbScale: number;
  onOrbScaleChange: (v: number) => void;
  trailLength: number;
  onTrailLengthChange: (v: number) => void;
  orbOpacity: number;
  onOrbOpacityChange: (v: number) => void;
  // 顏色
  colors: Record<string, string>;
  onColorChange: (type: string, color: string) => void;
  // 進階篩選
  visibleConstellations: Set<string>;
  onToggleConstellation: (name: string) => void;
  visibleCountries: Set<string>;
  onToggleCountry: (country: string) => void;
}

/* ── Theme ─────────────────────────────────────────────── */

const T = {
  BG_RAIL: "rgba(6, 6, 14, 0.85)",
  BG_PANEL: "rgba(8, 8, 20, 0.75)",
  BORDER: "rgba(255,255,255,0.08)",
  DIM: "#6B7280",
  TEXT: "rgba(255,255,255,0.85)",
  ACCENT: "#4fc3f7",
  ACTIVE_BG: "rgba(79,195,247,0.12)",
  ACTIVE_BORDER: "rgba(79,195,247,0.4)",
  SLIDER_TRACK: "#222",
};

const FILTER_LABELS: Record<string, string> = {
  Starlink: "星鏈 SpaceX",
  LEO: "低軌道（非星鏈）",
  MEO: "中軌道",
  GEO: "同步軌道",
  HEO: "高橢圓軌道",
};

const DEFAULT_COLORS: Record<string, string> = {
  Starlink: "#81d4fa",
  LEO: "#4fc3f7",
  MEO: "#ce93d8",
  GEO: "#ffb74d",
  HEO: "#ef5350",
};

/* ── Sub-components ────────────────────────────────────── */

function RailIcon({ active, onClick, children, title }: {
  active: boolean; onClick: () => void; children: ReactNode; title?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        position: "relative",
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "none",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        color: active ? "#fff" : T.DIM,
        transition: "color 0.15s",
      }}
    >
      {active && (
        <span style={{
          position: "absolute", left: -4, top: 8, bottom: 8,
          width: 3, borderRadius: 2, background: T.ACCENT,
        }} />
      )}
      {children}
    </button>
  );
}

function SectionHeader({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
      textTransform: "uppercase", color: T.DIM,
      marginTop: 14, marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

function SliderRow({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number;
  step: number; format?: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 11, fontFamily: "monospace", color: T.TEXT, marginBottom: 2,
      }}>
        <span>{label}</span>
        <span style={{ color: T.DIM }}>{format ? format(value) : String(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%", height: 4, appearance: "none", WebkitAppearance: "none",
          background: T.SLIDER_TRACK, borderRadius: 2, outline: "none",
          cursor: "pointer", accentColor: T.ACCENT,
        }}
      />
    </div>
  );
}

/* ── SVG Icons ─────────────────────────────────────────── */

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function IconPalette() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="10.5" r="2.5" />
      <circle cx="8.5" cy="7.5" r="2.5" />
      <circle cx="6.5" cy="12" r="2.5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.1 2.5-.3.4-.1.7-.5.7-1 0-.5-.2-.9-.6-1.1-.4-.3-.6-.7-.6-1.1 0-1.1.9-2 2-2h2.3c3 0 5.7-2.5 5.7-5.5C24 6.5 18.6 2 12 2z" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

/* ── Panel: Settings ───────────────────────────────────── */

function SettingsPanel(props: SidebarProps) {
  const ALL_TYPES = ["Starlink", "LEO", "MEO", "GEO", "HEO"];
  const stats = useMemo(() => {
    const s: Record<string, number> = {};
    for (const tle of props.tles) {
      const ft = tle.constellation === "Starlink" ? "Starlink" : tle.orbit_type;
      s[ft] = (s[ft] ?? 0) + 1;
    }
    return s;
  }, [props.tles]);

  return (
    <>
      <SectionHeader>軌道類型</SectionHeader>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {ALL_TYPES.map((type) => {
          const active = props.visibleTypes.has(type);
          const count = stats[type] ?? 0;
          return (
            <label key={type} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12 }}>
              <input
                type="checkbox" checked={active}
                onChange={() => props.onToggleType(type)}
                style={{ accentColor: props.colors[type] ?? DEFAULT_COLORS[type], width: 14, height: 14 }}
              />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: props.colors[type] ?? DEFAULT_COLORS[type], opacity: active ? 1 : 0.3 }} />
              <span style={{ opacity: active ? 1 : 0.4, flex: 1, fontSize: 11 }}>{FILTER_LABELS[type] ?? type}</span>
              <span style={{ opacity: 0.35, fontSize: 10 }}>{count.toLocaleString()}</span>
            </label>
          );
        })}
      </div>

      <SectionHeader>顯示</SectionHeader>
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 4, fontSize: 12 }}>
        <input type="checkbox" checked={props.showTrails} onChange={(e) => props.onShowTrailsChange(e.target.checked)} style={{ accentColor: T.ACCENT, width: 14, height: 14 }} />
        動態尾巴
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8, fontSize: 12 }}>
        <input type="checkbox" checked={props.showOrbits} onChange={(e) => props.onShowOrbitsChange(e.target.checked)} style={{ accentColor: T.ACCENT, width: 14, height: 14 }} />
        靜態軌道線
      </label>

      <SectionHeader>視覺參數</SectionHeader>
      <SliderRow label="尾巴長度" value={props.trailLength} min={3} max={20} step={1} format={(v) => `${v} 步`} onChange={props.onTrailLengthChange} />
      <SliderRow label="衛星大小" value={props.orbScale} min={0.3} max={3} step={0.1} format={(v) => `${v.toFixed(1)}x`} onChange={props.onOrbScaleChange} />
      <SliderRow label="衛星不透明度" value={props.orbOpacity} min={0.1} max={1} step={0.05} format={(v) => v.toFixed(2)} onChange={props.onOrbOpacityChange} />
      <SliderRow label="軌跡不透明度" value={props.orbitOpacity} min={0.05} max={0.8} step={0.05} format={(v) => v.toFixed(2)} onChange={props.onOrbitOpacityChange} />
    </>
  );
}

/* ── Panel: Filters ────────────────────────────────────── */

function FiltersPanel(props: SidebarProps) {
  const [filterTab, setFilterTab] = useState<"constellation" | "country">("constellation");

  // 統計星座
  const constellations = useMemo(() => {
    const map = new Map<string, number>();
    for (const tle of props.tles) {
      const c = tle.constellation || "Other";
      map.set(c, (map.get(c) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [props.tles]);

  // 統計國家（從 constellation 推斷）
  const CONSTELLATION_COUNTRY: Record<string, string> = {
    Starlink: "美國", OneWeb: "英國", GPS: "美國", Galileo: "歐盟",
    BeiDou: "中國", GLONASS: "俄羅斯", Iridium: "美國", Globalstar: "美國",
    Orbcomm: "美國", Planet: "美國", Spire: "美國", COSMOS: "俄羅斯",
    Qianfan: "中國",
  };

  const countries = useMemo(() => {
    const map = new Map<string, number>();
    for (const tle of props.tles) {
      const country = CONSTELLATION_COUNTRY[tle.constellation] ?? "其他";
      map.set(country, (map.get(country) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [props.tles]);

  return (
    <>
      {/* Tab 切換 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {(["constellation", "country"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            style={{
              flex: 1, padding: "5px 0", fontSize: 11, fontFamily: "monospace",
              border: `1px solid ${filterTab === tab ? T.ACTIVE_BORDER : T.BORDER}`,
              borderRadius: 4,
              background: filterTab === tab ? T.ACTIVE_BG : "transparent",
              color: filterTab === tab ? "#fff" : T.DIM,
              cursor: "pointer",
            }}
          >
            {tab === "constellation" ? "星座/系統" : "國家"}
          </button>
        ))}
      </div>

      {filterTab === "constellation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 400, overflowY: "auto" }}>
          {constellations.map(([name, count]) => {
            const active = props.visibleConstellations.has(name);
            return (
              <label key={name} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 11 }}>
                <input
                  type="checkbox" checked={active}
                  onChange={() => props.onToggleConstellation(name)}
                  style={{ accentColor: T.ACCENT, width: 13, height: 13 }}
                />
                <span style={{ opacity: active ? 1 : 0.4, flex: 1 }}>{name}</span>
                <span style={{ opacity: 0.3, fontSize: 10 }}>{count.toLocaleString()}</span>
              </label>
            );
          })}
        </div>
      )}

      {filterTab === "country" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 400, overflowY: "auto" }}>
          {countries.map(([country, count]) => {
            const active = props.visibleCountries.has(country);
            return (
              <label key={country} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 11 }}>
                <input
                  type="checkbox" checked={active}
                  onChange={() => props.onToggleCountry(country)}
                  style={{ accentColor: T.ACCENT, width: 13, height: 13 }}
                />
                <span style={{ opacity: active ? 1 : 0.4, flex: 1 }}>{country}</span>
                <span style={{ opacity: 0.3, fontSize: 10 }}>{count.toLocaleString()}</span>
              </label>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ── Panel: Colors ─────────────────────────────────────── */

function ColorsPanel(props: SidebarProps) {
  const types = ["Starlink", "LEO", "MEO", "GEO", "HEO"];
  return (
    <>
      <SectionHeader>軌道類型配色</SectionHeader>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {types.map((type) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
            <input
              type="color"
              value={props.colors[type] ?? DEFAULT_COLORS[type]}
              onChange={(e) => props.onColorChange(type, e.target.value)}
              style={{ width: 28, height: 28, border: "none", borderRadius: 4, cursor: "pointer", background: "none", padding: 0 }}
            />
            <span style={{ flex: 1, opacity: 0.85 }}>{FILTER_LABELS[type] ?? type}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 10, color: T.DIM, lineHeight: 1.5 }}>
        點選色塊自訂各軌道類型的顯示顏色。改色後衛星光點和軌跡都會即時更新。
      </div>
    </>
  );
}

/* ── Panel: Stats ──────────────────────────────────────── */

function StatsPanel(props: SidebarProps) {
  const total = props.tles.length;
  const byOrbit = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of props.tles) m[t.orbit_type] = (m[t.orbit_type] ?? 0) + 1;
    return m;
  }, [props.tles]);

  return (
    <>
      <SectionHeader>衛星統計</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{total.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: T.DIM, marginTop: 2 }}>追蹤中</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{Object.keys(byOrbit).length}</div>
          <div style={{ fontSize: 10, color: T.DIM, marginTop: 2 }}>軌道類型</div>
        </div>
      </div>

      <SectionHeader>軌道分佈</SectionHeader>
      {Object.entries(byOrbit).sort((a, b) => b[1] - a[1]).map(([orbit, count]) => {
        const pct = total > 0 ? (count / total * 100) : 0;
        return (
          <div key={orbit} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
              <span>{orbit}</span>
              <span style={{ color: T.DIM }}>{count.toLocaleString()} ({pct.toFixed(1)}%)</span>
            </div>
            <div style={{ height: 4, background: T.SLIDER_TRACK, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: DEFAULT_COLORS[orbit] ?? T.ACCENT, borderRadius: 2 }} />
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 16, fontSize: 10, color: T.DIM, lineHeight: 1.5 }}>
        資料來源：CelesTrak GP 3LE<br />
        元數據：UCS Satellite Database (7,560 筆)
      </div>
    </>
  );
}

/* ── Main Component ────────────────────────────────────── */

const PANELS: Array<{ id: PanelId; icon: () => ReactNode; title: string }> = [
  { id: "settings", icon: IconSettings, title: "設定" },
  { id: "filters", icon: IconLayers, title: "篩選圖層" },
  { id: "colors", icon: IconPalette, title: "顏色調整" },
  { id: "stats", icon: IconBarChart, title: "統計" },
];

export function Sidebar(props: SidebarProps) {
  const [activePanel, setActivePanel] = useState<PanelId | null>("settings");

  const handleIconClick = (id: PanelId) => {
    setActivePanel((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <style>{`
        @keyframes sidebarSlideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .sidebar-scrollbar::-webkit-scrollbar { width: 4px; }
        .sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* Icon Rail */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: 48,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 12,
        gap: 4,
        background: T.BG_RAIL,
        backdropFilter: "blur(16px)",
        borderRight: `1px solid ${T.BORDER}`,
      }}>
        {PANELS.map(({ id, icon: Icon, title }) => (
          <RailIcon key={id} active={activePanel === id} onClick={() => handleIconClick(id)} title={title}>
            <Icon />
          </RailIcon>
        ))}
      </div>

      {/* Floating Panel */}
      {activePanel && (
        <div
          className="sidebar-scrollbar"
          style={{
            position: "absolute",
            top: 64,
            left: 56,
            maxHeight: "calc(100vh - 140px)",
            width: 260,
            zIndex: 19,
            padding: "14px 16px",
            background: T.BG_PANEL,
            backdropFilter: "blur(16px)",
            borderRadius: 12,
            border: `1px solid ${T.BORDER}`,
            fontFamily: "monospace",
            fontSize: 12,
            color: T.TEXT,
            overflowY: "auto",
            animation: "sidebarSlideIn 0.2s ease-out",
          }}
        >
          {/* Panel Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${T.BORDER}`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {PANELS.find((p) => p.id === activePanel)?.title}
            </span>
            <button
              onClick={() => setActivePanel(null)}
              style={{
                background: "rgba(255,255,255,0.06)", border: `1px solid ${T.BORDER}`,
                borderRadius: 4, color: T.DIM, cursor: "pointer", padding: "2px 8px",
                fontSize: 11, fontFamily: "monospace",
              }}
            >
              x
            </button>
          </div>

          {/* Panel Content */}
          {activePanel === "settings" && <SettingsPanel {...props} />}
          {activePanel === "filters" && <FiltersPanel {...props} />}
          {activePanel === "colors" && <ColorsPanel {...props} />}
          {activePanel === "stats" && <StatsPanel {...props} />}
        </div>
      )}
    </>
  );
}
