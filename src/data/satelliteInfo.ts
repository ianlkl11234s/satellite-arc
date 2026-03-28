/**
 * 衛星中文名稱 / 俗名 / 描述對照表
 *
 * 用衛星名稱的 prefix 匹配，提供更友善的顯示資訊。
 * 可依需求持續擴充。
 */

export interface SatelliteDisplayInfo {
  /** 中文俗名 */
  zhName: string;
  /** 簡短描述 */
  desc: string;
  /** 所屬國家/組織 */
  country: string;
  /** 用途分類 */
  purpose: string;
}

/** 依衛星名稱 prefix 匹配（大寫比較） */
const PREFIX_MAP: Array<{
  prefix: string;
  info: SatelliteDisplayInfo;
}> = [
  // 台灣
  { prefix: "FORMOSAT", info: { zhName: "福爾摩沙衛星", desc: "台灣遙測/科學衛星", country: "台灣", purpose: "地球觀測" } },

  // 中國 — 導航
  { prefix: "BEIDOU", info: { zhName: "北斗", desc: "中國衛星導航系統", country: "中國", purpose: "導航定位" } },

  // 中國 — 太空站
  { prefix: "CSS (TIANHE)", info: { zhName: "天和核心艙", desc: "中國太空站核心", country: "中國", purpose: "太空站" } },
  { prefix: "CSS (WENTIAN)", info: { zhName: "問天實驗艙", desc: "中國太空站實驗艙", country: "中國", purpose: "太空站" } },
  { prefix: "CSS (MENGTIAN)", info: { zhName: "夢天實驗艙", desc: "中國太空站實驗艙", country: "中國", purpose: "太空站" } },

  // 中國 — 其他
  { prefix: "TIANWEN", info: { zhName: "天問", desc: "火星探測", country: "中國", purpose: "科學探測" } },
  { prefix: "FENGYUN", info: { zhName: "風雲", desc: "氣象衛星系列", country: "中國", purpose: "氣象觀測" } },
  { prefix: "YAOGAN", info: { zhName: "遙感", desc: "遙測衛星", country: "中國", purpose: "地球觀測" } },
  { prefix: "QIANFAN", info: { zhName: "千帆", desc: "寬頻通訊星座", country: "中國", purpose: "通訊" } },
  { prefix: "SHIYAN", info: { zhName: "實驗衛星", desc: "技術驗證衛星", country: "中國", purpose: "技術展示" } },

  // 美國 — 導航
  { prefix: "GPS", info: { zhName: "GPS 全球定位系統", desc: "美國衛星導航系統", country: "美國", purpose: "導航定位" } },
  { prefix: "NAVSTAR", info: { zhName: "GPS 導航星", desc: "GPS 衛星別名", country: "美國", purpose: "導航定位" } },

  // 美國 — 太空站
  { prefix: "ISS", info: { zhName: "國際太空站", desc: "多國合作的載人太空站", country: "多國", purpose: "太空站" } },

  // 美國 — 通訊星座
  { prefix: "STARLINK", info: { zhName: "星鏈", desc: "SpaceX 低軌寬頻網路", country: "美國", purpose: "通訊" } },
  { prefix: "IRIDIUM", info: { zhName: "銥衛星", desc: "全球衛星電話/IoT", country: "美國", purpose: "通訊" } },
  { prefix: "GLOBALSTAR", info: { zhName: "全球星", desc: "衛星電話/IoT 通訊", country: "美國", purpose: "通訊" } },
  { prefix: "ORBCOMM", info: { zhName: "ORBCOMM", desc: "物聯網通訊衛星", country: "美國", purpose: "通訊" } },

  // 美國 — 氣象
  { prefix: "GOES", info: { zhName: "GOES 氣象衛星", desc: "美國地球同步氣象衛星", country: "美國", purpose: "氣象觀測" } },
  { prefix: "NOAA", info: { zhName: "NOAA 氣象衛星", desc: "美國極軌氣象衛星", country: "美國", purpose: "氣象觀測" } },
  { prefix: "SUOMI NPP", info: { zhName: "Suomi NPP", desc: "美國氣象/環境觀測", country: "美國", purpose: "氣象觀測" } },
  { prefix: "JPSS", info: { zhName: "聯合極軌衛星", desc: "下一代極軌氣象衛星", country: "美國", purpose: "氣象觀測" } },

  // 美國 — 觀測
  { prefix: "LANDSAT", info: { zhName: "陸地衛星", desc: "地球遙測衛星系列", country: "美國", purpose: "地球觀測" } },
  { prefix: "TERRA", info: { zhName: "Terra 地球觀測", desc: "NASA 地球科學衛星", country: "美國", purpose: "地球觀測" } },
  { prefix: "AQUA", info: { zhName: "Aqua 水衛星", desc: "NASA 水循環觀測", country: "美國", purpose: "地球觀測" } },
  { prefix: "AURA", info: { zhName: "Aura 大氣衛星", desc: "NASA 大氣化學觀測", country: "美國", purpose: "地球觀測" } },

  // 美國 — 太空望遠鏡
  { prefix: "HST", info: { zhName: "哈伯太空望遠鏡", desc: "光學太空望遠鏡", country: "美國", purpose: "天文觀測" } },

  // 歐洲 — 導航
  { prefix: "GALILEO", info: { zhName: "伽利略", desc: "歐盟衛星導航系統", country: "歐盟", purpose: "導航定位" } },

  // 歐洲 — 觀測
  { prefix: "SENTINEL", info: { zhName: "哨兵衛星", desc: "歐洲哥白尼計畫", country: "歐盟", purpose: "地球觀測" } },
  { prefix: "METEOSAT", info: { zhName: "氣象衛星", desc: "歐洲氣象衛星", country: "歐洲", purpose: "氣象觀測" } },
  { prefix: "METOP", info: { zhName: "氣象作業衛星", desc: "歐洲極軌氣象衛星", country: "歐洲", purpose: "氣象觀測" } },

  // 英國
  { prefix: "ONEWEB", info: { zhName: "OneWeb", desc: "低軌寬頻通訊星座", country: "英國", purpose: "通訊" } },

  // 俄羅斯
  { prefix: "GLONASS", info: { zhName: "格洛納斯", desc: "俄國衛星導航系統", country: "俄羅斯", purpose: "導航定位" } },
  { prefix: "COSMOS", info: { zhName: "宇宙號", desc: "俄國軍/民用衛星", country: "俄羅斯", purpose: "多用途" } },
  { prefix: "METEOR", info: { zhName: "流星號", desc: "俄國氣象衛星", country: "俄羅斯", purpose: "氣象觀測" } },

  // 日本
  { prefix: "QZS", info: { zhName: "準天頂衛星", desc: "日本區域導航增強", country: "日本", purpose: "導航定位" } },
  { prefix: "HIMAWARI", info: { zhName: "向日葵氣象衛星", desc: "日本地球同步氣象衛星", country: "日本", purpose: "氣象觀測" } },
  { prefix: "ALOS", info: { zhName: "大地號", desc: "日本地球觀測衛星", country: "日本", purpose: "地球觀測" } },

  // 印度
  { prefix: "IRNSS", info: { zhName: "印度區域導航", desc: "NavIC 區域導航系統", country: "印度", purpose: "導航定位" } },

  // 商業觀測
  { prefix: "PLANET", info: { zhName: "Planet Labs", desc: "商業地球觀測星座", country: "美國", purpose: "地球觀測" } },
  { prefix: "FLOCK", info: { zhName: "Planet Flock", desc: "3U CubeSat 觀測星座", country: "美國", purpose: "地球觀測" } },
  { prefix: "SPIRE", info: { zhName: "Spire Global", desc: "氣象/AIS/GNSS 星座", country: "美國", purpose: "氣象/AIS" } },
  { prefix: "LEMUR", info: { zhName: "Spire Lemur", desc: "Spire CubeSat 星座", country: "美國", purpose: "氣象/AIS" } },

  // SES O3B
  { prefix: "O3B", info: { zhName: "O3b mPOWER", desc: "SES 中軌道寬頻通訊", country: "盧森堡", purpose: "通訊" } },

  // 通訊
  { prefix: "INTELSAT", info: { zhName: "國際通訊衛星", desc: "全球通訊衛星營運商", country: "多國", purpose: "通訊" } },
  { prefix: "SES", info: { zhName: "SES 通訊衛星", desc: "歐洲通訊衛星營運商", country: "盧森堡", purpose: "通訊" } },
  { prefix: "EUTELSAT", info: { zhName: "歐洲通訊衛星", desc: "歐洲通訊衛星營運商", country: "法國", purpose: "通訊" } },
  { prefix: "TELESAT", info: { zhName: "加拿大通訊衛星", desc: "加拿大衛星通訊", country: "加拿大", purpose: "通訊" } },
];

/**
 * 查詢衛星的中文顯示資訊
 */
export function getSatelliteInfo(name: string): SatelliteDisplayInfo | null {
  const upper = (name || "").toUpperCase();
  for (const { prefix, info } of PREFIX_MAP) {
    if (upper.startsWith(prefix) || upper.includes(prefix)) {
      return info;
    }
  }
  return null;
}

/** 軌道類型中英對照 */
export const ORBIT_TYPE_LABELS: Record<string, { zh: string; desc: string }> = {
  LEO: { zh: "低軌道", desc: "160-2,000 km，繞地球約 90 分鐘" },
  MEO: { zh: "中軌道", desc: "2,000-35,786 km，導航衛星" },
  GEO: { zh: "同步軌道", desc: "35,786 km，與地球同步旋轉" },
  HEO: { zh: "高橢圓軌道", desc: "高離心率橢圓軌道" },
};
