import * as THREE from "three";
import type { Sky } from "../app/assets";
import { AU_KM, PLANET_RADIUS_KM, SATURN_EQ_RADIUS_KM, SATURN_RINGS_KM, SUN_RADIUS_KM } from "../science/constants";
import planetVert from "./shaders/planet.vert.glsl?raw";
import planetFrag from "./shaders/planet.frag.glsl?raw";
import ringVert from "./shaders/ring.vert.glsl?raw";
import ringFrag from "./shaders/ring.frag.glsl?raw";
import { dirFromAltAz, enuToThree } from "../science/coords";
import { circleLine, createMarkers } from "./markers";
import { applyStarLook, createCorona, createStarSurfaceMaterial } from "./starSurface";
import { kelvinToRgb } from "../science/stars";
import { createSmallBodies } from "./smallBodies";

/** [tür, renk, Minnaert k (0: atmosfersiz yüzey), atmosfer kenarı rengi ve şiddeti] — görünüm temsili */
export const PLANET_LOOK: Record<string, [number, string, number, [number, number, number, number]]> = {
  mercury: [1, "#8C8780", 0, [0, 0, 0, 0]], venus: [2, "#EDD9A8", 0.9, [1.0, 0.9, 0.7, 0.55]],
  mars: [3, "#C26B40", 0, [0.95, 0.65, 0.5, 0.22]], jupiter: [0, "#D8C3A0", 1.1, [0.9, 0.85, 0.75, 0.12]],
  saturn: [4, "#E3CC99", 1.1, [0.95, 0.88, 0.7, 0.12]], uranus: [5, "#AEDCE6", 1.1, [0.6, 0.85, 0.95, 0.3]],
  neptune: [6, "#5679D9", 1.1, [0.4, 0.6, 1.0, 0.3]],
  earth: [0, "#3366aa", 1, [0.45, 0.65, 1.0, 0.4]], moon: [0, "#a0a0a0", 0, [0, 0, 0, 0]],
};

/**
 * solar katmanı (SPEC §6.5.5): birim = 1 AB, orijin = Ankara (≈ Dünya).
 * Güneş, Dünya noktası, gezegenler, Güneş merkezli dairesel yörüngeler, Voyager 1.
 * Yörüngeler daire olarak çizildi, gezegenler büyütüldü (ekranda etiketli).
 */
export function createSolarLayer(sky: Sky) {
  const scene = new THREE.Scene();
  const m = sky.meta;
  const sunPos = dirFromAltAz(m.sun.alt, m.sun.az).multiplyScalar(m.sun.dist_au);
  const ep = sky.frames.ecliptic_pole_enu;
  const pole = enuToThree(ep[0], ep[1], ep[2]).normalize();

  const bodies = sky.bodies.map(b => ({ b, pos: dirFromAltAz(b.alt, b.az).multiplyScalar(b.dist_au) }));
  const v = sky.voyager1;
  const voyagerPos = enuToThree(v.enu_dir[0], v.enu_dir[1], v.enu_dir[2]).normalize().multiplyScalar(v.dist_au);

  const sun = createMarkers([{ pos: sunPos, size: 26, color: "#FFD27A" }], 1);
  const dots = createMarkers([
    { pos: new THREE.Vector3(), size: 5, color: "#6FA8FF" },                  // Dünya
    ...bodies.map(({ b, pos }) => ({ pos, size: 4, color: new THREE.Color(b.rgb[0] / 255, b.rgb[1] / 255, b.rgb[2] / 255) })),
    { pos: voyagerPos, size: 4, color: "#E8ECF5" },
  ], 0);

  // Yörüngeler: Güneş merkezli, yarıçap = gezegenin Güneş'e o anki uzaklığı; Dünya'nınki orijinden geçer
  const orbits = [circleLine(sunPos, pole, sunPos.length(), "#8FB8FF", 0.2)];
  for (const { pos } of bodies) orbits.push(circleLine(sunPos, pole, pos.clone().sub(sunPos).length(), "#8FB8FF", 0.2));

  // Güneş → Voyager kesikli çizgi (5. durakta belirir)
  const vgeo = new THREE.BufferGeometry().setFromPoints([sunPos, voyagerPos]);
  const vmat = new THREE.LineDashedMaterial({ color: "#E8ECF5", dashSize: 3, gapSize: 3, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const vline = new THREE.Line(vgeo, vmat);
  vline.computeLineDistances();
  vline.frustumCulled = false;

  // Gerçek boyutlu küreler (yanlarına uçulabilsin diye): Güneş (granüllü fotosfer + korona, R1) ve gezegenler
  const sunR = SUN_RADIUS_KM / AU_KM;
  const sunMat = createStarSurfaceMaterial();
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(sunR, 128, 64), sunMat);
  sunMesh.position.copy(sunPos);
  const sp = sky.realism.poles_enu.sun;
  const sunPole = sp ? enuToThree(sp[0], sp[1], sp[2]).normalize() : pole.clone();         // IAU: Güneş'in dönme ekseni
  sunMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sunPole);
  const corona = createCorona(sunPos.clone(), sunR, sunPole);
  const [sr, sg, sb] = kelvinToRgb(5772);                                                  // IAU 2015 B3: Teff = 5.772 K
  applyStarLook(sunMat, corona.mat, new THREE.Color().setRGB(sr, sg, sb, THREE.SRGBColorSpace), 5772, 1, 2026);
  let sunRPx = 0;
  const KIND = PLANET_LOOK;
  const blank = new THREE.DataTexture(new Uint8Array([200, 180, 150, 255]), 1, 1);
  blank.needsUpdate = true;
  const planetMats: THREE.ShaderMaterial[] = [];
  const matByKey = new Map<string, THREE.ShaderMaterial>();
  let ringMat: THREE.ShaderMaterial | null = null;
  const extra: THREE.Object3D[] = [];
  const spheres = bodies.map(({ b, pos }) => {
    const [kind, color, minnaert, atmo] = KIND[b.key] ?? [1, "#999999", 0, [0, 0, 0, 0]];
    const rKm = b.key === "saturn" ? SATURN_EQ_RADIUS_KM : PLANET_RADIUS_KM[b.key] ?? 3000;
    const r = rKm / AU_KM;
    const pe = sky.realism.poles_enu[b.key] ?? [0, 0, 1];
    const pole = enuToThree(pe[0], pe[1], pe[2]).normalize();
    const mat = new THREE.ShaderMaterial({
      vertexShader: planetVert, fragmentShader: planetFrag,
      uniforms: {
        uMap: { value: blank as THREE.Texture }, uHasMap: { value: 0 }, uKind: { value: kind }, uColor: { value: new THREE.Color(color) },
        uSunPos: { value: sunPos }, uOpacity: { value: 1 }, uCenter: { value: pos }, uRadius: { value: r },
        uRingN: { value: pole }, uRingIn: { value: 0 }, uRingOut: { value: 0 },
        uMinnaert: { value: minnaert }, uAtmo: { value: new THREE.Vector4(...atmo) },
      },
    });
    planetMats.push(mat);
    matByKey.set(b.key, mat);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 96, 48), mat);
    mesh.position.copy(pos);
    // Dönme ekseni IAU (yerel +y = kuzey kutbu); başlangıç meridyeni temsili
    const X = new THREE.Vector3().crossVectors(pole, Math.abs(pole.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize();
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, pole, new THREE.Vector3().crossVectors(X, pole)));
    if (b.key === "saturn") {
      const R = SATURN_RINGS_KM, e = (k: number) => k / SATURN_EQ_RADIUS_KM;
      mat.uniforms.uRingIn.value = e(R.cIn); mat.uniforms.uRingOut.value = e(R.aOut);
      ringMat = new THREE.ShaderMaterial({
        vertexShader: ringVert, fragmentShader: ringFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: {
          uSunPos: { value: sunPos }, uCenter: { value: pos }, uRadius: { value: r }, uOpacity: { value: 1 },
          uEdges: { value: new THREE.Vector4(e(R.cIn), e(R.bIn), e(R.cassiniIn), e(R.aIn)) }, uAOut: { value: e(R.aOut) },
        },
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(R.cIn / AU_KM, R.aOut / AU_KM, 256, 1), ringMat);
      ring.position.copy(pos);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pole);     // halka düzlemi = ekvator düzlemi
      ring.renderOrder = 1;
      extra.push(ring);
    }
    return { mesh, r, pos };
  });
  const near = [{ pos: sunPos, r: sunR }, ...spheres.map(s => ({ pos: s.pos, r: s.r })), { pos: voyagerPos, r: 0 }];

  sunMesh.renderOrder = 0;
  for (const sp of spheres) sp.mesh.renderOrder = 0;
  scene.add(sunMesh, corona.mesh, ...spheres.map(sp => sp.mesh), ...extra, ...orbits.map(o => o.line), vline, dots.obj, sun.obj);

  let weight = 1;
  let belts: ReturnType<typeof createSmallBodies> | null = null;
  let beltFade = 1;
  return {
    scene,
    unitKm: AU_KM,
    originKm: new THREE.Vector3(),
    sunPos, voyagerPos, bodies,
    applyWeight(w: number) {
      weight = w;
      sun.material.uniforms.uOpacity.value = w * (1 - THREE.MathUtils.smoothstep(sunRPx, 25, 90));   // yakında korona devralır
      corona.mat.uniforms.uOpacity.value = w * THREE.MathUtils.smoothstep(sunRPx, 2, 12);
      if (belts) belts.material.uniforms.uOpacity.value = belts.base * w * beltFade;
      dots.material.uniforms.uOpacity.value = w;
      const nearSun = 1 - THREE.MathUtils.smoothstep(sunRPx, 40, 150);                          // Güneş'in önünden geçmesin
      for (const o of orbits) o.mat.opacity = o.base * w * nearSun;
      sunMat.uniforms.uOpacity.value = w;
      for (const m of planetMats) m.uniforms.uOpacity.value = w;
      const rm = ringMat as THREE.ShaderMaterial | null;
      if (rm) rm.uniforms.uOpacity.value = w;
    },
    setSmallBodies(buf: ArrayBuffer, count: number, keep: number) {
      belts = createSmallBodies(buf, count, sunPos, keep);
      belts.obj.renderOrder = 2;
      scene.add(belts.obj);
      belts.material.uniforms.uOpacity.value = belts.base * weight * beltFade;
    },
    setPlanetTexture(key: string, t: THREE.Texture | null) {
      const m = matByKey.get(key);
      if (m) { m.uniforms.uMap.value = t ?? blank; m.uniforms.uHasMap.value = t ? 1 : 0; }
    },
    /** camAU: kamera konumu (AB); Güneş halesi diskin görünen boyutuyla büyür (temsili hale) */
    update(pixelRatio: number, voyagerLine: number, camAU?: THREE.Vector3, fovDeg = 60, viewH = 800) {
      sun.material.uniforms.uPixelRatio.value = pixelRatio;
      if (camAU) {
        // Yakındaki gezegenin diski görünür olunca işaret noktasını gizle (ortasında nokta kalmasın)
        const sz = dots.obj.geometry.getAttribute("aSize") as THREE.BufferAttribute;
        const f = 1 / Math.tan(fovDeg * Math.PI / 360) * viewH / 2;
        let maxPx = 0;
        spheres.forEach((sp, i) => {
          const px = (sp.r / Math.max(camAU.distanceTo(sp.pos), 1e-12)) * f;
          maxPx = Math.max(maxPx, px);
          sz.setX(i + 1, px > 2.5 ? 0 : 4);
        });
        // Asteroitler gözle görülmeyecek kadar sönük: bir gezegene ya da Güneş'e yakın plandayken arka planı kumlamasın
        beltFade = 1 - THREE.MathUtils.smoothstep(Math.max(maxPx, sunRPx), 15, 60);
        sz.needsUpdate = true;
        const d = Math.max(camAU.distanceTo(sunPos), sunR * 1.01);
        const rPx = (sunR / d) / Math.tan(fovDeg * Math.PI / 360) * viewH / 2;
        sunRPx = rPx;
        (sun.obj.geometry.getAttribute("aSize") as THREE.BufferAttribute).setX(0, Math.min(500, Math.max(26, rPx * 7)));
        sun.obj.geometry.getAttribute("aSize").needsUpdate = true;
      }
      dots.material.uniforms.uPixelRatio.value = pixelRatio;
      if (belts) belts.material.uniforms.uPixelRatio.value = pixelRatio;
      vmat.opacity = 0.5 * voyagerLine * weight;
    },
    /** near: en yakın cismin yüzeyine uzaklığın %30'u */
    nearFar(c: THREE.Vector3): [number, number] {
      let gap = c.length() * 1e-3;
      for (const n of near) gap = Math.min(gap, c.distanceTo(n.pos) - n.r);
      return [Math.max(1e-9, gap * 0.3), c.length() * 10 + 400];
    },
  };
}
