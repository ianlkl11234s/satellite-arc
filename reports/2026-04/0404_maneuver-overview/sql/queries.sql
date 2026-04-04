-- ============================================================
-- 0404 變軌全局分析 SQL
-- 數據範圍：2026-03-28 ~ 2026-04-03 (7 天 TLE 歷史)
-- ============================================================

-- 1. 星座活動統計
SELECT constellation, maneuver_type, COUNT(*) as cnt,
       ROUND(AVG(delta_period_min)::numeric, 4) as avg_delta_period,
       ROUND(AVG(delta_inclination)::numeric, 4) as avg_delta_inc
FROM public.satellite_maneuvers
WHERE maneuver_type != 'NOMINAL'
GROUP BY constellation, maneuver_type
HAVING COUNT(*) > 2
ORDER BY cnt DESC;

-- 2. Starlink 分殼層分析
SELECT
    CASE
        WHEN curr_inclination BETWEEN 42 AND 44 THEN '43° shell'
        WHEN curr_inclination BETWEEN 52 AND 54 THEN '53° shell'
        WHEN curr_inclination BETWEEN 69 AND 71 THEN '70° shell'
        WHEN curr_inclination BETWEEN 96 AND 99 THEN '97° shell (sun-sync)'
        ELSE 'other'
    END AS shell,
    maneuver_type,
    COUNT(*) as cnt,
    ROUND(AVG(delta_period_min)::numeric, 4) as avg_delta_period,
    ROUND(MIN(delta_period_min)::numeric, 4) as min_delta,
    ROUND(MAX(delta_period_min)::numeric, 4) as max_delta
FROM public.satellite_maneuvers
WHERE constellation = 'Starlink' AND maneuver_type != 'NOMINAL'
GROUP BY shell, maneuver_type
ORDER BY shell, maneuver_type;

-- 3. Starlink 協調爬升偵測（同日、同 shell、delta 接近）
SELECT name, maneuver_type,
       ROUND(delta_period_min::numeric, 4) as delta_period,
       ROUND(curr_period_min::numeric, 2) as period,
       ROUND(curr_inclination::numeric, 2) as inc,
       curr_fetched_at::date as detected
FROM public.satellite_maneuvers
WHERE constellation = 'Starlink'
  AND maneuver_type = 'ALTITUDE_CHANGE'
  AND delta_period_min > 0.04
ORDER BY curr_inclination, delta_period_min DESC;

-- 4. 軍事衛星活動
SELECT name, constellation, orbit_type, maneuver_type,
       ROUND(delta_period_min::numeric, 4) as delta_period,
       ROUND(delta_inclination::numeric, 4) as delta_inc,
       ROUND(curr_inclination::numeric, 2) as inc,
       curr_fetched_at
FROM public.satellite_maneuvers
WHERE maneuver_type != 'NOMINAL'
  AND (name ILIKE '%USA%' OR name ILIKE '%NROL%' OR name ILIKE '%YAOGAN%'
       OR name ILIKE '%COSMOS%' OR name ILIKE '%MILSTAR%' OR name ILIKE '%WGS%'
       OR name ILIKE '%SBIRS%' OR name ILIKE '%MUOS%' OR name ILIKE '%AEHF%'
       OR name ILIKE '%BLACKJACK%' OR name ILIKE '%SJ-%' OR name ILIKE '%TJS%'
       OR name ILIKE '%GAOFEN%' OR name ILIKE '%JILIN%' OR name ILIKE '%BEIDOU%'
       OR name ILIKE '%SYRACUSE%')
ORDER BY ABS(delta_period_min) DESC;

-- 5. 最大單一機動 TOP 20
SELECT name, constellation, orbit_type, maneuver_type,
       ROUND(delta_period_min::numeric, 4) as delta_period,
       ROUND(delta_inclination::numeric, 4) as delta_inc,
       ROUND(delta_eccentricity::numeric, 6) as delta_ecc,
       ROUND(curr_period_min::numeric, 2) as period,
       ROUND(curr_inclination::numeric, 2) as inc,
       curr_fetched_at
FROM public.satellite_maneuvers
WHERE maneuver_type != 'NOMINAL'
ORDER BY ABS(delta_period_min) + ABS(delta_inclination)*100 DESC
LIMIT 20;

-- 6. 區域覆蓋分佈
SELECT
    CASE
        WHEN curr_inclination BETWEEN 0 AND 10 THEN '赤道帶 0-10°'
        WHEN curr_inclination BETWEEN 10 AND 30 THEN '亞熱帶 10-30°'
        WHEN curr_inclination BETWEEN 30 AND 55 THEN '中緯度 30-55° (台日韓歐美)'
        WHEN curr_inclination BETWEEN 55 AND 75 THEN '高緯度 55-75° (俄/北歐)'
        WHEN curr_inclination BETWEEN 75 AND 100 THEN '極軌 75-100° (全球覆蓋)'
        ELSE '其他'
    END AS latitude_band,
    maneuver_type,
    COUNT(*) as cnt
FROM public.satellite_maneuvers
WHERE maneuver_type != 'NOMINAL'
GROUP BY latitude_band, maneuver_type
ORDER BY latitude_band, maneuver_type;
