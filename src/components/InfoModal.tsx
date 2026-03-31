/**
 * Info Modal — 操作指南 + 關於 + 個人
 * 改編自 plan-art InfoModal，適配 Satellite Arc
 */

import { useState } from "react";
import { X } from "lucide-react";

type Lang = "zh" | "en";
type BottomTab = "guide" | "about" | "profile";
type GuidePage = "getting-started" | "data-sources" | "tips";

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

/* ── Sub-components ────────────────────────────── */

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

function Tag({ children }: { children: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", fontSize: 11,
      background: S.cardBg, border: `1px solid ${S.cardBorder}`,
      borderRadius: 4, color: S.sub,
    }}>{children}</span>
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

/* ── Pages ─────────────────────────────────────── */

function GettingStartedPage({ lang }: { lang: Lang }) {
  const L = lang === "zh";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <p style={{ fontSize: 13, lineHeight: 1.8, color: S.text, margin: 0 }}>
        {L
          ? "歡迎使用 Satellite Arc — 以 3D 球體呈現全球衛星即時軌跡與太空發射時程的視覺化作品。"
          : "Welcome to Satellite Arc — a 3D globe visualization of real-time satellite trajectories and space launch schedules."}
      </p>

      <SectionTitle>{L ? "地球操作" : "GLOBE CONTROLS"}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
        <Card title={L ? "旋轉視角" : "Rotate"}>
          <KeyBadge>{L ? "左鍵" : "Left"}</KeyBadge> + {L ? "拖曳 — 改變俯仰角和方位角" : "Drag — Change pitch & bearing"}
        </Card>
        <Card title={L ? "縮放地球" : "Zoom"}>
          <KeyBadge>{L ? "滾輪" : "Scroll"}</KeyBadge> {L ? "上下滾動 — 放大或縮小" : "— Zoom in or out"}
        </Card>
        <Card title={L ? "平移地球" : "Pan"}>
          <KeyBadge>{L ? "右鍵" : "Right"}</KeyBadge> + {L ? "拖曳 — 移動地球中心位置" : "Drag — Move globe center"}
        </Card>
      </div>

      <SectionTitle>{L ? "點擊互動" : "CLICK INTERACTIONS"}</SectionTitle>
      <Card title={L ? "點擊衛星光球" : "Click Satellite Orb"}>
        {L
          ? "顯示衛星浮動資訊卡：名稱、NORAD ID、軌道類型、高度、座標。再次點擊其他位置可關閉。"
          : "Show satellite info card: name, NORAD ID, orbit type, altitude, coordinates. Click elsewhere to dismiss."}
      </Card>
      <Card title={L ? "追蹤模式" : "Follow Mode"}>
        {L
          ? "選中衛星後，點擊右上角「追蹤」按鈕，相機會持續跟隨衛星移動。"
          : "After selecting a satellite, click the \"Follow\" button in the top-right to have the camera track the satellite."}
      </Card>

      <SectionTitle>{L ? "側邊欄面板" : "SIDEBAR PANELS"}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
        <Card title={L ? "設定" : "Settings"}>
          {L ? "用途分類開關、顯示參數（尾巴長度、衛星大小、透明度）" : "Category toggles, visual settings (trail length, orb scale, opacity)"}
        </Card>
        <Card title={L ? "篩選圖層" : "Filters"}>
          {L ? "按衛星系統、國家、用途篩選。支援搜尋、全選/清除。" : "Filter by constellation, country, purpose. Supports search, select all/clear."}
        </Card>
        <Card title={L ? "配色主題" : "Colors"}>
          {L ? "4 種預設主題（Default/Warm/Cool/Mono）+ 自訂每個分類的顏色。" : "4 preset themes + custom color per category."}
        </Card>
        <Card title={L ? "統計" : "Statistics"}>
          {L ? "衛星總數、軌道分佈、用途圓餅圖、主要營運商排名。" : "Total count, orbit distribution, category donut chart, top operators."}
        </Card>
        <Card title={L ? "發射時程" : "Launches"}>
          {L ? "即將發射的太空任務列表，含倒數計時、狀態。點擊可飛到發射台並顯示詳情卡片。" : "Upcoming space launches with countdown and status. Click to fly to the launch pad and view details."}
        </Card>
      </div>

      <SectionTitle>{L ? "預設視角" : "CAMERA PRESETS"}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
        {[
          { name: { zh: "北極", en: "North Pole" }, desc: { zh: "俯視太陽同步軌道", en: "View sun-sync orbits" } },
          { name: { zh: "南極", en: "South Pole" }, desc: { zh: "俯視極地軌道", en: "View polar orbits" } },
          { name: { zh: "赤道", en: "Equator" }, desc: { zh: "平視 GEO 衛星帶", en: "View GEO belt" } },
          { name: { zh: "全景", en: "Overview" }, desc: { zh: "遠距看整體分佈", en: "Far view of all sats" } },
          { name: { zh: "特寫", en: "Closeup" }, desc: { zh: "近距看衛星細節", en: "Close-up details" } },
        ].map((p) => (
          <Card key={t(p.name, lang)} title={t(p.name, lang)}>{t(p.desc, lang)}</Card>
        ))}
      </div>

      <SectionTitle>{L ? "時間軸控制" : "TIMELINE"}</SectionTitle>
      <Card title={L ? "時間控制列" : "Timeline Bar"}>
        {L
          ? "底部的控制列可暫停/播放時間、拖拉 ±12 小時、切換速度倍率（10x/60x/300x/600x）、跳轉至「NOW」即時。"
          : "The bottom timeline bar lets you pause/play, drag ±12 hours, switch speed (10x/60x/300x/600x), and jump to NOW."}
      </Card>

      <SectionTitle>{L ? "太空發射" : "SPACE LAUNCHES"}</SectionTitle>
      <Card title={L ? "發射台地標" : "Launch Pad Markers"}>
        {L
          ? "地球上標記了全球 233 個發射台。即將發射的台站會顯示紅色（< 24h）或橘色（< 7d）脈衝動畫。"
          : "233 launch pads marked on the globe. Pads with upcoming launches show red (< 24h) or orange (< 7d) pulse animations."}
      </Card>
      <Card title={L ? "點擊發射任務" : "Click a Launch"}>
        {L
          ? "在側邊欄「發射時程」面板點擊任務，相機會平滑飛到對應發射台，並顯示詳情卡片（火箭、軌道、機構、天氣等）。"
          : "Click a mission in the Launches panel — the camera smoothly flies to the launch pad and displays a detail card (rocket, orbit, agency, weather, etc.)."}
      </Card>
    </div>
  );
}

function DataSourcesPage({ lang }: { lang: Lang }) {
  const L = lang === "zh";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card title="CelesTrak" accentColor="#5B9CF6">
        {L
          ? "衛星 TLE（Two-Line Element）軌道參數 — 涵蓋 36 個 CelesTrak 群組，包含 Starlink、GPS、OneWeb、太空碎片等 15,000+ 顆衛星。"
          : "Satellite TLE orbital elements — 36 CelesTrak groups including Starlink, GPS, OneWeb, space debris, 15,000+ satellites."}
      </Card>
      <Card title="UCS Satellite Database" accentColor="#81c784">
        {L
          ? "Union of Concerned Scientists 衛星資料庫 — 提供營運商、國家、用途、發射日期、質量等詳細目錄資料（7,500+ 筆）。"
          : "Detailed catalog data from UCS — operator, country, purpose, launch date, mass, etc. (7,500+ records)."}
      </Card>
      <Card title="Launch Library 2 (TheSpaceDevs)" accentColor="#ff7043">
        {L
          ? "太空發射排程資料庫 — 涵蓋全球 233 個發射台、即將發射的任務、歷史發射紀錄（回溯 5 年）及太空事件。"
          : "Space launch schedule database — 233 launch pads worldwide, upcoming missions, historical launches (5 years back), and space events."}
      </Card>
      <Card title="satellite.js (SGP4)" accentColor="#ce93d8">
        {L
          ? "前端即時 SGP4 軌道傳播演算法 — 從 TLE 參數計算衛星的即時經緯度和高度，無需後端 API。"
          : "Client-side SGP4 orbit propagation — computes real-time lat/lng/altitude from TLE parameters, no backend API needed."}
      </Card>
      <Card title="Three.js" accentColor="#ffb74d">
        {L
          ? "3D 渲染引擎 — Earth mesh + InstancedMesh 衛星光點 + LineSegments 軌道線 + AdditiveBlending 光軌效果。"
          : "3D rendering engine — Earth mesh + InstancedMesh satellite orbs + LineSegments orbit lines + AdditiveBlending trail effects."}
      </Card>
    </div>
  );
}

function TipsPage({ lang }: { lang: Lang }) {
  const L = lang === "zh";
  const tips = L ? [
    { cat: "視覺調整", items: [
      "點擊分類數字可快速「Solo」— 只看單一類型的衛星和軌道線",
      "Starlink 和太空碎片預設隱藏，可在設定面板手動開啟",
      "衛星大小和尾巴長度可在設定面板的滑桿即時調整",
      "靜態軌道線可開啟/關閉，開啟後能看到完整的 3D 繞行軌跡",
    ]},
    { cat: "篩選技巧", items: [
      "篩選圖層面板支援三種維度：衛星系統（All）、國家（Country）、用途（Purpose）",
      "搜尋框可快速找到特定衛星或星座名稱",
      "Select All / Clear 只作用在當前 Tab 的篩選器",
    ]},
    { cat: "相機操作", items: [
      "5 個預設視角可快速切換：北極、南極、赤道、全景、特寫",
      "選中衛星後可開啟追蹤模式，相機會平滑跟隨衛星繞行地球",
      "右鍵拖曳可平移地球，重置按鈕回到原位",
    ]},
    { cat: "太空發射", items: [
      "側邊欄 Rocket icon 開啟發射時程面板，顯示即將發射的任務",
      "點擊任務可飛到發射台並查看火箭、軌道、機構等詳細資訊",
      "發射台標記：紅色脈衝 = 24 小時內發射、橘色 = 7 天內",
      "時間軸可拖拉 ±12 小時，觀察不同時間的衛星分佈",
    ]},
    { cat: "小知識", items: [
      "LEO（低軌）衛星高度 200-2,000 km，繞行一圈約 90 分鐘",
      "GEO（同步軌道）衛星高度 ~36,000 km，與地球同步旋轉",
      "太空碎片是 2007 中國反衛星試驗和 2009 Cosmos/Iridium 碰撞的殘骸",
      "發射資料來自 Launch Library 2 (TheSpaceDevs)，每日自動同步",
    ]},
  ] : [
    { cat: "Visual", items: [
      "Click category numbers to 'Solo' — view only one satellite type at a time",
      "Starlink and debris are hidden by default, enable them in Settings",
      "Orb size and trail length can be adjusted with sliders in Settings",
      "Static orbit lines show complete 3D orbital trajectories when enabled",
    ]},
    { cat: "Filtering", items: [
      "Filter panel supports three dimensions: Constellation (All), Country, Purpose",
      "Search box quickly finds specific satellites or constellation names",
      "Select All / Clear only affects the current tab's filter",
    ]},
    { cat: "Camera", items: [
      "5 camera presets for quick switching: North Pole, South Pole, Equator, Overview, Closeup",
      "Follow mode tracks the selected satellite as it orbits the Earth",
      "Right-click drag to pan the globe, reset button returns to origin",
    ]},
    { cat: "Launches", items: [
      "Open the Launches panel via the Rocket icon to see upcoming missions",
      "Click a mission to fly to the launch pad and view rocket, orbit, and agency details",
      "Launch pad markers: red pulse = within 24h, orange = within 7 days",
      "Drag the timeline ±12 hours to observe satellite distribution at different times",
    ]},
    { cat: "Fun Facts", items: [
      "LEO satellites orbit at 200-2,000 km altitude, completing one orbit in ~90 minutes",
      "GEO satellites at ~36,000 km rotate in sync with Earth",
      "Space debris includes remnants from the 2007 Chinese ASAT test and 2009 Cosmos/Iridium collision",
      "Launch data from Launch Library 2 (TheSpaceDevs), synced daily",
    ]},
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {tips.map((group) => (
        <div key={group.cat}>
          <SectionTitle>{group.cat}</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {group.items.map((tip, i) => (
              <div key={i} style={{
                padding: "8px 12px", fontSize: 12, lineHeight: 1.7,
                color: S.sub, background: S.cardBg, borderRadius: 6,
                borderLeft: `2px solid ${S.active}22`,
              }}>{tip}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AboutPage({ lang }: { lang: Lang }) {
  const L = lang === "zh";
  const stats = [
    { num: "15,000+", label: { zh: "追蹤衛星", en: "Satellites" } },
    { num: "233", label: { zh: "發射台", en: "Launch Pads" } },
    { num: "11", label: { zh: "用途分類", en: "Categories" } },
    { num: "7,500+", label: { zh: "UCS 目錄", en: "UCS Records" } },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h2 style={{ fontSize: 18, color: S.text, margin: "0 0 10px", letterSpacing: 0.5, fontFamily: S.font }}>Satellite Arc</h2>
        <p style={{ fontSize: 13, lineHeight: 1.9, color: S.text, margin: 0 }}>
          {L
            ? "全球衛星即時追蹤與太空發射時程 3D 視覺化。涵蓋 15,000+ 顆衛星、233 個發射台、即將發射的火箭任務，將太空動態轉化為圍繞地球的光軌藝術。"
            : "Real-time satellite tracking & space launch schedule 3D visualization. Covering 15,000+ satellites, 233 launch pads, upcoming rocket missions — transforming space dynamics into luminous art around the Earth."}
        </p>
      </div>

      <SectionTitle>{L ? "規模" : "SCALE"}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
        {stats.map((item) => (
          <div key={t(item.label, lang)} style={{
            background: S.cardBg, border: `1px solid ${S.cardBorder}`, borderRadius: 8,
            padding: "12px 14px", textAlign: "center",
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: S.active }}>{item.num}</div>
            <div style={{ fontSize: 11, color: S.sub, marginTop: 2 }}>{t(item.label, lang)}</div>
          </div>
        ))}
      </div>

      <SectionTitle>{L ? "技術堆疊" : "TECH STACK"}</SectionTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["React 19", "TypeScript", "Vite", "Three.js", "satellite.js (SGP4)", "WebGL", "Docker", "Supabase"].map((x) => (
          <Tag key={x}>{x}</Tag>
        ))}
      </div>

      <SectionTitle>{L ? "資料來源" : "DATA SOURCES"}</SectionTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["CelesTrak TLE", "Launch Library 2", "UCS Satellite DB", "SGP4 Propagation"].map((x) => (
          <Tag key={x}>{x}</Tag>
        ))}
      </div>

      <SectionTitle>{L ? "架構亮點" : "ARCHITECTURE"}</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Card title={L ? "前端 SGP4 即時計算" : "Client-side SGP4"}>
          {L
            ? "從 TLE 參數在瀏覽器端即時計算衛星位置，分批更新避免凍結 UI，支援 15,000+ 衛星同時渲染。"
            : "Real-time satellite position computation from TLE in the browser, batched updates to avoid UI freeze, supporting 15,000+ simultaneous satellites."}
        </Card>
        <Card title={L ? "InstancedMesh 批次渲染" : "InstancedMesh Batch Rendering"}>
          {L
            ? "使用 Three.js InstancedMesh 將所有衛星光點合併為單一 draw call，搭配呼吸動畫和多層 glow 效果。"
            : "All satellite orbs merged into a single draw call via Three.js InstancedMesh, with breathing animation and multi-layer glow."}
        </Card>
        <Card title={L ? "3D 軌道線高度映射" : "3D Orbit Altitude Mapping"}>
          {L
            ? "軌道線依真實高度非線性映射到 3D 空間：LEO 貼近球面、GEO 遠離球面，清晰區分不同軌道層。"
            : "Orbit lines mapped to 3D space using non-linear altitude scaling: LEO near surface, GEO far out, clearly distinguishing orbital layers."}
        </Card>
      </div>
    </div>
  );
}

/* ── ProfilePage（照抄 plan-art）────────────────── */

function ProjectCard({ name, desc, screenshot, site, github }: {
  name: string; desc: string; screenshot?: string; site?: string; github: string;
}) {
  return (
    <div style={{
      background: S.cardBg, border: `1px solid ${S.cardBorder}`, borderRadius: 8,
      overflow: "hidden",
    }}>
      {screenshot && (
        <div style={{ width: "100%", height: 120, overflow: "hidden" }}>
          <img src={screenshot} alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}
      <div style={{ padding: "10px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: S.text, marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 11, color: S.sub, marginBottom: 8, lineHeight: 1.5 }}>{desc}</div>
        <div style={{ display: "flex", gap: 8 }}>
          {site && (
            <a href={site} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: S.active, textDecoration: "none" }}>Live</a>
          )}
          <a href={github} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: S.sub, textDecoration: "none" }}>GitHub</a>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ lang }: { lang: Lang }) {
  const L = lang === "zh";
  const projects = [
    {
      name: L ? "Mini-Taiwan 軌道運輸模擬" : "Mini-Taiwan Rail Simulation",
      desc: L ? "台灣軌道運輸即時模擬視覺化" : "Real-time Taiwan rail transit simulation",
      screenshot: "./screenshots/mini-taiwan.png",
      site: "https://mini-taiwan-learning-project.zeabur.app/",
      github: "https://github.com/ianlkl11234s/mini-taiwan-learning-project",
    },
    {
      name: "Taiwan Flight Arc",
      desc: L ? "台灣航班弧線 3D 視覺化" : "Taiwan flight arc 3D visualization",
      screenshot: "./screenshots/taiwan-flight-arc.png",
      site: "https://flight-arc.zeabur.app/",
      github: "https://github.com/ianlkl11234s/flight-arc-graph",
    },
    {
      name: L ? "Taiwan Weather Timelapse 台灣氣象模擬" : "Taiwan Weather Timelapse",
      desc: L ? "台灣氣象時序動畫視覺化" : "Taiwan weather time-series animation",
      screenshot: "./screenshots/weather.png",
      site: "https://taiwan-weather-timelapse.zeabur.app/",
      github: "https://github.com/ianlkl11234s/taiwan-weather-timelapse",
    },
    {
      name: "Mini Taiwan Pulse",
      desc: L ? "台灣交通與基礎設施多圖層即時視覺化 — 航班、船舶、鐵道、車站、燈塔、風場等" : "Multi-layer real-time visualization of Taiwan's transport & infrastructure",
      screenshot: "./screenshots/all-layers-facilities.png",
      site: "https://mini-taiwan-pulse.zeabur.app/",
      github: "https://github.com/ianlkl11234s/mini-taiwan-pulse",
    },
    {
      name: L ? "Ship GIS — 台灣海域船舶動態" : "Ship GIS — Taiwan Maritime Viz",
      desc: L ? "台灣海域船舶動態視覺化平台" : "Taiwan maritime vessel visualization platform",
      github: "https://github.com/ianlkl11234s/tw-ship-viz",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <img src="./screenshots/頭貼.jpg" alt="Migu"
          style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: S.text }}>Migu</div>
          <div style={{ fontSize: 12, color: S.sub }}>Senior Data Analyst / GIS</div>
        </div>
      </div>

      <SectionTitle>{L ? "社群連結" : "SOCIAL LINKS"}</SectionTitle>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a href="https://github.com/ianlkl11234s" target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: S.cardBg, border: `1px solid ${S.cardBorder}`, borderRadius: 8, textDecoration: "none", color: S.text, fontSize: 12 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
          GitHub
        </a>
        <a href="https://www.threads.com/@ianlkl1314" target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: S.cardBg, border: `1px solid ${S.cardBorder}`, borderRadius: 8, textDecoration: "none", color: S.text, fontSize: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.028-3.577.877-6.43 2.523-8.478C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.592 12c.024 3.088.715 5.5 2.053 7.166 1.43 1.783 3.63 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.347-.794-.96-1.44-1.735-1.907-.327 2.14-1.07 3.79-2.24 4.876-1.278 1.187-2.95 1.82-4.86 1.82h-.09c-1.57-.014-2.904-.553-3.855-1.559C5.355 17.29 4.834 15.955 4.834 14.38c0-2.118.95-3.865 2.677-4.922 1.497-.916 3.443-1.39 5.782-1.41l.06.001c1.255.009 2.396.137 3.405.378.142-.67.2-1.37.167-2.073l2.1-.12c.054 1.09-.035 2.13-.278 3.075 1.08.624 1.917 1.46 2.42 2.607.762 1.74.872 4.478-1.225 6.533-1.78 1.744-3.943 2.508-7.002 2.53Zm-.512-9.47c-2.071.024-3.678.416-4.862 1.14-1.096.67-1.678 1.706-1.678 2.95 0 1.065.347 1.953 1.003 2.564.636.594 1.513.893 2.607.903 1.46-.004 2.705-.456 3.622-1.309.923-.858 1.522-2.192 1.771-3.963-.86-.232-1.807-.361-2.815-.372l-.05.002.402-.915Z" /></svg>
          Threads
        </a>
      </div>

      <SectionTitle>{L ? "其他專案" : "OTHER PROJECTS"}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {projects.map((p) => <ProjectCard key={p.github} {...p} />)}
      </div>
    </div>
  );
}

/* ── Main Modal ────────────────────────────────── */

const GUIDE_PAGES: Array<{ id: GuidePage; label: { zh: string; en: string } }> = [
  { id: "getting-started", label: { zh: "操作指南", en: "Getting Started" } },
  { id: "data-sources", label: { zh: "資料來源", en: "Data Sources" } },
  { id: "tips", label: { zh: "使用技巧", en: "Tips" } },
];

const BOTTOM_TABS: Array<{ id: BottomTab; label: { zh: string; en: string } }> = [
  { id: "guide", label: { zh: "指南", en: "Guide" } },
  { id: "about", label: { zh: "關於", en: "About" } },
  { id: "profile", label: { zh: "個人", en: "Profile" } },
];

export function InfoModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<BottomTab>("guide");
  const [guidePage, setGuidePage] = useState<GuidePage>("getting-started");
  const [lang, setLang] = useState<Lang>("zh");

  const renderContent = () => {
    if (activeTab === "guide") {
      switch (guidePage) {
        case "getting-started": return <GettingStartedPage lang={lang} />;
        case "data-sources": return <DataSourcesPage lang={lang} />;
        case "tips": return <TipsPage lang={lang} />;
      }
    }
    if (activeTab === "about") return <AboutPage lang={lang} />;
    if (activeTab === "profile") return <ProfilePage lang={lang} />;
  };

  const pageTitle = activeTab === "guide"
    ? t(GUIDE_PAGES.find((p) => p.id === guidePage)!.label, lang)
    : t(BOTTOM_TABS.find((b) => b.id === activeTab)!.label, lang);

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
          {/* 左側 Sidebar */}
          <div style={{
            width: 200, flexShrink: 0, padding: "20px 0",
            borderRight: `1px solid ${S.border}`,
            display: "flex", flexDirection: "column", justifyContent: "space-between",
          }}>
            {/* Guide 子導覽 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 12px" }}>
              {activeTab === "guide" && GUIDE_PAGES.map((p) => (
                <button key={p.id} onClick={() => setGuidePage(p.id)} style={{
                  padding: "8px 14px", fontSize: 13, fontFamily: S.font,
                  background: guidePage === p.id ? `${S.active}18` : "transparent",
                  color: guidePage === p.id ? S.active : S.sub,
                  border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left",
                  fontWeight: guidePage === p.id ? 600 : 400,
                }}>{t(p.label, lang)}</button>
              ))}
            </div>

            {/* 底部 Tab */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 12px" }}>
              {BOTTOM_TABS.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: "8px 14px", fontSize: 13, fontFamily: S.font,
                  background: activeTab === tab.id ? `${S.active}18` : "transparent",
                  color: activeTab === tab.id ? S.active : S.sub,
                  border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left",
                  fontWeight: activeTab === tab.id ? 600 : 400,
                }}>{t(tab.label, lang)}</button>
              ))}
            </div>
          </div>

          {/* 右側內容區 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 24px", borderBottom: `1px solid ${S.border}`, flexShrink: 0,
            }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: S.text }}>{pageTitle}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* 語言切換 */}
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

            {/* 捲動內容 */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
