/**
 * 球面座標轉換：lat/lng/alt → Three.js 3D Cartesian
 *
 * 場景單位：Earth radius = 1.0
 * 座標系：Y-up（北極朝上）
 */

const DEG2RAD = Math.PI / 180;

/** 地球半徑 (km) */
export const EARTH_RADIUS_KM = 6371;

/**
 * 高度縮放：將 200-36,000 km 映射到視覺友善的球面半徑
 *
 *   LEO  400 km  → r ≈ 1.12
 *   MEO 20,000 km → r ≈ 1.75
 *   GEO 36,000 km → r ≈ 2.10
 */
export function altToRadius(altKm: number): number {
  if (altKm <= 0) return 1.0;
  const s = Math.sqrt(altKm);
  const minS = Math.sqrt(150);
  const maxS = Math.sqrt(40000);
  const t = Math.max(0, Math.min(1, (s - minS) / (maxS - minS)));
  return 1.0 + 0.08 + t * 1.2; // 1.08 .. 2.28
}

/**
 * 地理座標 → 3D Cartesian
 *
 * @param lat  緯度（度）
 * @param lng  經度（度）
 * @param altKm 高度（公里），會經過 altToRadius 縮放
 * @returns [x, y, z] 場景座標
 */
export function geoToCartesian(
  lat: number,
  lng: number,
  altKm: number,
): [number, number, number] {
  const r = altToRadius(altKm);
  const latRad = lat * DEG2RAD;
  const lngRad = lng * DEG2RAD;
  const x = r * Math.cos(latRad) * Math.cos(lngRad);
  const y = r * Math.sin(latRad);
  const z = -r * Math.cos(latRad) * Math.sin(lngRad); // 取負使 lng=0 朝向相機
  return [x, y, z];
}

/**
 * 地理座標 → 3D Cartesian（使用真實比例，不經過 log 縮放）
 * 用於地球表面點（alt=0）
 */
export function geoToCartesianSurface(
  lat: number,
  lng: number,
): [number, number, number] {
  const latRad = lat * DEG2RAD;
  const lngRad = lng * DEG2RAD;
  const x = Math.cos(latRad) * Math.cos(lngRad);
  const y = Math.sin(latRad);
  const z = -Math.cos(latRad) * Math.sin(lngRad);
  return [x, y, z];
}
