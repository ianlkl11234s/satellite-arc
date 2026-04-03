/**
 * 太陽系模式側邊欄 — Icon Rail + 浮動面板（3 面板）
 * 沿用地球模式 Sidebar 的 UI pattern
 */

import { useState, type ReactNode } from "react";
import { SlidersHorizontal, Palette, BookOpen, Info, X, Sun, ChevronDown, ChevronRight } from "lucide-react";

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
  ACCENT_MUTED: "rgba(91,156,246,0.3)",
  SLIDER_TRACK: "rgba(255,255,255,0.08)",
  BG_ELEVATED: "rgba(255,255,255,0.04)",
};

const BLUR_PANEL = "blur(24px)";

/* ── Small Body Classes ────────────────────── */

const SMALL_BODY_CLASSES = [
  { key: "MBA", label: "Main Belt Asteroids", zh: "主帶小行星" },
  { key: "TJN", label: "Jupiter Trojans (L4/L5)", zh: "木星特洛伊小行星" },
  { key: "NEO", label: "Near-Earth Objects", zh: "近地天體" },
  { key: "TNO", label: "Kuiper Belt (TNOs)", zh: "海王星外天體" },
  { key: "CEN", label: "Centaurs", zh: "半人馬小天體" },
  { key: "HTC", label: "Halley-type Comets", zh: "哈雷型彗星" },
  { key: "JFC", label: "Jupiter-family Comets", zh: "木星族彗星" },
];

const DEFAULT_COLORS: Record<string, string> = {
  MBA: "#888888", TJN: "#66aa66", NEO: "#ff4444",
  TNO: "#6688cc", CEN: "#bb88dd", HTC: "#88ccff", JFC: "#aaddaa",
};

/* ── Color Presets ─────────────────────────── */

const SOLAR_COLOR_PRESETS: Record<string, { name: string; colors: Record<string, string> }> = {
  default: { name: "Default", colors: { MBA: "#888888", TJN: "#66aa66", NEO: "#ff4444", TNO: "#6688cc", CEN: "#bb88dd", HTC: "#88ccff", JFC: "#aaddaa" } },
  warm: { name: "Warm", colors: { MBA: "#d4a574", TJN: "#e8a838", NEO: "#ff6b35", TNO: "#ffb347", CEN: "#ffd700", HTC: "#ffcc80", JFC: "#ffa07a" } },
  cool: { name: "Cool", colors: { MBA: "#7eb8da", TJN: "#4ecdc4", NEO: "#5c9ead", TNO: "#5B9CF6", CEN: "#9b59b6", HTC: "#74b9ff", JFC: "#81ecec" } },
  mono: { name: "Mono", colors: { MBA: "#e0e0e0", TJN: "#bdbdbd", NEO: "#f5f5f5", TNO: "#9e9e9e", CEN: "#cccccc", HTC: "#b0bec5", JFC: "#cfd8dc" } },
};

/* ── Encyclopedia ──────────────────────────── */

const SMALL_BODY_INFO: Record<string, { zh: string; label: string; desc: string; formation: string; totalCount: string; significance: string }> = {
  MBA: {
    zh: "主帶小行星", label: "Main Belt Asteroids",
    desc: "位於火星和木星之間的小行星帶，是太陽系中最大的小行星集中區域。",
    formation: "太陽系形成初期（約 46 億年前），木星的強大引力阻止了這個區域的物質凝聚成行星，使它們保持為數以百萬計的碎片。",
    totalCount: "已知超過 134 萬顆，實際數量可能達數百萬",
    significance: "包含矮行星穀神星（Ceres），是研究太陽系早期歷史的重要線索。部分小行星含有豐富的金屬礦物，被視為未來太空採礦的目標。",
  },
  TJN: {
    zh: "木星特洛伊小行星", label: "Jupiter Trojans",
    desc: "共享木星軌道的小行星群，聚集在木星前方（L4 點）和後方（L5 點）的拉格朗日點。",
    formation: "可能是太陽系早期「大遷移」時期被木星引力捕獲的原始天體，來自更遙遠的外太陽系。",
    totalCount: "已知 15,838 顆",
    significance: "NASA Lucy 任務（2021 年發射）正在前往探訪多顆特洛伊小行星，它們被認為是太陽系形成的「化石」，保存了 46 億年前的原始物質。",
  },
  NEO: {
    zh: "近地天體", label: "Near-Earth Objects",
    desc: "軌道接近或穿越地球軌道的小行星和彗星，與地球最小距離小於 0.3 AU。",
    formation: "主要來自主帶小行星受到木星引力攝動而偏移到內太陽系的軌道，少部分來自彗星。",
    totalCount: "已知 23,543 顆（Apollo 型）",
    significance: "對地球構成潛在撞擊威脅。6,600 萬年前的恐龍滅絕事件就是由一顆約 10 公里的近地小行星撞擊造成。NASA DART 任務（2022 年）成功測試了偏轉小行星軌道的技術。",
  },
  TNO: {
    zh: "海王星外天體（柯伊伯帶）", label: "Trans-Neptunian Objects",
    desc: "軌道位於海王星軌道之外的天體，主要分佈在柯伊伯帶（30-50 AU）。",
    formation: "太陽系形成時外圍區域溫度極低，冰和塵埃凝結成這些冰質天體。它們是太陽系最原始、最未經改變的物質。",
    totalCount: "已知 6,034 顆，估計實際有數十萬顆直徑超過 100 公里的天體",
    significance: "包含冥王星、鬩神星等矮行星。柯伊伯帶是短週期彗星的來源地。New Horizons 探測器 2019 年飛掠了柯伊伯帶天體 Arrokoth，揭示了太陽系最原始的天體面貌。",
  },
  CEN: {
    zh: "半人馬小天體", label: "Centaurs",
    desc: "軌道位於木星和海王星之間的小天體，兼具小行星和彗星的特徵。",
    formation: "起源於柯伊伯帶，受到海王星引力攝動而遷移到內部軌道。它們的軌道不穩定，最終會被彈射到內太陽系或外太陽系。",
    totalCount: "已知 1,008 顆",
    significance: "最著名的是凱龍星（Chiron），1977 年被發現時曾被認為是行星。半人馬天體是連接柯伊伯帶和內太陽系的「中轉站」，部分會演化為木星族彗星。",
  },
  HTC: {
    zh: "哈雷型彗星", label: "Halley-type Comets",
    desc: "軌道週期在 20-200 年之間的彗星，軌道傾角可以很大（甚至逆行）。",
    formation: "被認為起源於歐特雲（距太陽 2,000-100,000 AU 的球殼狀區域），受到恆星引力攝動而進入內太陽系。",
    totalCount: "已知 110 顆",
    significance: "最著名的代表是哈雷彗星（1P/Halley），每 75-76 年回歸一次，人類記錄可追溯到公元前 240 年。1986 年歐洲 Giotto 探測器首次近距離拍攝了彗核。",
  },
  JFC: {
    zh: "木星族彗星", label: "Jupiter-family Comets",
    desc: "軌道週期小於 20 年、受木星引力強烈影響的短週期彗星。",
    formation: "起源於柯伊伯帶，經由半人馬天體階段逐步遷移到目前的短週期軌道。",
    totalCount: "已知 17 顆（已命名的）",
    significance: "包含 67P/C-G（Rosetta 任務目標）和 46P/Wirtanen 等。Rosetta 任務在 67P 上發現了甘胺酸（氨基酸），支持了彗星可能為地球帶來生命基礎物質的假說。",
  },
};

/* ── Panel Types ───────────────────────────── */

type PanelId = "settings" | "colors" | "encyclopedia";

const PANELS: Array<{ id: PanelId; icon: (props: { size: number }) => ReactNode; title: string }> = [
  { id: "settings", icon: ({ size }) => <SlidersHorizontal size={size} />, title: "Solar System Settings" },
  { id: "colors", icon: ({ size }) => <Palette size={size} />, title: "配色主題" },
  { id: "encyclopedia", icon: ({ size }) => <BookOpen size={size} />, title: "天體百科" },
];

const PANEL_WIDTH: Record<PanelId, number> = {
  settings: 260,
  colors: 260,
  encyclopedia: 300,
};

/* ── Sub-components ─────────────────────────── */

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
      background: checked ? T.ACCENT_MUTED : "rgba(255,255,255,0.08)",
      border: `1px solid ${checked ? T.ACCENT_MUTED : "rgba(255,255,255,0.12)"}`,
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
  planetScale: number;
  onPlanetScaleChange: (v: number) => void;
  glowOpacity: number;
  onGlowOpacityChange: (v: number) => void;
  showLabels: boolean;
  onShowLabelsChange: (v: boolean) => void;
  /** 軌道開關與透明度 — 分三組 */
  showPlanetOrbits: boolean;
  onShowPlanetOrbitsChange: (v: boolean) => void;
  planetOrbitOpacity: number;
  onPlanetOrbitOpacityChange: (v: number) => void;
  showHTCOrbits: boolean;
  onShowHTCOrbitsChange: (v: boolean) => void;
  htcOrbitOpacity: number;
  onHTCOrbitOpacityChange: (v: number) => void;
  showJFCOrbits: boolean;
  onShowJFCOrbitsChange: (v: boolean) => void;
  jfcOrbitOpacity: number;
  onJFCOrbitOpacityChange: (v: number) => void;
  /** 各類小天體可見性 */
  visibleClasses: Record<string, boolean>;
  onToggleClass: (cls: string) => void;
  /** 各類小天體數量 */
  classCounts: Record<string, number>;
  /** 每類粒子大小與不透明度 */
  classSizes: Record<string, number>;
  onClassSizeChange: (cls: string, v: number) => void;
  classOpacities: Record<string, number>;
  onClassOpacityChange: (cls: string, v: number) => void;
  /** 各類小天體顏色 */
  colors: Record<string, string>;
  onColorChange: (cls: string, color: string) => void;
  onInfoClick?: () => void;
  isMobile: boolean;
}

/* ── Panel: Settings ───────────────────────── */

function SettingsPanel(props: SolarSidebarProps) {
  const [selectedClass, setSelectedClass] = useState<string>("MBA");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── 小天體分類（純淨列表，不內嵌滑桿） ── */}
      <div>
        <SectionHeader>Small Bodies</SectionHeader>
        {SMALL_BODY_CLASSES.map(({ key, label }) => {
          const active = props.visibleClasses[key] !== false;
          const count = props.classCounts[key] ?? 0;
          const color = props.colors[key] ?? DEFAULT_COLORS[key] ?? "#888";
          return (
            <div key={key} onClick={() => props.onToggleClass(key)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "5px 0", cursor: "pointer",
              opacity: active ? 1 : 0.35, transition: "opacity 0.15s",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: color }} />
              <span style={{ fontSize: 13, fontFamily: T.FONT, flex: 1, color: active ? T.FONT_SECONDARY : T.DIM }}>{label}</span>
              <span style={{ fontSize: 12, color: T.DIM, fontFamily: T.FONT }}>{count > 0 ? count.toLocaleString() : "\u2014"}</span>
            </div>
          );
        })}
      </div>

      <Divider />

      {/* ── 粒子視覺（下拉選擇類別） ── */}
      <div>
        <SectionHeader>Particle Visual</SectionHeader>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={{
            width: "100%", padding: "6px 10px", marginBottom: 10,
            background: T.BG_ELEVATED, border: `1px solid ${T.BORDER}`,
            borderRadius: 8, color: T.FONT_SECONDARY, fontFamily: T.FONT,
            fontSize: 12, outline: "none", cursor: "pointer",
            appearance: "none", WebkitAppearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
          }}
        >
          {SMALL_BODY_CLASSES.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <SliderRow label="Size" value={props.classSizes[selectedClass] ?? 0.12} min={0.03} max={0.5} step={0.01}
          format={(v) => v.toFixed(2)} onChange={(v) => props.onClassSizeChange(selectedClass, v)} />
        <SliderRow label="Opacity" value={props.classOpacities[selectedClass] ?? 0.5} min={0.05} max={1} step={0.05}
          format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => props.onClassOpacityChange(selectedClass, v)} />
      </div>

      <Divider />

      {/* ── 軌道路徑 ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <SectionHeader>Orbit Paths</SectionHeader>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontFamily: T.FONT, color: T.FONT_SECONDARY }}>行星 / 矮行星</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: T.DIM }}>{Math.round(props.planetOrbitOpacity * 100)}%</span>
            <ToggleSwitch checked={props.showPlanetOrbits} onChange={props.onShowPlanetOrbitsChange} />
          </div>
        </div>
        {props.showPlanetOrbits && (
          <input type="range" min={0.05} max={1} step={0.05} value={props.planetOrbitOpacity}
            onChange={(e) => props.onPlanetOrbitOpacityChange(Number(e.target.value))}
            style={{ width: "100%", height: 3, appearance: "none", WebkitAppearance: "none", background: T.SLIDER_TRACK, borderRadius: 2, outline: "none", cursor: "pointer", accentColor: T.ACCENT, marginBottom: 6 }} />
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontFamily: T.FONT, color: T.FONT_SECONDARY }}>HTC Comets</span>
          <ToggleSwitch checked={props.showHTCOrbits} onChange={props.onShowHTCOrbitsChange} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontFamily: T.FONT, color: T.FONT_SECONDARY }}>JFC Comets</span>
          <ToggleSwitch checked={props.showJFCOrbits} onChange={props.onShowJFCOrbitsChange} />
        </div>
      </div>

      <Divider />

      {/* ── 行星顯示 ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionHeader>Planets</SectionHeader>
        <ToggleRow label="Labels" checked={props.showLabels} onChange={props.onShowLabelsChange} />
        <SliderRow label="Scale" value={props.planetScale} min={0.3} max={3} step={0.1}
          format={(v) => `${v.toFixed(1)}\u00d7`} onChange={props.onPlanetScaleChange} />
        <SliderRow label="Glow" value={props.glowOpacity} min={0} max={1} step={0.05}
          format={(v) => `${Math.round(v * 100)}%`} onChange={props.onGlowOpacityChange} />
      </div>
    </div>
  );
}

/* ── Panel: Colors ─────────────────────────── */

function ColorsPanel(props: SolarSidebarProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 預設主題 */}
      <div>
        <SectionHeader>預設主題</SectionHeader>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(SOLAR_COLOR_PRESETS).slice(0, 2).map(([key, preset]) => (
            <button key={key} onClick={() => {
              for (const [cls, color] of Object.entries(preset.colors)) props.onColorChange(cls, color);
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
          {Object.entries(SOLAR_COLOR_PRESETS).slice(2).map(([key, preset]) => (
            <button key={key} onClick={() => {
              for (const [cls, color] of Object.entries(preset.colors)) props.onColorChange(cls, color);
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
          {SMALL_BODY_CLASSES.map(({ key, zh }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, height: 34 }}>
              <input type="color" value={props.colors[key] ?? DEFAULT_COLORS[key] ?? "#888888"}
                onChange={(e) => props.onColorChange(key, e.target.value)}
                style={{ width: 24, height: 24, border: "none", borderRadius: 6, cursor: "pointer", background: "none", padding: 0 }}
              />
              <span style={{ flex: 1, fontSize: 13, fontFamily: T.FONT, color: T.FONT_SECONDARY }}>{zh}({key})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Panel: Encyclopedia ───────────────────── */

function EncyclopediaPanel(props: SolarSidebarProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const introStyle = { fontSize: 12, lineHeight: 1.7, color: T.FONT_SECONDARY, fontFamily: T.FONT };
  const introLabelStyle = { fontSize: 11, fontWeight: 600 as const, color: T.FONT_MUTED, marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" as const };
  const introHighlight = { color: T.ACCENT, fontWeight: 500 as const };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* 總覽說明 */}
      <div style={{
        background: T.BG_ELEVATED, borderRadius: 10,
        border: `1px solid ${showIntro ? T.BORDER : T.BORDER_SUBTLE}`,
        overflow: "hidden",
      }}>
        <button onClick={() => setShowIntro(!showIntro)} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", cursor: "pointer",
          background: "transparent", border: "none",
          color: T.FONT_SECONDARY, fontFamily: T.FONT, fontSize: 13, textAlign: "left",
        }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.ACCENT, flexShrink: 0 }} />
          <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: T.FONT_PRIMARY }}>太陽系小天體總覽</div>
          {showIntro ? <ChevronDown size={14} color={T.DIM} /> : <ChevronRight size={14} color={T.DIM} />}
        </button>
        {showIntro && (
          <div style={{ padding: "0 14px 14px", ...introStyle, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={introLabelStyle}>我們應該如何稱呼他們？</div>
              <p style={{ margin: "4px 0" }}>
                這五大類（MBA、TJN、NEO、TNO、Centaur）以及彗星，都有一個正式的總稱：
                <span style={introHighlight}> 太陽系小天體（Small Solar System Bodies, SSSB）</span>。
              </p>
              <p style={{ margin: "4px 0" }}>每顆小行星會經歷一個「從代號到擁有姓名」的過程：</p>
              <ul style={{ margin: "4px 0", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                <li><strong>臨時編號</strong> — 剛發現時用年份和字母編號，如 <code>2004 MN4</code></li>
                <li><strong>永久編號</strong> — 確認軌道後獲得數字 ID，如 <code>99942 (2004 MN4)</code></li>
                <li><strong>正式命名</strong> — 發現者命名，如 <code>99942 Apophis（毀神星）</code></li>
              </ul>
            </div>

            <div>
              <div style={introLabelStyle}>他們對太空的重要性</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <strong>🕰 太陽系的「時空膠囊」</strong>
                  <p style={{ margin: "2px 0" }}>大行星在幾十億年間經歷火山、地殼變動，最古老的岩石早已被重塑。但寒冷邊疆的柯伊伯帶天體從 46 億年前就保持著原貌，分析它們就像直接讀取太陽系的「原始設定檔」。</p>
                </div>
                <div>
                  <strong>💧 地球生命的「送貨員」</strong>
                  <p style={{ margin: "2px 0" }}>早期地球可能非常乾燥。海洋和有機分子很可能是由無數顆富含水分的彗星和小行星撞擊地球時「運送」過來的。</p>
                </div>
                <div>
                  <strong>🛡 行星防禦系統</strong>
                  <p style={{ margin: "2px 0" }}>6,500 萬年前一顆 ~10 公里的小行星導致恐龍滅絕。人類正精確計算每顆大於 140 公尺的 NEO 未來軌跡，NASA DART 任務已成功測試偏轉小行星軌道的技術。</p>
                </div>
                <div>
                  <strong>⛏ 未來的太空加油站與礦場</strong>
                  <p style={{ margin: "2px 0" }}>小行星含有豐富的冰（可電解為火箭燃料）和稀有金屬。某些金屬型小行星（如 Psyche 16）的資源價值超過地球經濟總量。</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Divider />

      {/* 各類別百科卡片 */}
      {SMALL_BODY_CLASSES.map(({ key }) => {
        const info = SMALL_BODY_INFO[key];
        if (!info) return null;
        const isOpen = expanded === key;
        const color = props.colors[key] ?? DEFAULT_COLORS[key] ?? "#888";
        const count = props.classCounts[key] ?? 0;

        return (
          <div key={key} style={{
            background: T.BG_ELEVATED, borderRadius: 10,
            border: `1px solid ${isOpen ? T.BORDER : T.BORDER_SUBTLE}`,
            overflow: "hidden", transition: "border-color 0.15s",
          }}>
            {/* Header — always visible */}
            <button onClick={() => setExpanded(isOpen ? null : key)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", cursor: "pointer",
              background: "transparent", border: "none",
              color: T.FONT_SECONDARY, fontFamily: T.FONT, fontSize: 13, textAlign: "left",
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: color, flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: T.FONT_PRIMARY }}>{info.zh}</div>
                <div style={{ fontSize: 11, color: T.DIM, marginTop: 1 }}>{info.label}</div>
              </div>
              {count > 0 && (
                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 10,
                  background: T.ACCENT_DIM, color: T.ACCENT,
                  fontFamily: T.FONT, flexShrink: 0,
                }}>{count.toLocaleString()}</span>
              )}
              {isOpen ? <ChevronDown size={14} color={T.DIM} /> : <ChevronRight size={14} color={T.DIM} />}
            </button>

            {/* Expandable content */}
            {isOpen && (
              <div style={{
                padding: "0 14px 14px",
                fontSize: 12, lineHeight: 1.7, fontFamily: T.FONT, color: T.FONT_SECONDARY,
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.FONT_MUTED, marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>簡介</div>
                  <div>{info.desc}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.FONT_MUTED, marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>形成</div>
                  <div>{info.formation}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.FONT_MUTED, marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>已知數量</div>
                  <div>{info.totalCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.FONT_MUTED, marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>重要性</div>
                  <div>{info.significance}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Component ─────────────────────────── */

export function SolarSidebar(props: SolarSidebarProps) {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [encyclopediaOpened, setEncyclopediaOpened] = useState(false);
  const mobile = props.isMobile;

  const handleIconClick = (id: PanelId) => {
    setActivePanel((p) => p === id ? null : id);
    if (id === "encyclopedia") setEncyclopediaOpened(true);
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
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: T.FONT }}>
          {PANELS.find((p) => p.id === activePanel)?.title}
        </span>
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
        {activePanel === "colors" && <ColorsPanel {...props} />}
        {activePanel === "encyclopedia" && <EncyclopediaPanel {...props} />}
      </div>
    </div>
  );

  if (mobile) {
    return (
      <>
        <style>{`
          @keyframes mobileSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          .sidebar-scrollbar::-webkit-scrollbar { width: 4px; }
          .sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        `}</style>

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
            background: "linear-gradient(180deg, #FFB347 0%, #FF8C00 100%)",
          }}>
            <Sun size={16} color="#fff" />
          </div>

          <div style={{ width: 1, height: 24, background: T.BORDER, margin: "0 2px", flexShrink: 0 }} />

          {PANELS.map(({ id, icon: Icon, title }) => (
            <button key={id} title={title} onClick={() => handleIconClick(id)} style={{
              width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
              background: activePanel === id ? T.ACCENT_DIM : "transparent",
              border: "none", borderRadius: 8, cursor: "pointer",
              color: activePanel === id ? T.ACCENT : T.FONT_TERTIARY, padding: 0,
              position: "relative",
            }}>
              <Icon size={18} />
              {id === "encyclopedia" && !encyclopediaOpened && (
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

        {panelContent}
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes sidebarSlideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes mobileSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .sidebar-scrollbar::-webkit-scrollbar { width: 4px; }
        .sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>

      {/* 桌面版：左側垂直 Icon Rail */}
      <div style={{
        position: "absolute", top: 82, left: 12, zIndex: 20,
        width: 52, display: "flex", flexDirection: "column", alignItems: "center",
        padding: "14px 0", gap: 6,
        background: T.BG_PANEL, backdropFilter: BLUR_PANEL,
        borderRadius: 14, border: `1px solid ${T.BORDER_SUBTLE}`,
      }}>
        {/* 品牌 Sun 圖示 */}
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(180deg, #FFB347 0%, #FF8C00 100%)",
          boxShadow: "0 4px 16px rgba(255,140,0,0.25)",
        }}>
          <Sun size={22} color="#fff" />
        </div>
        <div style={{ width: 32, height: 1, background: T.BORDER }} />

        {PANELS.map(({ id, icon: Icon, title }) => (
          <div key={id} style={{ position: "relative" }}>
            <RailIcon active={activePanel === id} onClick={() => handleIconClick(id)} title={title}>
              <Icon size={20} />
            </RailIcon>
            {id === "encyclopedia" && !encyclopediaOpened && (
              <div style={{
                position: "absolute", top: 6, right: 6,
                width: 6, height: 6, borderRadius: "50%",
                background: "#EF4444", boxShadow: "0 0 4px rgba(239,68,68,0.6)",
                pointerEvents: "none",
              }} />
            )}
          </div>
        ))}
        <div style={{ width: 32, height: 1, background: T.BORDER }} />
        <RailIcon active={false} onClick={() => props.onInfoClick?.()} title="使用指南">
          <Info size={20} />
        </RailIcon>
      </div>

      {panelContent}
    </>
  );
}
