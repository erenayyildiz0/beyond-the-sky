import { describe, expect, it } from "vitest";
import { C_KM_S, S2_ORBIT, SGRA_DEC_DEG, SGRA_DIST_PC, SGRA_RA_DEG } from "../src/science/constants";
import { s2OrbitPoints, s2Position } from "../src/science/s2";

const DEG = Math.PI / 180;
const L: [number, number, number] = [
  Math.cos(SGRA_DEC_DEG * DEG) * Math.cos(SGRA_RA_DEG * DEG),
  Math.cos(SGRA_DEC_DEG * DEG) * Math.sin(SGRA_RA_DEG * DEG),
  Math.sin(SGRA_DEC_DEG * DEG),
];
const awayAt = (yr: number) => {
  const { icrsAU } = s2Position(yr, SGRA_RA_DEG, SGRA_DEC_DEG, SGRA_DIST_PC);
  return icrsAU[0] * L[0] + icrsAU[1] * L[1] + icrsAU[2] * L[2];
};

describe("S2 yıldızının yörüngesi (GRAVITY 2020)", () => {
  it("periapsis (2018,379): r ≈ 119,4 AB (±0,5) ve hız ≈ 7,6–7,9 bin km/s (~%2,6 c)", () => {
    const p = s2Position(S2_ORBIT.tPeriYr, SGRA_RA_DEG, SGRA_DEC_DEG, SGRA_DIST_PC);
    expect(Math.abs(p.rAU - 119.4)).toBeLessThan(0.5);
    expect(p.vKmS).toBeGreaterThan(7600);
    expect(p.vKmS).toBeLessThan(7900);
    expect((p.vKmS / C_KM_S) * 100).toBeCloseTo(2.6, 1);
  });

  it("apoapsis (tP + P/2): r ≈ 1950 AB (±5)", () => {
    const a = s2Position(S2_ORBIT.tPeriYr + S2_ORBIT.periodYr / 2, SGRA_RA_DEG, SGRA_DEC_DEG, SGRA_DIST_PC);
    expect(Math.abs(a.rAU - 1950)).toBeLessThan(5);
  });

  it("dikine hız işareti: tP'de away > 0; tP − 0,1'den tP + 0,1'e türev pozitiften negatife döner", () => {
    const tP = S2_ORBIT.tPeriYr;
    expect(awayAt(tP)).toBeGreaterThan(0);
    const dt = 1e-4;
    const dBefore = (awayAt(tP - 0.1 + dt) - awayAt(tP - 0.1 - dt)) / (2 * dt);
    const dBefore05 = (awayAt(tP - 0.05 + dt) - awayAt(tP - 0.05 - dt)) / (2 * dt);
    const dAfter = (awayAt(tP + 0.1 + dt) - awayAt(tP + 0.1 - dt)) / (2 * dt);
    expect(dBefore).toBeGreaterThan(0);
    expect(dBefore05).toBeGreaterThan(0);
    expect(dAfter).toBeLessThan(0);
  });

  it("yörünge noktaları kapalı: ilk ve son nokta arası < 1e−6 a", () => {
    const pts = s2OrbitPoints(256, SGRA_RA_DEG, SGRA_DEC_DEG, SGRA_DIST_PC);
    expect(pts.length).toBe(256);
    const p0 = pts[0], p1 = pts[pts.length - 1];
    const dist = Math.hypot(p0[0] - p1[0], p0[1] - p1[1], p0[2] - p1[2]);
    const a = S2_ORBIT.aArcsec * SGRA_DIST_PC;
    expect(dist).toBeLessThan(1e-6 * a);
  });
});
