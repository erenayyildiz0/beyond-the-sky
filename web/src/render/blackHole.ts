import * as THREE from "three";
import vert from "./shaders/blackHole.vert.glsl?raw";
import frag from "./shaders/blackHole.frag.glsl?raw";
import { STAR_TIME } from "./starSurface";

/**
 * Schwarzschild kara deliği (ışık bükülmesi gerçek hesap, disk temsili). center/rs katman biriminde; diskN dünya yönünde.
 * halfRs: uzaktayken efekt karesinin yarı genişliği (Rs); kamera bunun 1,5 katından yakınsa tam ekran çizilir.
 */
export function createBlackHole(center: THREE.Vector3, rs: number, opts: { diskN?: THREE.Vector3; disk?: number; diskOut?: number; halfRs?: number; mw?: THREE.Texture | null; full?: boolean } = {}) {
  const diskN = (opts.diskN ?? new THREE.Vector3(0, 1, 0)).clone().normalize();
  const halfRs = opts.halfRs ?? 30;
  const mat = new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      uCenter: { value: new THREE.Vector3() }, uDiskN: { value: new THREE.Vector3() }, uRs: { value: rs }, uHalf: { value: halfRs * rs },
      uFull: { value: 0 }, uInvProj: { value: new THREE.Matrix4() }, uViewToWorld: { value: new THREE.Matrix3() },
      uOpacity: { value: 1 }, uTime: STAR_TIME, uDisk: { value: opts.disk ?? 1 }, uDiskOut: { value: opts.diskOut ?? 14 },
      uMW: { value: opts.mw ?? null }, uHasMW: { value: opts.mw ? 1 : 0 }, uMWGain: { value: 0.6 },
    },
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 20;
  const u = mat.uniforms;
  mesh.onBeforeRender = (_r, _s, camera) => {
    const cam = camera as THREE.PerspectiveCamera;
    u.uCenter.value.copy(center).applyMatrix4(cam.matrixWorldInverse);
    u.uDiskN.value.copy(diskN).transformDirection(cam.matrixWorldInverse);
    u.uInvProj.value.copy(cam.projectionMatrixInverse);
    u.uViewToWorld.value.setFromMatrix4(cam.matrixWorld);
    // Tam ekran yalnızca kamera efekt bölgesinin içindeyken ve merkez önde değilken (kare kameranın arkasına düşer)
    const c = u.uCenter.value;
    u.uFull.value = opts.full || (c.length() < u.uHalf.value && c.z > -0.3 * u.uHalf.value) ? 1 : 0;
  };
  return {
    mesh, mat,
    setMW(t: THREE.Texture, gain = 0.6) { u.uMW.value = t; u.uHasMW.value = 1; u.uMWGain.value = gain; },
  };
}
