import * as THREE from "three";
import vert from "./shaders/marker.vert.glsl?raw";
import frag from "./shaders/marker.frag.glsl?raw";

/** Ekran uzayında sabit boyutlu nokta kümesi (Güneş Sistemi gövdeleri, işaretler). */
export function createMarkers(points: { pos: THREE.Vector3; size: number; color: THREE.ColorRepresentation }[], glow = 0) {
  const n = points.length;
  const pos = new Float32Array(n * 3), size = new Float32Array(n), col = new Float32Array(n * 3);
  const c = new THREE.Color();
  points.forEach((p, i) => {
    pos.set([p.pos.x, p.pos.y, p.pos.z], i * 3);
    size[i] = p.size;
    c.set(p.color);
    col.set([c.r, c.g, c.b], i * 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  const material = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, premultipliedAlpha: true,
    uniforms: { uPixelRatio: { value: 1 }, uOpacity: { value: 1 }, uGlow: { value: glow } },
  });
  const obj = new THREE.Points(geo, material);
  obj.frustumCulled = false;
  return { obj, material };
}

/** Normali n olan düzlemde, merkezi c, yarıçapı r olan daire (LineLoop). */
export function circleLine(c: THREE.Vector3, n: THREE.Vector3, r: number, color: THREE.ColorRepresentation, opacity: number, segs = 256) {
  const a = new THREE.Vector3().crossVectors(n, Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize();
  const b = new THREE.Vector3().crossVectors(n, a).normalize();
  const pts: number[] = [];
  for (let i = 0; i < segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    pts.push(c.x + r * (Math.cos(t) * a.x + Math.sin(t) * b.x), c.y + r * (Math.cos(t) * a.y + Math.sin(t) * b.y),
             c.z + r * (Math.cos(t) * a.z + Math.sin(t) * b.z));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });   // cisimlerin arkasında kalsın
  const line = new THREE.LineLoop(geo, mat);
  line.frustumCulled = false;
  return { line, mat, base: opacity };
}
