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
  const [tab, setTab] = useState<"constellation" | "country">("constellation");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

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

  const catOrder = Object.keys(CATEGORIES);

  return (
    <>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {(["constellation", "country"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "5px 0", fontSize: 11, fontFamily: "monospace",
            border: `1px solid ${tab === t ? T.ACTIVE_BORDER : T.BORDER}`, borderRadius: 4,
            background: tab === t ? T.ACTIVE_BG : "transparent", color: tab === t ? "#fff" : T.DIM, cursor: "pointer",
          }}>
            {t === "constellation" ? "用途/星座" : "國家"}
          </button>
        ))}
      </div>

      {tab === "constellation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 500, overflowY: "auto" }}>
          {catOrder.map((cat) => {
            const info = CATEGORIES[cat]!;
            const constellations = catGroups[cat];
            if (!constellations || constellations.size === 0) return null;
            const totalCount = [...constellations.values()].reduce((a, b) => a + b, 0);
            const isExpanded = expandedCat === cat;

            return (
              <div key={cat}>
                {/* Category header（可展開） */}
                <button onClick={() => setExpandedCat(isExpanded ? null : cat)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 4px",
                  background: isExpanded ? "rgba(255,255,255,0.04)" : "transparent",
                  border: "none", borderRadius: 4, cursor: "pointer", color: T.TEXT, fontSize: 12, fontFamily: "monospace", textAlign: "left",
                }}>
                  <span style={{ fontSize: 13 }}>{info.icon}</span>
                  <span style={{ flex: 1, fontWeight: isExpanded ? 600 : 400 }}>{info.zh}</span>
                  <span style={{ opacity: 0.3, fontSize: 10 }}>{totalCount.toLocaleString()}</span>
                  <span style={{ opacity: 0.4, fontSize: 10 }}>{isExpanded ? "▼" : "▶"}</span>
                </button>

                {/* 展開後的 constellation 列表 */}
                {isExpanded && (
                  <div style={{ paddingLeft: 16, display: "flex", flexDirection: "column", gap: 2, marginBottom: 4 }}>
                    {[...constellations.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => {
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

      {tab === "country" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 500, overflowY: "auto" }}>
          {countries.map(([country, count]) => {
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
    </>
  );
}

/* ── Panel: Colors ─────────────────────────────────────── */

function ColorsPanel(props: SidebarProps) {
  return (
    <>
      <SectionHeader>用途分類配色</SectionHeader>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.entries(CATEGORIES).map(([cat, info]) => (
          <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
            <input type="color" value={props.colors[cat] ?? info.color} onChange={(e) => props.onColorChange(cat, e.target.value)}
              style={{ width: 28, height: 28, border: "none", borderRadius: 4, cursor: "pointer", background: "none", padding: 0 }} />
            <span style={{ fontSize: 14 }}>{info.icon}</span>
            <span style={{ flex: 1, opacity: 0.85 }}>{info.zh}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 10, color: T.DIM, lineHeight: 1.5 }}>
        點選色塊自訂各用途分類的顯示顏色。
      </div>
    </>
  );
}

/* ── Panel: Stats ──────────────────────────────────────── */

function StatsPanel(props: SidebarProps) {
  const total = props.tles.length;
  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of props.tles) m[t.category] = (m[t.category] ?? 0) + 1;
    return m;
  }, [props.tles]);

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
          <div style={{ fontSize: 20, fontWeight: 700 }}>{Object.keys(byCat).length}</div>
          <div style={{ fontSize: 10, color: T.DIM, marginTop: 2 }}>用途分類</div>
        </div>
      </div>

      <SectionHeader>用途分佈</SectionHeader>
      {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
        const pct = total > 0 ? (count / total * 100) : 0;
        const info = CATEGORIES[cat];
        return (
          <div key={cat} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
              <span>{info?.icon} {info?.zh ?? cat}</span>
              <span style={{ color: T.DIM }}>{count.toLocaleString()} ({pct.toFixed(1)}%)</span>
            </div>
            <div style={{ height: 4, background: T.SLIDER_TRACK, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: info?.color ?? T.ACCENT, borderRadius: 2 }} />
            </div>
          </div>
        );
      })}

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
              <div style={{ height: "100%", width: `${pct}%`, background: T.ACCENT, borderRadius: 2 }} />
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 16, fontSize: 10, color: T.DIM, lineHeight: 1.5 }}>
        資料來源：CelesTrak GP 3LE<br />
        分類依據：UCS Satellite Database
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
