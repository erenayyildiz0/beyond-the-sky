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
