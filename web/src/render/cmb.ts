import * as THREE from "three";
import vert from "./shaders/cmb.vert.glsl?raw";
import frag from "./shaders/cmb.frag.glsl?raw";

/** CMB küresi (R5): cosmic katmanında (birim milyon ışık yılı), yarıçap = son saçılma yüzeyinin eşhareketli uzaklığı. */
export function createCmbSphere(radiusMly: number, galToEnu: number[][]) {
  // three → ENU: e = x, n = −z, u = y; ENU → galaktik: Gᵀ
  const G = new THREE.Matrix3().set(galToEnu[0][0], galToEnu[0][1], galToEnu[0][2], galToEnu[1][0], galToEnu[1][1], galToEnu[1][2],
    galToEnu[2][0], galToEnu[2][1], galToEnu[2][2]);
  const threeToEnu = new THREE.Matrix3().set(1, 0, 0, 0, 0, -1, 0, 1, 0);
  const toGal = G.clone().transpose().multiply(threeToEnu);
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false, side: THREE.BackSide,
    uniforms: { uMap: { value: null }, uToGal: { value: toGal }, uOpacity: { value: 0 } },
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radiusMly, 128, 64), mat);
  mesh.renderOrder = -1;
  mesh.frustumCulled = false;
  return {
    mesh, mat,
    /** İçerideyken iç yüz (gökyüzü), dışarıdayken dış yüz (top) */
    update(camDistMly: number, opacity: number) {
      mat.side = camDistMly < radiusMly ? THREE.BackSide : THREE.FrontSide;
      mat.uniforms.uOpacity.value = opacity;
      mesh.visible = opacity > 0.002;
    },
  };
}
