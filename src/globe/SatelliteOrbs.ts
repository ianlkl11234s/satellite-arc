/**
 * 衛星光點 — InstancedMesh 渲染
 *
 * 多層 instanced 渲染：core + glow layers
 * 每顆衛星一個光點，支援呼吸動畫。
 */

import * as THREE from "three";

const MAX_INSTANCES = 16384;

/** 軌道類型色碼 */
const ORBIT_TYPE_COLORS: Record<string, THREE.Color> = {
  Starlink: new THREE.Color(0.51, 0.83, 0.98), // 亮淺藍
  LEO: new THREE.Color(0.31, 0.76, 0.97),      // 淺藍
  MEO: new THREE.Color(0.67, 0.33, 0.83),      // 紫
  GEO: new THREE.Color(1.0, 0.72, 0.3),        // 橘
  HEO: new THREE.Color(0.94, 0.33, 0.31),      // 紅
};

const DEFAULT_COLOR = new THREE.Color(0.4, 0.7, 1.0);

interface SatelliteEntry {
  id: string;
  x: number;
  y: number;
  z: number;
  orbitType: string;
}

export class SatelliteOrbs {
  private core: THREE.InstancedMesh;
  private glow1: THREE.InstancedMesh;
  private glow2: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private phaseOffsets = new Float32Array(MAX_INSTANCES);

  private baseScale = 1.0;

  setScale(scale: number) {
    this.baseScale = scale;
  }

  setOpacity(opacity: number) {
    (this.core.material as THREE.MeshBasicMaterial).opacity = opacity;
    (this.glow1.material as THREE.MeshBasicMaterial).opacity = opacity * 0.4;
    (this.glow2.material as THREE.MeshBasicMaterial).opacity = opacity * 0.12;
  }

  setColors(colors: Record<string, string>) {
    // 預轉換為 Color 物件，避免每幀 new Color()
    this._colorCache.clear();
    for (const [key, hex] of Object.entries(colors)) {
      this._colorCache.set(key, new THREE.Color(hex));
    }
  }

  private _colorCache = new Map<string, THREE.Color>();
  private _lastHighlightColors: Map<string, string> | null = null;

  constructor(scene: THREE.Scene) {
    const sphereGeo = new THREE.SphereGeometry(1, 8, 8);

    // Core (white, small)
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    this.core = new THREE.InstancedMesh(sphereGeo, coreMat, MAX_INSTANCES);
    this.core.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.core.count = 0;
    this.core.frustumCulled = false;
    scene.add(this.core);

    // Glow 1 (colored, medium)
    const glow1Mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.glow1 = new THREE.InstancedMesh(sphereGeo, glow1Mat, MAX_INSTANCES);
    this.glow1.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.glow1.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_INSTANCES * 3), 3,
    );
    this.glow1.count = 0;
    this.glow1.frustumCulled = false;
    scene.add(this.glow1);

    // Glow 2 (colored, large, faint)
    const glow2Mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.glow2 = new THREE.InstancedMesh(sphereGeo, glow2Mat, MAX_INSTANCES);
    this.glow2.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.glow2.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_INSTANCES * 3), 3,
    );
    this.glow2.count = 0;
    this.glow2.frustumCulled = false;
    scene.add(this.glow2);

    // 隨機相位偏移（呼吸動畫）
    for (let i = 0; i < MAX_INSTANCES; i++) {
      this.phaseOffsets[i] = Math.random() * Math.PI * 2;
    }
  }

  private _highlightColorCache = new Map<string, THREE.Color>();

  update(entries: SatelliteEntry[], time: number, highlightedIds?: Set<string> | null, highlightColors?: Map<string, string> | null) {
    const count = Math.min(entries.length, MAX_INSTANCES);

    // 預轉換 highlight 顏色
    if (highlightColors && highlightColors !== this._lastHighlightColors) {
      this._highlightColorCache.clear();
      for (const [id, hex] of highlightColors) {
        this._highlightColorCache.set(id, new THREE.Color(hex));
      }
      this._lastHighlightColors = highlightColors;
    }

    for (let i = 0; i < count; i++) {
      const { id, x, y, z, orbitType } = entries[i]!;
      const phase = this.phaseOffsets[i]!;
      const isHighlighted = highlightedIds?.has(id) ?? false;

      // 高亮衛星：更大的脈動 + 更快頻率
      const pulse = isHighlighted
        ? 1.4 + Math.sin(time * 3.0 + phase) * 0.4
        : 1.0 + Math.sin(time * 1.5 + phase) * 0.15;

      // 高亮衛星用變軌類型色，否則用原色
      const highlightColor = this._highlightColorCache.get(id);
      const color = highlightColor ?? this._colorCache.get(orbitType) ?? ORBIT_TYPE_COLORS[orbitType] ?? DEFAULT_COLOR;

      // Core
      const coreScale = 0.004 * pulse * this.baseScale;
      this.dummy.position.set(x, y, z);
      this.dummy.scale.setScalar(coreScale);
      this.dummy.updateMatrix();
      this.core.setMatrixAt(i, this.dummy.matrix);

      // Glow 1
      this.dummy.scale.setScalar(coreScale * (isHighlighted ? 3.5 : 2.5));
      this.dummy.updateMatrix();
      this.glow1.setMatrixAt(i, this.dummy.matrix);
      this.glow1.instanceColor!.setXYZ(i, color.r, color.g, color.b);

      // Glow 2
      this.dummy.scale.setScalar(coreScale * (isHighlighted ? 7 : 5));
      this.dummy.updateMatrix();
      this.glow2.setMatrixAt(i, this.dummy.matrix);
      this.glow2.instanceColor!.setXYZ(i, color.r, color.g, color.b);
    }

    this.core.count = count;
    this.glow1.count = count;
    this.glow2.count = count;

    this.core.instanceMatrix.needsUpdate = true;
    this.glow1.instanceMatrix.needsUpdate = true;
    this.glow1.instanceColor!.needsUpdate = true;
    this.glow2.instanceMatrix.needsUpdate = true;
    this.glow2.instanceColor!.needsUpdate = true;
  }
}
