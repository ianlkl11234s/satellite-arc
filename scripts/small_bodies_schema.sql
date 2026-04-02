-- 太陽系小天體軌道要素表
-- 資料來源：JPL Small-Body Database (SBDB)
-- 一次性匯入，不需定期更新（軌道要素幾乎不變）

CREATE TABLE IF NOT EXISTS small_bodies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  -- 分類：MBA(主帶小行星), TJN(木星特洛伊), NEO(近地天體), TNO(海王星外天體), CEN(半人馬)
  class TEXT NOT NULL,
  -- Keplerian 軌道六要素
  a DOUBLE PRECISION NOT NULL,      -- 半長軸 (AU)
  e DOUBLE PRECISION NOT NULL,      -- 離心率
  i DOUBLE PRECISION NOT NULL,      -- 軌道傾角 (degrees)
  om DOUBLE PRECISION NOT NULL,     -- 升交點經度 Ω (degrees)
  w DOUBLE PRECISION NOT NULL,      -- 近日點引數 ω (degrees)
  ma DOUBLE PRECISION NOT NULL,     -- 平近點角 M₀ (degrees)
  -- epoch 與週期
  epoch_jd DOUBLE PRECISION NOT NULL, -- 元素曆元 (Julian Date)
  period_days DOUBLE PRECISION,       -- 軌道週期 (天)，可由 a 計算

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 按 class 索引，前端依類別載入
CREATE INDEX IF NOT EXISTS idx_small_bodies_class ON small_bodies (class);

-- RLS：anon 只能 SELECT
ALTER TABLE small_bodies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_small_bodies"
  ON small_bodies FOR SELECT
  TO anon
  USING (true);
