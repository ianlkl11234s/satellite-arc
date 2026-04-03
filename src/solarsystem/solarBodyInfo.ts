/**
 * 太陽系天體資訊資料庫
 */

export interface SolarBodyInfo {
  name: string;
  type: "star" | "planet" | "dwarf_planet" | "comet" | "moon";
  label: string;
  zhName: string;
  desc: string;
  /** 真實半徑 (km) */
  radiusKm?: number;
  /** 距太陽距離 (AU) — 半長軸 */
  distanceAU?: number;
  /** 軌道週期描述 */
  orbitalPeriod?: string;
  /** 已知衛星數 */
  moons?: number;
  /** 表面溫度 */
  temperature?: string;
  /** 大氣成分 */
  atmosphere?: string;
  /** 特殊備註 */
  note?: string;
}

const BODY_INFO: Record<string, SolarBodyInfo> = {
  sun: {
    name: "sun", type: "star", label: "Sun", zhName: "太陽",
    desc: "太陽系中心恆星",
    radiusKm: 696340, temperature: "5,778 K (表面)",
    note: "佔太陽系總質量的 99.86%",
  },
  mercury: {
    name: "mercury", type: "planet", label: "Mercury", zhName: "水星",
    desc: "最靠近太陽的行星",
    radiusKm: 2440, distanceAU: 0.387, orbitalPeriod: "88 天",
    moons: 0, temperature: "-173°C ~ 427°C",
    note: "太陽系最小的行星，表面佈滿隕石坑",
  },
  venus: {
    name: "venus", type: "planet", label: "Venus", zhName: "金星",
    desc: "地球的「姊妹星」",
    radiusKm: 6052, distanceAU: 0.723, orbitalPeriod: "225 天",
    moons: 0, temperature: "462°C (表面)", atmosphere: "CO₂ 96.5%",
    note: "太陽系最熱的行星，大氣壓力是地球的 90 倍",
  },
  earth: {
    name: "earth", type: "planet", label: "Earth", zhName: "地球",
    desc: "我們的家園",
    radiusKm: 6371, distanceAU: 1.0, orbitalPeriod: "365.25 天",
    moons: 1, temperature: "15°C (平均)", atmosphere: "N₂ 78%, O₂ 21%",
    note: "已知唯一有生命的行星",
  },
  mars: {
    name: "mars", type: "planet", label: "Mars", zhName: "火星",
    desc: "紅色行星",
    radiusKm: 3390, distanceAU: 1.524, orbitalPeriod: "687 天",
    moons: 2, temperature: "-60°C (平均)", atmosphere: "CO₂ 95%",
    note: "Olympus Mons 是太陽系最高的火山（21.9 km）",
  },
  jupiter: {
    name: "jupiter", type: "planet", label: "Jupiter", zhName: "木星",
    desc: "太陽系最大的行星",
    radiusKm: 69911, distanceAU: 5.203, orbitalPeriod: "11.86 年",
    moons: 95, temperature: "-110°C (雲頂)", atmosphere: "H₂ 89%, He 10%",
    note: "大紅斑是持續數百年的超級風暴",
  },
  saturn: {
    name: "saturn", type: "planet", label: "Saturn", zhName: "土星",
    desc: "擁有壯觀環系統的行星",
    radiusKm: 58232, distanceAU: 9.537, orbitalPeriod: "29.46 年",
    moons: 146, temperature: "-140°C (雲頂)", atmosphere: "H₂ 96%, He 3%",
    note: "環的寬度達 28 萬公里，但厚度不到 1 公里",
  },
  uranus: {
    name: "uranus", type: "planet", label: "Uranus", zhName: "天王星",
    desc: "「側躺」旋轉的冰巨星",
    radiusKm: 25362, distanceAU: 19.191, orbitalPeriod: "84 年",
    moons: 28, temperature: "-224°C", atmosphere: "H₂ 83%, He 15%, CH₄ 2%",
    note: "自轉軸傾斜 97.8°，幾乎是側躺著繞太陽",
  },
  neptune: {
    name: "neptune", type: "planet", label: "Neptune", zhName: "海王星",
    desc: "太陽系最遠的行星",
    radiusKm: 24622, distanceAU: 30.069, orbitalPeriod: "164.8 年",
    moons: 16, temperature: "-218°C", atmosphere: "H₂ 80%, He 19%, CH₄ 1.5%",
    note: "風速可達 2,100 km/h，太陽系最強",
  },
  moon: {
    name: "moon", type: "moon", label: "Moon", zhName: "月球",
    desc: "地球唯一的天然衛星",
    radiusKm: 1737, distanceAU: 0.00257, orbitalPeriod: "27.3 天",
    temperature: "-173°C ~ 127°C",
    note: "1969 年 Apollo 11 首次載人登月",
  },
  pluto: {
    name: "pluto", type: "dwarf_planet", label: "Pluto", zhName: "冥王星",
    desc: "最著名的矮行星",
    radiusKm: 1188, distanceAU: 39.6, orbitalPeriod: "248 年",
    moons: 5, temperature: "-230°C",
    note: "2006 年被重新分類為矮行星，New Horizons 2015 年飛掠",
  },
  eris: {
    name: "eris", type: "dwarf_planet", label: "Eris", zhName: "鬩神星",
    desc: "離散盤中最大的已知天體",
    radiusKm: 1163, distanceAU: 68, orbitalPeriod: "559 年",
    moons: 1, temperature: "-243°C",
    note: "發現 Eris 促成了矮行星分類的建立",
  },
  halley: {
    name: "halley", type: "comet", label: "1P/Halley", zhName: "哈雷彗星",
    desc: "最著名的週期彗星",
    distanceAU: 17.9, orbitalPeriod: "75.3 年",
    note: "下次回歸約 2061 年，最後一次是 1986 年",
  },
  encke: {
    name: "encke", type: "comet", label: "2P/Encke", zhName: "恩克彗星",
    desc: "週期最短的已命名彗星",
    distanceAU: 2.22, orbitalPeriod: "3.3 年",
    note: "金牛座流星雨的母體",
  },
  pons_brooks: {
    name: "pons_brooks", type: "comet", label: "12P/Pons-Brooks", zhName: "龐斯-布魯克斯彗星",
    desc: "「惡魔彗星」",
    distanceAU: 17.2, orbitalPeriod: "71.2 年",
    note: "2024 年回歸時肉眼可見，外觀像有角的惡魔",
  },
  churyumov: {
    name: "churyumov", type: "comet", label: "67P/C-G", zhName: "丘留莫夫-格拉西緬科彗星",
    desc: "Rosetta 任務的目標彗星",
    distanceAU: 3.46, orbitalPeriod: "6.4 年",
    note: "2014 年 Philae 探測器首次在彗星表面軟著陸",
  },
  wirtanen: {
    name: "wirtanen", type: "comet", label: "46P/Wirtanen", zhName: "維爾塔寧彗星",
    desc: "木星族短週期彗星",
    distanceAU: 3.09, orbitalPeriod: "5.4 年",
    note: "2018 年近距離通過地球（0.078 AU），肉眼可見",
  },
};

export function getSolarBodyInfo(name: string): SolarBodyInfo | null {
  return BODY_INFO[name] ?? null;
}

const TYPE_LABELS: Record<string, string> = {
  star: "恆星", planet: "行星", dwarf_planet: "矮行星", comet: "彗星", moon: "衛星",
};

export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}
