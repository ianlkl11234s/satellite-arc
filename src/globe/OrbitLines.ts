/**
 * 軌道弧線 — 批次 LineSegments 渲染
 *
 * 將所有衛星的軌道路徑合併為一個 LineSegments geometry，
 * 每個路徑的座標已從 lat/lng/alt 轉為 3D Cartesian（自然沿球面彎曲）。
 */

import * as THREE from "three";
import { geoToCartesian } from "./coordinates";

/** 軌道類型色碼 */
const ORBIT_COLORS: Record<string, [number, number, number]> = {
  LEO: [0.31, 0.76, 0.97],
  MEO: [0.67, 0.33, 0.83],
  GEO: [1.0, 0.72, 0.3],
  HEO: [0.94, 0.33, 0.31],
};

const DEFAULT_C: [number, number, number] = [0.4, 0.7, 1.0];

interface OrbitData {
  /** path: [lat, lng, alt_m, unix_ts][] */
  path: [number, number, number, number][];
  orbitType: string;
}

export class OrbitLines {
  private mesh: THREE.LineSegments;
  private lastKey = "";

  constructor(scene: THREE.Scene) {
    const geo = new THREE.BufferGeometry();
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.mesh = new THREE.LineSegments(geo, mat);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  update(orbits: OrbitData[]) {
    // 簡單的 key 比較避免重複建構
    const key = `${orbits.length}`;
    if (key === this.lastKey) return;
    this.lastKey = key;

    // 計算總 segment 數
    let totalSegments = 0;
    for (const o of orbits) {
      if (o.path.length >= 2) totalSegments += o.path.length - 1;
    }

    if (totalSegments === 0) {
      this.mesh.geometry.setDrawRange(0, 0);
      return;
    }

    const totalVerts = totalSegments * 2;
    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);

    let offset = 0;

    for (const orbit of orbits) {
      if (orbit.path.length < 2) continue;

      const [cr, cg, cb] = ORBIT_COLORS[orbit.orbitType] ?? DEFAULT_C;

      for (let i = 0; i < orbit.path.length - 1; i++) {
        const p0 = orbit.path[i]!;
        const p1 = orbit.path[i + 1]!;

        // alt 是 meters，轉 km
        const [x0, y0, z0] = geoToCartesian(p0[0], p0[1], p0[2] / 1000);
        const [x1, y1, z1] = geoToCartesian(p1[0], p1[1], p1[2] / 1000);

        // 頭尾漸淡
        const t = i / (orbit.path.length - 1);
        const alpha = Math.sin(t * Math.PI); // 0 → 1 → 0

        positions[offset * 3] = x0;
        positions[offset * 3 + 1] = y0;
        positions[offset * 3 + 2] = z0;
        colors[offset * 3] = cr * alpha;
        colors[offset * 3 + 1] = cg * alpha;
        colors[offset * 3 + 2] = cb * alpha;
        offset++;

        positions[offset * 3] = x1;
        positions[offset * 3 + 1] = y1;
        positions[offset * 3 + 2] = z1;
        colors[offset * 3] = cr * alpha;
        colors[offset * 3 + 1] = cg * alpha;
        colors[offset * 3 + 2] = cb * alpha;
        offset++;
      }
    }

    const geo = this.mesh.geometry;
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setDrawRange(0, totalVerts);
    geo.computeBoundingSphere();
  }
}
