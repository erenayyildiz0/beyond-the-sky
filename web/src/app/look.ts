import * as THREE from "three";
import { DEG, dirFromAltAz } from "../science/coords";
import type { View } from "./assets";
import { T } from "./timeline";

/** Başlangıç kadrajı: ufuk ekranın üstünden horizon_screen_y oranında (SPEC §6.3). */
export function frameSkyCamera(cam: THREE.PerspectiveCamera, w: number, h: number, view: View) {
  const aspect = w / h;
  cam.fov = aspect >= 1 ? view.vfov_landscape_deg : view.vfov_portrait_deg;
  cam.aspect = aspect;
  cam.near = 0.1;
  cam.far = 5000;
  const alt0 = Math.atan((2 * view.horizon_screen_y - 1) * Math.tan((cam.fov / 2) * DEG)) / DEG;
  cam.position.set(0, 0, 0);
  cam.up.set(0, 1, 0);
  cam.lookAt(dirFromAltAz(alt0, view.az_deg));
  cam.updateProjectionMatrix();
  return alt0;   // yatayda (vFOV 60°) ≈ 19,1°, dikeyde (vFOV 90°) ≈ 31,0°
}

export const hFovDeg = (cam: THREE.PerspectiveCamera) =>
  2 * Math.atan(Math.tan((cam.fov / 2) * DEG) * cam.aspect) / DEG;

import { reducedMotion } from "./motion";

/** Perde 1 ve 3 bakışı: (alt, az) çifti, sürükleme + atalet + ok tuşları + boşta nefes. */
export class SkyLook {
  alt = 19; az = 80;
  private vAlt = 0; private vAz = 0;          // derece/sn (atalet)
  private t = 0;
  private idleS = 0;
  private breathAmp = 0;                     // nefes genliği yumuşakça açılıp kapanır
  private target = new THREE.Vector3();

  set(alt: number, az: number) { this.alt = alt; this.az = az; this.vAlt = this.vAz = 0; }

  /** dx, dy: piksel. Parmak sağa giderse gökyüzü sağa kayar. */
  drag(dx: number, dy: number, cam: THREE.PerspectiveCamera, w: number, h: number, dt: number) {
    if (dx === 0 && dy === 0) return;
    const dAz = -dx * hFovDeg(cam) / w;
    const dAlt = dy * cam.fov / h;
    this.az += dAz; this.alt += dAlt;
    if (dt > 0) { this.vAz = dAz / dt; this.vAlt = dAlt / dt; }
    this.idleS = 0;
    this.clamp();
  }

  update(dt: number, dragging: boolean, keys: Set<string>) {
    this.t += dt;
    const want = !reducedMotion() && this.idleS > 2 ? 1 : 0;
    this.breathAmp += (want - this.breathAmp) * Math.min(1, dt * 0.7);
    const k = T.look.arrowDegPerS * dt;
    let usedKeys = false;
    if (keys.has("ArrowLeft")) { this.az -= k; usedKeys = true; }
    if (keys.has("ArrowRight")) { this.az += k; usedKeys = true; }
    if (keys.has("ArrowUp")) { this.alt += k; usedKeys = true; }
    if (keys.has("ArrowDown")) { this.alt -= k; usedKeys = true; }
    if (dragging || usedKeys) { this.idleS = 0; if (usedKeys) this.vAz = this.vAlt = 0; }
    else {
      this.idleS += dt;
      const decay = Math.exp(-dt / T.look.inertiaTau);
      this.az += this.vAz * T.look.inertiaTau * (1 - decay);
      this.alt += this.vAlt * T.look.inertiaTau * (1 - decay);
      this.vAz *= decay; this.vAlt *= decay;
    }
    this.clamp();
  }

  private clamp() {
    this.alt = Math.min(T.look.maxAltDeg, Math.max(T.look.minAltDeg, this.alt));
    this.az = ((this.az % 360) + 360) % 360;
  }

  apply(cam: THREE.PerspectiveCamera) {
    const breathing = this.breathAmp * T.look.breathYawDeg * Math.sin((2 * Math.PI * this.t) / T.look.breathPeriodS);
    cam.up.set(0, 1, 0);
    cam.lookAt(dirFromAltAz(this.alt, this.az + breathing, this.target));
  }
}
