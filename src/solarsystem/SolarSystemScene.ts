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
  private sbCometOrbits: OrbitPath[] = []; // HTC/JFC from Supabase

  // 真實小天體粒子雲（替換假的 asteroidBelt）
  private smallBodyClouds: Map<string, {
    points: THREE.Points; bodies: SmallBody[];
    posArr: Float32Array; prevArr: Float32Array; targetArr: Float32Array;
    colorArr?: Float32Array; // per-vertex color (for spectral mode)
  }> = new Map();
  private sbLerpT = 0;          // 內插進度 0..1
  private sbUpdateInterval = 60; // 每 N 幀計算一次目標位置

  private animId = 0;
  private clock = new THREE.Clock();

  // 行星/彗星/矮行星位置快取（雙快取 lerp）
  private posCache: Map<string, [number, number, number]> = new Map();
  private posPrev: Map<string, [number, number, number]> = new Map();
  private posTarget: Map<string, [number, number, number]> = new Map();
  private planetLerpT = 1;
  private readonly PLANET_UPDATE_INTERVAL = 30;

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

      // 初始位置（三份：cache, prev, target）
      const pos = getPlanetPosition(planet, now);
      this.posCache.set(planet.name, [...pos]);
      this.posPrev.set(planet.name, [...pos]);
      this.posTarget.set(planet.name, [...pos]);
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
      const ckey = `comet_${comet.name}`;
      this.posCache.set(ckey, [...pos]);
      this.posPrev.set(ckey, [...pos]);
      this.posTarget.set(ckey, [...pos]);
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
      const dkey = `dwarf_${dwarf.name}`;
      this.posCache.set(dkey, [...pos]);
      this.posPrev.set(dkey, [...pos]);
      this.posTarget.set(dkey, [...pos]);
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

    // 行星/彗星/矮行星：每 N 幀計算目標，每幀 lerp
    if (this.frameCount % this.PLANET_UPDATE_INTERVAL === 0) {
      // 把當前位置存為 prev，計算新 target
      for (const key of this.posCache.keys()) {
        const cur = this.posCache.get(key)!;
        const prev = this.posPrev.get(key)!;
        prev[0] = cur[0]; prev[1] = cur[1]; prev[2] = cur[2];
      }
      for (const planet of PLANETS) {
        const pos = getPlanetPosition(planet, dateMs);
        const t = this.posTarget.get(planet.name)!;
        t[0] = pos[0]; t[1] = pos[1]; t[2] = pos[2];
      }
      for (const comet of COMETS) {
        const pos = getCometPosition(comet, dateMs);
        const t = this.posTarget.get(`comet_${comet.name}`);
        if (t) { t[0] = pos[0]; t[1] = pos[1]; t[2] = pos[2]; }
      }
      for (const dwarf of DWARF_PLANETS) {
        const pos = getDwarfPlanetPosition(dwarf, dateMs);
        const t = this.posTarget.get(`dwarf_${dwarf.name}`);
        if (t) { t[0] = pos[0]; t[1] = pos[1]; t[2] = pos[2]; }
      }
      this.planetLerpT = 0;
    }

    // 每幀 lerp 並套用
    this.planetLerpT = Math.min(this.planetLerpT + 1 / this.PLANET_UPDATE_INTERVAL, 1);
    const pt = this.planetLerpT;
    for (const key of this.posCache.keys()) {
      const c = this.posCache.get(key)!;
      const p = this.posPrev.get(key)!;
      const t = this.posTarget.get(key)!;
      c[0] = p[0] + (t[0] - p[0]) * pt;
      c[1] = p[1] + (t[1] - p[1]) * pt;
      c[2] = p[2] + (t[2] - p[2]) * pt;
    }

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

  /* ── Pick & Fly ──────────────────────────── */

  /** 螢幕座標 → 找最近的天體 */
  /** 最後一次 pick 到的小天體（HTC/JFC 粒子） */
  lastPickedSmallBody: SmallBody | null = null;

  pickBody(screenX: number, screenY: number, viewWidth: number, viewHeight: number): string | null {
    const mvp = new THREE.Matrix4().multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse,
    );
    const v = new THREE.Vector4();
    let closest: string | null = null;
    let closestDist = 40; // 像素閾值
    this.lastPickedSmallBody = null;

    // 檢查所有可點擊天體（行星、彗星等）
    const candidates: Array<{ name: string; pos: THREE.Vector3 }> = [];
    candidates.push({ name: "sun", pos: this.sun.group.position });
    for (const [name, mesh] of this.planets) candidates.push({ name, pos: mesh.group.position });
    candidates.push({ name: "moon", pos: this.moon.group.position });
    for (const [name, mesh] of this.comets) candidates.push({ name, pos: mesh.group.position });
    for (const [name, mesh] of this.dwarfPlanets) candidates.push({ name, pos: mesh.group.position });

    for (const { name, pos } of candidates) {
      v.set(pos.x, pos.y, pos.z, 1).applyMatrix4(mvp);
      if (v.w <= 0) continue;
      const sx = ((v.x / v.w) * 0.5 + 0.5) * viewWidth;
      const sy = ((-v.y / v.w) * 0.5 + 0.5) * viewHeight;
      const dist = Math.sqrt((sx - screenX) ** 2 + (sy - screenY) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        closest = name;
      }
    }

    // 也掃描 HTC/JFC 粒子
    for (const cls of ["HTC", "JFC"]) {
      const cloud = this.smallBodyClouds.get(cls);
      if (!cloud || !cloud.points.visible) continue;
      const { bodies, posArr } = cloud;
      for (let i = 0; i < bodies.length; i++) {
        const px = posArr[i * 3], py = posArr[i * 3 + 1], pz = posArr[i * 3 + 2];
        if (px > 9000) continue; // 被過濾的無效點
        v.set(px, py, pz, 1).applyMatrix4(mvp);
        if (v.w <= 0) continue;
        const sx = ((v.x / v.w) * 0.5 + 0.5) * viewWidth;
        const sy = ((-v.y / v.w) * 0.5 + 0.5) * viewHeight;
        const dist = Math.sqrt((sx - screenX) ** 2 + (sy - screenY) ** 2);
        if (dist < closestDist) {
          closestDist = dist;
          closest = `sb_${cls}_${i}`;
          this.lastPickedSmallBody = bodies[i];
        }
      }
    }

    return closest;
  }

  /** 飛到指定天體 */
  flyToBody(name: string) {
    let target: THREE.Vector3 | null = null;

    if (name === "sun") target = this.sun.group.position;
    else if (name === "moon") target = this.moon.group.position;
    else if (this.planets.has(name)) target = this.planets.get(name)!.group.position;
    else if (this.comets.has(name)) target = this.comets.get(name)!.group.position;
    else if (this.dwarfPlanets.has(name)) target = this.dwarfPlanets.get(name)!.group.position;

    if (!target) return;

    // 飛到天體附近（距離 = 到太陽距離的 30% + 5，確保看得到）
    const dist = target.length();
    const offset = Math.max(3, dist * 0.3 + 2);

    // 相機目標移到天體位置
    const tx = target.x;
    const ty = target.y + offset * 0.5;
    const tz = target.z + offset * 0.8;

    this._animateCameraTo(tx, ty, tz, target.x, target.y, target.z);
  }

  private _cameraAnimId = 0;
  private _animateCameraTo(cx: number, cy: number, cz: number, tx: number, ty: number, tz: number) {
    cancelAnimationFrame(this._cameraAnimId);
    const startPos = { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z };
    const startTarget = { x: this.controls.target.x, y: this.controls.target.y, z: this.controls.target.z };
    const duration = 1200;
    const startTime = performance.now();

    const step = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
      this.camera.position.set(
        startPos.x + (cx - startPos.x) * ease,
        startPos.y + (cy - startPos.y) * ease,
        startPos.z + (cz - startPos.z) * ease,
      );
      this.controls.target.set(
        startTarget.x + (tx - startTarget.x) * ease,
        startTarget.y + (ty - startTarget.y) * ease,
        startTarget.z + (tz - startTarget.z) * ease,
      );
      this.controls.update();
      if (t < 1) this._cameraAnimId = requestAnimationFrame(step);
    };
    step();
  }

  /* ── Setter methods ─────────────────────── */

  /* ── 軌道路徑控制（分三組） ── */

  setPlanetOrbitOpacity(opacity: number) {
    for (const orbit of this.orbits) orbit.setOpacity(opacity);
    for (const orbit of this.cometOrbits) orbit.setOpacity(opacity * 0.5);
  }
  setShowPlanetOrbits(show: boolean) {
    for (const orbit of this.orbits) orbit.setVisible(show);
    for (const orbit of this.cometOrbits) orbit.setVisible(show);
  }

  private _htcOrbitCount = 0;
  setHTCOrbitOpacity(opacity: number) {
    for (let i = 0; i < this._htcOrbitCount; i++) this.sbCometOrbits[i]?.setOpacity(opacity);
  }
  setShowHTCOrbits(show: boolean) {
    for (let i = 0; i < this._htcOrbitCount; i++) this.sbCometOrbits[i]?.setVisible(show);
  }
  setJFCOrbitOpacity(opacity: number) {
    for (let i = this._htcOrbitCount; i < this.sbCometOrbits.length; i++) this.sbCometOrbits[i]?.setOpacity(opacity);
  }
  setShowJFCOrbits(show: boolean) {
    for (let i = this._htcOrbitCount; i < this.sbCometOrbits.length; i++) this.sbCometOrbits[i]?.setVisible(show);
  }

  /* ── 行星/粒子視覺控制 ── */

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
  setClassColors(colors: Record<string, string>) {
    for (const [cls, { points }] of this.smallBodyClouds.entries()) {
      const hex = colors[cls];
      if (hex) (points.material as THREE.PointsMaterial).color.set(hex);
    }
  }
  setClassSize(cls: string, size: number) {
    const cloud = this.smallBodyClouds.get(cls);
    if (cloud) (cloud.points.material as THREE.PointsMaterial).size = size;
  }
  setClassOpacity(cls: string, opacity: number) {
    const cloud = this.smallBodyClouds.get(cls);
    if (cloud) (cloud.points.material as THREE.PointsMaterial).opacity = opacity;
  }

  /** 切換 MBA 光譜分類著色模式 */
  setSpectralMode(enabled: boolean) {
    const cloud = this.smallBodyClouds.get("MBA");
    if (!cloud) return;
    const mat = cloud.points.material as THREE.PointsMaterial;
    if (enabled && cloud.colorArr) {
      mat.vertexColors = true;
      mat.color.set(0xffffff); // vertexColors 模式下 material color 要白色
    } else {
      mat.vertexColors = false;
      mat.color.set(0x888888); // 恢復預設灰色
    }
    mat.needsUpdate = true;
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

      // MBA 才建立 per-vertex color buffer（光譜分類著色）
      let colorArr: Float32Array | undefined;
      if (cls === "MBA") {
        colorArr = new Float32Array(count * 3);
        const SPEC_COLORS: Record<string, [number, number, number]> = {
          C: [0.35, 0.55, 0.85],  // 藍色系（碳質，含水）
          S: [0.85, 0.65, 0.35],  // 橘黃色系（石質）
          M: [0.95, 0.85, 0.55],  // 金色系（金屬）
          X: [0.6, 0.6, 0.6],    // 灰色（未定）
        };
        const DEFAULT_C: [number, number, number] = [0.53, 0.53, 0.53]; // 無分類灰色
        for (let i = 0; i < count; i++) {
          const spec = bodies[i].spec_type;
          const c = (spec && SPEC_COLORS[spec]) || DEFAULT_C;
          colorArr[i * 3] = c[0];
          colorArr[i * 3 + 1] = c[1];
          colorArr[i * 3 + 2] = c[2];
        }
        geo.setAttribute("color", new THREE.BufferAttribute(colorArr, 3));
      }

      const points = new THREE.Points(geo, mat);
      this.scene.add(points);
      this.smallBodyClouds.set(cls, { points, bodies, posArr, prevArr, targetArr, colorArr });
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

    // 為 HTC/JFC 彗星繪製軌道路徑
    for (const orbit of this.sbCometOrbits) orbit.dispose(this.scene);
    this.sbCometOrbits = [];

    for (const cls of ["HTC", "JFC"]) {
      if (cls === "JFC") this._htcOrbitCount = this.sbCometOrbits.length;
      const bodies = grouped[cls];
      if (!bodies) continue;
      const color = COLORS[cls] ?? 0x888888;

      for (const b of bodies) {
        if (b.e >= 0.98 || b.a <= 0 || b.period_days <= 0) continue;

        // 計算軌道取樣點
        const samples = 360;
        const periodMs = b.period_days * 86400000;
        const pts: [number, number, number][] = [];
        const DEG2RAD = Math.PI / 180;
        const TWO_PI = 2 * Math.PI;
        const JD_UNIX_EPOCH = 2440587.5;
        const epochMs = (b.epoch_jd - JD_UNIX_EPOCH) * 86400000;

        for (let k = 0; k <= samples; k++) {
          const tMs = initMs + (k / samples) * periodMs;
          const days = (tMs - epochMs) / 86400000;
          const n = TWO_PI / b.period_days;
          let M = (b.ma * DEG2RAD + n * days) % TWO_PI;
          if (M < 0) M += TWO_PI;
          let E = M;
          for (let j = 0; j < 8; j++) E -= (E - b.e * Math.sin(E) - M) / (1 - b.e * Math.cos(E));
          if (!isFinite(E)) continue;

          const cosE = Math.cos(E), sinE = Math.sin(E);
          const x_orb = b.a * (cosE - b.e);
          const y_orb = b.a * Math.sqrt(1 - b.e * b.e) * sinE;
          const wRad = b.w * DEG2RAD, omRad = b.om * DEG2RAD, iRad = b.i * DEG2RAD;
          const cosW = Math.cos(wRad), sinW = Math.sin(wRad);
          const cosO = Math.cos(omRad), sinO = Math.sin(omRad);
          const cosI = Math.cos(iRad), sinI = Math.sin(iRad);
          const xEcl = (cosO * cosW - sinO * sinW * cosI) * x_orb + (-cosO * sinW - sinO * cosW * cosI) * y_orb;
          const yEcl = (sinO * cosW + cosO * sinW * cosI) * x_orb + (-sinO * sinW + cosO * cosW * cosI) * y_orb;
          const zEcl = (sinW * sinI) * x_orb + (cosW * sinI) * y_orb;
          const dist = Math.sqrt(xEcl * xEcl + yEcl * yEcl + zEcl * zEcl);
          if (dist > 80) continue; // 截斷太遠的部分
          const r = auToScene(dist);
          const s = r / (dist || 1);
          pts.push([xEcl * s, zEcl * s, -yEcl * s]);
        }

        if (pts.length > 10) {
          const orbit = new OrbitPath(this.scene, pts, color);
          orbit.setOpacity(0.1);
          this.sbCometOrbits.push(orbit);
        }
      }
    }
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
    for (const orbit of this.cometOrbits) orbit.dispose(this.scene);
    for (const orbit of this.sbCometOrbits) orbit.dispose(this.scene);

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
