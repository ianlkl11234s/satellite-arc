/**
 * 3D 地球球體 + 大氣光暈
 */

import * as THREE from "three";

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

export class EarthMesh {
  group: THREE.Group;
  private globe: THREE.Mesh;
  private atmosphere: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();

    // 地球球體
    const geo = new THREE.SphereGeometry(1.0, 64, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x111122,
    });
    this.globe = new THREE.Mesh(geo, mat);
    this.group.add(this.globe);

    // 大氣光暈（稍大的球，Fresnel 效果）
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

    // 載入地球貼圖
    const loader = new THREE.TextureLoader();
    loader.load("/textures/earth-dark.jpg", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      (this.globe.material as THREE.MeshBasicMaterial).map = texture;
      (this.globe.material as THREE.MeshBasicMaterial).color.set(0xffffff);
      (this.globe.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }, undefined, () => {
      // 貼圖載入失敗，用程序化的暗色大陸
      this.createProceduralEarth();
    });
  }

  private createProceduralEarth() {
    // 簡單的暗色球體 + 經緯線
    const mat = this.globe.material as THREE.MeshBasicMaterial;
    mat.color.set(0x0a0a18);
    mat.needsUpdate = true;

    // 加經緯線
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x1a1a3a,
      transparent: true,
      opacity: 0.3,
    });

    // 緯線
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

    // 經線
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
