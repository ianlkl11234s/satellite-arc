/**
 * 行星軌道橢圓路徑
 */

import * as THREE from "three";

export class OrbitPath {
  private line: THREE.Line;

  constructor(
    scene: THREE.Scene,
    points: [number, number, number][],
    color: number,
  ) {
    const positions = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      positions[i * 3] = points[i][0];
      positions[i * 3 + 1] = points[i][1];
      positions[i * 3 + 2] = points[i][2];
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });

    this.line = new THREE.Line(geo, mat);
    scene.add(this.line);
  }

  setOpacity(opacity: number) {
    (this.line.material as THREE.LineBasicMaterial).opacity = opacity;
  }

  setVisible(v: boolean) {
    this.line.visible = v;
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.line);
    this.line.geometry.dispose();
    (this.line.material as THREE.Material).dispose();
  }
}
