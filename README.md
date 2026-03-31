# Satellite Arc

3D 即時衛星軌道追蹤與視覺化。純 Three.js 渲染，瀏覽器端 SGP4 即時計算。

從 Supabase 載入 ~15,000 顆衛星（含太空碎片）的 TLE 軌道參數，用 [satellite.js](https://github.com/shashwatak/satellite-js) 在瀏覽器即時計算位置，以 Three.js 渲染在 3D 地球上。

![Satellite Tracker Overview](screenshot/overview.png)

![Closeup View](screenshot/closeup.png)

![Starlink Info Card](screenshot/starlink-info.png)

## 功能

### 核心渲染
- **3D 地球** — 日夜交替 shader（Blue Marble 白天 + Black Marble 夜晚 + 即時晨昏線）+ Fresnel 大氣光暈
- **~15,000 顆衛星** — 即時 SGP4 位置計算，分批更新保持 60fps
- **11 種用途分類** — 星鏈 / 寬頻通訊 / 衛星電話 / 導航定位 / 地球觀測 / 科學太空站 / 軍事情報 / 技術展示 / 太空碎片 等
- **動態尾巴** — 歷史位置緩衝區（20-50 步），零額外 SGP4 計算
- **3D 軌道線** — 依真實高度映射（LEO 貼球面、GEO 遠離球面），清晰區分軌道層

### 相機控制
- **旋轉 / 縮放 / 平移** — 左鍵旋轉、滾輪縮放、右鍵平移
- **5 個預設視角** — 北極俯視、南極俯視、赤道正視、全景遠距、特寫近距
- **衛星追蹤模式** — 選中衛星後，相機平滑跟隨繞行地球

### 側邊欄面板
- **設定** — 用途分類開關（Solo 模式快速切換）、顯示參數（尾巴/軌道線/日夜交替）、視覺參數
- **篩選圖層** — 依衛星系統 / 國家 / 用途三維篩選 + 搜尋
- **配色主題** — 4 組預設（Default / Warm / Cool / Mono）+ 自訂
- **統計** — 衛星總數、軌道分佈、用途圓餅圖、主要營運商
- **視角** — 5 個預設相機視角快切

### 太空發射
- **全球發射台標記** — 233 個發射台地表標記，即將發射的台站顯示脈衝動畫（< 24h 紅色 / < 7d 橘色）
- **發射時程面板** — 即將發射的任務列表，含倒數計時、狀態 badge、軌道類型
- **點擊飛到發射台** — 點擊任務，相機平滑飛到對應發射台位置
- **發射詳情卡片** — 火箭圖片、任務描述、機構、軌道參數、天氣、成功機率
- **資料來源** — Launch Library 2 (TheSpaceDevs)，每日自動同步 upcoming + 回溯歷史 5 年

### 使用者體驗
- **時間軸拖拉** — 可拖拉 ±12 小時，即時更新衛星位置
- **時間加速** — 10x ~ 600x，觀察衛星繞地球
- **點擊查看** — UCS 衛星目錄 7,560 筆（營運商、用途、發射資訊）
- **Info Modal** — 操作指南 / 資料來源 / 使用技巧 / 關於 / 個人，支援中英文
- **品牌 Loading** — 軌道動畫 + 步驟清單 + 平滑淡出過渡
- **Favicon** — 衛星軌道風格圖示
- **手機版 Responsive** — 底部水平工具列、底部滑出面板、自適應 Timeline

## 技術架構

```
CelesTrak (36 群組, 含碎片)          Launch Library 2 (TheSpaceDevs)
    ↓ data-collectors (每 2 小時)        ↓ data-collectors (每 5 分鐘輪轉)
Supabase satellite_tle               Supabase launches + launch_pads
    + satellite_catalog                  + launch_events
    ↓ satellite_classified view          ↓ launches_upcoming view
    ↓ PostgREST API                      ↓ PostgREST API
瀏覽器載入 TLE + category             瀏覽器載入 launches + pads
    ↓ satellite.js SGP4                  ↓
每幀分批計算衛星位置                   LaunchPadMarkers + LaunchPanel
    ↓ Three.js
InstancedMesh 光點 + 歷史緩衝區尾巴 + 3D OrbitLines + 發射台標記
```

### 效能策略

| 策略 | 說明 |
|------|------|
| 分批 SGP4 | 每幀只算 1/4 衛星，4 幀完成一輪 |
| 歷史緩衝區 | 尾巴用位置快取（最多 55 幀），不做額外 SGP4 |
| InstancedMesh | 3 層光點（core + glow1 + glow2）共 ~7 draw calls |
| 非同步篩選 | 篩選切換顯示 overlay，不凍結 UI |
| 淡出過渡 | Loading → 主畫面平滑淡出，Three.js 在背景預載 |

### 座標系

```
Earth radius = 1.0
高度用 sqrt 縮放：LEO 400km → r≈1.13 / MEO 20,000km → r≈1.9 / GEO 36,000km → r≈2.2
```

## 資料來源

| 來源 | 內容 | 更新頻率 |
|------|------|---------|
| **CelesTrak** (36 群組) → data-collectors → Supabase | TLE 軌道參數 (~15,000 顆，含太空碎片) | 每 2 小時 |
| **Launch Library 2** (TheSpaceDevs) → data-collectors → Supabase | 發射時程 + 233 發射台 + 太空事件 | 每 5 分鐘輪轉 |
| **UCS Satellite Database** → Supabase | 用途/營運商/發射資訊 (7,560 筆) | 靜態 |
| **NASA Black Marble** | 地球夜景貼圖 | 靜態 |

### CelesTrak 群組清單

導航（GPS / Galileo / BeiDou / GLONASS）、通訊星座（Starlink / OneWeb / Iridium / Globalstar / Orbcomm / Qianfan）、氣象觀測（Weather / NOAA / GOES）、地球觀測（Resource / Planet / Spire）、同步軌道（GEO / SES）、太空站與科學（Stations / Science）、搜救與環境（SARSAT / Argos / TDRSS）、特殊軌道（Molniya / Military / Radar / Analyst）、小型衛星（CubeSat / Education / DMC）、社群追蹤（Amateur / SatNOGS / Visual）、**太空碎片**（Fengyun-1C / Cosmos-2251 / Iridium-33）

## 專案結構

```
src/
├── globe/                       ← 3D 地球渲染核心
│   ├── GlobeView.tsx            ← React 容器 + 相機預設/追蹤模式
│   ├── GlobeScene.ts            ← 場景管理 + 分批 SGP4 + 追蹤邏輯
│   ├── EarthMesh.ts             ← 地球球體 + Fresnel 大氣
│   ├── SatelliteOrbs.ts         ← InstancedMesh 衛星光點（呼吸動畫）
│   ├── TrailLines.ts            ← 歷史緩衝區動態尾巴
│   ├── OrbitLines.ts            ← 3D 靜態軌道弧線（真實高度映射）
│   ├── LaunchPadMarkers.ts      ← 發射台地表標記 + 脈衝動畫
│   └── coordinates.ts           ← 球面座標轉換 + altToRadius
├── components/
│   ├── Sidebar.tsx              ← Icon Rail + 7 面板（設定/篩選/配色/統計/視角/發射時程/Info）
│   ├── LaunchPanel.tsx          ← 發射時程面板（倒數計時、詳情）
│   ├── InfoModal.tsx            ← 操作指南/資料來源/使用技巧/關於/個人（中英文）
│   └── LoadingScreen.tsx        ← 軌道動畫 + 步驟清單載入畫面
├── data/
│   ├── satelliteLoader.ts       ← Supabase API + SGP4 + 11 分類定義
│   ├── launchLoader.ts          ← Launch Library 2 資料載入（launches + pads）
│   └── satelliteInfo.ts         ← 中文俗名對照表
├── hooks/
│   └── useIsMobile.ts           ← 響應式斷點偵測
├── App.tsx                      ← 主程式（狀態管理 + 佈局 + 響應式）
└── main.tsx
```

## 快速開始

```bash
# 安裝
npm install

# 設定環境變數
cp .env.example .env
# 編輯 .env 填入 Supabase URL 和 anon key

# 開發
npm run dev

# Type check
npm run typecheck

# Build
npm run build
```

## 環境變數

| 變數 | 說明 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase PostgREST API URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key（公開，受 RLS 保護） |

## 部署

### Zeabur / Docker

```bash
# Dockerfile 已包含（Node 22 build + Nginx serve，port 8080）
# 在平台設定環境變數：VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

### 安全

- Supabase anon key 為公開 key（前端必定暴露）
- 所有衛星表已啟用 RLS：anon 只能 SELECT
- service_role key 僅 data-collectors 後端使用

## 操作

| 操作 | 說明 |
|------|------|
| 左鍵拖曳 | 旋轉地球 |
| 右鍵拖曳 | 平移地球 |
| 滾輪 | 縮放 |
| 點擊衛星 | 查看詳細資訊（NORAD ID、軌道、營運商等） |
| 點擊分類數字 | Solo 模式（只看這個分類） |
| 底部時間軸 | 播放/暫停、拖拉 ±12h、時間加速（10-600x）、重設為現在 |
| 側邊欄 | 設定 / 篩選 / 配色 / 統計 / 視角 / 發射時程 / Info |
| 追蹤按鈕 | 選中衛星後出現，相機跟隨衛星繞行 |
| 點擊發射任務 | 相機飛到發射台 + 顯示詳情卡片 |

## Roadmap

### 視覺增強
- **Cinema Mode** — keyframe 相機動畫、HQ 離線逐幀匯出、Vignette 暗角
- **Ground Track** — 衛星地面軌跡投影線

### 互動功能
- **Viewshed 視域分析** — 顯示選中衛星的地面可見範圍
- **衛星搜尋** — 搜尋衛星名稱 / NORAD ID，自動定位

### 資料擴充
- **Space-Track 整合** — 完整軍事/機密衛星 + 碰撞預警（CDM）
- **歷史回放** — 從 S3 歸檔載入過去 TLE，回放特定日期
- **太空天氣** — NASA DONKI / NOAA SWPC 太陽風暴、極光帶視覺化
- **ISS 即時追蹤** — Open Notify API 國際太空站位置標記

### 效能優化
- **GPU Compute** — WebGPU compute shader 平行 SGP4，支援 10 萬+ 衛星（`perf/webgpu-sgp4` 分支開發中）

## 相關專案

| 專案 | 角色 |
|------|------|
| `data-collectors` | CelesTrak TLE（每 2h）+ Launch Library 2 發射時程（每 5min 輪轉）→ Supabase |
| `gis-platform` | Supabase schema + UCS 衛星目錄 + satellite_classified view（11 category）+ pg_cron 自動分區 |
| `plan-art` | 航班軌跡視覺化（同系列） |

## 授權

MIT License
