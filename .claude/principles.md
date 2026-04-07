# 專案運作原則 — Satellite Art

（詳細架構見 [CLAUDE.md](CLAUDE.md)）

## 資料流
```
CelesTrak (每 2 小時) → data-collectors → Supabase
  ├─ satellite_tle          (最新 TLE，前端 SGP4 用)
  ├─ satellite_tle_history  (歷史 TLE，變軌偵測用)
  └─ satellite_maneuvers    (MATERIALIZED VIEW，每 2 小時 cron 刷新)
```

## 技術棧
- **Frontend**: React + Three.js
- **Orbital Math**: satellite.js (SGP4 propagation)
- **Data**: Supabase (`realtime.satellite_*`)

## 核心慣例

### TLE 時效性
- TLE 資料約 7 天內有效，超過誤差會快速放大
- 前端載入時取最新 TLE
- 變軌偵測用 `tle_history` 比對 epoch 差異

### 座標系統
- SGP4 輸出 ECI 座標 → 轉成 ECEF → 再轉 Three.js
- 地球旋轉用真實 GMST 計算

### 前端效能
- 2000+ 衛星同時追蹤：用 `InstancedMesh` + 背景 Web Worker 計算
- 每幀只更新可視衛星（frustum culling）

## 時區處理
- SGP4 用 **UTC** 計算（這是科學慣例，不能用台灣時間）
- 顯示層才轉台灣時間
- 讀 Supabase 時取 `EXTRACT(EPOCH FROM epoch_time)` → 直接 SGP4 用

## 相依專案
- **data-collectors** — 上游資料
- **gis-platform** — Supabase schema（`migrations/` 中有 satellite 相關的）
