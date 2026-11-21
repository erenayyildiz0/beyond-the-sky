import * as THREE from "three";
import vert from "./shaders/skyDome.vert.glsl?raw";
import frag from "./shaders/skyDome.frag.glsl?raw";
import { enuToThree } from "../science/coords";
import { MW_FLOOR, MW_SLOPE } from "../science/visibility";
import type { Sky } from "../app/assets";

/** Gökyüzü kubbesi: Samanyolu + gökyüzü rengi + Andromeda lekesi (SPEC §6.4). */
export function createSkyDome(sky: Sky, milkyWay: THREE.Texture) {
  const m31 = sky.galaxies.find(g => g.key === "m31")!;
  const dir = enuToThree(m31.enu_dir[0], m31.enu_dir[1], m31.enu_dir[2]).normalize();
  const maj = m31.major_enu ? enuToThree(m31.major_enu[0], m31.major_enu[1], m31.major_enu[2]).normalize()
                            : new THREE.Vector3(0, 0, -1);
  const material = new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uMW: { value: milkyWay },
      uMWOpacity: { value: 0 },
      uMWGain: { value: 1 },
      uSkyLum: { value: 1 },
      uMWFloor: { value: MW_FLOOR },
      uMWSlope: { value: MW_SLOPE },
      uExtK: { value: sky.meta.visibility.extinction_k },
      uSpace: { value: 0 },
      uZenith: { value: new THREE.Color("#161B26") },
      uHorizon: { value: new THREE.Color("#4A3427") },
      uM31Dir: { value: dir },
      uM31Major: { value: maj },
      uM31Opacity: { value: 0 },
    },
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 64, 32), material);
  mesh.renderOrder = 0;
  mesh.frustumCulled = false;
  return { mesh, material };
}

/** Samanyolu dokusunun varsayılan kazancı; ton eşlenmiş SVS haritası tam kazançta fazla parlak. Bilim panelinden ayarlanır. */
export const MW_GAIN_DEFAULT = 0.25;

/** §3.5 gökyüzü renkleri */
export const SKY_COLORS = {
  city: { zenith: new THREE.Color("#161B26"), horizon: new THREE.Color("#4A3427") },
  dark: { zenith: new THREE.Color("#020409"), horizon: new THREE.Color("#0B1220") },
};
