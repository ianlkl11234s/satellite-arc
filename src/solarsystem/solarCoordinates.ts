/**
 * 太陽系座標轉換 + Keplerian 軌道計算
 *
 * 座標系：Y-up（與地球模式一致）
 *   黃道面 = XZ 平面
 *   Y 軸 = 黃道法線（北黃極朝上）
 */

import type { PlanetDef, CometDef, DwarfPlanetDef } from "./planetData";
import { J2000_MS, YEAR_MS, MOON, jdToMs } from "./planetData";

const DEG2RAD = Math.PI / 180;
const TWO_PI = 2 * Math.PI;

/* ── 距離縮放 ──────────────────────────────── */

const AU_SCALE = 10;

/**
 * AU → scene 距離（sqrt 壓縮）
 *
 *   Mercury 0.39 AU → 6.2
 *   Earth   1.0  AU → 10.0
 *   Neptune 30   AU → 54.8
 */
export function auToScene(au: number): number {
  return Math.sqrt(au) * AU_SCALE;
}

/* ── Kepler 方程求解 ──────────────────────── */

/**
 * Newton-Raphson 求 eccentric anomaly E
 * @param M 平近點角 (rad)
 * @param e 離心率
 */
function solveKepler(M: number, e: number): number {
  let E = M;
  for (let i = 0; i < 10; i++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E;
}

/* ── 行星位置計算 ─────────────────────────── */

/**
 * 計算行星在指定時刻的日心黃道座標，轉為 scene 座標
 * @returns [x, y, z] scene units (Y-up, 黃道面=XZ)
 */
export function getPlanetPosition(
  planet: PlanetDef,
  dateMs: number,
): [number, number, number] {
  const { a, e, i, omega, w, M0, period } = planet;

  // 自 J2000 經過的年數
  const years = (dateMs - J2000_MS) / YEAR_MS;

  // 平近點角
  const n = TWO_PI / period; // rad/year
  let M = (M0 * DEG2RAD + n * years) % TWO_PI;
  if (M < 0) M += TWO_PI;

  // 解 Kepler 方程
  const E = solveKepler(M, e);

  // 軌道平面內座標
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const x_orb = a * (cosE - e);
  const y_orb = a * Math.sqrt(1 - e * e) * sinE;

  // 旋轉到黃道座標系
  const wRad = w * DEG2RAD;
  const omegaRad = omega * DEG2RAD;
  const iRad = i * DEG2RAD;

  const cosW = Math.cos(wRad);
  const sinW = Math.sin(wRad);
  const cosO = Math.cos(omegaRad);
  const sinO = Math.sin(omegaRad);
  const cosI = Math.cos(iRad);
  const sinI = Math.sin(iRad);

  // 3D rotation: Rz(-Ω) · Rx(-i) · Rz(-ω)
  const xEcl =
    (cosO * cosW - sinO * sinW * cosI) * x_orb +
    (-cosO * sinW - sinO * cosW * cosI) * y_orb;
  const yEcl =
    (sinO * cosW + cosO * sinW * cosI) * x_orb +
    (-sinO * sinW + cosO * cosW * cosI) * y_orb;
  const zEcl =
    (sinW * sinI) * x_orb +
    (cosW * sinI) * y_orb;

  // 黃道 → scene（黃道XY面 → scene XZ面，黃道Z → scene Y）
  const r = auToScene(Math.sqrt(xEcl * xEcl + yEcl * yEcl + zEcl * zEcl));
  const dist = Math.sqrt(xEcl * xEcl + yEcl * yEcl + zEcl * zEcl);
  const scale = r / (dist || 1);

  return [xEcl * scale, zEcl * scale, -yEcl * scale];
}

/**
 * 計算軌道上 N 個取樣點（用於繪製軌道路徑）
 */
export function getOrbitPoints(
  planet: PlanetDef,
  samples: number = 360,
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const periodMs = planet.period * YEAR_MS;

  // 以目前時間為基準，取樣一整圈
  const now = Date.now();
  for (let k = 0; k <= samples; k++) {
    const t = now + (k / samples) * periodMs;
    points.push(getPlanetPosition(planet, t));
  }
  return points;
}

/* ── 月球位置（相對地球） ────────────────── */

const DAY_MS = 24 * 3600 * 1000;

/**
 * 計算月球相對地球的偏移量（scene 座標）
 * @returns [dx, dy, dz] 加到地球位置上即為月球位置
 */
export function getMoonOffset(dateMs: number): [number, number, number] {
  const days = (dateMs - J2000_MS) / DAY_MS;

  // 平近點角
  const n = TWO_PI / MOON.periodDays;
  let M = (MOON.M0 * DEG2RAD + n * days) % TWO_PI;
  if (M < 0) M += TWO_PI;

  const E = solveKepler(M, MOON.e);

  // 軌道平面內
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const distAU = MOON.distanceKm / 149597870.7; // km → AU
  const x_orb = distAU * (cosE - MOON.e);
  const y_orb = distAU * Math.sqrt(1 - MOON.e * MOON.e) * sinE;

  // 月球軌道傾角（簡化：忽略升交點進動）
  const iRad = MOON.inclination * DEG2RAD;
  // 升交點進動：~18.6 年一圈
  const omegaRad = (MOON.omega0 - 360 * days / (18.6 * 365.25)) * DEG2RAD;

  const cosO = Math.cos(omegaRad);
  const sinO = Math.sin(omegaRad);
  const cosI = Math.cos(iRad);
  const sinI = Math.sin(iRad);

  const xEcl = cosO * x_orb - sinO * cosI * y_orb;
  const yEcl = sinO * x_orb + cosO * cosI * y_orb;
  const zEcl = sinI * y_orb;

  // 縮放到 scene 座標（月球離地球很近，用固定偏移量 ~1.5 scene units）
  const moonSceneDist = 1.5;
  const dist = Math.sqrt(xEcl * xEcl + yEcl * yEcl + zEcl * zEcl);
  const s = moonSceneDist / (dist || 1);

  return [xEcl * s, zEcl * s, -yEcl * s];
}

/* ── 彗星位置（使用近日點通過時間 tp） ──── */

/**
 * 計算彗星位置
 */
export function getCometPosition(
  comet: CometDef,
  dateMs: number,
): [number, number, number] {
  const { a, e, i, omega, w, tp, periodDays } = comet;
  const tpMs = jdToMs(tp);
  const days = (dateMs - tpMs) / DAY_MS;
  const n = TWO_PI / periodDays;
  let M = (n * days) % TWO_PI;
  if (M < 0) M += TWO_PI;

  const E = solveKepler(M, e);

  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const x_orb = a * (cosE - e);
  const y_orb = a * Math.sqrt(1 - e * e) * sinE;

  const wRad = w * DEG2RAD;
  const omegaRad = omega * DEG2RAD;
  const iRad = i * DEG2RAD;
  const cosW = Math.cos(wRad), sinW = Math.sin(wRad);
  const cosO = Math.cos(omegaRad), sinO = Math.sin(omegaRad);
  const cosI = Math.cos(iRad), sinI = Math.sin(iRad);

  const xEcl = (cosO * cosW - sinO * sinW * cosI) * x_orb + (-cosO * sinW - sinO * cosW * cosI) * y_orb;
  const yEcl = (sinO * cosW + cosO * sinW * cosI) * x_orb + (-sinO * sinW + cosO * cosW * cosI) * y_orb;
  const zEcl = (sinW * sinI) * x_orb + (cosW * sinI) * y_orb;

  const dist = Math.sqrt(xEcl * xEcl + yEcl * yEcl + zEcl * zEcl);
  const r = auToScene(dist);
  const scale = r / (dist || 1);
  return [xEcl * scale, zEcl * scale, -yEcl * scale];
}

/**
 * 彗星軌道取樣（只畫到合理範圍）
 */
export function getCometOrbitPoints(
  comet: CometDef,
  samples: number = 360,
): [number, number, number][] {
  const points: [number, number, number][] = [];
  const periodMs = comet.periodDays * DAY_MS;
  const now = Date.now();
  for (let k = 0; k <= samples; k++) {
    const t = now + (k / samples) * periodMs;
    const pos = getCometPosition(comet, t);
    // 限制繪製範圍（超過 Neptune 就截斷，避免極端橢圓佔滿畫面）
    const dist = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
    if (dist > 80) continue; // 大約 64 AU 處截斷
    points.push(pos);
  }
  return points;
}

/**
 * 矮行星位置（與行星相同的 Keplerian 計算）
 */
export function getDwarfPlanetPosition(
  dwarf: DwarfPlanetDef,
  dateMs: number,
): [number, number, number] {
  return getPlanetPosition(dwarf as PlanetDef, dateMs);
}
