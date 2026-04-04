# Satellite Art — 專案指引

## 專案概覽
React + Three.js 3D 衛星追蹤應用，支援地球模式（即時衛星位置）和太陽系模式（小天體軌道）。

## 相關 Repo
- **satellite-art** (本 repo): 前端應用
- **data-collectors**: Python 資料收集器（CelesTrak TLE、Launch Library 2）
- **gis-platform**: Supabase schema、migrations

## 軌道分析系統

### 資料流
```
CelesTrak (每2hr) → data-collectors → Supabase
  ├─ satellite_tle (最新 TLE，前端 SGP4 用)
  ├─ satellite_tle_history (歷史 TLE，變軌偵測用)
  └─ satellite_maneuvers (MATERIALIZED VIEW，每2hr cron刷新)
```

### 分析報告結構
```
reports/
  README.md                                    ← 結構說明與命名規則
  2026-04/                                     ← 月份
    0404_maneuver-overview/                    ← 日期_需求名稱
      readme.md                                ← 需求說明 + 摘要 + follow-up
      data/                                    ← 原始資料 CSV
      sql/                                     ← 分析查詢
      report/                                  ← 完整報告
```

### 報告命名規則
- 資料夾: `MMDD_topic-slug/`
- 每個需求包含 `readme.md` + `data/` + `sql/` + `report/`
- 常見 topic: `maneuver-overview`, `starlink-constellation`, `military-activity`, `coordinated-maneuvers`, `regional-coverage`

### 執行分析時
1. 從 `satellite_maneuvers` materialized view 查詢（已有 index，秒回）
2. 結合 `satellite_tle_history` 做深度歷史比對
3. SQL 存入 `sql/`，原始資料匯出到 `data/`，結論寫入 `report/`
4. `readme.md` 包含摘要和 Follow-up items
5. 檢查前次報告的 Follow-up 是否有需要更新的追蹤項目

### Supabase 連線
- DB (session mode): `postgresql://postgres.utcmcikhvxnohbxchbrs:...@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres`
- PostgREST API: `https://utcmcikhvxnohbxchbrs.supabase.co/rest/v1/`

### 關鍵閾值（變軌偵測）
- 高度變更: |ΔPeriod| > 0.05 min
- 軌道面變更: |ΔInclination| > 0.01°
- 形狀變更: |ΔEccentricity| > 0.001

### 重要追蹤項目（2026-04 起）
- **BeiDou-3 G4 (C62)**: 4/2 異常大幅機動 -4.81 min，持續監控
- **Starlink 53° shell**: 大規模面調整中，追蹤覆蓋密度變化
- **Starlink 37xxx 批次**: 協調爬升中，預計 1-2 週到達工作軌道
