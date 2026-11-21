import * as THREE from "three";
import vert from "./shaders/cosmic.vert.glsl?raw";
import frag from "./shaders/cosmic.frag.glsl?raw";
import { mulberry32 } from "./rng";
import { createMarkers } from "./markers";
import { enuToThree } from "../science/coords";

/** cosmic katmanı (R3): birim 1 milyon ışık yılı, orijin Ankara (= Güneş). 2MRS galaksileri + "Buradasın" işareti. */
export function createCosmicScene(data: Float32Array) {
  const n = data.length / 6;
  const pos = new Float32Array(n * 3), r = new Float32Array(n), kind = new Float32Array(n), ba = new Float32Array(n), rot = new Float32Array(n);
  const rnd = mulberry32(99);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const k = i * 6;
    enuToThree(data[k], data[k + 1], data[k + 2], v);              // pipeline ENU → three.js
    pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
    r[i] = data[k + 3] / 1000;                                       // bin ışık yılı → milyon
    kind[i] = data[k + 4]; ba[i] = data[k + 5]; rot[i] = rnd() * Math.PI;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aR", new THREE.BufferAttribute(r, 1));
  geo.setAttribute("aKind", new THREE.BufferAttribute(kind, 1));
  geo.setAttribute("aBA", new THREE.BufferAttribute(ba, 1));
  geo.setAttribute("aRot", new THREE.BufferAttribute(rot, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, premultipliedAlpha: true,
    uniforms: { uFocal: { value: 600 }, uPixelRatio: { value: 1 }, uOpacity: { value: 1 }, uMaxPx: { value: 48 } },
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  const scene = new THREE.Scene();
  const home = createMarkers([{ pos: new THREE.Vector3(), size: 12, color: "#8FB8FF" }], 0);
  home.obj.renderOrder = 2;
  scene.add(points, home.obj);
  return { scene, material, home, positions: pos, count: n };
}

/**
 * 2MRS'in ötesi (R5, TEMSİLİ — gerçek galaksi konumları değil): ~1,3 milyar ışık yılından gözlemlenebilir evrenin kenarına
 * kadar, kozmik ağı andıran (sırt gürültüsüyle seçilmiş) galaksi noktaları. Aynı galaksi malzemesiyle çizilir.
 */
export function createProceduralWeb(count: number, rMinMly: number, rMaxMly: number, material: THREE.ShaderMaterial) {
  const rnd = mulberry32(2026);
  const hash = (x: number, y: number, z: number) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  const noise = (x: number, y: number, z: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const fx = x - xi, fy = y - yi, fz = z - zi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
    const L = (a: number, b: number, t: number) => a + (b - a) * t;
    return L(L(L(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), L(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
             L(L(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), L(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w);
  };
  const CELL = 350;                                                  // tipik boşluk boyutu ölçeği (milyon ışık yılı)
  const pos = new Float32Array(count * 3), r = new Float32Array(count), kind = new Float32Array(count), ba = new Float32Array(count), rot = new Float32Array(count);
  let n = 0, guard = 0;
  while (n < count && guard++ < count * 60) {
    // hacimde düzgün: r³ düzgün
    const rr = Math.cbrt(rMinMly ** 3 + rnd() * (rMaxMly ** 3 - rMinMly ** 3));
    const ct = rnd() * 2 - 1, ph = rnd() * Math.PI * 2, st = Math.sqrt(1 - ct * ct);
    const x = rr * st * Math.cos(ph), y = rr * ct, z = rr * st * Math.sin(ph);
    const ridge = 1 - Math.abs(noise(x / CELL, y / CELL, z / CELL) * 2 - 1);      // sırt: duvarlar ve iplikler
    if (rnd() > ridge ** 6) continue;
    pos.set([x, y, z], n * 3);
    r[n] = (20 + rnd() * 60) / 1000; kind[n] = rnd() < 0.6 ? 1 : 0; ba[n] = 0.3 + rnd() * 0.7; rot[n] = rnd() * Math.PI;
    n++;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos.subarray(0, n * 3), 3));
  geo.setAttribute("aR", new THREE.BufferAttribute(r.subarray(0, n), 1));
  geo.setAttribute("aKind", new THREE.BufferAttribute(kind.subarray(0, n), 1));
  geo.setAttribute("aBA", new THREE.BufferAttribute(ba.subarray(0, n), 1));
  geo.setAttribute("aRot", new THREE.BufferAttribute(rot.subarray(0, n), 1));
  const pts = new THREE.Points(geo, material);
  pts.frustumCulled = false;
  return pts;
}
