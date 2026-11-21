// SPEC §3.8–§3.10, §6.5.2–§6.5.3 — rota, bakış, duraklar, parlaklık, uçuş kontrolü. three.js'in yalnızca matematik sınıfları.
import * as THREE from "three";
import { T } from "../app/timeline";
import type { Sky } from "../app/assets";
import { AU_KM, EARTH_RADIUS_KM, LIGHT_DAY_KM, LY_KM, PROXIMA_LY } from "./constants";
import { enuToThree } from "./coords";
import { smoothstep } from "./visibility";

export const Z_MIN = 3.6, Z_MAX = 19.318;

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function slerpDir(a: THREE.Vector3, b: THREE.Vector3, t: number, out = new THREE.Vector3()) {
  const ang = a.angleTo(b);
  if (ang < 1e-9) return out.copy(a);
  const s = Math.sin(ang);
  return out.copy(a).multiplyScalar(Math.sin((1 - t) * ang) / s).addScaledVector(b, Math.sin(t * ang) / s);
}

/** û(z): §3.9 tablosu. U, uCas, uTarget three.js çerçevesinde birim vektörler. */
export function pathDir(z: number, U: THREE.Vector3, uCas: THREE.Vector3, uTarget: THREE.Vector3, out = new THREE.Vector3()) {
  if (z <= 11.0) return out.copy(U);
  if (z < 13.0) return slerpDir(U, uCas, smooth(11.0, 13.0, z), out);
  if (z <= 15.75) return out.copy(uCas);
  if (z < 16.6) return slerpDir(uCas, uTarget, smooth(15.75, 16.6, z), out);
  return out.copy(uTarget);
}

export const cameraPosKm = (z: number, dir: THREE.Vector3, out = new THREE.Vector3()) => out.copy(dir).multiplyScalar(10 ** z);

export type Look = "back" | "forward";
export function baseLook(z: number): Look {
  if (z < 12.3) return "back";
  if (z < 15.9) return "forward";
  if (z < 16.5) return "back";
  if (z < 17.8) return "forward";
  if (z < 18.5) return "back";
  return "forward";
}

/** Uçuşta yıldızın görünür kadiri (§3.8) — GLSL ile birebir */
export const apparentMag = (mag: number, distHomeLy: number, distCamLy: number) =>
  mag + 5 * Math.log10(Math.max(distCamLy, 1e-3) / distHomeLy);

export const exposureLimit = (z: number) => 6.62 + 5 * Math.max(0, z - 15.3);

/** Rota vektörleri (three.js çerçevesi), sky.json'dan bir kez kurulur. */
export interface Route { U: THREE.Vector3; uCas: THREE.Vector3; uTarget: THREE.Vector3; north: THREE.Vector3; ngp: THREE.Vector3 }

export function routeFromSky(sky: Sky): Route {
  const [c, t] = [sky.path.u_cas, sky.path.u_target];
  const g = sky.frames.gal_to_enu;                     // sütunlar: x̂, ŷ, ẑ (NGP) — ENU
  return {
    U: new THREE.Vector3(0, 1, 0),
    uCas: enuToThree(c[0], c[1], c[2]).normalize(),
    uTarget: enuToThree(t[0], t[1], t[2]).normalize(),
    north: enuToThree(0, 1, 0),
    ngp: enuToThree(g[0][2], g[1][2], g[2][2]).normalize(),
  };
}

/** Yukarı referansı: z < 11 ENU Kuzey, 11 → 14 galaktik kuzey kutbuna slerp (§3.9). */
export const upRef = (z: number, r: Route, out = new THREE.Vector3()) => slerpDir(r.north, r.ngp, smooth(11, 14, z), out);

const _m = new THREE.Matrix4(), _o = new THREE.Vector3(), _up = new THREE.Vector3();
/** İleri yön f ve yukarı referansından kamera quaternion'u (Gram-Schmidt). */
export function lookQuaternion(f: THREE.Vector3, up: THREE.Vector3, out = new THREE.Quaternion()) {
  _up.copy(up).addScaledVector(f, -up.dot(f));
  if (_up.lengthSq() < 1e-12) _up.set(0, 0, -1).addScaledVector(f, f.z);   // paralel olmaz (§3.9) ama güvenlik
  _up.normalize();
  _m.lookAt(_o.set(0, 0, 0), f, _up);                  // kamera −z'ye bakar: lookAt(eye, target, up)
  return out.setFromRotationMatrix(_m);
}

/** Kamera çerçevesi: konum (km), temel bakış quaternion'u. */
export function flightFrame(z: number, look: Look, r: Route, outPos = new THREE.Vector3(), outQ = new THREE.Quaternion()) {
  const d = pathDir(z, r.U, r.uCas, r.uTarget, new THREE.Vector3());
  cameraPosKm(z, d, outPos);
  const f = look === "forward" ? d : d.clone().negate();
  lookQuaternion(f, upRef(z, r), outQ);
  return { pos: outPos, q: outQ };
}

export type StopKey = "earth" | "moon" | "sun" | "neptune" | "voyager" | "nearest" | "achird" | "cas" | "bubble" | "galaxy" | "m31";
export interface Stop { key: StopKey; z: number }

/** §3.10 durakları. Ay, Güneş, Neptün sky.json'dan; Achird ve Kraliçe (Schedar) yıldız uzaklıklarından. */
export function stopsFromSky(sky: Sky): Stop[] {
  const hipDly = (hip: number) => {
    const i = sky.stars.data.findIndex(r => r[7] === hip);
    return i >= 0 ? sky.starDly[i] ?? null : null;
  };
  const nep = sky.bodies.find(b => b.key === "neptune")!;
  const ly = (n: number) => Math.log10(n * LY_KM);
  return [
    { key: "earth", z: Math.log10(25_000) },
    { key: "moon", z: Math.log10(sky.meta.moon.distance_km) },
    { key: "sun", z: Math.log10(sky.meta.sun.dist_au * AU_KM) },
    { key: "neptune", z: Math.log10(nep.dist_au * AU_KM) },
    { key: "voyager", z: Math.log10(LIGHT_DAY_KM) },
    { key: "nearest", z: ly(PROXIMA_LY) },
    { key: "achird", z: ly(hipDly(3821) ?? 19.4) },
    { key: "cas", z: ly(hipDly(3179) ?? 228) },
    { key: "bubble", z: ly(1700) },
    { key: "galaxy", z: ly(150_000) },
    { key: "m31", z: Z_MAX },
  ];
}

/** Katman ağırlıkları (§6.5.1). */
export const earthWeight = (z: number) => 1 - smoothstep(6.2, 7.0, z);
export const solarWeight = (z: number) => smoothstep(5.9, 6.6, z) * (1 - smoothstep(10.9, 11.8, z));
export const deepWeight = (_z: number) => 1;
/** Ankara'nın Dünya merkezine uzaklığı (km): ortalama yarıçap + rakım */
export const ankaraRadiusKm = (heightM: number) => EARTH_RADIUS_KM + heightM / 1000;

export class FlightControl {
  z = Z_MIN; v = 0;              // v: onluk/sn
  throttle = 0;                  // −1 geri … +1 ileri (düğme, ↑/↓, W/S)
  vMax: number = T.act2.vMax;
  private flyTo: { from: number; to: number; t: number; dur: number } | null = null;

  get flying() { return this.flyTo != null; }

  update(dt: number, stops: number[], extraDz = 0) {     // extraDz: pinch + tekerlek
    if (this.flyTo) {
      const f = this.flyTo; f.t = Math.min(f.dur, f.t + dt);
      const k = f.t / f.dur, e = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;   // easeInOutCubic
      this.z = f.from + (f.to - f.from) * e;
      if (f.t >= f.dur) this.flyTo = null;
      return;
    }
    const near = stops.some(s => Math.abs(this.z - s) < T.act2.detentZ);
    const vTarget = this.vMax * this.throttle * (near ? T.act2.detentFactor : 1);
    const tau = this.throttle !== 0 ? T.act2.accelTau : T.act2.decelTau;
    this.v += (vTarget - this.v) * (1 - Math.exp(-dt / tau));
    this.z = Math.min(Z_MAX, Math.max(Z_MIN, this.z + this.v * dt + extraDz));
  }
  goTo(z: number, dur: number = T.act2.flyToS) { this.flyTo = { from: this.z, to: z, t: 0, dur }; this.v = 0; }
  cancelGoTo() { this.flyTo = null; }
}
