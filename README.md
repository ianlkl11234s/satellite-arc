# Satellite Art

Pure Three.js 3D 地球 + 即時衛星軌道追蹤視覺化。

從 Supabase 載入 ~12,000 顆衛星的 TLE 軌道參數，用 [satellite.js](https://github.com/shashwatak/satellite-js) 在瀏覽器即時計算每顆衛星的位置，以 Three.js 渲染在 3D 地球上。

## 功能

- **3D 地球** — NASA Black Marble 夜景貼圖 + Fresnel 大氣光暈
- **~12,000 顆衛星** — 即時 SGP4 位置計算（Starlink ~10,000 + 導航/通訊/氣象/科學）
- **動態尾巴** — 每顆衛星拖著過去 ~4 分鐘的漸淡軌跡
- **靜態軌道線** — 60 分鐘完整軌道弧線（可選）
- **軌道類型分色** — Starlink / LEO / MEO / GEO / HEO 各有獨立顏色
- **時間加速** — 1x ~ 600x 速度，觀察衛星繞地球
- **點擊查看** — 點擊衛星顯示完整資訊（名稱、用途、營運商、發射日期等）
- **UCS 衛星目錄** — 7,560 筆衛星的詳細元數據（從 Supabase 即時查詢）
- **篩選控制** — 依類型開關（Starlink / LEO / MEO / GEO / HEO）
- **視覺調整** — 軌跡透明度、光點大小

## 技術架構

```
Supabase (satellite_tle 表)
    ↓ PostgREST API
瀏覽器載入 TLE 參數（一次 ~3MB）
    ↓ satellite.js SGP4
每幀計算 12,000 顆衛星即時位置
    ↓ Three.js InstancedMesh
3D 地球 + 衛星光點 + 動態尾巴
```

### 渲染管線

| 元件 | Draw Calls | 說明 |
|------|-----------|------|
| 地球球體 | 1 | SphereGeometry + NASA 貼圖 |
| 大氣光暈 | 1 | BackSide Fresnel shader |
| 衛星光點 | 3 | InstancedMesh（core + 2 glow layers） |
| 動態尾巴 | 1 | 批次 LineSegments，每 10 幀更新 |
| 靜態軌道 | 1 | 批次 LineSegments |
| **總計** | **~7** | 60fps |

### 座標系

```
Earth radius = 1.0（場景單位）
lat/lng/alt → 3D Cartesian:
  r = altToRadius(altKm)  // sqrt 縮放
  x = r × cos(lat) × cos(lng)
  y = r × sin(lat)
  z = -r × cos(lat) × sin(lng)
```

高度用 sqrt 縮放讓不同軌道層視覺上有區別：
- LEO 400 km → r ≈ 1.15
- MEO 20,000 km → r ≈ 1.8
- GEO 36,000 km → r ≈ 2.2

## 資料來源

| 來源 | 內容 | 更新頻率 |
|------|------|---------|
| **CelesTrak** → data-collectors → Supabase `satellite_tle` | TLE 軌道參數（~12,000 顆） | 每 2 小時 |
| **UCS Satellite Database** → Supabase `satellite_catalog` | 用途/營運商/發射資訊（7,560 筆） | 靜態 |
| **NASA Black Marble** | 地球夜景貼圖 | 靜態 |

## 專案結構

```
satellite-art/
├── public/textures/earth-dark.jpg   ← NASA 夜景貼圖
├── src/
│   ├── globe/                       ← 3D 地球渲染核心
│   │   ├── GlobeView.tsx            ← React 容器
│   │   ├── GlobeScene.ts            ← 場景管理 + SGP4 計算迴圈
│   │   ├── EarthMesh.ts             ← 地球球體 + 大氣
│   │   ├── SatelliteOrbs.ts         ← InstancedMesh 衛星光點
│   │   ├── TrailLines.ts            ← 動態尾巴
│   │   ├── OrbitLines.ts            ← 靜態軌道弧線
│   │   └── coordinates.ts           ← 球面座標轉換
│   ├── data/
│   │   ├── satelliteLoader.ts       ← Supabase TLE 載入 + SGP4 軌道計算
│   │   └── satelliteInfo.ts         ← 中文俗名 / 軌道類型對照表
│   ├── hooks/
│   │   ├── useSatelliteData.ts      ← 衛星資料管理 hook
│   │   └── useIsMobile.ts
│   ├── types/index.ts
│   ├── utils/dateUtils.ts
│   ├── App.tsx                      ← 主程式
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 快速開始

```bash
# 安裝
npm install

# 開發
npm run dev

# Type check
npm run typecheck

# Build
npm run build
```

瀏覽器開啟 `http://localhost:5173`，等待 TLE 載入後即可看到 3D 地球 + 衛星。

## 操作

- **滑鼠拖曳** — 旋轉地球
- **滾輪** — 縮放
- **點擊衛星** — 查看詳細資訊
- **底部控制列** — 播放/暫停、時間加速（1x ~ 600x）、重設為現在
- **左側面板** — 類型篩選、尾巴/軌道開關、透明度、光點大小

## 相關專案

| 專案 | 角色 |
|------|------|
| `data-collectors` | 每 2 小時從 CelesTrak 收集 TLE → Supabase |
| `gis-platform` | Supabase schema 管理 + UCS 衛星目錄匯入 |
| `plan-art` | 航班軌跡視覺化（同系列，用 Mapbox + Three.js） |

## 授權

MIT License
