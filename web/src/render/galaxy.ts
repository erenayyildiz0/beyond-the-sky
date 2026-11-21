import * as THREE from "three";
import planeVert from "./shaders/galaxyPlane.vert.glsl?raw";
import planeFrag from "./shaders/galaxyPlane.frag.glsl?raw";
import pointsVert from "./shaders/galaxyPoints.vert.glsl?raw";
import pointsFrag from "./shaders/galaxyPoints.frag.glsl?raw";
import { mulberry32 } from "./rng";

/** Galaksinin yönü: x ekseni (haritanın sağı), y ekseni (haritanın üstü), normal; merkez ışık yılı (deep katmanı). */
export interface GalaxyFrame { center: THREE.Vector3; x: THREE.Vector3; y: THREE.Vector3; n: THREE.Vector3 }
export interface GalaxyShape { halfLy: number; hDiskLy: number; hBulgeLy: number; rBulgeLy: number }

/** Bir emisyon katmanının ağırlığı (galaxyPlane.frag.glsl ile aynı formül; test için). */
export function planeWeight(z: number, r: number, s: GalaxyShape, delta: number) {
  const h = s.hDiskLy + s.hBulgeLy * Math.exp(-r / s.rBulgeLy);
  return Math.min(1, delta / (2.5066 * h) * Math.exp(-0.5 * z * z / (h * h)));
}

/** Katman yükseklikleri (galaksi merkezine göre, ışık yılı) */
export function planeHeights(s: GalaxyShape, planes: number) {
  const hMax = 2 * (s.hDiskLy + s.hBulgeLy);
  const delta = (2 * hMax) / (planes - 1);
  return { delta, z: Array.from({ length: planes }, (_, i) => -hMax + i * delta) };
}

/**
 * Katmanlı galaksi (R2, temsili; konum, yön ve boyut gerçek): yüz-üstü harita galaksi düzleminde üst üste ince
 * emisyon katmanları ve ortada toz katmanları olarak çizilir. Üstten sarmal, yandan toz şeritli ince disk görünür.
 */
export function createLayeredGalaxy(f: GalaxyFrame, s: GalaxyShape, planes: number, dustPlanes = 5) {
  const group = new THREE.Group();
  group.position.copy(f.center);
  group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.x, f.y, f.n));
  const geo = new THREE.PlaneGeometry(2 * s.halfLy, 2 * s.halfLy, 1, 1);
  const { delta, z: heights } = planeHeights(s, planes);
  const mats: THREE.ShaderMaterial[] = [];
  const emission: THREE.Mesh[] = [];
  const mk = (z: number, dust: boolean) => {
    const m = new THREE.ShaderMaterial({
      vertexShader: planeVert, fragmentShader: planeFrag, transparent: true, depthWrite: false, depthTest: false,
      side: THREE.DoubleSide,
      blending: dust ? THREE.NormalBlending : THREE.AdditiveBlending,
      uniforms: {
        uMap: { value: null }, uZ: { value: z }, uDelta: { value: delta }, uHDisk: { value: s.hDiskLy }, uHBulge: { value: s.hBulgeLy },
        uRBulge: { value: s.rBulgeLy }, uOpacity: { value: 0 }, uGain: { value: 1 }, uDust: { value: dust ? 1 : 0 },
        uDustN: { value: dustPlanes }, uCamFade: { value: 1 },
      },
    });
    mats.push(m);
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.z = z;
    mesh.frustumCulled = false;
    group.add(mesh);
    if (!dust) emission.push(mesh);
  };
  for (const z of heights) mk(z, false);
  for (let i = 0; i < dustPlanes; i++) mk((i / (dustPlanes - 1) - 0.5) * 1.2 * s.hDiskLy, true);
  const camLocal = new THREE.Vector3();
  const inv = new THREE.Matrix4();
  return {
    group, frame: f, shape: s,
    setMap(t: THREE.Texture) { for (const m of mats) m.uniforms.uMap.value = t; },
    /** opacity: görünürlük; camLy: kamera (ışık yılı); kameranın içinden geçtiği katmanlar yumuşakça söner */
    update(opacity: number, camLy: THREE.Vector3, gain = 1) {
      group.visible = opacity > 0.002;
      if (!group.visible) return;
      group.updateMatrixWorld();
      camLocal.copy(camLy).applyMatrix4(inv.copy(group.matrixWorld).invert());
      const inside = Math.hypot(camLocal.x, camLocal.y) < s.halfLy;
      // Uyarlamalı katman: yüzden bakınca dikey yapı görünmez → her 4. katman (ağırlık ×4), yandan bakınca hepsi.
      // Ekran kartı her katmanda bütün diski boyadığı için bu, üstten görünümde maliyeti ~4 kat azaltır.
      const cosv = Math.abs(camLocal.z) / Math.max(camLocal.length(), 1e-9);
      const stride = inside ? 1 : cosv > 0.75 ? 4 : cosv > 0.4 ? 2 : 1;
      const mid = Math.floor(emission.length / 2);
      emission.forEach((mesh, i) => {
        mesh.visible = (i - mid) % stride === 0;
        (mesh.material as THREE.ShaderMaterial).uniforms.uDelta.value = delta * stride;
      });
      for (const m of mats) {
        const dz = Math.abs(camLocal.z - m.uniforms.uZ.value);
        m.uniforms.uOpacity.value = opacity;
        m.uniforms.uGain.value = gain;
        m.uniforms.uCamFade.value = inside ? Math.min(1, Math.max(0, (dz - 0.05 * s.hDiskLy) / (1.5 * s.hDiskLy))) : 1;
      }
    },
  };
}

/** SPEC §3.13 Samanyolu parçacıkları (galaksi yerel koordinatlarında, ışık yılı); Güneş çevresi silinir. */
export function createGalaxyParticles(f: GalaxyFrame, count: number, opts: { sunLocal?: THREE.Vector3; nearR: number; spiral: boolean; radiusK: number }) {
  const rnd = mulberry32(2024);
  const gauss = () => { const u = Math.max(rnd(), 1e-9), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), size = new Float32Array(count);
  const phi0 = Math.PI - Math.log(26.7 / 4) / Math.tan(12 * Math.PI / 180);
  const core = new THREE.Color("#FFD8A8"), armC = new THREE.Color("#CFE0FF"), c = new THREE.Color();
  const K = opts.radiusK;                                        // ölçek: 1 birim = K × 1000 ışık yılı / 50
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0, t = 0;
    const p = rnd();
    if (!opts.spiral) {                                          // düzensiz bulut
      x = gauss() * 0.35; y = gauss() * 0.3; z = gauss() * 0.1; t = 0.5;
    } else if (p < 0.82) {                                       // kollar
      const r = 50 * Math.pow(rnd(), 0.6), kol = i % 2;
      const th = phi0 + kol * Math.PI + Math.log(Math.max(r, 4) / 4) / Math.tan(12 * Math.PI / 180) + gauss() * 0.35 * (1 - r / 60);
      x = r * Math.cos(th) / 50; y = r * Math.sin(th) / 50; z = gauss() * (0.6 + 2.5 * Math.exp(-r / 6)) / 50;
      t = Math.min(1, r / 30);
    } else if (p < 0.9) {                                        // çubuk, 25° döndürülmüş
      const bx = (rnd() * 2 - 1) * 9, by = gauss() * 2.5, a = 25 * Math.PI / 180;
      x = (bx * Math.cos(a) - by * Math.sin(a)) / 50; y = (bx * Math.sin(a) + by * Math.cos(a)) / 50; z = gauss() * 0.8 / 50;
    } else {                                                     // şişkinlik
      x = gauss() * 3 / 50; y = gauss() * 3 / 50; z = gauss() * 3 / 50;
    }
    pos.set([x * K, y * K, z * K], i * 3);
    c.copy(core).lerp(armC, t);
    col.set([c.r, c.g, c.b], i * 3);
    size[i] = 1 + rnd() * 1.5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: pointsVert, fragmentShader: pointsFrag, transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, premultipliedAlpha: true,
    uniforms: {
      uSize: { value: 1 }, uPixelRatio: { value: 1 }, uOpacity: { value: 0 }, uNearR: { value: opts.nearR },
      uSunLocal: { value: opts.sunLocal ?? new THREE.Vector3(-1e9, 0, 0) },
    },
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.position.copy(f.center);
  pts.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(f.x, f.y, f.n));
  return { obj: pts, mat };
}
