/**
 * 對比軌道渲染 — 變軌前後軌跡疊加
 *
 * 獨立於 OrbitLines，用兩組 LineSegments 分別渲染：
 * - before（舊軌道）：紅色半透明
 * - after（新軌道）：青色明亮
 * 支援同時顯示多顆衛星的對比軌道。
 */

import * as THREE from "three";
import { geoToCartesian } from "./coordinates";

export interface ComparisonOrbitPair {
  /** before 可為 null（只顯示 after，用於群體軌道展示） */
  before: [number, number, number, number][] | null;
  after: [number, number, number, number][];
  /** 自訂顏色（hex），不提供則用預設 */
  color?: string;
}

const BEFORE_COLOR: [number, number, number] = [1.0, 0.42, 0.42]; // #FF6B6B
const AFTER_COLOR: [number, number, number] = [0.31, 0.76, 0.97]; // #4FC3F7

export class ComparisonOrbits {
  private meshBefore: THREE.LineSegments;
  private meshAfter: THREE.LineSegments;

  constructor(scene: THREE.Scene) {
    const geo1 = new THREE.BufferGeometry();
    const geo2 = new THREE.BufferGeometry();

    // Before: 半透明紅色虛線感
    const matBefore = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // After: 明亮青色
    const matAfter = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.meshBefore = new THREE.LineSegments(geo1, matBefore);
    this.meshAfter = new THREE.LineSegments(geo2, matAfter);

    this.meshBefore.frustumCulled = false;
    this.meshAfter.frustumCulled = false;
    this.meshBefore.visible = false;
    this.meshAfter.visible = false;

    scene.add(this.meshBefore);
    scene.add(this.meshAfter);
  }

  private buildGeometry(
    mesh: THREE.LineSegments,
    paths: { path: [number, number, number, number][]; color: [number, number, number] }[],
  ) {
    let totalSegments = 0;
    for (const p of paths) {
      if (p.path.length >= 2) totalSegments += p.path.length - 1;
    }

    if (totalSegments === 0) {
      mesh.geometry.setDrawRange(0, 0);
      return;
    }

    const totalVerts = totalSegments * 2;
    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);
    let offset = 0;

    for (const { path, color: [cr, cg, cb] } of paths) {
      if (path.length < 2) continue;

      for (let i = 0; i < path.length - 1; i++) {
        const p0 = path[i]!;
        const p1 = path[i + 1]!;

        const [x0, y0, z0] = geoToCartesian(p0[0], p0[1], p0[2] / 1000);
        const [x1, y1, z1] = geoToCartesian(p1[0], p1[1], p1[2] / 1000);

        // 頭尾漸淡
        const t = i / (path.length - 1);
        const alpha = Math.sin(t * Math.PI);

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

    const geo = mesh.geometry;
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setDrawRange(0, totalVerts);
    geo.computeBoundingSphere();
  }

  private parseColor(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  }

  update(pairs: ComparisonOrbitPair[]) {
    const beforePaths: { path: [number, number, number, number][]; color: [number, number, number] }[] = [];
    const afterPaths: { path: [number, number, number, number][]; color: [number, number, number] }[] = [];

    for (const pair of pairs) {
      const afterColor = pair.color ? this.parseColor(pair.color) : AFTER_COLOR;

      if (pair.before && pair.before.length >= 2) {
        beforePaths.push({ path: pair.before, color: BEFORE_COLOR });
      }
      if (pair.after.length >= 2) {
        afterPaths.push({ path: pair.after, color: afterColor });
      }
    }

    this.buildGeometry(this.meshBefore, beforePaths);
    this.buildGeometry(this.meshAfter, afterPaths);

    this.meshBefore.visible = beforePaths.length > 0;
    this.meshAfter.visible = afterPaths.length > 0;
  }

  clear() {
    this.meshBefore.geometry.setDrawRange(0, 0);
    this.meshAfter.geometry.setDrawRange(0, 0);
    this.meshBefore.visible = false;
    this.meshAfter.visible = false;
  }

  setVisible(visible: boolean) {
    if (this.meshBefore.geometry.drawRange.count > 0) this.meshBefore.visible = visible;
    if (this.meshAfter.geometry.drawRange.count > 0) this.meshAfter.visible = visible;
  }
}
