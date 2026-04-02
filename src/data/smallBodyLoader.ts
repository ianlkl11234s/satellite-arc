/**
 * 太陽系小天體資料載入
 *
 * 從 Supabase small_bodies 表載入真實軌道要素（JPL SBDB 來源）。
 * 資料幾乎不變，前端啟動時 fetch 一次即可。
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface SmallBody {
  name: string;
  class: string; // MBA, TJN, NEO, TNO, CEN
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  epoch_jd: number;
  period_days: number;
}

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

/**
 * 載入指定類別的小天體
 * @param bodyClass "MBA" | "TJN" | "NEO" | "TNO" | "CEN" | 全部 (null)
 */
export async function loadSmallBodies(bodyClass?: string): Promise<SmallBody[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase 未設定，跳過 small body 載入");
    return [];
  }

  let url = `${SUPABASE_URL}/rest/v1/small_bodies?select=name,class,a,e,i,om,w,ma,epoch_jd,period_days`;
  if (bodyClass) url += `&class=eq.${bodyClass}`;
  url += `&limit=10000`;

  try {
    const resp = await fetch(url, { headers: HEADERS });
    if (!resp.ok) {
      console.warn(`Small body 載入失敗: ${resp.status}`);
      return [];
    }
    return resp.json();
  } catch (err) {
    console.warn("Small body 載入錯誤:", err);
    return [];
  }
}

/** 依類別平行載入所有小天體（避免單次 limit 截斷） */
export async function loadAllSmallBodies(): Promise<Record<string, SmallBody[]>> {
  const classes = ["MBA", "TJN", "NEO", "TNO", "CEN"];
  const results = await Promise.all(classes.map((cls) => loadSmallBodies(cls)));
  const grouped: Record<string, SmallBody[]> = {};
  for (let i = 0; i < classes.length; i++) {
    if (results[i].length > 0) grouped[classes[i]] = results[i];
  }
  return grouped;
}
