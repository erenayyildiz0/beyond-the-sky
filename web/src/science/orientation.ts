// SPEC §6.3 — jiroskop quaternion'u (three.js'in kaldırılan DeviceOrientationControls matematiği; doğrulandı)
import * as THREE from "three";
const DEG = Math.PI / 180;
const zee = new THREE.Vector3(0, 0, 1);
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion();
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));   // X etrafında −90°

/** alpha: kuzeye göre mutlak (0 = cihazın üstü kuzeyi gösterir, saat yönünün tersine artar). */
export function orientationToQuaternion(alphaDeg: number, betaDeg: number, gammaDeg: number, screenDeg: number,
                                        out = new THREE.Quaternion()) {
  euler.set(betaDeg * DEG, alphaDeg * DEG, -gammaDeg * DEG, "YXZ");
  out.setFromEuler(euler);
  out.multiply(q1);
  out.multiply(q0.setFromAxisAngle(zee, -screenDeg * DEG));
  return out;
}

/** Pusula yönü (saat yönünde, kuzeyden) → mutlak alpha */
export const headingToAlpha = (h: number) => ((360 - h) % 360 + 360) % 360;

export const wrap180 = (a: number) => ((a + 540) % 360) - 180;
