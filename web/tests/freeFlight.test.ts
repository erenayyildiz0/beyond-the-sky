import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { EARTH_RADIUS_KM, LY_KM, MOON_RADIUS_KM } from "../src/science/constants";
import {
  altitudeKm, cruiseSpeed, flyPlan, FreeOrientation, localScaleKm, pointPlan, resolveCollisions, SPEED_MAX_KM_S, SPEED_MIN_KM_S,
  STAR_MIN_LY, type Space,
} from "../src/science/freeFlight";

const surface = EARTH_RADIUS_KM + 0.89;
const space = (starsLy: number[] = [1e6, 0, 0]): Space => ({
  earthCenter: new THREE.Vector3(0, -surface, 0),
  surfaceKm: surface,
  bodies: [{ key: "moon", pos: new THREE.Vector3(380_000, 0, 0), radiusKm: MOON_RADIUS_KM, minDistKm: 1.5 * MOON_RADIUS_KM }],
  starPosLy: new Float32Array(starsLy),
});

describe("serbest uçuş (SPEC §6.12, km)", () => {
  it("cruiseSpeed sınırları", () => {
    expect(cruiseSpeed(0, 1)).toBe(SPEED_MIN_KM_S);
    expect(cruiseSpeed(1e30, 1)).toBe(SPEED_MAX_KM_S);
    expect(cruiseSpeed(1000, 1)).toBeCloseTo(600, 9);
    expect(cruiseSpeed(1000, -1)).toBeCloseTo(-600, 9);
    expect(cruiseSpeed(1000, 0)).toBe(0);
  });

  it("localScaleKm en küçüğü seçer: yükseklik, Ay, yıldız", () => {
    const s = space();
    expect(localScaleKm(new THREE.Vector3(0, 100, 0), s)).toBeCloseTo(100.89, 6);                     // yerde: yükseklik
    const nearMoon = new THREE.Vector3(380_000 - MOON_RADIUS_KM - 500, 0, 0);
    expect(localScaleKm(nearMoon, s)).toBeCloseTo(500, 6);                                           // Ay yüzeyine
    const st = space([10, 0, 0]);
    const nearStar = new THREE.Vector3(9.9 * LY_KM, 0, 0);
    expect(localScaleKm(nearStar, st) / LY_KM).toBeCloseTo(0.1, 6);                                  // yıldıza
  });

  it("flyPlan: başlangıç, bitişte endKm, monoton, 2–7 sn", () => {
    const C0 = new THREE.Vector3(0, 1e6, 0), T = new THREE.Vector3(5 * LY_KM, 0, 0), end = 0.05 * LY_KM;
    const p = flyPlan(C0, T, end);
    expect(p.at(0).distanceTo(C0)).toBeLessThan(1e-3 * C0.distanceTo(T));
    expect(p.at(1).distanceTo(T)).toBeCloseTo(end, -2);
    let prev = Infinity;
    for (let s = 0; s <= 1.0001; s += 0.01) { const d = p.at(s).distanceTo(T); expect(d).toBeLessThanOrEqual(prev + 1e-6); prev = d; }
    expect(p.dur).toBeGreaterThanOrEqual(2); expect(p.dur).toBeLessThanOrEqual(7);
  });

  it("pointPlan tam noktada biter", () => {
    const P = new THREE.Vector3(1, 2, 3).multiplyScalar(1e9);
    expect(pointPlan(new THREE.Vector3(), P).at(1).distanceTo(P)).toBe(0);
  });

  it("çarpışma: yüzeyin, Ay'ın ve yıldızın içine girilmez", () => {
    const s = space([10, 0, 0]);
    const under = resolveCollisions(new THREE.Vector3(0, -50, 0), s);
    expect(altitudeKm(under, s)).toBeCloseTo(0.89, 6);
    const inMoon = resolveCollisions(new THREE.Vector3(380_000, 100, 0), s);
    expect(inMoon.distanceTo(s.bodies[0].pos)).toBeCloseTo(1.5 * MOON_RADIUS_KM, 3);
    const inStar = resolveCollisions(new THREE.Vector3(10 * LY_KM - 1e9, 0, 0), s, 0);
    expect(inStar.distanceTo(new THREE.Vector3(10 * LY_KM, 0, 0)) / LY_KM).toBeCloseTo(STAR_MIN_LY, 6);
  });

  it("yükseliş: 0,9 km'den 400 km'ye throttle 1 ile 8–18 sn", () => {
    const s = space();
    const C = new THREE.Vector3();
    let v = 0, t = 0;
    const dt = 1 / 60;
    while (altitudeKm(C, s) < 400 && t < 60) {
      const target = cruiseSpeed(localScaleKm(C, s), 1);
      v += (target - v) * (1 - Math.exp(-dt / 0.4));
      C.addScaledVector(C.clone().sub(s.earthCenter).normalize(), v * dt);
      t += dt;
    }
    expect(t).toBeGreaterThan(8);
    expect(t).toBeLessThan(18);
  });

  it("FreeOrientation: döndürünce yuvarlanma yok, yukarı ileriye dik", () => {
    const o = new FreeOrientation();
    o.rotate(30, 20);
    o.levelTo(new THREE.Vector3(0, 1, 0), 1);
    expect(Math.abs(o.f.dot(o.u))).toBeLessThan(1e-12);
    const right = new THREE.Vector3().crossVectors(o.f, o.u);
    expect(Math.abs(right.y)).toBeLessThan(1e-9);                    // ufuk yatay kalır
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(o.quaternion());
    expect(fwd.distanceTo(o.f)).toBeLessThan(1e-9);
    expect(o.f.y).toBeGreaterThan(0);                                // pozitif pitch yukarı
    expect(o.f.x).toBeGreaterThan(0);                                // pozitif yaw sağa
  });
});
