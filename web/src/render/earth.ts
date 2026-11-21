import * as THREE from "three";
import vert from "./shaders/earth.vert.glsl?raw";
import frag from "./shaders/earth.frag.glsl?raw";
import atmoFrag from "./shaders/atmosphere.frag.glsl?raw";
import moonFrag from "./shaders/moon.frag.glsl?raw";
import type { Sky } from "../app/assets";
import { EARTH_RADIUS_KM } from "../science/constants";
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

  const earthMat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag,
    uniforms: { uNight: { value: blank as THREE.Texture }, uSun: { value: sun }, uDay: { value: new THREE.Color("#0A1A33") }, uOpacity: { value: 1 } },
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), earthMat);
  earth.quaternion.copy(earthQuaternionFor(m.location.lat, m.location.lon));
  earth.renderOrder = 1;

  const atmoMat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: atmoFrag, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, premultipliedAlpha: true,
    uniforms: { uColor: { value: new THREE.Color("#4A7BD8") }, uOpacity: { value: 1 } },
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
  const moonMat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: moonFrag, uniforms: { uSun: { value: sun }, uOpacity: { value: 1 } } });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1737.4 / EARTH_RADIUS_KM, 64, 32), moonMat);
  moon.position.copy(moonPos);
  const ep = sky.frames.ecliptic_pole_enu;
  const orbit = circleLine(new THREE.Vector3(), enuToThree(ep[0], ep[1], ep[2]).normalize(), moonPos.length(), "#8FB8FF", 0.25);

  scene.add(earth, atmo, ring, moon, orbit.line);

  return {
    scene,
    unitKm: EARTH_RADIUS_KM,
    originKm: new THREE.Vector3(0, -ankaraRadiusKm(m.location.height_m), 0),
    moonPos,
    setNightTexture(t: THREE.Texture) { earthMat.uniforms.uNight.value = t; },
    applyWeight(w: number) {
      earthMat.uniforms.uOpacity.value = w;
      atmoMat.uniforms.uOpacity.value = w;
      moonMat.uniforms.uOpacity.value = w;
      orbit.mat.opacity = orbit.base * w;
    },
    /** z ve zamanla değişenler: halka nabzı, z > 6'da sönme */
    update(z: number, t: number) {
      const s = 1 + 0.25 * Math.sin(t * 3);
      ring.scale.setScalar(s * (1 + 3 * smoothstep(4.0, 5.5, z)));
      ringMat.opacity = (1 - smoothstep(5.6, 6.0, z)) * (0.6 + 0.4 * Math.sin(t * 3));
    },
    nearFar(d: number): [number, number] { return [Math.max(0.0005, d * 0.01), d * 10 + 200]; },
  };
}
