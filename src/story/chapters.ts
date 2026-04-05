/**
 * 故事章節定義
 *
 * 每個章節控制：標題、描述、地球相機位置、衛星篩選、軌道顯示。
 * 章節資料會在 StoryMode 中依滾動位置逐步展示。
 */

export interface StoryChapter {
  id: string;
  title: string;
  subtitle?: string;
  body: string;
  /** 相機目標 [azimuth°, polar°, distance] */
  camera: [number, number, number];
  /** 只顯示這些星座（null = 全部） */
  constellations?: string[] | null;
  /** 只顯示這些 category */
  categories?: string[];
  /** 顯示的變軌類型篩選（null = 不顯示變軌衛星） */
  maneuverFilter?: string | null;
  /** 是否顯示群體軌道 */
  showOrbits?: boolean;
  /** 模擬速度 */
  speed?: number;
  /** 強調色 */
  accentColor?: string;
}

/** 2026-04-04 Starlink 動態故事 */
export const STARLINK_STORY_0404: StoryChapter[] = [
  {
    id: "intro",
    title: "Starlink 本週做了什麼？",
    subtitle: "2026.03.28 — 04.03 衛星軌道變化分析",
    body: "過去 7 天，我們追蹤了 15,757 顆衛星的軌道參數變化。其中 Starlink 星座佔了所有變軌事件的 75%。讓我們來看看 SpaceX 正在做什麼。",
    camera: [-30, 30, 5.5],
    categories: ["starlink"],
    speed: 60,
    accentColor: "#5B9CF6",
  },
  {
    id: "shell-53",
    title: "53° 主力星座：大規模軌道面調整",
    subtitle: "121 顆衛星正在重新排列",
    body: "Starlink 的 53° 傾角 shell 是商業服務的主力，覆蓋台灣、日本、韓國、歐洲、美國等中緯度地區。本週有 121 顆衛星進行了軌道面調整，SpaceX 正在優化這個區域的覆蓋密度。這意味著這些地區的網速和可用性可能即將提升。",
    camera: [120, 35, 4.0],
    constellations: ["Starlink"],
    maneuverFilter: "PLANE_CHANGE",
    showOrbits: true,
    speed: 60,
    accentColor: "#ce93d8",
  },
  {
    id: "coordinated-ascent",
    title: "協調爬升：新衛星正在就位",
    subtitle: "37xxx 系列同步升軌中",
    body: "10+ 顆最新發射的 STARLINK-37xxx 系列衛星正在從部署軌道（約 300km）協調爬升到工作軌道（約 550km）。它們以幾乎相同的速率同步升軌——每顆衛星的週期都增加了約 0.05 分鐘。這是每次 Falcon 9 發射後的標準部署流程。",
    camera: [0, 75, 4.5],
    constellations: ["Starlink"],
    maneuverFilter: "ALTITUDE_CHANGE",
    showOrbits: true,
    speed: 300,
    accentColor: "#ff9800",
  },
  {
    id: "deorbit",
    title: "受控降軌：老兵退役",
    subtitle: "早期衛星正在離開軌道",
    body: "STARLINK-1971、3149 等早期編號的衛星正在大幅降低軌道，週期減少 0.4-0.8 分鐘。這是受控脫軌除役——SpaceX 會讓老舊衛星逐步降低高度，最終再入大氣層燒毀。值得注意的是 STARLINK-11687 標記為 [DTC]（Direct-To-Cell），這是手機直連版本的早期測試機。",
    camera: [-90, -20, 4.0],
    constellations: ["Starlink"],
    maneuverFilter: "ALTITUDE_CHANGE",
    speed: 60,
    accentColor: "#ef5350",
  },
  {
    id: "beidou",
    title: "番外：北斗異常機動",
    subtitle: "BeiDou-3 G4 週期驟降 4.81 分鐘",
    body: "本週最大的單一機動不是 Starlink，而是中國的北斗三號 G4 衛星。它的軌道週期在一次觀測中減少了 4.81 分鐘，相當於約 68 公里的高度下降。對 GEO 衛星而言，正常站位保持的變化僅 0.01-0.1 分鐘。這可能是 GEO 經度遷移、碰撞規避、或系統異常處置。",
    camera: [105, 5, 5.0],
    constellations: ["BeiDou"],
    categories: ["navigation"],
    speed: 10,
    accentColor: "#ff9800",
  },
  {
    id: "summary",
    title: "總結",
    subtitle: "持續追蹤中",
    body: "Starlink 正在同時管理 5 個軌道殼層的數百顆衛星：新批次爬升、主力星座優化、老舊衛星除役。這就是太空中最大的星座管理工程。我們會持續追蹤這些變化。\n\n資料來源：CelesTrak TLE · 分析：Satellite Arc",
    camera: [-30, 30, 6.0],
    speed: 60,
    accentColor: "#5B9CF6",
  },
];
