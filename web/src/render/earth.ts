import * as THREE from "three";
import vert from "./shaders/earth.vert.glsl?raw";
import frag from "./shaders/earth.frag.glsl?raw";
import atmoFrag from "./shaders/atmosphere.frag.glsl?raw";
import moonFrag from "./shaders/moon.frag.glsl?raw";
import type { Sky } from "../app/assets";
import { EARTH_RADIUS_KM, MOON_RADIUS_KM } from "../science/constants";
import { dirFromAltAz, earthQuaternionFor, enuToThree } from "../science/coords";
import { ankaraRadiusKm } from "../science/flight";
import { smoothstep } from "../science/visibility";
import { circleLine } from "./markers";

/**
 * earth katmanı (SPEC §6.5.5): birim = Dünya yarıçapı, orijin = Dünya merkezi.
 * Dünya, atmosfer, Ankara halkası, Ay ve Ay yörüngesi.
 */
export function createEarthLayer(sky: Sky) {
  const scene = new THREE.Scene();
  const m = sky.meta;
  const sun = dirFromAltAz(m.sun.alt, m.sun.az);
  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  blank.needsUpdate = true;

  const pb = sky.realism.ankara_patch;
  const earthMat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    uniforms: {
      uDay: { value: blank as THREE.Texture }, uNight: { value: blank as THREE.Texture }, uPatch: { value: blank as THREE.Texture },
      uPatchBounds: { value: new THREE.Vector4(pb.lat_min, pb.lat_max, pb.lon_min, pb.lon_max) },
      uHasDay: { value: 0 }, uHasPatch: { value: 0 }, uSun: { value: sun }, uOpacity: { value: 1 },
    },
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), earthMat);
  earth.quaternion.copy(earthQuaternionFor(m.location.lat, m.location.lon));
  earth.renderOrder = 1;

  const atmoMat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: atmoFrag, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, premultipliedAlpha: true,
    uniforms: { uColor: { value: new THREE.Color("#4A7BD8") }, uSun: { value: sun }, uOpacity: { value: 1 } },
  });
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.02, 96, 48), atmoMat);
  atmo.renderOrder = 2;

  // Ankara halkası: yüzeye teğet, nabız gibi atar
  const ankaraY = ankaraRadiusKm(m.location.height_m) / EARTH_RADIUS_KM;   // ≈ 1,00014
  const ringMat = new THREE.MeshBasicMaterial({ color: "#8FB8FF", transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.010, 0.014, 64), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, ankaraY + 0.0005, 0);
  ring.renderOrder = 3;

  // Ay: Ankara + topo-merkezli konum
  const moonPos = dirFromAltAz(m.moon.alt, m.moon.az).multiplyScalar(m.moon.distance_km / EARTH_RADIUS_KM).add(new THREE.Vector3(0, ankaraY, 0));
  const moonMat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: moonFrag,
    uniforms: { uMap: { value: blank as THREE.Texture }, uHasMap: { value: 0 }, uSun: { value: sun }, uOpacity: { value: 1 } } });
  const MOON_R = MOON_RADIUS_KM / EARTH_RADIUS_KM;
  const moon = new THREE.Mesh(new THREE.SphereGeometry(MOON_R, 128, 64), moonMat);
  moon.position.copy(moonPos);
  { // Gelgit kilidi: yakın yüz (boylam 0 = yerel +x) Dünya'ya, kuzey kutbu IAU eksenine (libration yok sayıldı)
    const X = moonPos.clone().negate().normalize();
    const p = sky.realism.poles_enu.moon;
    const Y = enuToThree(p[0], p[1], p[2]).normalize();
    Y.addScaledVector(X, -Y.dot(X)).normalize();
    moon.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, new THREE.Vector3().crossVectors(X, Y)));
  }
  const ep = sky.frames.ecliptic_pole_enu;
  const orbit = circleLine(new THREE.Vector3(), enuToThree(ep[0], ep[1], ep[2]).normalize(), moonPos.length(), "#8FB8FF", 0.25);

  scene.add(earth, atmo, ring, moon, orbit.line);

  return {
    scene,
    unitKm: EARTH_RADIUS_KM,
    originKm: new THREE.Vector3(0, -ankaraRadiusKm(m.location.height_m), 0),
    moonPos,
    setNightTexture(t: THREE.Texture) { earthMat.uniforms.uNight.value = t; },
    setDayTexture(t: THREE.Texture) { earthMat.uniforms.uDay.value = t; earthMat.uniforms.uHasDay.value = 1; },
    setPatchTexture(t: THREE.Texture) {
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
      earthMat.uniforms.uPatch.value = t; earthMat.uniforms.uHasPatch.value = 1;
    },
    setMoonTexture(t: THREE.Texture) { moonMat.uniforms.uMap.value = t; moonMat.uniforms.uHasMap.value = 1; },
    applyWeight(w: number) {
      earthMat.uniforms.uOpacity.value = w;
      atmoMat.uniforms.uOpacity.value = w;
      moonMat.uniforms.uOpacity.value = w;
      orbit.mat.opacity = orbit.base * w;
    },
    /** z ve zamanla değişenler: halka nabzı, z > 6'da sönme */
    update(z: number, t: number, altKm: number) {
      const s = 1 + 0.25 * Math.sin(t * 3);
      ring.scale.setScalar(s * (1 + 3 * smoothstep(4.0, 5.5, z)));
      ringMat.opacity = (1 - smoothstep(5.6, 6.0, z)) * smoothstep(400, 1500, altKm) * (0.6 + 0.4 * Math.sin(t * 3));
    },
    /** near: en yakın yüzeye (Dünya ya da Ay) uzaklığın %30'u — alçak irtifada ve Ay'ın yanında kırpılmasın */
    nearFar(c: THREE.Vector3): [number, number] {
      const d = c.length();
      const gap = Math.min(d - 1, c.distanceTo(moonPos) - MOON_R);
      return [Math.max(1e-7, gap * 0.3), d * 10 + 200];
    },
  };
}
