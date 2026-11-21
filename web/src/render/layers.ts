import * as THREE from "three";
import type { Sky } from "../app/assets";
import { LY_KM } from "../science/constants";
import { createSkyDome } from "./skyDome";

/**
 * Ölçek katmanları (SPEC §6.5.1). Kamera 10^3,6 km'den 10^19,3 km'ye uzaklaşır; tek sahnede float32 ve
 * derinlik tamponu bozulur. Her katman kendi biriminde çizilir; ana kamera konumu JS'te float64 km.
 */
export interface ScaleLayer {
  name: "cosmic" | "deep" | "bh" | "star" | "solar" | "earth";
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  unitKm: number;
  originKm: THREE.Vector3;               // three.js çerçevesinde, Ankara'ya göre
  weight(z: number): number;
  applyWeight(w: number): void;          // malzeme opaklıkları
  nearFar(camPos: THREE.Vector3): [number, number];   // katman biriminde kamera konumu → near/far
}

export function renderLayers(r: THREE.WebGLRenderer, layers: ScaleLayer[], camPosKm: THREE.Vector3, q: THREE.Quaternion, z: number) {
  r.clear();
  for (const L of layers) {                                // sıra: cosmic → deep → solar → earth (uzaktan yakına)
    const w = L.weight(z);
    if (w <= 0.001) continue;
    L.applyWeight(w);
    L.camera.quaternion.copy(q);
    L.camera.position.copy(camPosKm).sub(L.originKm).divideScalar(L.unitKm);
    const [n, f] = L.nearFar(L.camera.position);
    L.camera.near = n; L.camera.far = f; L.camera.updateProjectionMatrix();
    r.clearDepth();
    r.render(L.scene, L.camera);
  }
}

/**
 * Sahnedeki bütün malzemelerin gölgelendiricilerini önceden derle (gizli nesneler dahil). Yoksa her katman ekrana ilk
 * geldiğinde tarayıcı derler ve o kare 50–400 ms takılır. compileAsync, destekleyen tarayıcıda (KHR_parallel_shader_compile)
 * ana iş parçacığını bekletmez.
 */
export function precompile(r: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const hidden: THREE.Object3D[] = [];
  scene.traverse(o => { if (!o.visible) { hidden.push(o); o.visible = true; } });
  try { r.compileAsync(scene, camera).catch(() => {}); } catch { /* derleme hatası çizimde zaten görünür */ }
  for (const o of hidden) o.visible = false;
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
