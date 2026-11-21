import * as THREE from "three";
import type { Sky } from "../app/assets";
import { LY_KM } from "../science/constants";
import { createSkyDome } from "./skyDome";

/**
 * Ölçek katmanları (SPEC §6.5.1). Kamera 10^3,6 km'den 10^19,3 km'ye uzaklaşır; tek sahnede float32 ve
 * derinlik tamponu bozulur. Her katman kendi biriminde çizilir; ana kamera konumu JS'te float64 km.
 */
export interface ScaleLayer {
  name: "deep" | "solar" | "earth";
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  unitKm: number;
  originKm: THREE.Vector3;               // three.js çerçevesinde, Ankara'ya göre
  weight(z: number): number;
  applyWeight(w: number): void;          // malzeme opaklıkları
  nearFar(distUnits: number): [number, number];
}

export function renderLayers(r: THREE.WebGLRenderer, layers: ScaleLayer[], camPosKm: THREE.Vector3, q: THREE.Quaternion, z: number) {
  r.clear();
  for (const L of layers) {                                // sıra: deep → solar → earth (uzaktan yakına)
    const w = L.weight(z);
    if (w <= 0.001) continue;
    L.applyWeight(w);
    L.camera.quaternion.copy(q);
    L.camera.position.copy(camPosKm).sub(L.originKm).divideScalar(L.unitKm);
    const [n, f] = L.nearFar(L.camera.position.length());
    L.camera.near = n; L.camera.far = f; L.camera.updateProjectionMatrix();
    r.clearDepth();
    r.render(L.scene, L.camera);
  }
}

/** Bütün katman kameraları aynı FOV: yatayda 60°, dikeyde 75° (§6.5.1). */
export function layerFov(w: number, h: number) { return w / h >= 1 ? 60 : 75; }

/** deep katmanı: birim ışık yılı, orijin Ankara. Samanyolu küresi (uSpace = 1) + yıldızlar. */
export function createDeepScene(sky: Sky, milkyWay: THREE.Texture, stars: THREE.Points) {
  const scene = new THREE.Scene();
  const dome = createSkyDome(sky, milkyWay);
  const u = dome.material.uniforms;
  u.uSpace.value = 1;
  u.uExtK.value = 0;
  u.uMWOpacity.value = 1;
  u.uM31Opacity.value = 0;
  scene.add(dome.mesh, stars);
  return { scene, dome, unitKm: LY_KM, originKm: new THREE.Vector3() };
}
