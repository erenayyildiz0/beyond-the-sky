import * as THREE from "three";
import { applyStarLook, createStarSurfaceMaterial, STAR_TIME } from "./starSurface";
import { kelvinToRgb } from "../science/stars";

const beamVert = /* glsl */ `
varying float vT;
varying vec2 vUv;
void main() { vUv = uv; vT = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const beamFrag = /* glsl */ `
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float along = vUv.y;                                        // sivri uçta (yıldızda) parlak, dışa doğru söner
  float a = pow(along, 1.6) * 0.55 * uOpacity;
  gl_FragColor = vec4(vec3(0.65, 0.8, 1.0) * a, a);
}`;

/**
 * Pulsar (temsili görünüm, boyut gerçek): sıcak nötron yıldızı yüzeyi ve manyetik kutuplardan çıkan iki ışın demeti.
 * Manyetik eksen dönme eksenine eğik; demetler deniz feneri gibi döner. Dönme çok yavaşlatıldı (spinHz gerçek değer).
 */
export function createPulsar(rKm: number, spinHz: number) {
  const group = new THREE.Group();
  const surf = createStarSurfaceMaterial(1.2);
  const [r, g, b] = kelvinToRgb(30000);
  applyStarLook(surf, null, new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace), 30000, rKm / 695_700, 7);
  surf.uniforms.uContrast.value = 0.15;
  group.add(new THREE.Mesh(new THREE.SphereGeometry(rKm, 64, 32), surf));
  const spin = new THREE.Group();
  spin.rotation.z = 0.35;                                     // dönme ekseni hafif eğik (görüntü için)
  group.add(spin);
  const mag = new THREE.Group();
  mag.rotation.z = 0.75;                                      // manyetik eksen dönme eksenine ~43° eğik (temsili)
  spin.add(mag);
  const mat = new THREE.ShaderMaterial({ vertexShader: beamVert, fragmentShader: beamFrag, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uOpacity: { value: 1 } } });
  const L = 22 * rKm;
  for (const s of [1, -1]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(4 * rKm, L, 32, 1, true), mat);
    cone.position.y = s * (L / 2 + 0.8 * rKm);
    if (s > 0) cone.rotation.x = Math.PI;                      // geniş uç dışarıda, sivri uç yıldızda
    mag.add(cone);
  }
  return {
    group,
    update() { spin.rotation.y = STAR_TIME.value * 2 * Math.PI * 0.4; },   // gösterim: 0,4 tur/sn (gerçekte spinHz)
    spinHz,
  };
}
