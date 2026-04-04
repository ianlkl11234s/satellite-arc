# 0404 衛星變軌全局分析

**日期**: 2026-04-04
**數據範圍**: 2026-03-28 ~ 2026-04-03 (7 天 TLE 歷史)
**類型**: 首次全局變軌偵測分析

## 目錄結構

```
0404_maneuver-overview/
  readme.md          ← 本檔案（需求說明 + 摘要）
  data/
    maneuvers_non_nominal.csv   ← 627 筆非正常變軌原始資料
    constellation_summary.csv   ← 星座級統計彙總
  sql/
    queries.sql       ← 6 組分析查詢（可重複執行）
  report/
    analysis.md       ← 完整分析報告與結論
```

## 分析摘要

- **Starlink**: 470 次變軌 (75%)，新批次協調爬升 + 53° shell 大規模面調整
- **BeiDou-3 G4**: 週期 -4.81 min，本週最大單一機動
- **軍事衛星**: 整體平靜，無異常部署信號
- **區域覆蓋**: 中緯度 30-55° 最多調整（台日韓歐美）

## Follow-up 追蹤

- [ ] BeiDou-3 G4 (C62) 持續追蹤
- [ ] Starlink 53° shell 面調整趨勢
- [ ] Starlink 37xxx 批次爬升完成時間
- [ ] SYRACUSE 4A 法國軍事衛星
- [ ] 累積 30 天資料後建立行為基線
