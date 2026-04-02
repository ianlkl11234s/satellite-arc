/**
 * 行星球體 + 貼圖 + CSS2D Label + 大氣光暈
 */

import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import type { PlanetDef } from "./planetData";

/* ── 大氣光暈 Shader ──────────────────────── */

const ATMO_VERT = `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ATMO_FRAG = `
uniform vec3 glowColor;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vec3 viewDir = normalize(-vPosition);
  float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
  float intensity = pow(rim, 2.5) * 0.6;
  gl_FragColor = vec4(glowColor, intensity);
}
`;

export class PlanetMesh {
  group: THREE.Group;
  readonly name: string;
  private sphere: THREE.Mesh;
  private atmoMesh: THREE.Mesh;

  constructor(planet: PlanetDef) {
    this.name = planet.name;
    this.group = new THREE.Group();

    // 行星球體 — 先用 fallback 色
    const geo = new THREE.SphereGeometry(planet.visualRadius, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: planet.color,
      roughness: 0.8,
      metalness: 0.05,
      emissive: new THREE.Color(planet.color),
      emissiveIntensity: 0.15,
    });
    this.sphere = new THREE.Mesh(geo, mat);
    this.group.add(this.sphere);

    // 載入貼圖
    const loader = new THREE.TextureLoader();
    loader.load(planet.texture, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      (this.sphere.material as THREE.MeshStandardMaterial).map = tex;
      (this.sphere.material as THREE.MeshStandardMaterial).emissiveMap = tex;
      (this.sphere.material as THREE.MeshStandardMaterial).needsUpdate = true;
    });

    // 大氣光暈（微微光圈）
    const atmoGeo = new THREE.SphereGeometry(planet.visualRadius * 1.25, 24, 24);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: ATMO_VERT,
      fragmentShader: ATMO_FRAG,
      uniforms: {
        glowColor: { value: new THREE.Color(planet.color) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    this.group.add(this.atmoMesh);

    // 土星環
    if (planet.name === "saturn") {
      this.addSaturnRing(planet.visualRadius);
    }

    // CSS2D Label
    const div = document.createElement("div");
    div.textContent = planet.label;
    Object.assign(div.style, {
      fontFamily: "'Inter', sans-serif",
      fontSize: "11px",
      color: "rgba(255,255,255,0.8)",
      padding: "2px 8px",
      background: "rgba(0,0,0,0.5)",
      borderRadius: "4px",
      pointerEvents: "none",
      whiteSpace: "nowrap",
      userSelect: "none",
      letterSpacing: "0.3px",
    });
    const label = new CSS2DObject(div);
    label.position.set(0, planet.visualRadius + 0.35, 0);
    label.layers.set(0);
    this.group.add(label);
  }

  private addSaturnRing(planetRadius: number) {
    const innerR = planetRadius * 1.3;
    const outerR = planetRadius * 2.4;
    const ringGeo = new THREE.RingGeometry(innerR, outerR, 64);
    // 修正 UV 讓貼圖正確映射到環上
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      uv.setXY(i, (dist - innerR) / (outerR - innerR), 0.5);
    }

    const loader = new THREE.TextureLoader();
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xead6a6,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    loader.load("/textures/saturn_ring.png", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      ringMat.map = tex;
      ringMat.needsUpdate = true;
    });

    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2 + 0.47; // 土星軸傾斜 ~27°
    this.group.add(ring);
  }

  setPosition(x: number, y: number, z: number) {
    this.group.position.set(x, y, z);
  }

  setScale(s: number) {
    this.sphere.scale.setScalar(s);
    this.atmoMesh.scale.setScalar(s);
  }

  setGlowOpacity(opacity: number) {
    this.atmoMesh.visible = opacity > 0.01;
    (this.atmoMesh.material as THREE.ShaderMaterial).opacity = opacity;
  }
}

/** 月球 mesh — 有貼圖 */
export class MoonMesh {
  group: THREE.Group;

  constructor(color: number, radius: number, label: string, texture?: string) {
    this.group = new THREE.Group();

    const geo = new THREE.SphereGeometry(radius, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: 0.0,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.2,
    });
    const sphere = new THREE.Mesh(geo, mat);
    this.group.add(sphere);

    if (texture) {
      const loader = new THREE.TextureLoader();
      loader.load(texture, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        mat.map = tex;
        mat.emissiveMap = tex;
        mat.needsUpdate = true;
      });
    }

    const div = document.createElement("div");
    div.textContent = label;
    Object.assign(div.style, {
      fontFamily: "'Inter', sans-serif",
      fontSize: "10px",
      color: "rgba(255,255,255,0.6)",
      padding: "1px 5px",
      background: "rgba(0,0,0,0.4)",
      borderRadius: "3px",
      pointerEvents: "none",
      whiteSpace: "nowrap",
      userSelect: "none",
    });
    const cssLabel = new CSS2DObject(div);
    cssLabel.position.set(0, radius + 0.18, 0);
    this.group.add(cssLabel);
  }

  setPosition(x: number, y: number, z: number) {
    this.group.position.set(x, y, z);
  }
}
