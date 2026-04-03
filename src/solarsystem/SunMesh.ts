/**
 * 太陽球體 + 貼圖 + 外層輝光
 */

import * as THREE from "three";
import { SUN_VISUAL_RADIUS } from "./planetData";

/* ── 太陽表面 Shader（貼圖 + 脈動） ─────── */

const SUN_VERT = `
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SUN_FRAG = `
uniform sampler2D sunMap;
uniform float time;
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vec4 texColor = texture2D(sunMap, vUv);

  // 微微脈動：邊緣稍亮
  float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
  float pulse = 1.0 + 0.05 * sin(time * 1.5);

  vec3 color = texColor.rgb * pulse * (1.0 + rim * 0.3);
  gl_FragColor = vec4(color, 1.0);
}
`;

/* ── 外層輝光 Shader ──────────────────────── */

const GLOW_VERT = `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const GLOW_FRAG = `
uniform vec3 glowColor;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vec3 viewDir = normalize(-vPosition);
  float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
  float intensity = pow(rim, 1.8) * 1.0;
  gl_FragColor = vec4(glowColor, intensity);
}
`;

export class SunMesh {
  group: THREE.Group;
  private sunMat: THREE.ShaderMaterial | null = null;

  constructor() {
    this.group = new THREE.Group();

    // 太陽球體 — 先用 MeshBasicMaterial 佔位
    const geo = new THREE.SphereGeometry(SUN_VISUAL_RADIUS, 48, 48);
    const placeholder = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
    const sphere = new THREE.Mesh<THREE.SphereGeometry, THREE.Material>(geo, placeholder);
    this.group.add(sphere);

    // 載入太陽貼圖
    const loader = new THREE.TextureLoader();
    loader.load("/textures/sun.jpg", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      this.sunMat = new THREE.ShaderMaterial({
        vertexShader: SUN_VERT,
        fragmentShader: SUN_FRAG,
        uniforms: {
          sunMap: { value: tex },
          time: { value: 0 },
        },
      });
      sphere.material = this.sunMat;
    });

    // 外層輝光
    const glowGeo = new THREE.SphereGeometry(SUN_VISUAL_RADIUS * 1.4, 32, 32);
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      uniforms: {
        glowColor: { value: new THREE.Color(0xff8811) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.group.add(new THREE.Mesh(glowGeo, glowMat));

    // 點光源（更強）
    this.group.add(new THREE.PointLight(0xfff5e0, 2.5, 500));
  }

  /** 每幀呼叫，更新脈動動畫 */
  update(elapsed: number) {
    if (this.sunMat) {
      this.sunMat.uniforms.time.value = elapsed;
    }
  }
}
