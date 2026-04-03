/**
 * Solar System Info Modal — 操作指南 + 資料來源 + 關於
 * 複用 InfoModal 的 UI pattern，內容專屬太陽系模式
 */

import { useState } from "react";
import { X } from "lucide-react";

type Lang = "zh" | "en";
type Tab = "guide" | "data" | "about";

const S = {
  bg: "rgba(14,14,22,0.96)",
  border: "rgba(255,255,255,0.1)",
  cardBg: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.08)",
  label: "rgba(255,255,255,0.4)",
  text: "rgba(255,255,255,0.85)",
  sub: "rgba(255,255,255,0.5)",
  active: "#5B9CF6",
  font: "'Inter', sans-serif",
} as const;

const t = (obj: { zh: string; en: string }, lang: Lang) => obj[lang];

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 style={{
      margin: "4px 0 6px", fontSize: 11, fontWeight: 600,
      letterSpacing: 1.5, textTransform: "uppercase",
      color: S.label, fontFamily: S.font,
    }}>{children}</h3>
  );
}

function Card({ title, accentColor, children }: { title: string; accentColor?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: S.cardBg, border: `1px solid ${S.cardBorder}`, borderRadius: 8,
      padding: "12px 14px", borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: S.text, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: S.sub, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function KeyBadge({ children }: { children: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", fontSize: 11, fontWeight: 600,
      background: "rgba(255,255,255,0.08)", border: `1px solid ${S.border}`,
      borderRadius: 4, color: S.text, fontFamily: S.font,
    }}>{children}</span>
  );
}

/* ── Pages ──────────────────────────────────── */

function GuidePage({ lang }: { lang: Lang }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: S.sub, lineHeight: 1.7, margin: 0 }}>
        {t({
          zh: "Solar System 模式以 3D 即時模擬太陽系的行星繞行、小天體分佈和彗星軌道。所有天體位置由 Keplerian 軌道力學在瀏覽器端即時計算。",
          en: "Solar System mode simulates planetary orbits, small body distributions, and comet trajectories in real-time 3D. All positions are computed client-side using Keplerian orbital mechanics.",
        }, lang)}
      </p>

      <SectionTitle>{t({ zh: "場景操作", en: "Scene Controls" }, lang)}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Card title={t({ zh: "旋轉視角", en: "Rotate View" }, lang)} accentColor="#5B9CF6">
          <KeyBadge>{t({ zh: "左鍵", en: "Left" }, lang)}</KeyBadge> + {t({ zh: "拖曳 — 改變俯仰角和方位角", en: "drag — change pitch and azimuth" }, lang)}
        </Card>
        <Card title={t({ zh: "縮放", en: "Zoom" }, lang)} accentColor="#5B9CF6">
          <KeyBadge>{t({ zh: "滾輪", en: "Scroll" }, lang)}</KeyBadge> {t({ zh: "上下滾動 — 放大或縮小", en: "scroll — zoom in or out" }, lang)}
        </Card>
        <Card title={t({ zh: "平移", en: "Pan" }, lang)} accentColor="#5B9CF6">
          <KeyBadge>{t({ zh: "右鍵", en: "Right" }, lang)}</KeyBadge> + {t({ zh: "拖曳 — 移動視角中心", en: "drag — move view center" }, lang)}
        </Card>
      </div>

      <SectionTitle>{t({ zh: "點擊互動", en: "Click Interaction" }, lang)}</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Card title={t({ zh: "點擊天體", en: "Click Celestial Body" }, lang)} accentColor="#FFB347">
          {t({
            zh: "點擊行星、彗星、矮行星、太陽或月球，顯示浮動資訊卡：名稱、中文名、類型、物理數據（半徑、溫度、大氣等）。相機會自動飛到天體附近。",
            en: "Click any planet, comet, dwarf planet, Sun or Moon to show an info card with name, type, and physical data. Camera flies to the body automatically.",
          }, lang)}
        </Card>
        <Card title={t({ zh: "點擊彗星粒子", en: "Click Comet Particles" }, lang)} accentColor="#88ccff">
          {t({
            zh: "HTC（哈雷型）和 JFC（木星族）彗星以粒子形式渲染，點擊可顯示其名稱和軌道參數（半長軸、離心率、傾角、週期）。",
            en: "HTC and JFC comets are rendered as particles. Click to show name and orbital elements (semi-major axis, eccentricity, inclination, period).",
          }, lang)}
        </Card>
      </div>

      <SectionTitle>{t({ zh: "側邊欄面板", en: "Sidebar Panels" }, lang)}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Card title={t({ zh: "設定", en: "Settings" }, lang)} accentColor="#5B9CF6">
          {t({
            zh: "7 類小天體分類篩選（帶數量），每類可獨立調整粒子大小和不透明度。軌道路徑分三組控制（行星/HTC/JFC）。",
            en: "7-class small body filter with counts. Per-class particle size/opacity. Orbit paths in 3 groups (planet/HTC/JFC).",
          }, lang)}
        </Card>
        <Card title={t({ zh: "配色主題", en: "Color Themes" }, lang)} accentColor="#FFB347">
          {t({
            zh: "4 種預設主題（Default / Warm / Cool / Mono）+ 7 類自訂色。Mono 主題在深色背景上特別清晰。",
            en: "4 presets (Default/Warm/Cool/Mono) + 7-class custom colors. Mono theme is especially clear on dark background.",
          }, lang)}
        </Card>
        <Card title={t({ zh: "天體百科", en: "Encyclopedia" }, lang)} accentColor="#66aa66">
          {t({
            zh: "7 類小天體的中文百科：簡介、形成機制、已知數量、對人類的重要性。含 NASA 任務參考。",
            en: "Chinese encyclopedia for 7 small body classes: description, formation, known count, significance. Includes NASA mission references.",
          }, lang)}
        </Card>
      </div>

      <SectionTitle>{t({ zh: "時間控制", en: "Time Control" }, lang)}</SectionTitle>
      <Card title={t({ zh: "時間軸", en: "Timeline" }, lang)} accentColor="#5B9CF6">
        {t({
          zh: "時間軸範圍 ±1 年（以天為步進），速度選項：10min/s、1h/s、1d/s、1w/s、1mo/s。所有天體位置使用雙快取 lerp 內插，任何速度下都保持流暢無頓感。",
          en: "Timeline range ±1 year (day steps). Speed: 10min/s to 1month/s. All positions use double-buffered lerp interpolation for smooth animation at any speed.",
        }, lang)}
      </Card>
    </div>
  );
}

function DataPage({ lang }: { lang: Lang }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 13, color: S.sub, lineHeight: 1.7, margin: 0 }}>
        {t({
          zh: "太陽系模式的資料來自多個公開來源，所有計算在瀏覽器端完成。",
          en: "Solar System mode data comes from multiple open sources. All calculations are done client-side.",
        }, lang)}
      </p>

      <SectionTitle>{t({ zh: "行星位置", en: "Planetary Positions" }, lang)}</SectionTitle>
      <Card title="Keplerian Orbital Elements (J2000)" accentColor="#FFB347">
        {t({
          zh: "8 大行星 + 月球 + 矮行星的位置由 J2000 Keplerian 軌道要素即時計算。使用 Newton-Raphson 法解 Kepler 方程，低離心率天體 3 次迭代，高離心率天體 8 次迭代。",
          en: "Positions for 8 planets + Moon + dwarf planets are computed from J2000 Keplerian elements using Newton-Raphson solver. Low-eccentricity bodies use 3 iterations, high-eccentricity use 8.",
        }, lang)}
      </Card>

      <SectionTitle>{t({ zh: "小天體資料", en: "Small Body Data" }, lang)}</SectionTitle>
      <Card title="NASA JPL Small-Body Database (SBDB)" accentColor="#5B9CF6">
        {t({
          zh: "86,549 顆小天體的軌道要素從 JPL SBDB API 一次性匯入 Supabase。資料幾乎不變（軌道要素是長期觀測擬合結果），不需定期更新。前端啟動時從 Supabase 載入，用 Range header 自動分頁。",
          en: "86,549 small body orbital elements imported once from JPL SBDB API into Supabase. Data is essentially static (orbit elements are long-term observation fits). Loaded on frontend startup with automatic pagination via Range headers.",
        }, lang)}
      </Card>

      <div style={{ fontSize: 12, color: S.sub, lineHeight: 1.7 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${S.border}` }}>
              <th style={{ textAlign: "left", padding: "6px 0", color: S.label }}>{t({ zh: "類別", en: "Class" }, lang)}</th>
              <th style={{ textAlign: "right", padding: "6px 0", color: S.label }}>{t({ zh: "數量", en: "Count" }, lang)}</th>
              <th style={{ textAlign: "right", padding: "6px 0", color: S.label }}>{t({ zh: "佔 JPL 總數", en: "Coverage" }, lang)}</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["MBA 主帶小行星", "40,000", "3%"],
              ["TJN 木星特洛伊", "15,838", "100%"],
              ["NEO 近地天體", "23,543", "100%"],
              ["TNO 柯伊伯帶", "6,033", "100%"],
              ["CEN 半人馬", "1,008", "100%"],
              ["HTC 哈雷型彗星", "110", "100%"],
              ["JFC 木星族彗星", "17", "100%"],
            ].map(([name, count, coverage]) => (
              <tr key={name} style={{ borderBottom: `1px solid ${S.cardBorder}` }}>
                <td style={{ padding: "5px 0", color: S.text }}>{name}</td>
                <td style={{ padding: "5px 0", textAlign: "right", color: S.sub }}>{count}</td>
                <td style={{ padding: "5px 0", textAlign: "right", color: S.sub }}>{coverage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle>{t({ zh: "行星貼圖", en: "Planet Textures" }, lang)}</SectionTitle>
      <Card title="Solar System Scope (CC BY 4.0)" accentColor="#66aa66">
        {t({
          zh: "太陽、8 大行星、月球的 2K 貼圖來自 Solar System Scope，以 Creative Commons Attribution 4.0 授權。土星環使用獨立的 alpha 貼圖。",
          en: "2K textures for Sun, 8 planets and Moon from Solar System Scope under CC BY 4.0 license. Saturn ring uses a separate alpha texture.",
        }, lang)}
      </Card>
    </div>
  );
}

function AboutPage({ lang }: { lang: Lang }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card title="Solar System Mode" accentColor="#FFB347">
        {t({
          zh: "太陽系模式是 Satellite Arc 的擴展功能，將視角從近地軌道延伸到整個太陽系。使用 Keplerian 軌道力學在瀏覽器端即時計算 86,549 顆天體的位置，搭配雙快取 lerp 內插確保任何時間倍速下的平滑動畫。",
          en: "Solar System mode extends Satellite Arc from near-Earth orbit to the entire solar system. It computes positions for 86,549 celestial bodies in real-time using Keplerian orbital mechanics, with double-buffered lerp interpolation for smooth animation at any time speed.",
        }, lang)}
      </Card>

      <SectionTitle>{t({ zh: "技術要點", en: "Technical Highlights" }, lang)}</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Card title={t({ zh: "Kepler 方程求解器", en: "Kepler Equation Solver" }, lang)}>
          {t({
            zh: "Newton-Raphson 迭代法求解 eccentric anomaly，支援高離心率天體（彗星 e > 0.9）。每 60 幀批量計算 86k 天體位置，每幀 lerp 內插，零幀卡頓。",
            en: "Newton-Raphson solver for eccentric anomaly, handles high-eccentricity bodies (comets e > 0.9). Batch-computes 86k positions every 60 frames, per-frame lerp interpolation, zero frame drops.",
          }, lang)}
        </Card>
        <Card title={t({ zh: "距離縮放", en: "Distance Scaling" }, lang)}>
          {t({
            zh: "使用 √(AU) × 10 壓縮太陽系距離，讓內外行星都能同時看到。行星大小誇張約 500 倍，否則在畫面上不到 0.1 像素。",
            en: "Uses √(AU) × 10 to compress solar system distances so both inner and outer planets are visible. Planet sizes are exaggerated ~500x, otherwise they'd be < 0.1 pixel on screen.",
          }, lang)}
        </Card>
        <Card title={t({ zh: "Supabase 分頁載入", en: "Supabase Paginated Loading" }, lang)}>
          {t({
            zh: "前端使用 PostgREST Range header 自動分頁（每頁 10,000 筆），7 個類別平行載入，約 2-3 秒完成 86,549 筆資料載入。",
            en: "Frontend uses PostgREST Range headers for automatic pagination (10,000 per page), 7 classes loaded in parallel. ~86,549 records loaded in 2-3 seconds.",
          }, lang)}
        </Card>
      </div>
    </div>
  );
}

/* ── Tabs ──────────────────────────────────── */

const TABS: Array<{ id: Tab; label: { zh: string; en: string } }> = [
  { id: "guide", label: { zh: "操作指南", en: "Guide" } },
  { id: "data", label: { zh: "資料來源", en: "Data Sources" } },
  { id: "about", label: { zh: "關於", en: "About" } },
];

/* ── Main ──────────────────────────────────── */

export function SolarInfoModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("guide");
  const [lang, setLang] = useState<Lang>("zh");

  const renderContent = () => {
    switch (activeTab) {
      case "guide": return <GuidePage lang={lang} />;
      case "data": return <DataPage lang={lang} />;
      case "about": return <AboutPage lang={lang} />;
    }
  };

  const pageTitle = t(TABS.find((tab) => tab.id === activeTab)!.label, lang);

  return (
    <>
      <style>{`@keyframes infoFadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "infoFadeIn 0.2s ease-out",
      }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: 920, maxWidth: "95vw", height: 680, maxHeight: "90vh",
          background: S.bg, borderRadius: 14, border: `1px solid ${S.border}`,
          display: "flex", overflow: "hidden", fontFamily: S.font,
        }}>
          {/* 左側 Tab */}
          <div style={{
            width: 200, flexShrink: 0, padding: "20px 12px",
            borderRight: `1px solid ${S.border}`,
            display: "flex", flexDirection: "column", gap: 2,
          }}>
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: "8px 14px", fontSize: 13, fontFamily: S.font,
                background: activeTab === tab.id ? `${S.active}18` : "transparent",
                color: activeTab === tab.id ? S.active : S.sub,
                border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left",
                fontWeight: activeTab === tab.id ? 600 : 400,
              }}>{t(tab.label, lang)}</button>
            ))}
          </div>

          {/* 右側內容 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 24px", borderBottom: `1px solid ${S.border}`, flexShrink: 0,
            }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: S.text }}>{pageTitle}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${S.border}` }}>
                  {(["zh", "en"] as Lang[]).map((l) => (
                    <button key={l} onClick={() => setLang(l)} style={{
                      padding: "4px 10px", fontSize: 11, fontWeight: 600, fontFamily: S.font,
                      background: lang === l ? S.active : "transparent",
                      color: lang === l ? "#fff" : S.sub,
                      border: "none", cursor: "pointer",
                    }}>{l.toUpperCase()}</button>
                  ))}
                </div>
                <button onClick={onClose} style={{
                  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.06)", border: `1px solid ${S.border}`,
                  borderRadius: 6, color: S.sub, cursor: "pointer", padding: 0,
                }}>
                  <X size={14} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
