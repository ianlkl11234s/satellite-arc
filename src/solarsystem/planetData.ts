/**
 * 太陽系行星靜態資料
 *
 * 軌道要素來自 J2000 Keplerian Elements（NASA JPL）
 * 視覺半徑經誇張處理，真實比例在畫面上看不到
 * 貼圖來源：Solar System Scope (CC BY 4.0)
 */

export interface PlanetDef {
  name: string;
  label: string;
  color: number;
  /** 誇張後的視覺半徑（scene units） */
  visualRadius: number;
  /** 貼圖路徑 */
  texture: string;
  /** 軌道半長軸 (AU) */
  a: number;
  /** 離心率 */
  e: number;
  /** 軌道傾角 (degrees, 相對黃道面) */
  i: number;
  /** 升交點經度 (degrees) */
  omega: number;
  /** 近日點引數 (degrees) */
  w: number;
  /** J2000 平近點角 (degrees) — epoch 2000-01-01 12:00 TT */
  M0: number;
  /** 軌道週期 (年) */
  period: number;
}

/** J2000 epoch: 2000-01-01T12:00:00 UTC (ms) */
export const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

/** 一年的毫秒數 */
export const YEAR_MS = 365.25 * 24 * 3600 * 1000;

export const PLANETS: PlanetDef[] = [
  {
    name: "mercury", label: "Mercury", color: 0xb5b5b5,
    visualRadius: 0.25, texture: "/textures/mercury.jpg",
    a: 0.387, e: 0.2056, i: 7.005,
    omega: 48.331, w: 29.124, M0: 174.796, period: 0.2408,
  },
  {
    name: "venus", label: "Venus", color: 0xe8cda0,
    visualRadius: 0.38, texture: "/textures/venus.jpg",
    a: 0.723, e: 0.0068, i: 3.395,
    omega: 76.680, w: 54.884, M0: 50.115, period: 0.6152,
  },
  {
    name: "earth", label: "Earth", color: 0x4da6ff,
    visualRadius: 0.4, texture: "/textures/earth-day.jpg",
    a: 1.000, e: 0.0167, i: 0.000,
    omega: -11.261, w: 114.208, M0: 357.517, period: 1.0000,
  },
  {
    name: "mars", label: "Mars", color: 0xe07050,
    visualRadius: 0.3, texture: "/textures/mars.jpg",
    a: 1.524, e: 0.0934, i: 1.850,
    omega: 49.558, w: 286.502, M0: 19.373, period: 1.8809,
  },
  {
    name: "jupiter", label: "Jupiter", color: 0xd4a574,
    visualRadius: 0.8, texture: "/textures/jupiter.jpg",
    a: 5.203, e: 0.0489, i: 1.303,
    omega: 100.464, w: 273.867, M0: 20.020, period: 11.862,
  },
  {
    name: "saturn", label: "Saturn", color: 0xead6a6,
    visualRadius: 0.65, texture: "/textures/saturn.jpg",
    a: 9.537, e: 0.0565, i: 2.489,
    omega: 113.666, w: 339.392, M0: 317.020, period: 29.457,
  },
  {
    name: "uranus", label: "Uranus", color: 0x72c4d0,
    visualRadius: 0.5, texture: "/textures/uranus.jpg",
    a: 19.191, e: 0.0463, i: 0.773,
    omega: 74.006, w: 96.998, M0: 142.238, period: 84.011,
  },
  {
    name: "neptune", label: "Neptune", color: 0x4466ee,
    visualRadius: 0.48, texture: "/textures/neptune.jpg",
    a: 30.069, e: 0.0095, i: 1.770,
    omega: 131.784, w: 276.336, M0: 256.228, period: 164.8,
  },
];

/** 月球軌道資料（相對地球） */
export const MOON = {
  name: "moon",
  label: "Moon",
  color: 0xcccccc,
  visualRadius: 0.12,
  texture: "/textures/moon.jpg",
  /** 平均距離 (km) */
  distanceKm: 384400,
  /** 軌道週期 (天) */
  periodDays: 27.322,
  /** 軌道傾角相對黃道 (degrees) */
  inclination: 5.145,
  /** J2000 起始平近點角 (degrees) */
  M0: 134.963,
  /** J2000 升交點經度 (degrees) */
  omega0: 125.044,
  /** 離心率 */
  e: 0.0549,
};

/** 彗星軌道資料 */
export interface CometDef {
  name: string;
  label: string;
  color: number;
  /** 軌道半長軸 (AU) */
  a: number;
  /** 離心率 */
  e: number;
  /** 軌道傾角 (degrees) */
  i: number;
  /** 升交點經度 (degrees) */
  omega: number;
  /** 近日點引數 (degrees) */
  w: number;
  /** 近日點通過時間 (Julian Date) */
  tp: number;
  /** 軌道週期 (天) */
  periodDays: number;
}

/** JD → ms since Unix epoch */
export function jdToMs(jd: number): number {
  return (jd - 2440587.5) * 86400000;
}

export const COMETS: CometDef[] = [
  {
    name: "halley", label: "1P/Halley", color: 0x88ccff,
    a: 17.9, e: 0.968, i: 162, omega: 59.1, w: 112,
    tp: 2446467.4, periodDays: 27700,
  },
  {
    name: "encke", label: "2P/Encke", color: 0xaaddaa,
    a: 2.22, e: 0.848, i: 11.4, omega: 334, w: 187,
    tp: 2459847.5, periodDays: 1210,
  },
  {
    name: "pons_brooks", label: "12P/Pons-Brooks", color: 0xddaaff,
    a: 17.2, e: 0.955, i: 74.2, omega: 256, w: 199,
    tp: 2460421.631, periodDays: 26000,
  },
  {
    name: "churyumov", label: "67P/C-G", color: 0xffccaa,
    a: 3.46, e: 0.641, i: 7.04, omega: 50.1, w: 12.8,
    tp: 2457305.5, periodDays: 2350,
  },
  {
    name: "wirtanen", label: "46P/Wirtanen", color: 0xaaffcc,
    a: 3.09, e: 0.659, i: 11.7, omega: 82.2, w: 356,
    tp: 2458465.5, periodDays: 1990,
  },
];

/** 矮行星（在 Kuiper Belt 區域標註） */
export interface DwarfPlanetDef {
  name: string;
  label: string;
  color: number;
  visualRadius: number;
  a: number;
  e: number;
  i: number;
  omega: number;
  w: number;
  M0: number;
  period: number;
}

export const DWARF_PLANETS: DwarfPlanetDef[] = [
  {
    name: "pluto", label: "Pluto", color: 0xccaa88,
    visualRadius: 0.15, a: 39.6, e: 0.252, i: 17.1,
    omega: 110.3, w: 113.8, M0: 14.53, period: 247.9,
  },
  {
    name: "eris", label: "Eris", color: 0xdddddd,
    visualRadius: 0.12, a: 68, e: 0.437, i: 43.9,
    omega: 35.9, w: 151.6, M0: 205.1, period: 559,
  },
];

/** 太陽視覺半徑 */
export const SUN_VISUAL_RADIUS = 1.5;
export const SUN_COLOR = 0xffdd44;
