# Satellite Orbit Analysis Reports

定期分析衛星軌道變化、星座協同行為、區域覆蓋動態。

## 目錄結構

```
reports/
  README.md                                  ← 本檔案
  2026-04/                                   ← 月份
    0404_maneuver-overview/                  ← 日期_需求名稱
      readme.md                              ← 需求說明 + 摘要 + follow-up
      data/                                  ← 原始資料 (CSV)
        maneuvers_non_nominal.csv
        constellation_summary.csv
      sql/                                   ← 分析查詢
        queries.sql
      report/                                ← 完整報告
        analysis.md
    0410_starlink-shell-tracking/             ← (未來範例)
      ...
  2026-05/
    ...
```

## 命名規則

- **需求資料夾**: `MMDD_topic-slug/`
- **topic 範例**: `maneuver-overview`, `starlink-constellation`, `military-activity`, `coordinated-maneuvers`, `regional-coverage`, `beidou-tracking`

## 常見分析類型

| Topic | 說明 | 頻率 |
|-------|------|------|
| maneuver-overview | 全局變軌偵測摘要 | 每週或需要時 |
| starlink-constellation | Starlink 星座管理動態 | 追蹤中 |
| military-activity | 軍事/情報衛星異常 | 事件驅動 |
| coordinated-maneuvers | 協調性群體機動 | 事件驅動 |
| regional-coverage | 特定區域覆蓋變化 | 需要時 |
