import * as THREE from "three";
import vert from "./shaders/skyline.vert.glsl?raw";
import frag from "./shaders/skyline.frag.glsl?raw";
import { DEG } from "../science/coords";
import { mulberry32 } from "./rng";

const W = 4096, H = 256;
export const SKYLINE_ALT_MIN = -3, SKYLINE_ALT_MAX = 14;     // bant (derece)
const RADIUS = 800;

/** Veri dokusu (SPEC §6.4): R bina maskesi, G pencere (0/128/255), B sönme eşiği; A hep 255. */
export function skylineData(seed = 42) {
  const rnd = mulberry32(seed);
  const data = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) data[i * 4 + 3] = 255;
  const pxPerDegX = W / 360, pxPerDegY = H / (SKYLINE_ALT_MAX - SKYLINE_ALT_MIN);
  const rowOfAlt = (a: number) => Math.round((a - SKYLINE_ALT_MIN) * pxPerDegY);
  const horizonRow = rowOfAlt(0);
  let x = 0;
  while (x < W) {
    const wDeg = 0.6 + rnd() * 1.4;
    const tower = rnd() < 0.07;
    const hDeg = tower ? 7 + rnd() * 4 : 1.5 + Math.pow(rnd(), 1.6) * 5.5;
    const w = Math.max(3, Math.round(wDeg * pxPerDegX));
    const top = rowOfAlt(hDeg);
    const x1 = Math.min(W, x + w);
    for (let cx = x; cx < x1; cx++) {
      for (let r = 0; r < top; r++) data[(r * W + cx) * 4] = 255;
    }
    // Pencereler: 4×6 px ızgara, her hücrede 2×3 px pencere
    for (let gx = x + 1; gx + 2 < x1 - 1; gx += 4) {
      for (let gy = horizonRow + 2; gy + 3 < top - 2; gy += 6) {
        const lit = rnd() < 0.55;
        const g = lit ? (rnd() < 0.4 ? 128 : 255) : 0;
        const theta = Math.round((0.02 + rnd() * 0.96) * 255);
        for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 3; dy++) {
          const k = ((gy + dy) * W + gx + dx) * 4;
          data[k + 1] = g;
          data[k + 2] = theta;
        }
      }
    }
    x = x1 + (rnd() < 0.15 ? Math.round(rnd() * 0.4 * pxPerDegX) : 0);   // ara sıra boşluk
  }
  // Ufkun altı (zemin) her yerde dolu
  for (let r = 0; r <= horizonRow; r++) for (let cx = 0; cx < W; cx++) data[(r * W + cx) * 4] = 255;
  return data;
}

export function createSkyline() {
  const tex = new THREE.DataTexture(skylineData(), W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.colorSpace = THREE.NoColorSpace;          // veri
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  const yMin = RADIUS * Math.tan(SKYLINE_ALT_MIN * DEG), yMax = RADIUS * Math.tan(SKYLINE_ALT_MAX * DEG);
  const geo = new THREE.CylinderGeometry(RADIUS, RADIUS, yMax - yMin, 512, 1, true);
  geo.translate(0, (yMax + yMin) / 2, 0);
  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    transparent: true,
    uniforms: {
      uData: { value: tex },
      uP: { value: 0 },
      uAltMin: { value: SKYLINE_ALT_MIN },
      uAltMax: { value: SKYLINE_ALT_MAX },
      uOpacity: { value: 1 },
      uDrop: { value: 0 },
      uBuilding: { value: new THREE.Color("#05060A") },
      uCold: { value: new THREE.Color("#DDE8FF") },
      uWarm: { value: new THREE.Color("#FFD9A0") },
    },
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = 10;
  mesh.frustumCulled = false;
  return { mesh, material };
}
