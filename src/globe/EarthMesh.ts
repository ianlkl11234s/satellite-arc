/**
 * 3D 地球球體 + 日夜交替 + 大氣光暈
 */

import * as THREE from "three";

/* ── 大氣光暈 Shader ─────────────────────────── */

const ATMOSPHERE_VERT = `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ATMOSPHERE_FRAG = `
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vec3 viewDir = normalize(-vPosition);
  float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
  float intensity = pow(rim, 3.0) * 0.6;
  gl_FragColor = vec4(0.3, 0.6, 1.0, intensity);
}
`;

/* ── 日夜交替 Shader ─────────────────────────── */

const EARTH_VERT = `
varying vec2 vUv;
varying vec3 vNormalW;
void main() {
  vUv = uv;
  vNormalW = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const EARTH_FRAG = `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform vec3 sunDirection;

varying vec2 vUv;
varying vec3 vNormalW;

void main() {
  vec4 dayColor = texture2D(dayMap, vUv);
  vec4 nightColor = texture2D(nightMap, vUv);

  // dot(normal, sunDir): 1=正午, 0=晨昏線, -1=午夜
  float sunDot = dot(vNormalW, sunDirection);

  // 平滑過渡帶（晨昏線 ± 0.15 範圍）
  float blend = smoothstep(-0.15, 0.15, sunDot);

  // 夜間加亮城市燈光（讓夜景更明顯）
  vec4 nightBoosted = nightColor * 1.2;

  // 白天稍微降低亮度避免太刺眼
  vec4 dayDimmed = dayColor * (0.7 + 0.3 * max(sunDot, 0.0));

  gl_FragColor = mix(nightBoosted, dayDimmed, blend);
}
`;

/* ── 太陽位置計算 ─────────────────────────────── */

function getSunDirection(date: Date): THREE.Vector3 {
  // 簡化太陽位置：基於日期計算太陽赤經赤緯
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const hourUTC = date.getUTCHours() + date.getUTCMinutes() / 60;

  // 太陽赤緯（-23.45° ~ +23.45°）
  const declination = -23.45 * Math.cos((2 * Math.PI * (dayOfYear + 10)) / 365);
  const decRad = (declination * Math.PI) / 180;

  // 太陽時角：UTC 12:00 = 經度 0°
  const hourAngle = ((hourUTC - 12) / 24) * 2 * Math.PI;

  // 轉成 3D 方向（Y-up 座標系，lng=0 朝 +Z → 我們的座標系 lng=0 朝 -Z）
  const x = Math.cos(decRad) * Math.sin(hourAngle);
  const y = Math.sin(decRad);
  const z = -Math.cos(decRad) * Math.cos(hourAngle);

  return new THREE.Vector3(x, y, z).normalize();
}

/* ── EarthMesh Class ─────────────────────────── */

export class EarthMesh {
  group: THREE.Group;
  private globe: THREE.Mesh;
  private atmosphere: THREE.Mesh;
  private earthMat: THREE.ShaderMaterial | null = null;

  constructor() {
    this.group = new THREE.Group();

    // 地球球體 — 先用暗色佔位，貼圖載入後切換到 ShaderMaterial
    const geo = new THREE.SphereGeometry(1.0, 64, 64);
    const placeholderMat = new THREE.MeshBasicMaterial({ color: 0x111122 });
    this.globe = new THREE.Mesh(geo, placeholderMat);
    this.group.add(this.globe);

    // 大氣光暈
    const atmoGeo = new THREE.SphereGeometry(1.02, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERT,
      fragmentShader: ATMOSPHERE_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    this.group.add(this.atmosphere);

    // 載入兩張貼圖
    const loader = new THREE.TextureLoader();
    const dayPromise = new Promise<THREE.Texture>((resolve, reject) => {
      loader.load("/textures/earth-day.jpg", (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      }, undefined, reject);
    });
    const nightPromise = new Promise<THREE.Texture>((resolve, reject) => {
      loader.load("/textures/earth-dark.jpg", (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      }, undefined, reject);
    });

    Promise.all([dayPromise, nightPromise])
      .then(([dayTex, nightTex]) => {
        this.earthMat = new THREE.ShaderMaterial({
          vertexShader: EARTH_VERT,
          fragmentShader: EARTH_FRAG,
          uniforms: {
            dayMap: { value: dayTex },
            nightMap: { value: nightTex },
            sunDirection: { value: getSunDirection(new Date()) },
          },
        });
        this.globe.material = this.earthMat;
      })
      .catch(() => {
        // 貼圖載入失敗，fallback 夜景
        loader.load("/textures/earth-dark.jpg", (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          (this.globe.material as THREE.MeshBasicMaterial).map = texture;
          (this.globe.material as THREE.MeshBasicMaterial).color.set(0xffffff);
          (this.globe.material as THREE.MeshBasicMaterial).needsUpdate = true;
        }, undefined, () => {
          this.createProceduralEarth();
        });
      });
  }

  /** 每幀呼叫，更新太陽方向 */
  updateSunDirection(simDate: Date) {
    if (this.earthMat) {
      this.earthMat.uniforms.sunDirection.value.copy(getSunDirection(simDate));
    }
  }

  private createProceduralEarth() {
    const mat = this.globe.material as THREE.MeshBasicMaterial;
    mat.color.set(0x0a0a18);
    mat.needsUpdate = true;

    const gridMat = new THREE.LineBasicMaterial({
      color: 0x1a1a3a,
      transparent: true,
      opacity: 0.3,
    });

    for (let lat = -60; lat <= 60; lat += 30) {
      const points: THREE.Vector3[] = [];
      const latRad = (lat * Math.PI) / 180;
      for (let lng = 0; lng <= 360; lng += 5) {
        const lngRad = (lng * Math.PI) / 180;
        points.push(
          new THREE.Vector3(
            1.001 * Math.cos(latRad) * Math.cos(lngRad),
            1.001 * Math.sin(latRad),
            -1.001 * Math.cos(latRad) * Math.sin(lngRad),
          ),
        );
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      this.group.add(new THREE.Line(lineGeo, gridMat));
    }

    for (let lng = 0; lng < 360; lng += 30) {
      const points: THREE.Vector3[] = [];
      const lngRad = (lng * Math.PI) / 180;
      for (let lat = -90; lat <= 90; lat += 5) {
        const latRad = (lat * Math.PI) / 180;
        points.push(
          new THREE.Vector3(
            1.001 * Math.cos(latRad) * Math.cos(lngRad),
            1.001 * Math.sin(latRad),
            -1.001 * Math.cos(latRad) * Math.sin(lngRad),
          ),
        );
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      this.group.add(new THREE.Line(lineGeo, gridMat));
    }
  }
}
