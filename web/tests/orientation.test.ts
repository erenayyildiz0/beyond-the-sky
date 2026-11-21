import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { altAzFromDir } from "../src/science/coords";
import { headingToAlpha, orientationToQuaternion } from "../src/science/orientation";

const look = (a: number, b: number, g: number, s = 0) => {
  const q = orientationToQuaternion(a, b, g, s);
  return { dir: altAzFromDir(new THREE.Vector3(0, 0, -1).applyQuaternion(q)), up: new THREE.Vector3(0, 1, 0).applyQuaternion(q) };
};

describe("orientation (SPEC §6.3 doğrulanan durumlar)", () => {
  it("dik telefon, alpha 0, beta 90 → Kuzey, ufukta, yukarısı +y", () => {
    const r = look(0, 90, 0);
    expect(r.dir.altDeg).toBeCloseTo(0, 6); expect(Math.min(r.dir.azDeg, 360 - r.dir.azDeg)).toBeCloseTo(0, 6); expect(r.up.y).toBeCloseTo(1, 6);
  });
  it("alpha 90 → Batı, alpha 270 → Doğu", () => {
    expect(look(90, 90, 0).dir.azDeg).toBeCloseTo(270, 6);
    expect(look(270, 90, 0).dir.azDeg).toBeCloseTo(90, 6);
  });
  it("beta 135 → 45° yükseklik; beta 0 → tam aşağı", () => {
    expect(look(0, 135, 0).dir.altDeg).toBeCloseTo(45, 6);
    expect(look(0, 0, 0).dir.altDeg).toBeCloseTo(-90, 6);
  });
  it("yatay tutuş (ekran 90°): yine Kuzey, ufukta, yukarısı +y", () => {
    const r = look(90, 0, -90, 90);                  // yatayda cihazın üstü batıyı gösterir → alpha 90
    expect(r.dir.altDeg).toBeCloseTo(0, 5); expect(Math.min(r.dir.azDeg, 360 - r.dir.azDeg)).toBeCloseTo(0, 5); expect(r.up.y).toBeCloseTo(1, 5);
  });
  it("headingToAlpha", () => {
    for (const h of [0, 45, 90, 180, 295]) {
      const az = look(headingToAlpha(h), 90, 0).dir.azDeg;
      expect(Math.min(Math.abs(az - h), 360 - Math.abs(az - h))).toBeLessThan(1e-6);
    }
  });
});
