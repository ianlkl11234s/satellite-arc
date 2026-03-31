/**
 * 太空發射資料載入
 *
 * 從 Supabase 拉取 launches_upcoming view 和 launch_pads_all view，
 * 供前端顯示發射時程與發射台地標。
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/** 即將發射的任務 */
export interface Launch {
  id: string;
  name: string;
  net: string; // ISO 8601
  window_start: string | null;
  window_end: string | null;
  status: string; // Go / TBD / TBC / Success / Failure
  status_name: string;
  rocket_name: string;
  rocket_family: string;
  rocket_full_name: string;
  mission_name: string;
  mission_type: string;
  mission_description: string;
  orbit_name: string;
  orbit_abbrev: string;
  agency_name: string;
  agency_type: string;
  pad_name: string;
  location_name: string;
  country_code: string;
  probability: number | null;
  weather_concerns: string;
  webcast_live: boolean;
  image_url: string;
  infographic_url: string;
  program_names: string;
  last_updated: string;
  pad_latitude: number | null;
  pad_longitude: number | null;
}

/** 發射台 */
export interface LaunchPad {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  location_name: string;
  country_code: string;
  total_launch_count: number;
  orbital_launch_attempt_count: number;
}

/** 載入即將發射的任務 */
export async function loadUpcomingLaunches(): Promise<Launch[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase 未設定，跳過 launch 載入");
    return [];
  }

  const url = `${SUPABASE_URL}/rest/v1/launches_upcoming?select=*&order=net.asc&limit=100`;
  const resp = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!resp.ok) {
    console.warn(`Launch 載入失敗: ${resp.status}`);
    return [];
  }

  return resp.json();
}

/** 載入所有發射台 */
export async function loadLaunchPads(): Promise<LaunchPad[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase 未設定，跳過 pad 載入");
    return [];
  }

  const url = `${SUPABASE_URL}/rest/v1/launch_pads_all?select=*&limit=500`;
  const resp = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!resp.ok) {
    console.warn(`LaunchPad 載入失敗: ${resp.status}`);
    return [];
  }

  return resp.json();
}
