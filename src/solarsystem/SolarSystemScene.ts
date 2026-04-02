/**
 * 太陽系 3D 場景管理
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { SunMesh } from "./SunMesh";
import { PlanetMesh, MoonMesh } from "./PlanetMesh";
import { OrbitPath } from "./OrbitPath";
import { PLANETS, MOON, COMETS, DWARF_PLANETS } from "./planetData";
import { getPlanetPosition, getOrbitPoints, getMoonOffset, auToScene, getCometPosition, getCometOrbitPoints, getDwarfPlanetPosition } from "./solarCoordinates";
import type { SmallBody } from "../data/smallBodyLoader";

/* ── 星空背景 ─────────────────────────────── */

function createStarfield(scene: THREE.Scene): THREE.Points {
  const count = 3000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // 均勻分佈在球面上
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 400;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.4,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const stars = new THREE.Points(geo, mat);
  scene.add(stars);
  return stars;
}

/* ── 黃道面格線 ───────────────────────────── */

function createEclipticGrid(scene: THREE.Scene) {
  const mat = new THREE.LineBasicMaterial({
    color: 0x334466,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  });

  // 同心圓
  for (const au of [1, 2, 5, 10, 20, 30]) {
    const r = Math.sqrt(au) * 10;
    const pts: THREE.Vector3[] = [];
    for (let a = 0; a <= 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      pts.push(new THREE.Vector3(Math.cos(rad) * r, 0, Math.sin(rad) * r));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    scene.add(new THREE.Line(geo, mat));
  }
}

/* ── SolarSystemScene ─────────────────────── */

export class SolarSystemScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  labelRenderer: CSS2DRenderer;
  controls: OrbitControls;

  private sun: SunMesh;
  private planets: Map<string, PlanetMesh> = new Map();
  private orbits: OrbitPath[] = [];
  private moon: MoonMesh;
  private asteroidBelt: THREE.Points | null = null;
  private comets: Map<string, PlanetMesh> = new Map();
  private cometOrbits: OrbitPath[] = [];
  private dwarfPlanets: Map<string, PlanetMesh> = new Map();

  // 真實小天體粒子雲（替換假的 asteroidBelt）
  // posArr = 當前顯示位置, targetArr = 下一個計算目標, prevArr = 上一個計算結果
  private smallBodyClouds: Map<string, {
    points: THREE.Points; bodies: SmallBody[];
    posArr: Float32Array; prevArr: Float32Array; targetArr: Float32Array;
  }> = new Map();
  private sbLerpT = 0;          // 內插進度 0..1
  private sbUpdateInterval = 60; // 每 N 幀計算一次目標位置

  private animId = 0;
  private clock = new THREE.Clock();

  // 預分配的位置快取，避免每幀 new
  private posCache: Map<string, [number, number, number]> = new Map();

  getCurrentTime: () => number = () => Date.now() / 1000;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020208);

    const w = container.clientWidth;
    const h = container.clientHeight;

    // 相機
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(0, 45, 65);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // CSS2D Renderer（label 層）
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(w, h);
    Object.assign(this.labelRenderer.domElement.style, {
      position: "absolute",
      top: "0",
      left: "0",
      pointerEvents: "none",
    });
    container.appendChild(this.labelRenderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 200;
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.5;

    // 環境光（稍強，讓背光面也看得到）
    this.scene.add(new THREE.AmbientLight(0x556688, 0.6));

    // 星空
    createStarfield(this.scene);

    // 黃道格線
    createEclipticGrid(this.scene);

    // 太陽
    this.sun = new SunMesh();
    this.scene.add(this.sun.group);

    // 行星 + 軌道
    const now = Date.now();
    for (const planet of PLANETS) {
      // 行星 mesh
      const mesh = new PlanetMesh(planet);
      this.planets.set(planet.name, mesh);
      this.scene.add(mesh.group);

      // 軌道路徑
      const points = getOrbitPoints(planet, 360);
      const orbit = new OrbitPath(this.scene, points, planet.color);
      this.orbits.push(orbit);

      // 初始位置
      const pos = getPlanetPosition(planet, now);
      this.posCache.set(planet.name, pos);
      mesh.setPosition(pos[0], pos[1], pos[2]);
    }

    // 月球
    this.moon = new MoonMesh(MOON.color, MOON.visualRadius, MOON.label, MOON.texture);
    this.scene.add(this.moon.group);

    // 小行星帶（Mars-Jupiter 間，2.2-3.2 AU）
    this.asteroidBelt = this.createAsteroidBelt(2000, 2.2, 3.2);
    this.scene.add(this.asteroidBelt);

    // 彗星
    for (const comet of COMETS) {
      const mesh = new PlanetMesh({
        name: comet.name, label: comet.label, color: comet.color,
        visualRadius: 0.12, texture: "", // 彗星不需貼圖
        a: comet.a, e: comet.e, i: comet.i,
        omega: comet.omega, w: comet.w, M0: 0, period: comet.periodDays / 365.25,
      });
      this.comets.set(comet.name, mesh);
      this.scene.add(mesh.group);

      const pos = getCometPosition(comet, now);
      this.posCache.set(`comet_${comet.name}`, pos);
      mesh.setPosition(pos[0], pos[1], pos[2]);

      // 彗星軌道（虛線效果用不同顏色和更低透明度）
      const orbitPts = getCometOrbitPoints(comet, 720);
      if (orbitPts.length > 10) {
        const orbit = new OrbitPath(this.scene, orbitPts, comet.color);
        orbit.setOpacity(0.15);
        this.cometOrbits.push(orbit);
      }
    }

    // 矮行星（Pluto, Eris）
    for (const dwarf of DWARF_PLANETS) {
      const mesh = new PlanetMesh({
        ...dwarf, texture: "",
        a: dwarf.a, e: dwarf.e, i: dwarf.i,
        omega: dwarf.omega, w: dwarf.w, M0: dwarf.M0, period: dwarf.period,
      });
      this.dwarfPlanets.set(dwarf.name, mesh);
      this.scene.add(mesh.group);

      const pos = getDwarfPlanetPosition(dwarf, now);
      this.posCache.set(`dwarf_${dwarf.name}`, pos);
      mesh.setPosition(pos[0], pos[1], pos[2]);

      // 矮行星軌道
      const orbitPts = getOrbitPoints(dwarf as any, 360);
      this.orbits.push(new OrbitPath(this.scene, orbitPts, dwarf.color));
    }

    // Resize
    const onResize = () => {
      const rw = container.clientWidth;
      const rh = container.clientHeight;
      this.camera.aspect = rw / rh;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(rw, rh);
      this.labelRenderer.setSize(rw, rh);
    };
    window.addEventListener("resize", onResize);
    this._onResize = onResize;

    // 啟動動畫
    this.animate();
  }

  private createAsteroidBelt(count: number, minAU: number, maxAU: number): THREE.Points {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const au = minAU + Math.random() * (maxAU - minAU);
      const angle = Math.random() * Math.PI * 2;
      const r = auToScene(au);
      // 小的 Y 散佈（軌道傾角）
      const ySpread = (Math.random() - 0.5) * 1.2;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = ySpread;
      positions[i * 3 + 2] = Math.sin(angle) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.12,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    return new THREE.Points(geo, mat);
  }

  private _onResize: (() => void) | null = null;
  private frameCount = 0;

  private animate = () => {
    this.animId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.frameCount++;

    const elapsed = this.clock.getElapsedTime();
    const timeS = this.getCurrentTime();
    const dateMs = timeS * 1000;

    // 太陽脈動動畫
    this.sun.update(elapsed);

    // 每 30 幀更新一次位置（天體移動極慢）
    if (this.frameCount % 30 === 0) {
      for (const planet of PLANETS) {
        const pos = getPlanetPosition(planet, dateMs);
        const cached = this.posCache.get(planet.name)!;
        cached[0] = pos[0]; cached[1] = pos[1]; cached[2] = pos[2];
      }
      for (const comet of COMETS) {
        const pos = getCometPosition(comet, dateMs);
        const key = `comet_${comet.name}`;
        const cached = this.posCache.get(key);
        if (cached) { cached[0] = pos[0]; cached[1] = pos[1]; cached[2] = pos[2]; }
      }
      for (const dwarf of DWARF_PLANETS) {
        const pos = getDwarfPlanetPosition(dwarf, dateMs);
        const key = `dwarf_${dwarf.name}`;
        const cached = this.posCache.get(key);
        if (cached) { cached[0] = pos[0]; cached[1] = pos[1]; cached[2] = pos[2]; }
      }
    }

    // 每幀套用位置
    for (const planet of PLANETS) {
      const pos = this.posCache.get(planet.name)!;
      this.planets.get(planet.name)!.setPosition(pos[0], pos[1], pos[2]);
    }
    for (const comet of COMETS) {
      const pos = this.posCache.get(`comet_${comet.name}`);
      if (pos) this.comets.get(comet.name)?.setPosition(pos[0], pos[1], pos[2]);
    }
    for (const dwarf of DWARF_PLANETS) {
      const pos = this.posCache.get(`dwarf_${dwarf.name}`);
      if (pos) this.dwarfPlanets.get(dwarf.name)?.setPosition(pos[0], pos[1], pos[2]);
    }

    // 小天體：每 N 幀計算目標位置，每幀 lerp 平滑過渡
    if (this.smallBodyClouds.size > 0) {
      if (this.frameCount % this.sbUpdateInterval === 0) {
        this.computeSmallBodyTargets(dateMs);
      }
      this.sbLerpT += 1 / this.sbUpdateInterval;
      this.lerpSmallBodies();
    }

    // 月球位置 = 地球位置 + 偏移
    const earthPos = this.posCache.get("earth")!;
    const moonOff = getMoonOffset(dateMs);
    this.moon.setPosition(
      earthPos[0] + moonOff[0],
      earthPos[1] + moonOff[1],
      earthPos[2] + moonOff[2],
    );

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };

  /* ── Setter methods ─────────────────────── */

  setOrbitOpacity(opacity: number) {
    for (const orbit of this.orbits) orbit.setOpacity(opacity);
    for (const orbit of this.cometOrbits) orbit.setOpacity(opacity * 0.5);
  }

  setShowOrbits(show: boolean) {
    for (const orbit of this.orbits) orbit.setVisible(show);
    for (const orbit of this.cometOrbits) orbit.setVisible(show);
  }

  setPlanetScale(scale: number) {
    for (const mesh of this.planets.values()) mesh.setScale(scale);
    for (const mesh of this.comets.values()) mesh.setScale(scale);
    for (const mesh of this.dwarfPlanets.values()) mesh.setScale(scale);
    this.moon.group.scale.setScalar(scale);
  }

  setGlowOpacity(opacity: number) {
    for (const mesh of this.planets.values()) mesh.setGlowOpacity(opacity);
    for (const mesh of this.comets.values()) mesh.setGlowOpacity(opacity);
    for (const mesh of this.dwarfPlanets.values()) mesh.setGlowOpacity(opacity);
  }

  setShowLabels(show: boolean) {
    this.labelRenderer.domElement.style.display = show ? "" : "none";
  }

  setShowAsteroidBelt(show: boolean) {
    if (this.asteroidBelt) this.asteroidBelt.visible = show;
  }

  setClassVisibility(cls: string, visible: boolean) {
    const cloud = this.smallBodyClouds.get(cls);
    if (cloud) cloud.points.visible = visible;
  }

  setParticleSize(size: number) {
    for (const { points } of this.smallBodyClouds.values()) {
      (points.material as THREE.PointsMaterial).size = size;
    }
    if (this.asteroidBelt) (this.asteroidBelt.material as THREE.PointsMaterial).size = size;
  }

  setClassColors(colors: Record<string, string>) {
    for (const [cls, { points }] of this.smallBodyClouds.entries()) {
      const hex = colors[cls];
      if (hex) (points.material as THREE.PointsMaterial).color.set(hex);
    }
  }

  setParticleOpacity(opacity: number) {
    for (const { points } of this.smallBodyClouds.values()) {
      (points.material as THREE.PointsMaterial).opacity = opacity;
    }
    if (this.asteroidBelt) (this.asteroidBelt.material as THREE.PointsMaterial).opacity = opacity;
  }

  /** 設定真實小天體資料（來自 Supabase），替換假的粒子 */
  setSmallBodies(grouped: Record<string, SmallBody[]>) {
    // 移除假的小行星帶
    if (this.asteroidBelt) {
      this.scene.remove(this.asteroidBelt);
      this.asteroidBelt.geometry.dispose();
      (this.asteroidBelt.material as THREE.Material).dispose();
      this.asteroidBelt = null;
    }
    // 移除舊的真實資料
    for (const { points } of this.smallBodyClouds.values()) {
      this.scene.remove(points);
      points.geometry.dispose();
      (points.material as THREE.Material).dispose();
    }
    this.smallBodyClouds.clear();

    const COLORS: Record<string, number> = {
      MBA: 0x888888, // 灰
      TJN: 0x66aa66, // 綠
      NEO: 0xff4444, // 紅
      TNO: 0x6688cc, // 藍
      CEN: 0xbb88dd, // 紫
      HTC: 0x88ccff, // 淡藍
      JFC: 0xaaddaa, // 淡綠
    };
    const SIZES: Record<string, number> = {
      MBA: 0.1, TJN: 0.12, NEO: 0.15, TNO: 0.1, CEN: 0.2, HTC: 0.25, JFC: 0.2,
    };

    for (const [cls, bodies] of Object.entries(grouped)) {
      const count = bodies.length;
      if (count === 0) continue;

      const posArr = new Float32Array(count * 3);
      const prevArr = new Float32Array(count * 3);
      const targetArr = new Float32Array(count * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
      (geo.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);

      const mat = new THREE.PointsMaterial({
        color: COLORS[cls] ?? 0x888888,
        size: SIZES[cls] ?? 0.1,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });

      const points = new THREE.Points(geo, mat);
      this.scene.add(points);
      this.smallBodyClouds.set(cls, { points, bodies, posArr, prevArr, targetArr });
    }

    // 立即計算初始位置（填滿 prev + target + posArr）
    const initMs = this.getCurrentTime() * 1000;
    this.computeSmallBodyTargets(initMs);
    // 初始化 prev = target（第一幀不需要 lerp）
    for (const cloud of this.smallBodyClouds.values()) {
      cloud.prevArr.set(cloud.targetArr);
      cloud.posArr.set(cloud.targetArr);
      (cloud.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
    this.sbLerpT = 1;
  }

  /** 計算目標位置（寫入 targetArr），並把 posArr 複製到 prevArr */
  private computeSmallBodyTargets(dateMs: number) {
    const DEG2RAD = Math.PI / 180;
    const TWO_PI = 2 * Math.PI;
    const JD_UNIX_EPOCH = 2440587.5;

    for (const cloud of this.smallBodyClouds.values()) {
      const { bodies, posArr, prevArr, targetArr } = cloud;

      // 把當前位置存為 prev（供 lerp 用）
      prevArr.set(posArr);

      for (let idx = 0; idx < bodies.length; idx++) {
        const b = bodies[idx];
        const i3 = idx * 3;

        // 過濾無效 / 數值不穩定的天體
        if (!isFinite(b.ma) || !isFinite(b.epoch_jd) || !isFinite(b.a) ||
            b.e >= 0.98 || b.a <= 0 || b.period_days <= 0) {
          targetArr[i3] = targetArr[i3 + 1] = targetArr[i3 + 2] = 9999;
          continue;
        }

        const epochMs = (b.epoch_jd - JD_UNIX_EPOCH) * 86400000;
        const days = (dateMs - epochMs) / 86400000;

        const n = b.period_days > 0 ? TWO_PI / b.period_days : 0;
        let M = (b.ma * DEG2RAD + n * days) % TWO_PI;
        if (M < 0) M += TWO_PI;

        const iters = b.e > 0.4 ? 8 : 3;
        let E = M;
        for (let j = 0; j < iters; j++) {
          E -= (E - b.e * Math.sin(E) - M) / (1 - b.e * Math.cos(E));
        }

        // Kepler 發散檢查
        if (!isFinite(E)) {
          targetArr[i3] = targetArr[i3 + 1] = targetArr[i3 + 2] = 9999;
          continue;
        }

        const cosE = Math.cos(E), sinE = Math.sin(E);
        const x_orb = b.a * (cosE - b.e);
        const y_orb = b.a * Math.sqrt(1 - b.e * b.e) * sinE;

        const wRad = b.w * DEG2RAD;
        const omRad = b.om * DEG2RAD;
        const iRad = b.i * DEG2RAD;
        const cosW = Math.cos(wRad), sinW = Math.sin(wRad);
        const cosO = Math.cos(omRad), sinO = Math.sin(omRad);
        const cosI = Math.cos(iRad), sinI = Math.sin(iRad);

        const xEcl = (cosO * cosW - sinO * sinW * cosI) * x_orb + (-cosO * sinW - sinO * cosW * cosI) * y_orb;
        const yEcl = (sinO * cosW + cosO * sinW * cosI) * x_orb + (-sinO * sinW + cosO * cosW * cosI) * y_orb;
        const zEcl = (sinW * sinI) * x_orb + (cosW * sinI) * y_orb;

        const dist = Math.sqrt(xEcl * xEcl + yEcl * yEcl + zEcl * zEcl);
        const r = auToScene(dist);
        const scale = r / (dist || 1);

        targetArr[i3] = xEcl * scale;
        targetArr[i3 + 1] = zEcl * scale;
        targetArr[i3 + 2] = -yEcl * scale;
      }
    }
    this.sbLerpT = 0;
  }

  /** 每幀呼叫：在 prev 和 target 之間 lerp */
  private lerpSmallBodies() {
    const t = Math.min(this.sbLerpT, 1);
    for (const { posArr, prevArr, targetArr, points } of this.smallBodyClouds.values()) {
      for (let k = 0; k < posArr.length; k++) {
        posArr[k] = prevArr[k] + (targetArr[k] - prevArr[k]) * t;
      }
      (points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  dispose() {
    cancelAnimationFrame(this.animId);
    if (this._onResize) window.removeEventListener("resize", this._onResize);

    // 清理 label renderer DOM
    this.labelRenderer.domElement.remove();

    // 清理軌道
    for (const orbit of this.orbits) orbit.dispose(this.scene);

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
