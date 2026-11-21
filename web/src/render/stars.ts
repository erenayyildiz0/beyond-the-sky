import * as THREE from "three";
import vertSky from "./shaders/starsSky.vert.glsl?raw";
import frag from "./shaders/stars.frag.glsl?raw";
import { dirFromAltAz } from "../science/coords";
import { mulberry32 } from "./rng";
import type { Sky } from "../app/assets";

export const STAR_DEFAULTS = { uBaseSize: 1.6, uMaxSize: 9, uRefMag: 6.0, uSoft: 0.25, uTwinkle: 1, uIntensity: 1 };

/** Bütün yıldızlar için tek geometri (SPEC §6.4). position = gerçek 3D konum (ışık yılı). */
export function createStarGeometry(sky: Sky) {
  const n = sky.stars.data.length;
  const pos = new Float32Array(n * 3), mag = new Float32Array(n), col = new Float32Array(n * 3);
  const phase = new Float32Array(n), planet = new Float32Array(n), noDist = new Float32Array(n);
  const rnd = mulberry32(7);
  const v = new THREE.Vector3(), c = new THREE.Color();
  const shell = sky.meta.stats.nodist_shell_ly;
  sky.stars.data.forEach(([alt, az, m, r, g, b, dly], i) => {
    dirFromAltAz(alt, az, v).multiplyScalar(dly ?? shell);
    pos.set([v.x, v.y, v.z], i * 3);
    mag[i] = m;
    c.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);    // doğrusal çalışma uzayına
    col.set([c.r, c.g, c.b], i * 3);
    phase[i] = rnd();
    noDist[i] = dly == null ? 1 : 0;
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aMag", new THREE.BufferAttribute(mag, 1));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  geo.setAttribute("aPlanet", new THREE.BufferAttribute(planet, 1));
  geo.setAttribute("aNoDist", new THREE.BufferAttribute(noDist, 1));
  return geo;
}

/** Gezegenler ayrı küçük bir geometri (aPlanet = 1, titremez, sayılmaz). */
export function createPlanetGeometry(sky: Sky) {
  const bodies = sky.bodies;
  const n = bodies.length;
  const pos = new Float32Array(n * 3), mag = new Float32Array(n), col = new Float32Array(n * 3);
  const v = new THREE.Vector3(), c = new THREE.Color();
  bodies.forEach((b, i) => {
    dirFromAltAz(b.alt, b.az, v);
    pos.set([v.x, v.y, v.z], i * 3);
    mag[i] = b.mag;
    c.setRGB(b.rgb[0] / 255, b.rgb[1] / 255, b.rgb[2] / 255, THREE.SRGBColorSpace);
    col.set([c.r, c.g, c.b], i * 3);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aMag", new THREE.BufferAttribute(mag, 1));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(n), 1));
  geo.setAttribute("aPlanet", new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
  return geo;
}

/** Gökyüzü malzemesi (Perde 1 ve 3). */
export function createSkyStarMaterial(sky: Sky, pixelRatio: number) {
  return new THREE.ShaderMaterial({
    vertexShader: vertSky,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,                   // (ONE, ONE): fragment zaten alfa ile çarpılmış renk verir
    uniforms: {
      uSqm: { value: sky.meta.visibility.sqm_city },
      uGlowMag: { value: sky.meta.visibility.glow_city_mag },
      uExtK: { value: sky.meta.visibility.extinction_k },
      uSoft: { value: STAR_DEFAULTS.uSoft },
      uBaseSize: { value: STAR_DEFAULTS.uBaseSize },
      uMaxSize: { value: STAR_DEFAULTS.uMaxSize },
      uRefMag: { value: STAR_DEFAULTS.uRefMag },
      uPixelRatio: { value: pixelRatio },
      uTime: { value: 0 },
      uTwinkle: { value: STAR_DEFAULTS.uTwinkle },
      uIntensity: { value: STAR_DEFAULTS.uIntensity },
    },
  });
}
