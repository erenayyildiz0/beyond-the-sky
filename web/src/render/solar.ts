import * as THREE from "three";
import type { Sky } from "../app/assets";
import { AU_KM } from "../science/constants";
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

  scene.add(...orbits.map(o => o.line), vline, dots.obj, sun.obj);

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
    },
    update(pixelRatio: number, voyagerLine: number) {
      sun.material.uniforms.uPixelRatio.value = pixelRatio;
      dots.material.uniforms.uPixelRatio.value = pixelRatio;
      vmat.opacity = 0.5 * voyagerLine * weight;
    },
    nearFar(d: number): [number, number] { return [Math.max(1e-6, d * 1e-4), d * 10 + 400]; },
  };
}
