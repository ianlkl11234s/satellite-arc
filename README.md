# Satellite Arc

3D 即時衛星軌道追蹤與視覺化。純 Three.js 渲染，瀏覽器端 SGP4 即時計算。

從 Supabase 載入 ~12,000 顆衛星的 TLE 軌道參數，用 [satellite.js](https://github.com/shashwatak/satellite-js) 在瀏覽器即時計算位置，以 Three.js 渲染在 3D 地球上。

## 功能

- **3D 地球** — NASA Black Marble 夜景貼圖 + Fresnel 大氣光暈
- **~12,000 顆衛星** — 即時 SGP4 位置計算，分批更新保持 60fps
- **10 種用途分類** — 星鏈 / 寬頻通訊 / 衛星電話 / 導航定位 / 地球觀測 / 科學太空站 / 軍事情報 / 技術展示 等
- **動態尾巴** — 歷史位置緩衝區，零額外 SGP4 計算
- **靜態軌道線** — 60 分鐘完整軌道弧線（可選）
- **時間加速** — 1x ~ 600x，觀察衛星繞地球
- **點擊查看** — UCS 衛星目錄 7,560 筆（營運商、用途、發射資訊）
- **Icon Rail 側邊欄** — 四面板：設定 / 篩選圖層 / 配色主題 / 統計
- **篩選圖層** — 依衛星系統、國家、用途三維篩選 + 搜尋
- **配色主題** — 4 組預設（Default / Warm / Cool / Mono）+ 自訂
- **統計面板** — 圓餅圖、軌道分佈、主要營運商
- **品牌 Loading** — 進度條 + 兩階段載入提示

## 技術架構

```
Supabase (satellite_classified view)
    ↓ PostgREST API（分頁拉取，RLS 保護）
瀏覽器載入 TLE + category + country（一次 ~4MB）
    ↓ satellite.js SGP4
每幀分批計算衛星位置（12,000 ÷ 4 批 = 3,000/幀）
    ↓ Three.js
InstancedMesh 光點 + 歷史緩衝區尾巴 + OrbitLines
```

### 效能策略

| 策略 | 說明 |
|------|------|
| 分批 SGP4 | 每幀只算 1/4 衛星（~3,000 次），4 幀完成一輪 |
| 歷史緩衝區 | 尾巴用位置快取，不做額外 SGP4 |
| InstancedMesh | 3 層光點共 ~7 draw calls |
| 非同步篩選 | 篩選切換顯示 overlay，不凍結 UI |

### 座標系

```
Earth radius = 1.0
高度用 sqrt 縮放：LEO 400km → r≈1.15 / MEO 20,000km → r≈1.8 / GEO 36,000km → r≈2.2
```

## 資料來源

| 來源 | 內容 | 更新頻率 |
|------|------|---------|
| **CelesTrak** → data-collectors → Supabase | TLE 軌道參數 (~12,000 顆) | 每 2 小時 |
| **UCS Satellite Database** → Supabase | 用途/營運商/發射資訊 (7,560 筆) | 靜態 |
| **NASA Black Marble** | 地球夜景貼圖 | 靜態 |

## 專案結構

```
src/
├── globe/                       ← 3D 地球渲染核心
│   ├── GlobeView.tsx            ← React 容器
│   ├── GlobeScene.ts            ← 場景管理 + 分批 SGP4 迴圈
│   ├── EarthMesh.ts             ← 地球球體 + Fresnel 大氣
│   ├── SatelliteOrbs.ts         ← InstancedMesh 衛星光點
│   ├── TrailLines.ts            ← 歷史緩衝區動態尾巴
│   ├── OrbitLines.ts            ← 靜態軌道弧線
│   └── coordinates.ts           ← 球面座標轉換
├── components/
│   ├── Sidebar.tsx              ← Icon Rail + 4 面板（設定/篩選/配色/統計）
│   └── LoadingScreen.tsx        ← 品牌化載入畫面
├── data/
│   ├── satelliteLoader.ts       ← Supabase API + SGP4 + 分類定義
│   └── satelliteInfo.ts         ← 中文俗名對照表
├── App.tsx                      ← 主程式（狀態管理 + 佈局）
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
# Dockerfile 已包含（Node 22 build + Nginx serve）
# 在平台設定環境變數：VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

### 安全

- Supabase anon key 為公開 key（前端必定暴露）
- 所有衛星表已啟用 RLS：anon 只能 SELECT
- service_role key 僅 data-collectors 後端使用

## 操作

| 操作 | 說明 |
|------|------|
| 滑鼠拖曳 | 旋轉地球 |
| 滾輪 | 縮放 |
| 點擊衛星 | 查看詳細資訊 |
| 底部控制列 | 播放/暫停、時間加速、重設為現在 |
| 左側 Icon Rail | 設定 / 篩選圖層 / 配色主題 / 統計 |

## Roadmap

### UI / 視覺
- **對齊 pencil 設計稿** — 衛星資訊卡的藍色上邊框、右上角 Settings/Capture 按鈕、底部時間軸進度條（可拖曳）、整體間距與字級微調
- **Cinema Mode** — 從 plan-art 搬入 keyframe 相機動畫系統、HQ 離線逐幀匯出、Vignette 暗角、錄影 overlay（時間/衛星數），可製作 YouTube 影片
- **色彩主題系統** — 擴充更多 preset（如 Neon、Sunset），支援 localStorage 記憶選擇

### 互動功能
- **單顆衛星追蹤模式** — 點擊衛星後鎖定相機跟隨，自動旋轉地球追蹤該衛星移動，顯示地面軌跡投影線（ground track）和預測的下一圈軌道
- **Viewshed 視域分析** — 從 plan-art 搬入，顯示選中衛星的地面可見範圍（3D 扇形 + 掃描線）
- **衛星搜尋** — 在 header 或側邊欄加搜尋框，可直接搜衛星名稱/NORAD ID，搜到後自動定位

### 資料擴充
- **Space-Track 整合** — 註冊 Space-Track.org 帳號後，可取得完整的軍事/機密衛星目錄（目前 CelesTrak 公開版缺少部分保密衛星），同時可取得碰撞預警資料（CDM）
- **太空碎片** — 加入 NORAD 追蹤的 ~40,000 個碎片物體，可切換顯示（獨立圖層）
- **歷史回放** — 從 S3 歸檔載入過去的 TLE，回放特定日期的衛星分佈

### 效能優化
- **Web Worker** — 把 SGP4 計算（目前每幀 ~3,000 次）移到 Web Worker，完全不阻塞主線程的 UI 和 Three.js 渲染，消除所有殘餘的微卡頓
- **GPU Compute（進階）** — 用 WebGPU compute shader 做 SGP4 計算，全部 12,000 顆衛星每幀 GPU 平行完成，適合未來衛星數量增長到 10 萬+

## 相關專案

| 專案 | 角色 |
|------|------|
| `data-collectors` | 每 2 小時從 CelesTrak 收集 TLE → Supabase |
| `gis-platform` | Supabase schema + UCS 衛星目錄 + classified view |
| `plan-art` | 航班軌跡視覺化（同系列） |

## 授權

MIT License
