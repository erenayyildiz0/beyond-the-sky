import * as THREE from "three";
import type { Sky } from "../app/assets";

/** 3D takımyıldız çizgileri (SPEC §6.5.5): gerçek konumlar arasında; kamera yaklaştıkça şekil kendiliğinden bozulur. */
export function createConstellationLines(sky: Sky, starPosLy: Float32Array) {
  const group = new THREE.Group();
  const mats: Record<string, THREE.LineBasicMaterial> = {};
  for (const [key, pairs] of Object.entries(sky.constellations)) {
    const pts: number[] = [];
    for (const [a, b] of pairs) pts.push(...starPosLy.subarray(a * 3, a * 3 + 3), ...starPosLy.subarray(b * 3, b * 3 + 3));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.LineBasicMaterial({ color: "#8FB8FF", transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
    const lines = new THREE.LineSegments(geo, mat);
    lines.frustumCulled = false;
    lines.renderOrder = 1;
    mats[key] = mat;
    group.add(lines);
  }
  return {
    group,
    /** opacity: genel (z'ye göre), casBoost: Kraliçe durağında 0,6 */
    update(opacity: number, casBoost: number) {
      for (const [k, m] of Object.entries(mats)) m.opacity = k === "cas" ? Math.max(opacity * 0.35, casBoost * 0.6) : opacity * 0.35;
    },
  };
}
