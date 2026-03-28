/**
 * 衛星動態尾巴 — 每幀更新
 *
 * 每顆衛星渲染最近 N 分鐘的軌跡，尾端漸淡。
 * 用單一 LineSegments geometry 批次渲染所有衛星的尾巴。
 */

import * as THREE from "three";

/** 軌道類型色碼 */
const TRAIL_COLORS: Record<string, [number, number, number]> = {
  Starlink: [0.51, 0.83, 0.98],
  LEO: [0.31, 0.76, 0.97],
  MEO: [0.67, 0.33, 0.83],
  GEO: [1.0, 0.72, 0.3],
  HEO: [0.94, 0.33, 0.31],
};

const DEFAULT_C: [number, number, number] = [0.4, 0.7, 1.0];

export interface TrailEntry {
  /** 軌跡點（從最新到最舊）: [x, y, z][] */
  points: Array<[number, number, number]>;
  orbitType: string;
}

export class TrailLines {
  private mesh: THREE.LineSegments;
  private positions: Float32Array;
  private colors: Float32Array;
  private maxVerts: number;

  constructor(scene: THREE.Scene, maxSatellites: number, trailPoints: number) {
    // 每顆衛星 (trailPoints - 1) 條線段，每條 2 頂點
    this.maxVerts = maxSatellites * (trailPoints - 1) * 2;
    this.positions = new Float32Array(this.maxVerts * 3);
    this.colors = new Float32Array(this.maxVerts * 3);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.mesh = new THREE.LineSegments(geo, mat);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  setOpacity(opacity: number) {
    (this.mesh.material as THREE.LineBasicMaterial).opacity = opacity;
  }

  setVisible(visible: boolean) {
    this.mesh.visible = visible;
  }

  /**
   * 更新所有衛星的尾巴
   */
  update(trails: TrailEntry[]) {
    let offset = 0;

    for (const trail of trails) {
      if (trail.points.length < 2) continue;
      if (offset >= this.maxVerts) break;

      const [cr, cg, cb] = TRAIL_COLORS[trail.orbitType] ?? DEFAULT_C;
      const numSegs = trail.points.length - 1;

      for (let i = 0; i < numSegs; i++) {
        if (offset + 2 > this.maxVerts) break;

        const p0 = trail.points[i]!;
        const p1 = trail.points[i + 1]!;

        // 越靠近尾端（index 越大）越淡
        const alpha = 1.0 - (i / numSegs);
        const fadeR = cr * alpha;
        const fadeG = cg * alpha;
        const fadeB = cb * alpha;

        this.positions[offset * 3] = p0[0];
        this.positions[offset * 3 + 1] = p0[1];
        this.positions[offset * 3 + 2] = p0[2];
        this.colors[offset * 3] = fadeR;
        this.colors[offset * 3 + 1] = fadeG;
        this.colors[offset * 3 + 2] = fadeB;
        offset++;

        this.positions[offset * 3] = p1[0];
        this.positions[offset * 3 + 1] = p1[1];
        this.positions[offset * 3 + 2] = p1[2];
        this.colors[offset * 3] = fadeR;
        this.colors[offset * 3 + 1] = fadeG;
        this.colors[offset * 3 + 2] = fadeB;
        offset++;
      }
    }

    // 清零剩餘
    for (let i = offset * 3; i < Math.min(offset * 3 + 300, this.positions.length); i++) {
      this.positions[i] = 0;
      this.colors[i] = 0;
    }

    const geo = this.mesh.geometry;
    geo.setDrawRange(0, offset);
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }
}
