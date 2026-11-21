import * as THREE from "three";
import type { Sky } from "../app/assets";
import { AU_KM, PLANET_RADIUS_KM, SATURN_EQ_RADIUS_KM, SATURN_RINGS_KM, SUN_RADIUS_KM } from "../science/constants";
import vert from "./shaders/earth.vert.glsl?raw";
import planetVert from "./shaders/planet.vert.glsl?raw";
import planetFrag from "./shaders/planet.frag.glsl?raw";
import ringVert from "./shaders/ring.vert.glsl?raw";
import ringFrag from "./shaders/ring.frag.glsl?raw";
import sunFrag from "./shaders/sun.frag.glsl?raw";
import { dirFromAltAz, enuToThree } from "../science/coords";
import { circleLine, createMarkers } from "./markers";

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

  // Gerçek boyutlu küreler (yanlarına uçulabilsin diye): kenarı kararan Güneş ve gezegenler (R1)
  const sunMat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: sunFrag, uniforms: { uOpacity: { value: 1 } } });
  const sunR = SUN_RADIUS_KM / AU_KM;
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(sunR, 96, 48), sunMat);
  sunMesh.position.copy(sunPos);
  const KIND: Record<string, [number, string]> = {
    mercury: [1, "#8C8780"], venus: [2, "#EDD9A8"], mars: [3, "#C26B40"], jupiter: [0, "#D8C3A0"],
    saturn: [4, "#E3CC99"], uranus: [5, "#AEDCE6"], neptune: [6, "#5679D9"],
  };
  const blank = new THREE.DataTexture(new Uint8Array([200, 180, 150, 255]), 1, 1);
  blank.needsUpdate = true;
  const planetMats: THREE.ShaderMaterial[] = [];
  let jupiterMat: THREE.ShaderMaterial | null = null;
  let ringMat: THREE.ShaderMaterial | null = null;
  const extra: THREE.Object3D[] = [];
  const spheres = bodies.map(({ b, pos }) => {
    const [kind, color] = KIND[b.key] ?? [1, "#999999"];
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
      },
    });
    planetMats.push(mat);
    if (b.key === "jupiter") jupiterMat = mat;
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
  scene.add(sunMesh, ...spheres.map(sp => sp.mesh), ...extra, ...orbits.map(o => o.line), vline, dots.obj, sun.obj);

  let weight = 1;
  return {
    scene,
    unitKm: AU_KM,
    originKm: new THREE.Vector3(),
    sunPos, voyagerPos, bodies,
    applyWeight(w: number) {
      weight = w;
      sun.material.uniforms.uOpacity.value = w;
      dots.material.uniforms.uOpacity.value = w;
      for (const o of orbits) o.mat.opacity = o.base * w;
      sunMat.uniforms.uOpacity.value = w;
      for (const m of planetMats) m.uniforms.uOpacity.value = w;
      const rm = ringMat as THREE.ShaderMaterial | null;
      if (rm) rm.uniforms.uOpacity.value = w;
    },
    setJupiterTexture(t: THREE.Texture) {
      const m = jupiterMat as THREE.ShaderMaterial | null;
      if (m) { m.uniforms.uMap.value = t; m.uniforms.uHasMap.value = 1; }
    },
    /** camAU: kamera konumu (AB); Güneş halesi diskin görünen boyutuyla büyür (temsili hale) */
    update(pixelRatio: number, voyagerLine: number, camAU?: THREE.Vector3, fovDeg = 60, viewH = 800) {
      sun.material.uniforms.uPixelRatio.value = pixelRatio;
      if (camAU) {
        // Yakındaki gezegenin diski görünür olunca işaret noktasını gizle (ortasında nokta kalmasın)
        const sz = dots.obj.geometry.getAttribute("aSize") as THREE.BufferAttribute;
        const f = 1 / Math.tan(fovDeg * Math.PI / 360) * viewH / 2;
        spheres.forEach((sp, i) => sz.setX(i + 1, (sp.r / Math.max(camAU.distanceTo(sp.pos), 1e-12)) * f > 2.5 ? 0 : 4));
        sz.needsUpdate = true;
        const d = Math.max(camAU.distanceTo(sunPos), sunR * 1.01);
        const rPx = (sunR / d) / Math.tan(fovDeg * Math.PI / 360) * viewH / 2;
        (sun.obj.geometry.getAttribute("aSize") as THREE.BufferAttribute).setX(0, Math.min(500, Math.max(26, rPx * 7)));
        sun.obj.geometry.getAttribute("aSize").needsUpdate = true;
      }
      dots.material.uniforms.uPixelRatio.value = pixelRatio;
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
