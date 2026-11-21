// Serbest uçuş (SPEC §6.12'nin km cinsine genişletilmiş hali; onaylı sapma, docs/EXTRAS.md P2).
// Konum C: km, three.js çerçevesi, orijin Ankara (JS float64). three.js'in yalnızca matematik sınıfları.
import * as THREE from "three";
import { EARTH_RADIUS_KM, LY_KM } from "./constants";
import { slerpDir } from "./flight";
import { smoothstep } from "./visibility";

export interface SpaceBody { key: string; pos: THREE.Vector3; radiusKm: number; minDistKm: number }

export interface Space {
  earthCenter: THREE.Vector3;   // km
  surfaceKm: number;            // Ankara'nın Dünya merkezine uzaklığı (en düşük nokta: çatı)
  bodies: SpaceBody[];          // Ay, Güneş, gezegenler, Voyager 1 (km)
  starPosLy: Float32Array;      // yıldızlar (ışık yılı, 3×N)
}

export const STAR_MIN_LY = 0.02;                          // bir yıldızın bundan yakınına girilmez (§6.12)
export const SPEED_MIN_KM_S = 0.05;
export const SPEED_MAX_KM_S = 1e9 * LY_KM;                // kozmik ölçek (R3) için §6.12'deki 5e5 ışık yılı/sn'den yükseltildi; hız yine yerel ölçekle sınırlı

export const altitudeKm = (C: THREE.Vector3, s: Space) => C.distanceTo(s.earthCenter) - EARTH_RADIUS_KM;

/** En yakın yıldız (ışık yılı cinsinden uzaklık) */
export function nearestStar(C: THREE.Vector3, starPosLy: Float32Array) {
  const x = C.x / LY_KM, y = C.y / LY_KM, z = C.z / LY_KM;
  let best = Infinity, bi = -1;
  for (let i = 0; i < starPosLy.length; i += 3) {
    const dx = starPosLy[i] - x, dy = starPosLy[i + 1] - y, dz = starPosLy[i + 2] - z;
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 < best) { best = d2; bi = i / 3; }
  }
  return { i: bi, dLy: Math.sqrt(best) };
}

/** Bulunduğun yerin "yerel ölçeği" (km): Dünya'ya yükseklik, cisimlerin yüzeyine ve en yakın yıldıza uzaklığın en küçüğü. */
export function localScaleKm(C: THREE.Vector3, s: Space, nearStarLy?: number) {
  let best = Math.max(altitudeKm(C, s), 1e-3);
  for (const b of s.bodies) best = Math.min(best, Math.max(C.distanceTo(b.pos) - b.radiusKm, 1e-3));
  const ns = nearStarLy ?? nearestStar(C, s.starPosLy).dLy;
  return Math.min(best, ns * LY_KM);
}

/** İleri hız (km/sn): yerel ölçekle orantılı, sınırlı. */
export const cruiseSpeed = (scaleKm: number, throttle: number) =>
  throttle * Math.min(SPEED_MAX_KM_S, Math.max(SPEED_MIN_KM_S, 0.6 * scaleKm));

/** Hedefe logaritmik yaklaşma (§6.12 flyPlan, km). s ∈ [0,1]; s = 1'de hedefe endKm uzaklıkta. */
export function flyPlan(C0: THREE.Vector3, target: THREE.Vector3, endKm: number) {
  const dir = C0.clone().sub(target);                          // hedeften kameraya
  if (dir.lengthSq() < 1e-18) dir.set(0, 1, 0);
  const d0 = Math.max(dir.length(), endKm * 1.01);
  dir.normalize();
  const dur = Math.min(7, Math.max(2, 1.5 + 0.6 * Math.log10(d0 / endKm)));
  const at = (s: number, out = new THREE.Vector3()) => {
    const e = s < 0.5 ? 4 * s ** 3 : 1 - (-2 * s + 2) ** 3 / 2;
    const d = d0 * Math.pow(endKm / d0, e);
    return out.copy(target).addScaledVector(dir, d);
  };
  return { dur, at, dir };
}

/** Bir bakış noktasına (tam konuma) uçuş: flyPlan, bitişte hedef noktaya çok yakın. */
export function pointPlan(C0: THREE.Vector3, P: THREE.Vector3) {
  const eps = Math.max(1e-9 * C0.distanceTo(P), 1e-3);
  const plan = flyPlan(C0, P, eps);
  return { dur: plan.dur, at: (s: number, out = new THREE.Vector3()) => (s >= 1 ? out.copy(P) : plan.at(s, out)) };
}

/** Çarpışma: Dünya yüzeyi (çatı), cisimler (minDistKm) ve en yakın yıldız (varsayılan 0,02 ışık yılı; R4'te yarıçapın 1,5 katı) — dışarı it. */
export function resolveCollisions(C: THREE.Vector3, s: Space, nearStarIdx = -1, starMinKm = STAR_MIN_LY * LY_KM) {
  const r = C.distanceTo(s.earthCenter);
  if (r < s.surfaceKm) C.sub(s.earthCenter).multiplyScalar(s.surfaceKm / Math.max(r, 1e-9)).add(s.earthCenter);
  for (const b of s.bodies) {
    const d = C.distanceTo(b.pos);
    if (d < b.minDistKm) C.sub(b.pos).multiplyScalar(b.minDistKm / Math.max(d, 1e-9)).add(b.pos);
  }
  if (nearStarIdx >= 0) {
    const p = s.starPosLy, k = nearStarIdx * 3;
    const P = new THREE.Vector3(p[k], p[k + 1], p[k + 2]).multiplyScalar(LY_KM);
    const d = C.distanceTo(P), m = starMinKm;
    if (d < m) C.sub(P).multiplyScalar(m / Math.max(d, 1e-9)).add(P);
  }
  return C;
}

/** Yukarı referansı: yerde başucu, 30–300 km arasında ENU Kuzey'e (aşağı bakarken kuzey ekranın üstünde), z 11–14 galaktik kuzeye. */
export function freeUpRef(C: THREE.Vector3, s: Space, north: THREE.Vector3, ngp: THREE.Vector3, out = new THREE.Vector3()) {
  const zen = C.clone().sub(s.earthCenter).normalize();
  const la = Math.log10(Math.max(altitudeKm(C, s), 1e-3));
  slerpDir(zen, north, smoothstep(Math.log10(30), Math.log10(300), la), out);
  const z = Math.log10(Math.max(C.length(), 1e-3));
  return slerpDir(out.clone(), ngp, smoothstep(11, 14, z), out);
}

/** Yükselişte hareket yönü: 100 km altında İleri hep yukarı (şehrin 3D modeli yok), 80–150 km'de baktığın yöne geçer. */
export function moveDirection(C: THREE.Vector3, s: Space, forward: THREE.Vector3, out = new THREE.Vector3()) {
  const zen = C.clone().sub(s.earthCenter).normalize();
  return slerpDir(zen, forward, smoothstep(80, 150, altitudeKm(C, s)), out);
}

/** Yuvarlanmasız serbest kamera yönelimi: ileri f ve yukarı u. */
export class FreeOrientation {
  f = new THREE.Vector3(0, 0, -1);
  u = new THREE.Vector3(0, 1, 0);
  private m = new THREE.Matrix4();

  setFromQuaternion(q: THREE.Quaternion) {
    this.f.set(0, 0, -1).applyQuaternion(q);
    this.u.set(0, 1, 0).applyQuaternion(q);
  }

  /** Yukarıyı referansa yumuşakça hizala (Gram-Schmidt); bakış referansa paralelse mevcut yukarıyı koru. */
  levelTo(ref: THREE.Vector3, k: number) {
    const want = ref.clone().addScaledVector(this.f, -ref.dot(this.f));
    if (want.length() > 0.15) this.u.lerp(want.normalize(), k);
    this.u.addScaledVector(this.f, -this.u.dot(this.f)).normalize();
  }

  /** Sağa/sola (derece, yukarı ekseni etrafında) ve yukarı/aşağı (derece, sağ ekseni etrafında) */
  rotate(yawDeg: number, pitchDeg: number) {
    const D = Math.PI / 180;
    if (yawDeg) this.f.applyAxisAngle(this.u, -yawDeg * D);
    if (pitchDeg) {
      const right = new THREE.Vector3().crossVectors(this.f, this.u).normalize();
      this.f.applyAxisAngle(right, pitchDeg * D);
      this.u.applyAxisAngle(right, pitchDeg * D);
    }
    this.f.normalize();
    this.u.addScaledVector(this.f, -this.u.dot(this.f)).normalize();
  }

  quaternion(out = new THREE.Quaternion()) {
    this.m.lookAt(new THREE.Vector3(), this.f, this.u);
    return out.setFromRotationMatrix(this.m);
  }
}
