/**
 * 3D 地球場景管理
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EarthMesh } from "./EarthMesh";
import { SatelliteOrbs } from "./SatelliteOrbs";
import { OrbitLines } from "./OrbitLines";
import { TrailLines, type TrailEntry } from "./TrailLines";
import { geoToCartesian } from "./coordinates";
import type { SatelliteTLE } from "../data/satelliteLoader";
import * as satellite from "satellite.js";

export interface SatellitePosition {
  id: string;
  index: number;
  x: number;
  y: number;
  z: number;
  lat: number;
  lng: number;
  altKm: number;
  orbitType: string;
  name: string;
  constellation: string;
}

export class GlobeScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;

  private earth: EarthMesh;
  private orbs: SatelliteOrbs;
  private orbits: OrbitLines;
  private trails: TrailLines;
  private animId = 0;
  private clock = new THREE.Clock();

  /** 尾巴長度 */
  trailLength = 8;
  trailStepSec = 30;
  private trailUpdateCounter = 0;

  // 分批更新位置：每幀只算 1/N 的衛星，快取結果
  private readonly BATCH_COUNT = 4;
  private batchIndex = 0;
  private positionCache = new Map<number, SatellitePosition>();

  // 歷史位置環形緩衝區（用於動態尾巴，不需額外 SGP4）
  // key: satellite index → 最近 N 幀的 [x,y,z] 位置
  private historyBuffer = new Map<number, Array<[number, number, number]>>();
  private historyMaxLen = 20; // 最多存幾幀歷史
  private historyWriteCounter = 0;
  private historyWriteInterval = 3; // 每 N 幀記錄一次位置

  // 外部回呼
  getCurrentTime: () => number = () => Date.now() / 1000;

  // TLE 快取
  private tles: SatelliteTLE[] = [];
  private satRecs: satellite.SatRec[] = [];

  // 篩選
  private visibleOrbitTypes = new Set(["starlink", "broadband", "phone", "geo_comms", "navigation", "earth_obs", "science", "military", "tech_demo", "other"]);
  constellationFilter: Set<string> | null = null;
  countryFilter: Set<string> | null = null;
  countryMap: Record<string, string> = {};

  // 視覺參數
  showTrails = true;
  showOrbits = false;
  orbitOpacity = 0.35;
  orbScale = 1.0;
  orbOpacity = 0.9;

  // 最新位置快取（供點擊查詢用）
  lastPositions: SatellitePosition[] = [];

  // 選中的衛星
  selectedId: string | null = null;
  private selectedRing: THREE.Line | null = null;

  // 追蹤模式
  followMode = false;
  private followLerp = 0.03; // 追蹤平滑度

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020208);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 100);
    this.camera.position.set(0, 0.5, 3.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1.3;
    this.controls.maxDistance = 8;
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.5;
    // 限制平移範圍，避免地球飛出畫面
    this.controls.addEventListener("change", () => {
      const target = this.controls.target;
      const maxPan = 2;
      target.clampScalar(-maxPan, maxPan);
    });

    this.earth = new EarthMesh();
    this.scene.add(this.earth.group);

    this.orbs = new SatelliteOrbs(this.scene);
    this.orbits = new OrbitLines(this.scene);
    this.orbits.setVisible(false); // 靜態軌道預設關
    this.trails = new TrailLines(this.scene, 13000, 10);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    this.animate();
  }

  setTLEs(tles: SatelliteTLE[]) {
    this.tles = tles;
    this.satRecs = [];
    for (const tle of tles) {
      try {
        this.satRecs.push(satellite.twoline2satrec(tle.tle_line1, tle.tle_line2));
      } catch {
        this.satRecs.push(null as unknown as satellite.SatRec);
      }
    }
  }

  setOrbits(orbits: Array<{ path: [number, number, number, number][]; orbitType: string }>) {
    // 只顯示被篩選的軌道類型
    const filtered = orbits.filter((o) => this.visibleOrbitTypes.has(o.orbitType));
    this.orbits.update(filtered);
  }

  setVisibleOrbitTypes(types: Set<string>) {
    this.visibleOrbitTypes = types;
  }

  setOrbitOpacity(opacity: number) {
    this.orbitOpacity = opacity;
    this.orbits.setOpacity(opacity);
    this.trails.setOpacity(opacity * 1.5);
  }

  setShowTrails(show: boolean) {
    this.showTrails = show;
    this.trails.setVisible(show);
  }

  setShowOrbits(show: boolean) {
    this.showOrbits = show;
    this.orbits.setVisible(show);
  }

  setOrbScale(scale: number) {
    this.orbScale = scale;
    this.orbs.setScale(scale);
  }

  setOrbOpacity(opacity: number) {
    this.orbOpacity = opacity;
    this.orbs.setOpacity(opacity);
  }

  setColors(colors: Record<string, string>) {
    this.orbs.setColors(colors);
    this.orbits.setColors(colors);
    this.trails.setColors(colors);
  }

  /**
   * 點擊拾取：找最近的衛星
   */
  pickSatellite(screenX: number, screenY: number, viewWidth: number, viewHeight: number): SatellitePosition | null {
    if (this.lastPositions.length === 0) return null;

    let closest: SatellitePosition | null = null;
    let closestDist = 30; // 像素閾值

    const mvp = new THREE.Matrix4().multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse,
    );
    const v = new THREE.Vector4();

    for (const pos of this.lastPositions) {
      v.set(pos.x, pos.y, pos.z, 1).applyMatrix4(mvp);
      if (v.w <= 0) continue; // 在相機後面
      const sx = ((v.x / v.w) * 0.5 + 0.5) * viewWidth;
      const sy = ((-v.y / v.w) * 0.5 + 0.5) * viewHeight;
      const dist = Math.sqrt((sx - screenX) ** 2 + (sy - screenY) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        closest = pos;
      }
    }

    return closest;
  }

  /**
   * 設定選中衛星（顯示高亮環）
   */
  setSelected(id: string | null) {
    this.selectedId = id;
    // 移除舊的選中環
    if (this.selectedRing) {
      this.scene.remove(this.selectedRing);
      this.selectedRing.geometry.dispose();
      this.selectedRing = null;
    }
  }

  private updateSelectedRing() {
    if (!this.selectedId) return;
    const pos = this.lastPositions.find((p) => p.id === this.selectedId);
    if (!pos) return;

    if (!this.selectedRing) {
      const ringGeo = new THREE.RingGeometry(0.018, 0.022, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x4fc3f7,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.selectedRing = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 65 }, (_, i) => {
            const angle = (i / 64) * Math.PI * 2;
            return new THREE.Vector3(Math.cos(angle) * 0.02, Math.sin(angle) * 0.02, 0);
          }),
        ),
        new THREE.LineBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.9 }),
      );
      ringMat.dispose();
      ringGeo.dispose();
      this.scene.add(this.selectedRing);
    }

    this.selectedRing.position.set(pos.x, pos.y, pos.z);
    this.selectedRing.lookAt(0, 0, 0);
  }

  /* ── Camera presets ──────────────────────────────────── */

  setCameraPreset(preset: "north_pole" | "south_pole" | "equator" | "overview" | "closeup") {
    // 停止追蹤模式
    this.followMode = false;
    // 重置 target 到原點
    this.controls.target.set(0, 0, 0);

    switch (preset) {
      case "north_pole":
        this.camera.position.set(0, 4, 0.01);
        break;
      case "south_pole":
        this.camera.position.set(0, -4, 0.01);
        break;
      case "equator":
        this.camera.position.set(0, 0, 3.5);
        break;
      case "overview":
        this.camera.position.set(0, 2, 6);
        break;
      case "closeup":
        this.camera.position.set(0, 0.3, 1.5);
        break;
    }
    this.controls.update();
  }

  resetPan() {
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  setFollowMode(enabled: boolean) {
    this.followMode = enabled;
    if (!enabled) {
      // 回到原點 target
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  private animate() {
    this.animId = requestAnimationFrame(() => this.animate());

    // 追蹤模式：讓 controls.target 跟隨選中衛星
    if (this.followMode && this.selectedId) {
      const sat = this.lastPositions.find((p) => p.id === this.selectedId);
      if (sat) {
        const target = this.controls.target;
        target.x += (sat.x - target.x) * this.followLerp;
        target.y += (sat.y - target.y) * this.followLerp;
        target.z += (sat.z - target.z) * this.followLerp;
      }
    }

    this.controls.update();

    const elapsed = this.clock.getElapsedTime();
    const currentTime = this.getCurrentTime();

    if (this.tles.length > 0) {
      const date = new Date(currentTime * 1000);
      const gmst = satellite.gstime(date);

      // 分批計算：每幀只算 1/BATCH_COUNT 的衛星
      const batchSize = Math.ceil(this.tles.length / this.BATCH_COUNT);
      const batchStart = this.batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, this.tles.length);
      this.batchIndex = (this.batchIndex + 1) % this.BATCH_COUNT;

      for (let i = batchStart; i < batchEnd; i++) {
        const tle = this.tles[i]!;
        const cat = (tle as unknown as Record<string, string>).category ?? "other";
        if (!this.visibleOrbitTypes.has(cat)) {
          this.positionCache.delete(i);
          continue;
        }
        if (this.constellationFilter && !this.constellationFilter.has(tle.constellation || "Other")) {
          this.positionCache.delete(i);
          continue;
        }
        const country = (tle as unknown as Record<string, string | null>).country_operator ?? "Unknown";
        if (this.countryFilter && !this.countryFilter.has(country)) {
          this.positionCache.delete(i);
          continue;
        }

        const satrec = this.satRecs[i];
        if (!satrec) continue;

        try {
          const posVel = satellite.propagate(satrec, date);
          if (!posVel.position || typeof posVel.position === "boolean") continue;

          const geo = satellite.eciToGeodetic(posVel.position, gmst);
          const lat = satellite.degreesLat(geo.latitude);
          const lng = satellite.degreesLong(geo.longitude);
          const altKm = geo.height;
          const [x, y, z] = geoToCartesian(lat, lng, altKm);

          this.positionCache.set(i, {
            id: `sat_${tle.norad_id}`,
            index: i,
            x, y, z,
            lat, lng, altKm,
            orbitType: cat,
            name: tle.name,
            constellation: tle.constellation,
          });
        } catch {
          continue;
        }
      }

      // 從快取組裝完整的 entries
      const entries = [...this.positionCache.values()];
      this.lastPositions = entries;
      this.orbs.update(entries, elapsed);

      // 記錄歷史位置到環形緩衝區（每 N 幀記錄一次）
      this.historyWriteCounter++;
      if (this.historyWriteCounter % this.historyWriteInterval === 0) {
        for (const pos of entries) {
          let hist = this.historyBuffer.get(pos.index);
          if (!hist) {
            hist = [];
            this.historyBuffer.set(pos.index, hist);
          }
          hist.unshift([pos.x, pos.y, pos.z]);
          if (hist.length > this.historyMaxLen) hist.length = this.historyMaxLen;
        }
      }

      // 動態尾巴：直接從歷史緩衝區讀取（零 SGP4 計算）
      this.trailUpdateCounter++;
      if (this.showTrails && this.trailUpdateCounter % 5 === 0) {
        const trailEntries: TrailEntry[] = [];
        const maxPts = Math.min(this.trailLength, this.historyMaxLen);
        for (const pos of entries) {
          const hist = this.historyBuffer.get(pos.index);
          if (!hist || hist.length < 2) continue;
          const points = hist.slice(0, maxPts);
          trailEntries.push({ points, orbitType: pos.orbitType });
        }
        this.trails.update(trailEntries);
      }
      this.updateSelectedRing();
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
