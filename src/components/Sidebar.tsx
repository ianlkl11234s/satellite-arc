/**
 * 衛星追蹤側邊欄 — Icon Rail + 浮動面板
 */

import { useState, useMemo, type ReactNode } from "react";
import type { SatelliteTLE } from "../data/satelliteLoader";
import { CATEGORIES } from "../data/satelliteLoader";

type PanelId = "settings" | "filters" | "colors" | "stats";

export interface SidebarProps {
  tles: SatelliteTLE[];
  // 用途分類篩選
  visibleCategories: Set<string>;
  onToggleCategory: (cat: string) => void;
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
  // 全選/清除
  onSelectAllConstellations?: () => void;
  onClearConstellations?: () => void;
  onSelectAllCountries?: () => void;
  onClearCountries?: () => void;
}

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

/* ── Sub-components ────────────────────────────────────── */

function RailIcon({ active, onClick, children, title }: {
  active: boolean; onClick: () => void; children: ReactNode; title?: string;
}) {
  return (
    <button title={title} onClick={onClick} style={{
      position: "relative", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
      background: "none", border: "none", borderRadius: 8, cursor: "pointer",
      color: active ? "#fff" : T.DIM, transition: "color 0.15s",
    }}>
      {active && <span style={{ position: "absolute", left: -4, top: 8, bottom: 8, width: 3, borderRadius: 2, background: T.ACCENT }} />}
      {children}
    </button>
  );
}

function SectionHeader({ children }: { children: string }) {
  return <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.DIM, marginTop: 14, marginBottom: 6 }}>{children}</div>;
}

function SliderRow({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number; format?: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "monospace", color: T.TEXT, marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ color: T.DIM }}>{format ? format(value) : String(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", height: 4, appearance: "none", WebkitAppearance: "none", background: T.SLIDER_TRACK, borderRadius: 2, outline: "none", cursor: "pointer", accentColor: T.ACCENT }} />
    </div>
  );
}

/* ── SVG Icons ─────────────────────────────────────────── */

function IconSettings() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>;
}
function IconLayers() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>;
}
function IconPalette() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="10.5" r="2.5" /><circle cx="8.5" cy="7.5" r="2.5" /><circle cx="6.5" cy="12" r="2.5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.1 2.5-.3.4-.1.7-.5.7-1 0-.5-.2-.9-.6-1.1-.4-.3-.6-.7-.6-1.1 0-1.1.9-2 2-2h2.3c3 0 5.7-2.5 5.7-5.5C24 6.5 18.6 2 12 2z" /></svg>;
}
function IconBarChart() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
}

/* ── Panel: Settings ───────────────────────────────────── */

function SettingsPanel(props: SidebarProps) {
  const catStats = useMemo(() => {
    const s: Record<string, number> = {};
    for (const t of props.tles) s[t.category] = (s[t.category] ?? 0) + 1;
    return s;
  }, [props.tles]);

  const catOrder = Object.keys(CATEGORIES);

  return (
    <>
      <SectionHeader>用途分類</SectionHeader>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {catOrder.map((cat) => {
          const info = CATEGORIES[cat]!;
          const active = props.visibleCategories.has(cat);
          const count = catStats[cat] ?? 0;
          if (count === 0) return null;
          return (
            <label key={cat} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12 }}>
              <input type="checkbox" checked={active} onChange={() => props.onToggleCategory(cat)}
                style={{ accentColor: props.colors[cat] ?? info.color, width: 14, height: 14 }} />
              <span style={{ fontSize: 14 }}>{info.icon}</span>
              <span style={{ opacity: active ? 1 : 0.4, flex: 1 }}>{info.zh}</span>
              <span style={{ opacity: 0.3, fontSize: 10 }}>{count.toLocaleString()}</span>
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

/* ── Panel: Filters（兩層：Category → Constellation / Country） ── */

function FiltersPanel(props: SidebarProps) {
  const [tab, setTab] = useState<"system" | "country" | "purpose">("system");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const searchLower = search.toLowerCase();

  // 按 category 分組的 constellation
  const catGroups = useMemo(() => {
    const groups: Record<string, Map<string, number>> = {};
    for (const t of props.tles) {
      if (!groups[t.category]) groups[t.category] = new Map();
      const key = t.constellation || "Other";
      groups[t.category]!.set(key, (groups[t.category]!.get(key) ?? 0) + 1);
    }
    return groups;
  }, [props.tles]);

  // 國家統計
  const countries = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of props.tles) {
      const c = t.country_operator ?? "Unknown";
      map.set(c, (map.get(c) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [props.tles]);

  // UCS purpose 統計
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
    { key: "system" as const, label: "衛星系統" },
    { key: "country" as const, label: "國家" },
    { key: "purpose" as const, label: "用途" },
  ];

  return (
    <>
      {/* 搜尋框 */}
      <input
        type="text" placeholder="搜尋衛星、星座、國家..."
        value={search} onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "7px 10px", marginBottom: 10,
          background: "rgba(255,255,255,0.05)", border: `1px solid ${T.BORDER}`,
          borderRadius: 6, color: T.TEXT, fontFamily: "monospace", fontSize: 11,
          outline: "none",
        }}
      />

      {/* 三個 Tab */}
      <div style={{ display: "flex", gap: 3, marginBottom: 10 }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: "5px 0", fontSize: 11, fontFamily: "monospace",
            border: `1px solid ${tab === t.key ? T.ACTIVE_BORDER : T.BORDER}`, borderRadius: 4,
            background: tab === t.key ? T.ACTIVE_BG : "transparent", color: tab === t.key ? "#fff" : T.DIM, cursor: "pointer",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 衛星系統 tab */}
      {tab === "system" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {catOrder.map((cat) => {
            const info = CATEGORIES[cat]!;
            const constellations = catGroups[cat];
            if (!constellations || constellations.size === 0) return null;
            // 搜尋過濾
            const filteredEntries = [...constellations.entries()].filter(([name]) =>
              !searchLower || name.toLowerCase().includes(searchLower) || info.zh.includes(search)
            );
            if (searchLower && filteredEntries.length === 0) return null;
            const totalCount = [...constellations.values()].reduce((a, b) => a + b, 0);
            const isExpanded = expandedCat === cat || !!searchLower;

            return (
              <div key={cat}>
                <button onClick={() => setExpandedCat(isExpanded && !searchLower ? null : cat)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 4px",
                  background: isExpanded ? "rgba(255,255,255,0.04)" : "transparent",
                  border: "none", borderRadius: 4, cursor: "pointer", color: T.TEXT, fontSize: 12, fontFamily: "monospace", textAlign: "left",
                }}>
                  <span style={{ fontSize: 13 }}>{info.icon}</span>
                  <span style={{ flex: 1, fontWeight: isExpanded ? 600 : 400 }}>{info.zh}</span>
                  <span style={{ opacity: 0.3, fontSize: 10 }}>{totalCount.toLocaleString()}</span>
                  <span style={{ opacity: 0.4, fontSize: 10 }}>{isExpanded ? "▼" : "▶"}</span>
                </button>
                {isExpanded && (
                  <div style={{ paddingLeft: 16, display: "flex", flexDirection: "column", gap: 2, marginBottom: 4 }}>
                    {filteredEntries.sort((a, b) => b[1] - a[1]).map(([name, count]) => {
                      const active = props.visibleConstellations.has(name);
                      return (
                        <label key={name} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 11 }}>
                          <input type="checkbox" checked={active} onChange={() => props.onToggleConstellation(name)}
                            style={{ accentColor: props.colors[cat] ?? info.color, width: 12, height: 12 }} />
                          <span style={{ opacity: active ? 1 : 0.4, flex: 1 }}>{name}</span>
                          <span style={{ opacity: 0.25, fontSize: 10 }}>{count.toLocaleString()}</span>
                        </label>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {countries.filter(([c]) => !searchLower || c.toLowerCase().includes(searchLower)).map(([country, count]) => {
            const active = props.visibleCountries.has(country);
            return (
              <label key={country} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 11 }}>
                <input type="checkbox" checked={active} onChange={() => props.onToggleCountry(country)}
                  style={{ accentColor: T.ACCENT, width: 13, height: 13 }} />
                <span style={{ opacity: active ? 1 : 0.4, flex: 1 }}>{country}</span>
                <span style={{ opacity: 0.25, fontSize: 10 }}>{count.toLocaleString()}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* 用途 tab */}
      {tab === "purpose" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {purposes.filter(([p]) => !searchLower || p.toLowerCase().includes(searchLower)).map(([purpose, count]) => (
            <div key={purpose} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
              <span style={{ flex: 1, opacity: 0.85 }}>{purpose}</span>
              <span style={{ opacity: 0.3, fontSize: 10 }}>{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* 全選/清除 */}
      <div style={{ display: "flex", gap: 6, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${T.BORDER}` }}>
        <button onClick={() => { props.onSelectAllConstellations?.(); props.onSelectAllCountries?.(); }} style={{
          flex: 1, padding: "5px 0", fontSize: 10, fontFamily: "monospace",
          border: `1px solid ${T.BORDER}`, borderRadius: 4, background: "transparent", color: T.DIM, cursor: "pointer",
        }}>全選</button>
        <button onClick={() => { props.onClearConstellations?.(); props.onClearCountries?.(); }} style={{
          flex: 1, padding: "5px 0", fontSize: 10, fontFamily: "monospace",
          border: `1px solid ${T.BORDER}`, borderRadius: 4, background: "transparent", color: T.DIM, cursor: "pointer",
        }}>清除</button>
      </div>
    </>
  );
}

/* ── Panel: Colors ─────────────────────────────────────── */

const COLOR_PRESETS: Record<string, { name: string; colors: Record<string, string> }> = {
  default: { name: "預設", colors: Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, v.color])) },
  warm: { name: "暖色", colors: { broadband: "#ff8a65", phone: "#ffab40", geo_comms: "#ffd54f", navigation: "#fff176", earth_obs: "#aed581", science: "#e6ee9c", military: "#ef9a9a", tech_demo: "#bcaaa4", other: "#a1887f" } },
  cool: { name: "冷色", colors: { broadband: "#4dd0e1", phone: "#4fc3f7", geo_comms: "#64b5f6", navigation: "#7986cb", earth_obs: "#9fa8da", science: "#b39ddb", military: "#ce93d8", tech_demo: "#90a4ae", other: "#78909c" } },
  mono: { name: "單色", colors: { broadband: "#e0e0e0", phone: "#bdbdbd", geo_comms: "#9e9e9e", navigation: "#eeeeee", earth_obs: "#b0bec5", science: "#cfd8dc", military: "#757575", tech_demo: "#616161", other: "#424242" } },
};

function ColorsPanel(props: SidebarProps) {
  return (
    <>
      <SectionHeader>配色主題</SectionHeader>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {Object.entries(COLOR_PRESETS).map(([key, preset]) => (
          <button key={key} onClick={() => {
            for (const [cat, color] of Object.entries(preset.colors)) {
              props.onColorChange(cat, color);
            }
          }} style={{
            flex: 1, padding: "8px 4px", borderRadius: 6, cursor: "pointer",
            background: "rgba(255,255,255,0.04)", border: `1px solid ${T.BORDER}`,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}>
            <div style={{ display: "flex", gap: 2 }}>
              {Object.values(preset.colors).slice(0, 4).map((c, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
              ))}
            </div>
            <span style={{ fontSize: 9, color: T.DIM, fontFamily: "monospace" }}>{preset.name}</span>
          </button>
        ))}
      </div>

      <SectionHeader>自訂配色</SectionHeader>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.entries(CATEGORIES).map(([cat, info]) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
            <input type="color" value={props.colors[cat] ?? info.color} onChange={(e) => props.onColorChange(cat, e.target.value)}
              style={{ width: 24, height: 24, border: "none", borderRadius: 4, cursor: "pointer", background: "none", padding: 0 }} />
            <span style={{ fontSize: 13 }}>{info.icon}</span>
            <span style={{ flex: 1, opacity: 0.85 }}>{info.zh}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Panel: Stats ──────────────────────────────────────── */

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

  return (
    <>
      <SectionHeader>統計</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "12px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.ACCENT }}>{total.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: T.DIM, marginTop: 2 }}>追蹤中衛星</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "12px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#81c784" }}>{visible.toLocaleString()}</div>
          <div style={{ fontSize: 10, color: T.DIM, marginTop: 2 }}>目前顯示</div>
        </div>
      </div>

      <SectionHeader>軌道分佈</SectionHeader>
      {byOrbit.map(([orbit, count]) => {
        const pct = total > 0 ? (count / total * 100) : 0;
        return (
          <div key={orbit} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
              <span>{orbit}</span>
              <span style={{ color: T.DIM }}>{count.toLocaleString()}</span>
            </div>
            <div style={{ height: 4, background: T.SLIDER_TRACK, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: T.ACCENT, borderRadius: 2 }} />
            </div>
          </div>
        );
      })}

      <SectionHeader>用途分佈</SectionHeader>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <DonutChart data={donutData} size={90} />
        <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 10 }}>
          {byCat.slice(0, 6).map(([cat, count]) => {
            const info = CATEGORIES[cat];
            const pct = total > 0 ? (count / total * 100).toFixed(1) : "0";
            return (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: 1, background: props.colors[cat] ?? info?.color ?? T.ACCENT, flexShrink: 0 }} />
                <span style={{ opacity: 0.7 }}>{info?.zh ?? cat}</span>
                <span style={{ opacity: 0.35 }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <SectionHeader>主要營運商</SectionHeader>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {topOperators.map(([op, count]) => (
          <div key={op} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
            <span style={{ opacity: 0.8 }}>{op}</span>
            <span style={{ opacity: 0.3 }}>{count.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, fontSize: 9, color: T.DIM, lineHeight: 1.5 }}>
        資料來源：CelesTrak GP 3LE · UCS Satellite Database
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

  return (
    <>
      <style>{`
        @keyframes sidebarSlideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        .sidebar-scrollbar::-webkit-scrollbar { width: 4px; }
        .sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0, width: 48, zIndex: 20,
        display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, gap: 4,
        background: T.BG_RAIL, backdropFilter: "blur(16px)", borderRight: `1px solid ${T.BORDER}`,
      }}>
        {PANELS.map(({ id, icon: Icon, title }) => (
          <RailIcon key={id} active={activePanel === id} onClick={() => setActivePanel((p) => p === id ? null : id)} title={title}>
            <Icon />
          </RailIcon>
        ))}
      </div>

      {activePanel && (
        <div className="sidebar-scrollbar" style={{
          position: "absolute", top: 80, left: 56, maxHeight: "calc(100vh - 140px)", width: 270, zIndex: 19,
          padding: "14px 16px", background: T.BG_PANEL, backdropFilter: "blur(16px)", borderRadius: 12,
          border: `1px solid ${T.BORDER}`, fontFamily: "monospace", fontSize: 12, color: T.TEXT,
          overflowY: "auto", animation: "sidebarSlideIn 0.2s ease-out",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${T.BORDER}` }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{PANELS.find((p) => p.id === activePanel)?.title}</span>
            <button onClick={() => setActivePanel(null)} style={{
              background: "rgba(255,255,255,0.06)", border: `1px solid ${T.BORDER}`, borderRadius: 4,
              color: T.DIM, cursor: "pointer", padding: "2px 8px", fontSize: 11, fontFamily: "monospace",
            }}>x</button>
          </div>

          {activePanel === "settings" && <SettingsPanel {...props} />}
          {activePanel === "filters" && <FiltersPanel {...props} />}
          {activePanel === "colors" && <ColorsPanel {...props} />}
          {activePanel === "stats" && <StatsPanel {...props} />}
        </div>
      )}
    </>
  );
}
