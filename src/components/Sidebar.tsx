/**
 * 衛星追蹤側邊欄 — Icon Rail + 浮動面板
 * 對齊 Pencil 設計稿
 */

import { useState, useMemo, type ReactNode } from "react";
import type { SatelliteTLE } from "../data/satelliteLoader";
import { CATEGORIES, categoryLabel } from "../data/satelliteLoader";
import {
  SlidersHorizontal,
  Layers,
  Palette,
  Satellite,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Camera,
  Info,
  Rocket,
} from "lucide-react";
import type { Launch } from "../data/launchLoader";
import { LaunchPanel } from "./LaunchPanel";

type PanelId = "settings" | "filters" | "colors" | "stats" | "camera" | "launches";

export interface SidebarProps {
  tles: SatelliteTLE[];
  visibleCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
  onSoloCategory: (cat: string) => void;
  showTrails: boolean;
  onShowTrailsChange: (v: boolean) => void;
  showOrbits: boolean;
  onShowOrbitsChange: (v: boolean) => void;
  showDayNight: boolean;
  onShowDayNightChange: (v: boolean) => void;
  orbitOpacity: number;
  onOrbitOpacityChange: (v: number) => void;
  orbScale: number;
  onOrbScaleChange: (v: number) => void;
  trailLength: number;
  onTrailLengthChange: (v: number) => void;
  orbOpacity: number;
  onOrbOpacityChange: (v: number) => void;
  colors: Record<string, string>;
  onColorChange: (type: string, color: string) => void;
  visibleConstellations: Set<string>;
  onToggleConstellation: (name: string) => void;
  visibleCountries: Set<string>;
  onToggleCountry: (country: string) => void;
  onSelectAllConstellations?: () => void;
  onClearConstellations?: () => void;
  onSelectAllCountries?: () => void;
  onClearCountries?: () => void;
  showLaunchPads?: boolean;
  onShowLaunchPadsChange?: (v: boolean) => void;
  onInfoClick?: () => void;
  onCameraPreset?: (preset: string) => void;
  isMobile?: boolean;
  launches?: Launch[];
  onFlyToLaunch?: (lat: number, lng: number, launch?: Launch) => void;
}

/* ── Design Tokens (from Pencil) ─────────────────────── */

const T = {
  FONT: "'Inter', sans-serif",
  BG_PANEL: "#12161ECC",
  BORDER_SUBTLE: "rgba(255,255,255,0.06)",
  BORDER: "rgba(255,255,255,0.10)",
  DIM: "#6B7280",
  FONT_PRIMARY: "#FFFFFF",
  FONT_SECONDARY: "rgba(255,255,255,0.7)",
  FONT_TERTIARY: "rgba(255,255,255,0.45)",
  FONT_MUTED: "rgba(255,255,255,0.3)",
  ACCENT: "#5B9CF6",
  ACCENT_DIM: "rgba(91,156,246,0.12)",
  ACCENT_MUTED: "rgba(91,156,246,0.3)",
  SLIDER_TRACK: "rgba(255,255,255,0.08)",
  SLIDER_FILL: "#5B9CF6",
  BG_ELEVATED: "rgba(255,255,255,0.04)",
};

const BLUR_PANEL = "blur(24px)";

/* ── Sub-components ──────────────────────────────────── */

function RailIcon({ active, onClick, children, title }: {
  active: boolean; onClick: () => void; children: ReactNode; title?: string;
}) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
      background: active ? T.ACCENT_DIM : "transparent",
      border: "none", borderRadius: 10, cursor: "pointer",
      color: active ? T.ACCENT : T.FONT_TERTIARY,
      transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}

function SectionHeader({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, letterSpacing: 1.2,
      textTransform: "uppercase", color: T.FONT_MUTED,
      marginBottom: 10, fontFamily: T.FONT,
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: T.BORDER_SUBTLE, width: "100%", flexShrink: 0 }} />;
}

function SliderRow({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number; format?: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: T.FONT, color: T.FONT_SECONDARY, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: T.DIM }}>{format ? format(value) : String(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", height: 3, appearance: "none", WebkitAppearance: "none", background: T.SLIDER_TRACK, borderRadius: 2, outline: "none", cursor: "pointer", accentColor: T.ACCENT }} />
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 36, height: 20, borderRadius: 10, cursor: "pointer",
      background: checked ? T.ACCENT_MUTED : "rgba(255,255,255,0.08)",
      border: `1px solid ${checked ? T.ACCENT_MUTED : "rgba(255,255,255,0.12)"}`,
      position: "relative", transition: "background 0.2s",
      flexShrink: 0,
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: "50%",
        background: checked ? T.ACCENT : "rgba(255,255,255,0.4)",
        position: "absolute", top: 2,
        left: checked ? 19 : 2,
        transition: "left 0.2s, background 0.2s",
      }} />
    </div>
  );
}

/* ── Bar Chart Icon (Phosphor style) ─────────────────── */

function IconBarChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
      <path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z" />
    </svg>
  );
}

/* ── Panel: Settings ─────────────────────────────────── */

function SettingsPanel(props: SidebarProps) {
  const catStats = useMemo(() => {
    const s: Record<string, number> = {};
    for (const t of props.tles) s[t.category] = (s[t.category] ?? 0) + 1;
    return s;
  }, [props.tles]);

  const catOrder = Object.keys(CATEGORIES);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 用途分類 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <SectionHeader>用途分類</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {catOrder.map((cat) => {
            const info = CATEGORIES[cat]!;
            const active = props.visibleCategories.has(cat);
            const count = catStats[cat] ?? 0;
            if (count === 0) return null;
            const isSolo = active && props.visibleCategories.size === 1;
            return (
              <div key={cat} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "5px 0", fontFamily: T.FONT,
              }}>
                <div onClick={() => props.onToggleCategory(cat)} style={{
                  display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: props.colors[cat] ?? info.color,
                    opacity: active ? 1 : 0.2, flexShrink: 0,
                  }} />
                  <span style={{ flex: 1, fontSize: 13, color: T.FONT_SECONDARY, opacity: active ? 1 : 0.35 }}>{info.zh}</span>
                </div>
                <span
                  title={isSolo ? "顯示全部" : "只看這個"}
                  onClick={(e) => { e.stopPropagation(); props.onSoloCategory(cat); }}
                  style={{
                    fontSize: 11, padding: "2px 6px", borderRadius: 4, cursor: "pointer",
                    background: isSolo ? T.ACCENT_DIM : "transparent",
                    color: isSolo ? T.ACCENT : T.DIM,
                    opacity: active ? 0.8 : 0.2,
                    transition: "all 0.15s",
                  }}
                >{isSolo ? "ALL" : count.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Divider />

      {/* 顯示 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionHeader>顯示</SectionHeader>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontFamily: T.FONT, color: T.FONT_SECONDARY }}>動態尾巴</span>
          <ToggleSwitch checked={props.showTrails} onChange={props.onShowTrailsChange} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontFamily: T.FONT, color: T.FONT_SECONDARY }}>靜態軌道線</span>
          <ToggleSwitch checked={props.showOrbits} onChange={props.onShowOrbitsChange} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontFamily: T.FONT, color: T.FONT_SECONDARY }}>日夜交替</span>
          <ToggleSwitch checked={props.showDayNight} onChange={props.onShowDayNightChange} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontFamily: T.FONT, color: T.FONT_SECONDARY }}>發射台標記</span>
          <ToggleSwitch checked={props.showLaunchPads ?? true} onChange={(v) => props.onShowLaunchPadsChange?.(v)} />
        </div>
      </div>

      <Divider />

      {/* 視覺參數 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionHeader>視覺參數</SectionHeader>
        <SliderRow label="尾巴長度" value={props.trailLength} min={20} max={50} step={1} format={(v) => `${v} 步`} onChange={props.onTrailLengthChange} />
        <SliderRow label="衛星大小" value={props.orbScale} min={0.3} max={3} step={0.1} format={(v) => `${v.toFixed(1)}x`} onChange={props.onOrbScaleChange} />
        <SliderRow label="衛星不透明度" value={props.orbOpacity} min={0.1} max={1} step={0.05} format={(v) => v.toFixed(2)} onChange={props.onOrbOpacityChange} />
        <SliderRow label="軌跡不透明度" value={props.orbitOpacity} min={0.05} max={0.8} step={0.05} format={(v) => v.toFixed(2)} onChange={props.onOrbitOpacityChange} />
      </div>
    </div>
  );
}

/* ── Panel: Filters ──────────────────────────────────── */

function FiltersPanel(props: SidebarProps) {
  const [tab, setTab] = useState<"system" | "country" | "purpose">("system");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const searchLower = search.toLowerCase();

  const catGroups = useMemo(() => {
    const groups: Record<string, Map<string, number>> = {};
    for (const t of props.tles) {
      if (!groups[t.category]) groups[t.category] = new Map();
      const key = t.constellation || "Other";
      groups[t.category]!.set(key, (groups[t.category]!.get(key) ?? 0) + 1);
    }
    return groups;
  }, [props.tles]);

  const countries = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of props.tles) {
      const c = t.country_operator ?? "Unknown";
      map.set(c, (map.get(c) ?? 0) + 1);
    }
    // Taiwan 置頂，其餘按數量降序
    return [...map.entries()].sort((a, b) => {
      if (a[0] === "Taiwan") return -1;
      if (b[0] === "Taiwan") return 1;
      return b[1] - a[1];
    });
  }, [props.tles]);

  const purposes = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of props.tles) {
      const cat = CATEGORIES[t.category];
      map.set(cat?.zh ?? t.category, (map.get(cat?.zh ?? t.category) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [props.tles]);

  const catOrder = Object.keys(CATEGORIES);
  const tabs = [
    { key: "system" as const, label: "All" },
    { key: "country" as const, label: "Country" },
    { key: "purpose" as const, label: "Purpose" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 搜尋框 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        height: 36, padding: "0 12px",
        background: T.BG_ELEVATED, border: `1px solid ${T.BORDER}`,
        borderRadius: 8,
      }}>
        <Search size={14} color={T.DIM} />
        <input
          type="text" placeholder="Search satellites..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, background: "transparent", border: "none",
            color: T.FONT_SECONDARY, fontFamily: T.FONT, fontSize: 13,
            outline: "none",
          }}
        />
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 2, padding: 2,
        background: T.BG_ELEVATED, borderRadius: 8,
      }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "6px 0", fontSize: 12, fontFamily: T.FONT, fontWeight: 500,
            border: "none", borderRadius: 6,
            background: tab === t.key ? T.ACCENT_DIM : "transparent",
            color: tab === t.key ? T.ACCENT : T.DIM,
            cursor: "pointer", transition: "all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 衛星系統 tab */}
      {tab === "system" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {catOrder.map((cat) => {
            const info = CATEGORIES[cat]!;
            const constellations = catGroups[cat];
            if (!constellations || constellations.size === 0) return null;
            const filteredEntries = [...constellations.entries()].filter(([name]) =>
              !searchLower || name.toLowerCase().includes(searchLower) || info.zh.includes(search) || info.en.toLowerCase().includes(searchLower)
            );
            if (searchLower && filteredEntries.length === 0) return null;
            const totalCount = [...constellations.values()].reduce((a, b) => a + b, 0);
            const isExpanded = expandedCat === cat || !!searchLower;

            return (
              <div key={cat}>
                <button onClick={() => setExpandedCat(isExpanded && !searchLower ? null : cat)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px",
                  background: T.BG_ELEVATED, border: "none", borderRadius: 8,
                  cursor: "pointer", color: T.FONT_SECONDARY,
                  fontSize: 13, fontFamily: T.FONT, textAlign: "left",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: props.colors[cat] ?? info.color, flexShrink: 0,
                  }} />
                  <span style={{ flex: 1, fontWeight: isExpanded ? 600 : 400 }}>{categoryLabel(cat)}</span>
                  <span style={{ color: T.DIM, fontSize: 12 }}>{totalCount.toLocaleString()}</span>
                  {isExpanded ? <ChevronDown size={14} color={T.DIM} /> : <ChevronRight size={14} color={T.DIM} />}
                </button>
                {isExpanded && (
                  <div style={{ paddingLeft: 20, paddingRight: 12, display: "flex", flexDirection: "column", gap: 2, marginTop: 4, marginBottom: 4 }}>
                    {filteredEntries.sort((a, b) => b[1] - a[1]).map(([name, count]) => {
                      const active = props.visibleConstellations.has(name);
                      return (
                        <div key={name} onClick={() => props.onToggleConstellation(name)} style={{
                          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                          padding: "4px 0", fontSize: 12, fontFamily: T.FONT,
                        }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: props.colors[cat] ?? info.color,
                            opacity: active ? 1 : 0.2, flexShrink: 0,
                          }} />
                          <span style={{ opacity: active ? 0.9 : 0.35, flex: 1, color: T.FONT_SECONDARY }}>{name}</span>
                          <span style={{ opacity: 0.3, fontSize: 11, color: T.DIM }}>{count.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 國家 tab */}
      {tab === "country" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {countries.filter(([c]) => !searchLower || c.toLowerCase().includes(searchLower)).map(([country, count]) => {
            const active = props.visibleCountries.has(country);
            return (
              <div key={country} onClick={() => props.onToggleCountry(country)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                background: active ? T.BG_ELEVATED : "transparent",
                fontSize: 13, fontFamily: T.FONT,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: T.ACCENT, opacity: active ? 1 : 0.2, flexShrink: 0,
                }} />
                <span style={{ opacity: active ? 0.9 : 0.4, flex: 1, color: T.FONT_SECONDARY }}>{country}</span>
                <span style={{ opacity: 0.3, fontSize: 11, color: T.DIM }}>{count.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 用途 tab */}
      {tab === "purpose" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {purposes.filter(([p]) => !searchLower || p.toLowerCase().includes(searchLower)).map(([purpose, count]) => (
            <div key={purpose} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 12px", fontSize: 13, fontFamily: T.FONT,
            }}>
              <span style={{ flex: 1, color: T.FONT_SECONDARY }}>{purpose}</span>
              <span style={{ color: T.DIM, fontSize: 11 }}>{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* 全選/清除 — 根據當前 tab 操作對應篩選器 */}
      <Divider />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => {
          if (tab === "country") { props.onSelectAllCountries?.(); }
          else { props.onSelectAllConstellations?.(); }
        }} style={{
          flex: 1, padding: "6px 0", fontSize: 12, fontFamily: T.FONT, fontWeight: 500,
          border: `1px solid ${T.BORDER_SUBTLE}`, borderRadius: 6,
          background: "transparent", color: T.DIM, cursor: "pointer",
        }}>Select All</button>
        <button onClick={() => {
          if (tab === "country") { props.onClearCountries?.(); }
          else { props.onClearConstellations?.(); }
        }} style={{
          flex: 1, padding: "6px 0", fontSize: 12, fontFamily: T.FONT, fontWeight: 500,
          border: `1px solid ${T.BORDER_SUBTLE}`, borderRadius: 6,
          background: "transparent", color: T.DIM, cursor: "pointer",
        }}>Clear</button>
      </div>
    </div>
  );
}

/* ── Panel: Colors ───────────────────────────────────── */

const COLOR_PRESETS: Record<string, { name: string; colors: Record<string, string> }> = {
  default: { name: "Default", colors: Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, v.color])) },
  warm: { name: "Warm", colors: { starlink: "#ffcc80", broadband: "#ff8a65", phone: "#ffab40", geo_comms: "#ffd54f", navigation: "#fff176", earth_obs: "#aed581", science: "#e6ee9c", military: "#ef9a9a", tech_demo: "#bcaaa4", debris: "#8d6e63", other: "#a1887f" } },
  cool: { name: "Cool", colors: { starlink: "#80deea", broadband: "#4dd0e1", phone: "#4fc3f7", geo_comms: "#64b5f6", navigation: "#7986cb", earth_obs: "#9fa8da", science: "#b39ddb", military: "#ce93d8", tech_demo: "#90a4ae", debris: "#546e7a", other: "#78909c" } },
  mono: { name: "Mono", colors: { starlink: "#f5f5f5", broadband: "#e0e0e0", phone: "#bdbdbd", geo_comms: "#9e9e9e", navigation: "#eeeeee", earth_obs: "#b0bec5", science: "#cfd8dc", military: "#757575", tech_demo: "#616161", debris: "#424242", other: "#424242" } },
};

function ColorsPanel(props: SidebarProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 預設主題 */}
      <div>
        <SectionHeader>預設主題</SectionHeader>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(COLOR_PRESETS).slice(0, 2).map(([key, preset]) => (
            <button key={key} onClick={() => {
              for (const [cat, color] of Object.entries(preset.colors)) props.onColorChange(cat, color);
            }} style={{
              flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer",
              background: T.BG_ELEVATED, border: `1px solid ${T.BORDER_SUBTLE}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}>
              <div style={{ display: "flex", gap: 3 }}>
                {Object.values(preset.colors).slice(0, 5).map((c, i) => (
                  <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: T.DIM, fontFamily: T.FONT }}>{preset.name}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {Object.entries(COLOR_PRESETS).slice(2).map(([key, preset]) => (
            <button key={key} onClick={() => {
              for (const [cat, color] of Object.entries(preset.colors)) props.onColorChange(cat, color);
            }} style={{
              flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer",
              background: T.BG_ELEVATED, border: `1px solid ${T.BORDER_SUBTLE}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}>
              <div style={{ display: "flex", gap: 3 }}>
                {Object.values(preset.colors).slice(0, 5).map((c, i) => (
                  <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: T.DIM, fontFamily: T.FONT }}>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* 自訂顏色 */}
      <div>
        <SectionHeader>自訂顏色</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(CATEGORIES).map(([cat, info]) => (
            <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, height: 34 }}>
              <input type="color" value={props.colors[cat] ?? info.color} onChange={(e) => props.onColorChange(cat, e.target.value)}
                style={{ width: 24, height: 24, border: "none", borderRadius: 6, cursor: "pointer", background: "none", padding: 0 }} />
              <span style={{ flex: 1, fontSize: 13, fontFamily: T.FONT, color: T.FONT_SECONDARY }}>{categoryLabel(cat)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Panel: Stats ────────────────────────────────────── */

function DonutChart({ data, size = 100 }: { data: Array<{ label: string; value: number; color: string }>; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const r = size / 2;
  const innerR = r * 0.6;
  let cumAngle = -Math.PI / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const angle = (d.value / total) * Math.PI * 2;
        const startAngle = cumAngle;
        cumAngle += angle;
        const endAngle = cumAngle;
        const largeArc = angle > Math.PI ? 1 : 0;
        const x1 = r + Math.cos(startAngle) * r;
        const y1 = r + Math.sin(startAngle) * r;
        const x2 = r + Math.cos(endAngle) * r;
        const y2 = r + Math.sin(endAngle) * r;
        const ix1 = r + Math.cos(endAngle) * innerR;
        const iy1 = r + Math.sin(endAngle) * innerR;
        const ix2 = r + Math.cos(startAngle) * innerR;
        const iy2 = r + Math.sin(startAngle) * innerR;
        return (
          <path key={i} fill={d.color} opacity={0.85}
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`} />
        );
      })}
    </svg>
  );
}

function StatsPanel(props: SidebarProps) {
  const total = props.tles.length;

  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of props.tles) m[t.category] = (m[t.category] ?? 0) + 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [props.tles]);

  const byOrbit = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of props.tles) m[t.orbit_type] = (m[t.orbit_type] ?? 0) + 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [props.tles]);

  const topOperators = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of props.tles) {
      const op = t.constellation || "Other";
      m.set(op, (m.get(op) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [props.tles]);

  const visible = props.tles.filter((t) => props.visibleCategories.has(t.category)).length;

  const donutData = byCat.map(([cat, count]) => ({
    label: CATEGORIES[cat]?.zh ?? cat,
    value: count,
    color: props.colors[cat] ?? CATEGORIES[cat]?.color ?? T.ACCENT,
  }));

  const maxOrbitCount = byOrbit.length > 0 ? byOrbit[0][1] : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Overview Metrics */}
      <div>
        <SectionHeader>統計</SectionHeader>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            flex: 1, background: T.BG_ELEVATED, borderRadius: 10, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: T.ACCENT, fontFamily: T.FONT }}>{total.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: T.DIM, marginTop: 2, fontFamily: T.FONT }}>追蹤衛星總數</div>
          </div>
          <div style={{
            flex: 1, background: T.BG_ELEVATED, borderRadius: 10, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#81c784", fontFamily: T.FONT }}>{visible.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: T.DIM, marginTop: 2, fontFamily: T.FONT }}>目前顯示中</div>
          </div>
        </div>
      </div>

      <Divider />

      {/* Orbit Distribution */}
      <div>
        <SectionHeader>軌道分佈</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {byOrbit.map(([orbit, count]) => (
            <div key={orbit}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: T.FONT, marginBottom: 4 }}>
                <span style={{ color: T.FONT_SECONDARY }}>{orbit}</span>
                <span style={{ color: T.DIM }}>{count.toLocaleString()}</span>
              </div>
              <div style={{ height: 4, background: T.SLIDER_TRACK, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(count / maxOrbitCount) * 100}%`, background: T.ACCENT, borderRadius: 2, transition: "width 0.3s" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Category Donut */}
      <div>
        <SectionHeader>用途分佈</SectionHeader>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <DonutChart data={donutData} size={90} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, fontFamily: T.FONT }}>
            {byCat.slice(0, 6).map(([cat, count]) => {
              const info = CATEGORIES[cat];
              const pct = total > 0 ? (count / total * 100).toFixed(1) : "0";
              return (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 2, background: props.colors[cat] ?? info?.color ?? T.ACCENT, flexShrink: 0 }} />
                  <span style={{ color: T.FONT_SECONDARY }}>{info?.en ?? cat}</span>
                  <span style={{ color: T.DIM }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Divider />

      {/* Top Operators */}
      <div>
        <SectionHeader>主要營運商</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {topOperators.map(([op, count]) => (
            <div key={op} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: T.FONT }}>
              <span style={{ color: T.FONT_SECONDARY }}>{op}</span>
              <span style={{ color: T.DIM }}>{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Panel: Camera Presets ────────────────────────────── */

const CAMERA_PRESETS = [
  { id: "north_pole", label: "北極俯視", desc: "太陽同步軌道", icon: "🌐" },
  { id: "south_pole", label: "南極俯視", desc: "極地軌道", icon: "🌐" },
  { id: "equator", label: "赤道正視", desc: "GEO 衛星帶", icon: "🌍" },
  { id: "overview", label: "全景遠距", desc: "整體分佈", icon: "🔭" },
  { id: "closeup", label: "特寫近距", desc: "衛星細節", icon: "🔍" },
];

function CameraPanel(props: SidebarProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <SectionHeader>預設視角</SectionHeader>
      {CAMERA_PRESETS.map((preset) => (
        <button key={preset.id} onClick={() => props.onCameraPreset?.(preset.id)} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", borderRadius: 8, cursor: "pointer",
          background: T.BG_ELEVATED, border: `1px solid ${T.BORDER_SUBTLE}`,
          color: T.FONT_SECONDARY, fontFamily: T.FONT, fontSize: 13, textAlign: "left",
          width: "100%", transition: "all 0.15s",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{preset.icon}</span>
          <div>
            <div style={{ fontWeight: 500 }}>{preset.label}</div>
            <div style={{ fontSize: 11, color: T.DIM, marginTop: 1 }}>{preset.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ── Panel Width Map ─────────────────────────────────── */

const PANEL_WIDTH: Record<PanelId, number> = {
  settings: 258,
  filters: 280,
  colors: 260,
  stats: 300,
  camera: 240,
  launches: 320,
};

/* ── Main Panel Titles ───────────────────────────────── */

const PANELS: Array<{ id: PanelId; icon: (props: { size: number }) => ReactNode; title: string }> = [
  { id: "settings", icon: ({ size }) => <SlidersHorizontal size={size} />, title: "設定" },
  { id: "filters", icon: ({ size }) => <Layers size={size} />, title: "篩選圖層" },
  { id: "colors", icon: ({ size }) => <Palette size={size} />, title: "配色主題" },
  { id: "stats", icon: (_props: { size: number }) => <IconBarChart />, title: "統計" },
  { id: "camera", icon: ({ size }) => <Camera size={size} />, title: "視角" },
  { id: "launches", icon: ({ size }) => <Rocket size={size} />, title: "發射時程" },
];

/* ── Main Component ──────────────────────────────────── */

export function Sidebar(props: SidebarProps) {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const mobile = props.isMobile;

  const handleIconClick = (id: PanelId) => {
    setActivePanel((p) => p === id ? null : id);
    if (!hasOpenedOnce) setHasOpenedOnce(true);
  };

  const panelContent = activePanel && (
    <div style={{
      position: "absolute",
      ...(mobile
        ? { bottom: 56, left: 8, right: 8, maxHeight: "60vh" }
        : { top: 82, left: 76, maxHeight: "calc(100vh - 140px)", width: PANEL_WIDTH[activePanel] }),
      zIndex: 19,
      background: T.BG_PANEL, backdropFilter: BLUR_PANEL,
      borderRadius: 14, border: `1px solid ${T.BORDER_SUBTLE}`,
      fontFamily: T.FONT, fontSize: 13, color: T.FONT_PRIMARY,
      display: "flex", flexDirection: "column", overflow: "hidden",
      animation: mobile ? "mobileSlideUp 0.2s ease-out" : "sidebarSlideIn 0.2s ease-out",
    }}>
      {/* 固定 Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 20px", flexShrink: 0,
        borderBottom: `1px solid ${T.BORDER_SUBTLE}`,
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: T.FONT }}>{PANELS.find((p) => p.id === activePanel)?.title}</span>
        <button onClick={() => setActivePanel(null)} style={{
          width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.06)", border: `1px solid ${T.BORDER_SUBTLE}`, borderRadius: 6,
          color: T.DIM, cursor: "pointer", padding: 0,
        }}>
          <X size={12} />
        </button>
      </div>
      {/* 可捲動內容 */}
      <div className="sidebar-scrollbar" style={{ padding: "12px 20px 16px", overflowY: "auto", flex: 1 }}>
        {activePanel === "settings" && <SettingsPanel {...props} />}
        {activePanel === "filters" && <FiltersPanel {...props} />}
        {activePanel === "colors" && <ColorsPanel {...props} />}
        {activePanel === "stats" && <StatsPanel {...props} />}
        {activePanel === "camera" && <CameraPanel {...props} />}
        {activePanel === "launches" && <LaunchPanel launches={props.launches ?? []} onFlyTo={(lat, lng, launch) => props.onFlyToLaunch?.(lat, lng, launch)} />}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes sidebarSlideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes mobileSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .sidebar-scrollbar::-webkit-scrollbar { width: 4px; }
        .sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>

      {mobile ? (
        /* ── 手機版：底部水平工具列 ── */
        <>
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
            height: 52, display: "flex", alignItems: "center", justifyContent: "center",
            gap: 4, padding: "0 8px",
            background: T.BG_PANEL, backdropFilter: BLUR_PANEL,
            borderTop: `1px solid ${T.BORDER_SUBTLE}`,
          }}>
            {/* 品牌圖示 */}
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(180deg, #5B9CF6 0%, #3D6DB3 100%)",
            }}>
              <Satellite size={16} color="#fff" />
            </div>

            <div style={{ width: 1, height: 24, background: T.BORDER, margin: "0 2px", flexShrink: 0 }} />

            {PANELS.map(({ id, icon: Icon, title }) => (
              <button key={id} title={title} onClick={() => handleIconClick(id)} style={{
                width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
                background: activePanel === id ? T.ACCENT_DIM : "transparent",
                border: "none", borderRadius: 8, cursor: "pointer",
                color: activePanel === id ? T.ACCENT : T.FONT_TERTIARY,
                position: "relative", padding: 0,
              }}>
                <Icon size={18} />
                {id === "settings" && !hasOpenedOnce && (
                  <div style={{
                    position: "absolute", top: 6, right: 6,
                    width: 5, height: 5, borderRadius: "50%",
                    background: "#EF4444", boxShadow: "0 0 4px rgba(239,68,68,0.6)",
                  }} />
                )}
              </button>
            ))}

            <div style={{ width: 1, height: 24, background: T.BORDER, margin: "0 2px", flexShrink: 0 }} />

            <button title="使用指南" onClick={() => props.onInfoClick?.()} style={{
              width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "none", borderRadius: 8, cursor: "pointer",
              color: T.FONT_TERTIARY, padding: 0,
            }}>
              <Info size={18} />
            </button>
          </div>

          {/* 面板從底部滑出 */}
          {panelContent}
        </>
      ) : (
        /* ── 桌面版：左側垂直浮動卡片 ── */
        <>
          <div style={{
            position: "absolute", top: 82, left: 12, zIndex: 20,
            width: 52, display: "flex", flexDirection: "column", alignItems: "center",
            padding: "14px 0", gap: 6,
            background: T.BG_PANEL, backdropFilter: BLUR_PANEL,
            borderRadius: 14, border: `1px solid ${T.BORDER_SUBTLE}`,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(180deg, #5B9CF6 0%, #3D6DB3 100%)",
              boxShadow: "0 4px 16px rgba(91,156,246,0.25)",
            }}>
              <Satellite size={22} color="#fff" />
            </div>
            <div style={{ width: 32, height: 1, background: T.BORDER }} />
            {PANELS.map(({ id, icon: Icon, title }) => (
              <RailIcon key={id} active={activePanel === id} onClick={() => handleIconClick(id)} title={title}>
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} />
                  {id === "settings" && !hasOpenedOnce && (
                    <div style={{
                      position: "absolute", top: -2, right: -2,
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#EF4444", boxShadow: "0 0 4px rgba(239,68,68,0.6)",
                    }} />
                  )}
                </div>
              </RailIcon>
            ))}
            <div style={{ width: 32, height: 1, background: T.BORDER }} />
            <RailIcon active={false} onClick={() => props.onInfoClick?.()} title="使用指南">
              <Info size={20} />
            </RailIcon>
          </div>
          {panelContent}
        </>
      )}
    </>
  );
}
