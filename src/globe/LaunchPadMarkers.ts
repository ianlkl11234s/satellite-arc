/**
 * 發射台地表標記 — InstancedMesh 渲染
 *
 * 在 3D 地球上標記全球發射場位置。
 * 即將發射的台站會有脈衝 glow 動畫。
 *
 * 顏色編碼：
 * - 紅色脈衝：距下次發射 < 24h
 * - 橘色脈衝：距下次發射 < 7d
 * - 灰色靜態：無近期發射
 */

import * as THREE from "three";
import { geoToCartesianSurface } from "./coordinates";
import type { LaunchPad, Launch } from "../data/launchLoader";

const MAX_PADS = 512;

// 標記顏色
const COLOR_HOT = new THREE.Color(1.0, 0.25, 0.2);    // < 24h — 紅
const COLOR_WARM = new THREE.Color(1.0, 0.6, 0.15);    // < 7d — 橘
const COLOR_IDLE = new THREE.Color(0.5, 0.5, 0.55);    // 無近期發射 — 灰

// 脈衝 ring 顏色
const RING_HOT = new THREE.Color(1.0, 0.3, 0.2);
const RING_WARM = new THREE.Color(1.0, 0.65, 0.2);

interface PadEntry {
  pad: LaunchPad;
  hoursToLaunch: number; // 距最近一次發射的小時數，-1 表示無
}

export class LaunchPadMarkers {
  private core: THREE.InstancedMesh;
  private ring: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private entries: PadEntry[] = [];
  private visible = true;

  constructor(private scene: THREE.Scene) {
    // 核心標記：小菱形（八面體）
    const coreGeo = new THREE.OctahedronGeometry(0.012, 0);
    const coreMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    this.core = new THREE.InstancedMesh(coreGeo, coreMat, MAX_PADS);
    this.core.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.core.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_PADS * 3), 3,
    );
    this.core.count = 0;
    this.core.frustumCulled = false;
    this.scene.add(this.core);

    // 脈衝 ring：圓環（只對有近期發射的台站顯示）
    const ringGeo = new THREE.RingGeometry(0.015, 0.025, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ring = new THREE.InstancedMesh(ringGeo, ringMat, MAX_PADS);
    this.ring.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.ring.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(MAX_PADS * 3), 3,
    );
    this.ring.count = 0;
    this.ring.frustumCulled = false;
    this.scene.add(this.ring);
  }

  /** 設定發射台 + 發射列表，計算每個台站的下次發射時間 */
  setPads(pads: LaunchPad[], launches: Launch[]) {
    // 建立 pad_id → 最近發射時間 的映射
    const now = Date.now();
    const padNextLaunch = new Map<string, number>();

    for (const l of launches) {
      if (!l.net || !l.pad_latitude || !l.pad_longitude) continue;
      const launchTime = new Date(l.net).getTime();
      if (launchTime < now) continue; // 跳過已過的

      // 找最近的 pad（用座標匹配）
      for (const p of pads) {
        if (
          Math.abs(p.latitude - l.pad_latitude) < 0.01 &&
          Math.abs(p.longitude - l.pad_longitude) < 0.01
        ) {
          const prev = padNextLaunch.get(p.id) ?? Infinity;
          if (launchTime < prev) padNextLaunch.set(p.id, launchTime);
          break;
        }
      }
    }

    this.entries = pads
      .filter(p => p.latitude != null && p.longitude != null)
      .map(pad => {
        const nextTime = padNextLaunch.get(pad.id);
        const hoursToLaunch = nextTime ? (nextTime - now) / 3600000 : -1;
        return { pad, hoursToLaunch };
      });

    this._buildInstances();
  }

  private _buildInstances() {
    const count = Math.min(this.entries.length, MAX_PADS);
    this.core.count = count;

    let ringCount = 0;

    for (let i = 0; i < count; i++) {
      const { pad, hoursToLaunch } = this.entries[i];
      const [x, y, z] = geoToCartesianSurface(pad.latitude, pad.longitude);

      // 核心標記
      this.dummy.position.set(x, y, z);
      // 讓菱形朝外（法線方向）
      this.dummy.lookAt(x * 2, y * 2, z * 2);
      this.dummy.scale.setScalar(1);
      this.dummy.updateMatrix();
      this.core.setMatrixAt(i, this.dummy.matrix);

      // 顏色
      const color = hoursToLaunch >= 0 && hoursToLaunch < 24
        ? COLOR_HOT
        : hoursToLaunch >= 0 && hoursToLaunch < 168
          ? COLOR_WARM
          : COLOR_IDLE;
      this.core.setColorAt(i, color);

      // 脈衝 ring（只對有近期發射的台站）
      if (hoursToLaunch >= 0 && hoursToLaunch < 168) {
        this.ring.setMatrixAt(ringCount, this.dummy.matrix);
        const ringColor = hoursToLaunch < 24 ? RING_HOT : RING_WARM;
        this.ring.setColorAt(ringCount, ringColor);
        ringCount++;
      }
    }

    this.ring.count = ringCount;
    this.core.instanceMatrix.needsUpdate = true;
    this.core.instanceColor!.needsUpdate = true;
    this.ring.instanceMatrix.needsUpdate = true;
    this.ring.instanceColor!.needsUpdate = true;
  }

  /** 每幀更新脈衝動畫 */
  update(elapsed: number) {
    if (!this.visible || this.ring.count === 0) return;

    const pulse = 0.3 + Math.abs(Math.sin(elapsed * 2.5)) * 0.7;
    const scale = 1.0 + Math.sin(elapsed * 3) * 0.4;
    const mat = this.ring.material as THREE.MeshBasicMaterial;
    mat.opacity = pulse * 0.6;

    // 更新 ring scale（脈衝擴散效果）
    for (let i = 0; i < this.ring.count; i++) {
      const m = new THREE.Matrix4();
      this.ring.getMatrixAt(i, m);
      const pos = new THREE.Vector3();
      pos.setFromMatrixPosition(m);

      this.dummy.position.copy(pos);
      this.dummy.lookAt(pos.x * 2, pos.y * 2, pos.z * 2);
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      this.ring.setMatrixAt(i, this.dummy.matrix);
    }
    this.ring.instanceMatrix.needsUpdate = true;
  }

  setVisible(v: boolean) {
    this.visible = v;
    this.core.visible = v;
    this.ring.visible = v;
  }

  /** 點擊檢測：回傳最近的發射台 */
  findNearest(x: number, y: number, z: number, threshold = 0.05): LaunchPad | null {
    let best: LaunchPad | null = null;
    let bestDist = threshold;

    for (const { pad } of this.entries) {
      const [px, py, pz] = geoToCartesianSurface(pad.latitude, pad.longitude);
      const d = Math.sqrt((x - px) ** 2 + (y - py) ** 2 + (z - pz) ** 2);
      if (d < bestDist) {
        bestDist = d;
        best = pad;
      }
    }

    return best;
  }

  dispose() {
    this.scene.remove(this.core);
    this.scene.remove(this.ring);
    this.core.geometry.dispose();
    (this.core.material as THREE.Material).dispose();
    this.ring.geometry.dispose();
    (this.ring.material as THREE.Material).dispose();
  }
}
