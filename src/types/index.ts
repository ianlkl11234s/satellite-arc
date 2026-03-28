/** 單一軌跡點：[緯度, 經度, 高度(公尺), Unix timestamp] */
export type TrailPoint = [number, number, number, number];

/** 航班資料（衛星也用此格式，欄位語義不同） */
export interface Flight {
  fr24_id: string;
  callsign: string;
  registration: string;
  aircraft_type: string;
  origin_icao: string;
  origin_iata: string;
  dest_icao: string;
  dest_iata: string;
  dep_time: number;
  arr_time: number;
  status: string;
  trail_points: number;
  path: TrailPoint[];
}
