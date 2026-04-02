/**
 * 太陽系小天體資料載入
 *
 * 從 Supabase small_bodies 表載入真實軌道要素（JPL SBDB 來源）。
 * 資料幾乎不變，前端啟動時 fetch 一次即可。
 * 超過 PostgREST row limit 時自動分頁（Range header）。
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export interface SmallBody {
  name: string;
  class: string; // MBA, TJN, NEO, TNO, CEN, HTC, JFC
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  epoch_jd: number;
  period_days: number;
}

const PAGE_SIZE = 10000;

/**
 * 載入指定類別的小天體（自動分頁）
 */
export async function loadSmallBodies(bodyClass: string): Promise<SmallBody[]> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase 未設定，跳過 small body 載入");
    return [];
  }

  const baseUrl = `${SUPABASE_URL}/rest/v1/small_bodies?select=name,class,a,e,i,om,w,ma,epoch_jd,period_days&class=eq.${bodyClass}&order=id`;
  const all: SmallBody[] = [];
  let offset = 0;

  while (true) {
    try {
      const resp = await fetch(baseUrl, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Range: `${offset}-${offset + PAGE_SIZE - 1}`,
        },
      });

      if (!resp.ok && resp.status !== 206) {
        console.warn(`Small body ${bodyClass} 載入失敗: ${resp.status}`);
        break;
      }

      const rows: SmallBody[] = await resp.json();
      all.push(...rows);

      // 如果回傳數量 < PAGE_SIZE，表示已經是最後一頁
      if (rows.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    } catch (err) {
      console.warn(`Small body ${bodyClass} 載入錯誤:`, err);
      break;
    }
  }

  return all;
}

/** 依類別平行載入所有小天體 */
export async function loadAllSmallBodies(): Promise<Record<string, SmallBody[]>> {
  const classes = ["MBA", "TJN", "NEO", "TNO", "CEN", "HTC", "JFC"];
  const results = await Promise.all(classes.map((cls) => loadSmallBodies(cls)));
  const grouped: Record<string, SmallBody[]> = {};
  for (let i = 0; i < classes.length; i++) {
    if (results[i].length > 0) grouped[classes[i]] = results[i];
  }
  return grouped;
}
