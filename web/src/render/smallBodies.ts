import * as THREE from "three";
import { enuToThree } from "../science/coords";

/** Grup renkleri (temsili): kayalık ana kuşak, Truvalılar, buzlu Kuiper kuşağı. Sıra sky.json smallbodies.groups ile aynı. */
const GROUP_RGB: [number, number, number][] = [[1.0, 0.84, 0.62], [1.0, 0.72, 0.5], [0.55, 0.75, 1.0]];
/** Parlaklığın yarıya indiği kamera uzaklığı (AB): kalabalık ana kuşak uzaktan taşmasın, seyrek Kuiper kuşağı görünsün */
const GROUP_REF_AU = [7, 9, 170];

const vert = /* glsl */ `
uniform float uPixelRatio;
attribute vec3 aColor;
attribute float aRef;
varying vec3 vColor;
varying float vA;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vA = clamp(aRef / max(-mv.z, 1e-6), 0.08, 1.0);
  gl_PointSize = (1.3 + 0.9 * vA) * uPixelRatio;
  gl_Position = projectionMatrix * mv;
}`;
const frag = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vA;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(0.5, 1.0, r)) * uOpacity * vA;
  gl_FragColor = vec4(vColor * a, a);
}`;

/**
 * Asteroit kuşağı, Jüpiter Truvalıları ve Kuiper kuşağı (solar katmanı, birim AB): gözlem gecesindeki gerçek konumlar
 * (JPL SBDB yörüngeleri, pipeline'da Kepler taşıması). Her nokta bir cisim; boyutları noktadan küçük.
 * buf: N×3 float32 (güneş merkezli ENU, AB) + N uint8 grup; keep: telefonda seyreltme oranı.
 */
export function createSmallBodies(buf: ArrayBuffer, count: number, sunPos: THREE.Vector3, keep = 1) {
  const P = new Float32Array(buf, 0, count * 3);
  const G = new Uint8Array(buf, count * 12, count);
  const step = Math.max(1, Math.round(1 / keep));
  const n = Math.ceil(count / step);
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), ref = new Float32Array(n);
  const v = new THREE.Vector3();
  for (let i = 0, j = 0; i < count; i += step, j++) {
    enuToThree(P[i * 3], P[i * 3 + 1], P[i * 3 + 2], v).add(sunPos);
    pos.set([v.x, v.y, v.z], j * 3);
    col.set(GROUP_RGB[G[i]] ?? GROUP_RGB[0], j * 3);
    ref[j] = GROUP_REF_AU[G[i]] ?? GROUP_REF_AU[0];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aRef", new THREE.BufferAttribute(ref, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uPixelRatio: { value: 1 }, uOpacity: { value: 0.75 } },
  });
  const obj = new THREE.Points(geo, material);
  obj.frustumCulled = false;
  return { obj, material, base: 0.75 };
}
