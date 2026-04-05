/**
 * Dashboard 資料載入
 *
 * 從 Supabase 拉取 Starlink 每日變軌資料，
 * 按天分組、按 shell 分類。
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface DailyManeuver {
  norad_id: number;
  name: string;
  shell: string;
  period_min: number;
  inclination: number;
  delta_period: number;
  delta_inc: number;
  fetched_at: string;
}

export interface DaySummary {
  date: string;
  total: number;
  altitudeChanges: number;
  planeChanges: number;
  shells: Record<string, { count: number; avgDelta: number; ascending: number; descending: number }>;
  topMovers: DailyManeuver[];
}

export async function loadStarlinkDailyData(): Promise<DaySummary[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];

  // 用 RPC 或直接查 tle_history 太慢，改從 CSV 靜態載入
  // 但先嘗試直接查 materialized 或 view
  // 最穩定的方式：建一個 Supabase function 或直接前端計算
  // 這裡用 satellite_tle_history 分頁拉取 Starlink 的變軌資料

  const url = `${SUPABASE_URL}/rest/v1/rpc/starlink_daily_maneuvers`;
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (resp.ok) {
      const raw = await resp.json();
      return processDailyData(raw);
    }
  } catch { /* fallback below */ }

  // Fallback: 從靜態 CSV 載入
  return loadFromCSV();
}

async function loadFromCSV(): Promise<DaySummary[]> {
  try {
    const resp = await fetch("/reports/2026-04/0405_starlink-daily-analysis/data/starlink_daily_maneuvers.csv");
    if (!resp.ok) return [];
    const text = await resp.text();
    const lines = text.trim().split("\n");
    const header = lines[0]!.split(",");

    const records: DailyManeuver[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]!.split(",");
      records.push({
        norad_id: parseInt(cols[header.indexOf("norad_id")]!, 10),
        name: cols[header.indexOf("name")]!,
        shell: cols[header.indexOf("shell")]!,
        period_min: parseFloat(cols[header.indexOf("period_min")]!),
        inclination: parseFloat(cols[header.indexOf("inclination")]!),
        delta_period: parseFloat(cols[header.indexOf("delta_period")]!),
        delta_inc: parseFloat(cols[header.indexOf("delta_inc")]!),
        fetched_at: cols[header.indexOf("day")]!,
      });
    }
    return processDailyData(records);
  } catch {
    return [];
  }
}

function processDailyData(records: DailyManeuver[]): DaySummary[] {
  const byDay = new Map<string, DailyManeuver[]>();
  for (const r of records) {
    const day = r.fetched_at.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(r);
  }

  const summaries: DaySummary[] = [];
  for (const [date, maneuvers] of [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const shells: DaySummary["shells"] = {};
    let altitudeChanges = 0;
    let planeChanges = 0;

    for (const m of maneuvers) {
      if (!shells[m.shell]) shells[m.shell] = { count: 0, avgDelta: 0, ascending: 0, descending: 0 };
      const s = shells[m.shell]!;
      s.count++;
      s.avgDelta += m.delta_period;
      if (m.delta_period > 0) s.ascending++;
      else s.descending++;

      if (Math.abs(m.delta_period) > 0.05) altitudeChanges++;
      if (Math.abs(m.delta_inc) > 0.01) planeChanges++;
    }

    for (const s of Object.values(shells)) {
      if (s.count > 0) s.avgDelta /= s.count;
    }

    const topMovers = [...maneuvers]
      .sort((a, b) => Math.abs(b.delta_period) - Math.abs(a.delta_period))
      .slice(0, 10);

    summaries.push({ date, total: maneuvers.length, altitudeChanges, planeChanges, shells, topMovers });
  }

  return summaries;
}
