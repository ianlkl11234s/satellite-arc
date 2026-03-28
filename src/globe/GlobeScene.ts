/**
 * 3D 地球場景管理
 *
 * 管理 Three.js scene, camera, renderer, OrbitControls，
 * 以及地球、衛星光點、軌道弧線的更新。
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EarthMesh } from "./EarthMesh";
import { SatelliteOrbs } from "./SatelliteOrbs";
import { OrbitLines } from "./OrbitLines";
import { geoToCartesian } from "./coordinates";
import type { SatelliteTLE } from "../data/satelliteLoader";
import * as satellite from "satellite.js";

export class GlobeScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;

  private earth: EarthMesh;
  private orbs: SatelliteOrbs;
  private orbits: OrbitLines;
  private animId = 0;
  private clock = new THREE.Clock();

  // 外部回呼：每幀取得當前時間（Unix timestamp）
  getCurrentTime: () => number = () => Date.now() / 1000;

  // TLE 快取（用於即時 SGP4 計算）
  private tles: SatelliteTLE[] = [];
  private satRecs: satellite.SatRec[] = [];

  constructor(container: HTMLElement) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020208);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 100);
    this.camera.position.set(0, 0.5, 3.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1.3;
    this.controls.maxDistance = 8;
    this.controls.enablePan = false;

    // Earth
    this.earth = new EarthMesh();
    this.scene.add(this.earth.group);

    // Satellites
    this.orbs = new SatelliteOrbs(this.scene);
    this.orbits = new OrbitLines(this.scene);

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // Start
    this.animate();
  }

  /**
   * 設定衛星 TLE 資料（載入後呼叫一次）
   */
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

  /**
   * 設定軌道弧線（從 Flight[] 的 path 建構）
   */
  setOrbits(orbits: Array<{ path: [number, number, number, number][]; orbitType: string }>) {
    this.orbits.update(orbits);
  }

  private animate() {
    this.animId = requestAnimationFrame(() => this.animate());
    this.controls.update();

    const elapsed = this.clock.getElapsedTime();
    const currentTime = this.getCurrentTime();

    // 即時計算衛星位置
    if (this.tles.length > 0) {
      const date = new Date(currentTime * 1000);
      const entries: Array<{
        id: string;
        x: number;
        y: number;
        z: number;
        orbitType: string;
      }> = [];

      for (let i = 0; i < this.tles.length; i++) {
        const satrec = this.satRecs[i];
        if (!satrec) continue;

        try {
          const posVel = satellite.propagate(satrec, date);
          if (!posVel.position || typeof posVel.position === "boolean") continue;

          const gmst = satellite.gstime(date);
          const geo = satellite.eciToGeodetic(posVel.position, gmst);
          const lat = satellite.degreesLat(geo.latitude);
          const lng = satellite.degreesLong(geo.longitude);
          const altKm = geo.height;

          const [x, y, z] = geoToCartesian(lat, lng, altKm);
          entries.push({
            id: `sat_${this.tles[i]!.norad_id}`,
            x, y, z,
            orbitType: this.tles[i]!.orbit_type,
          });
        } catch {
          continue;
        }
      }

      this.orbs.update(entries, elapsed);
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
