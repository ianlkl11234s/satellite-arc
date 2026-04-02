/**
 * 太陽系模式側邊欄 — Icon Rail + 浮動面板
 * 沿用地球模式 Sidebar 的 UI pattern
 */

import { useState } from "react";
import { SlidersHorizontal, X, Sun } from "lucide-react";

/* ── Design Tokens（與 Sidebar.tsx 一致） ─── */

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
  SLIDER_TRACK: "rgba(255,255,255,0.08)",
};

const BLUR_PANEL = "blur(24px)";

const SMALL_BODY_CLASSES = [
  { key: "MBA", label: "Main Belt Asteroids", color: "#888888" },
  { key: "TJN", label: "Jupiter Trojans (L4/L5)", color: "#66aa66" },
  { key: "NEO", label: "Near-Earth Objects", color: "#ff4444" },
  { key: "TNO", label: "Kuiper Belt (TNOs)", color: "#6688cc" },
  { key: "CEN", label: "Centaurs", color: "#bb88dd" },
];

/* ── Sub-components ─────────────────────────── */

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
  return <div style={{ height: 1, background: T.BORDER_SUBTLE, width: "100%", flexShrink: 0, margin: "8px 0" }} />;
}

function SliderRow({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  format?: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: T.FONT, color: T.FONT_SECONDARY, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: T.DIM }}>{format ? format(value) : String(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%", height: 3, appearance: "none", WebkitAppearance: "none",
          background: T.SLIDER_TRACK, borderRadius: 2, outline: "none",
          cursor: "pointer", accentColor: T.ACCENT,
        }}
      />
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 36, height: 20, borderRadius: 10, cursor: "pointer",
      background: checked ? "rgba(91,156,246,0.3)" : "rgba(255,255,255,0.08)",
      border: `1px solid ${checked ? "rgba(91,156,246,0.3)" : "rgba(255,255,255,0.12)"}`,
      position: "relative", transition: "background 0.2s", flexShrink: 0,
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

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontFamily: T.FONT, color: T.FONT_SECONDARY }}>{label}</span>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

/* ── Props ──────────────────────────────────── */

export interface SolarSidebarProps {
  orbitOpacity: number;
  onOrbitOpacityChange: (v: number) => void;
  planetScale: number;
  onPlanetScaleChange: (v: number) => void;
  glowOpacity: number;
  onGlowOpacityChange: (v: number) => void;
  showLabels: boolean;
  onShowLabelsChange: (v: boolean) => void;
  showOrbits: boolean;
  onShowOrbitsChange: (v: boolean) => void;
  showAsteroidBelt: boolean;
  onShowAsteroidBeltChange: (v: boolean) => void;
  /** 各類小天體可見性 */
  visibleClasses: Record<string, boolean>;
  onToggleClass: (cls: string) => void;
  /** 各類小天體數量 */
  classCounts: Record<string, number>;
  /** 小天體粒子大小 */
  particleSize: number;
  onParticleSizeChange: (v: number) => void;
  /** 小天體粒子不透明度 */
  particleOpacity: number;
  onParticleOpacityChange: (v: number) => void;
  isMobile: boolean;
}

/* ── Main Component ─────────────────────────── */

export function SolarSidebar(props: SolarSidebarProps) {
  const [open, setOpen] = useState(false);
  const mobile = props.isMobile;

  const panel = open && (
    <div style={{
      position: "absolute",
      ...(mobile
        ? { bottom: 56, left: 8, right: 8, maxHeight: "60vh" }
        : { top: 82, left: 76, maxHeight: "calc(100vh - 140px)", width: 260 }),
      zIndex: 19,
      background: T.BG_PANEL, backdropFilter: BLUR_PANEL,
      borderRadius: 14, border: `1px solid ${T.BORDER_SUBTLE}`,
      fontFamily: T.FONT, fontSize: 13, color: T.FONT_PRIMARY,
      display: "flex", flexDirection: "column", overflow: "hidden",
      animation: mobile ? "mobileSlideUp 0.2s ease-out" : "sidebarSlideIn 0.2s ease-out",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 20px", flexShrink: 0,
        borderBottom: `1px solid ${T.BORDER_SUBTLE}`,
      }}>
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: T.FONT }}>Solar System Settings</span>
        <button onClick={() => setOpen(false)} style={{
          width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.06)", border: `1px solid ${T.BORDER_SUBTLE}`, borderRadius: 6,
          color: T.DIM, cursor: "pointer", padding: 0,
        }}>
          <X size={12} />
        </button>
      </div>

      {/* Content */}
      <div className="sidebar-scrollbar" style={{ padding: "12px 20px 16px", overflowY: "auto", flex: 1 }}>
        {/* ── 小天體分類（最上面，像地球模式的衛星分類） ── */}
        <SectionHeader>Small Bodies</SectionHeader>
        {SMALL_BODY_CLASSES.map(({ key, label, color }) => {
          const active = props.visibleClasses[key] !== false;
          const count = props.classCounts[key] ?? 0;
          return (
            <div key={key}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 6, cursor: "pointer",
                opacity: active ? 1 : 0.4,
                transition: "opacity 0.15s",
              }}
              onClick={() => props.onToggleClass(key)}
            >
              <div style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: color,
              }} />
              <span style={{
                fontSize: 13, fontFamily: T.FONT, flex: 1,
                color: active ? T.FONT_SECONDARY : T.DIM,
              }}>{label}</span>
              <span style={{
                fontSize: 12, color: T.DIM, fontFamily: T.FONT,
                minWidth: 36, textAlign: "right",
              }}>{count > 0 ? count.toLocaleString() : "—"}</span>
            </div>
          );
        })}

        <Divider />

        {/* ── 顯示 ── */}
        <SectionHeader>Display</SectionHeader>
        <ToggleRow label="Orbit paths" checked={props.showOrbits} onChange={props.onShowOrbitsChange} />
        <ToggleRow label="Planet labels" checked={props.showLabels} onChange={props.onShowLabelsChange} />

        <Divider />

        {/* ── 視覺參數 ── */}
        <SectionHeader>Visual</SectionHeader>
        <SliderRow
          label="Orbit opacity"
          value={props.orbitOpacity}
          min={0.05} max={0.8} step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={props.onOrbitOpacityChange}
        />
        <SliderRow
          label="Planet scale"
          value={props.planetScale}
          min={0.3} max={3} step={0.1}
          format={(v) => `${v.toFixed(1)}×`}
          onChange={props.onPlanetScaleChange}
        />
        <SliderRow
          label="Glow intensity"
          value={props.glowOpacity}
          min={0} max={1} step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={props.onGlowOpacityChange}
        />
        <SliderRow
          label="Particle size"
          value={props.particleSize}
          min={0.05} max={0.5} step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={props.onParticleSizeChange}
        />
        <SliderRow
          label="Particle opacity"
          value={props.particleOpacity}
          min={0.1} max={1} step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={props.onParticleOpacityChange}
        />
      </div>
    </div>
  );

  if (mobile) {
    return (
      <>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
          height: 52, display: "flex", alignItems: "center", justifyContent: "center",
          gap: 4, padding: "0 8px",
          background: T.BG_PANEL, backdropFilter: BLUR_PANEL,
          borderTop: `1px solid ${T.BORDER_SUBTLE}`,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(180deg, #FFB347 0%, #FF8C00 100%)",
          }}>
            <Sun size={16} color="#fff" />
          </div>
          <div style={{ width: 1, height: 24, background: T.BORDER, margin: "0 2px", flexShrink: 0 }} />
          <button title="Settings" onClick={() => setOpen((p) => !p)} style={{
            width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            background: open ? T.ACCENT_DIM : "transparent",
            border: "none", borderRadius: 8, cursor: "pointer",
            color: open ? T.ACCENT : T.FONT_TERTIARY, padding: 0,
          }}>
            <SlidersHorizontal size={18} />
          </button>
        </div>
        {panel}
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes sidebarSlideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        .sidebar-scrollbar::-webkit-scrollbar { width: 4px; }
        .sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>

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
          background: "linear-gradient(180deg, #FFB347 0%, #FF8C00 100%)",
          boxShadow: "0 4px 16px rgba(255,140,0,0.25)",
        }}>
          <Sun size={22} color="#fff" />
        </div>
        <div style={{ width: 32, height: 1, background: T.BORDER }} />
        <button title="Settings" onClick={() => setOpen((p) => !p)} style={{
          width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
          background: open ? T.ACCENT_DIM : "transparent",
          border: "none", borderRadius: 10, cursor: "pointer",
          color: open ? T.ACCENT : T.FONT_TERTIARY,
          transition: "all 0.15s",
        }}>
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {panel}
    </>
  );
}
