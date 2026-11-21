import { describe, expect, it } from "vitest";
import { bolometricCorrection, bvToKelvin, computedRadius, kelvinToRgb, PUBLISHED_RADII, starRadius } from "../src/science/stars";

describe("yıldız boyutu (R4)", () => {
  it("sıcaklık rengi: soğuk turuncu, sıcak mavimsi", () => {
    const [r1, , b1] = kelvinToRgb(3300), [r2, , b2] = kelvinToRgb(10_500);
    expect(r1).toBeGreaterThan(b1); expect(b2).toBeGreaterThanOrEqual(r2);
  });
  it("bolometrik düzeltme (Torres 2010)", () => {
    expect(bolometricCorrection(5772)).toBeCloseTo(-0.08, 2);
    expect(bolometricCorrection(3600)).toBeLessThan(-1.5);
  });
  it("Güneş kendi yarıçapını verir", () => {
    // Güneş: V = 4,83 mutlak (10 pc), B−V 0,65 → ~1 R☉
    const r = computedRadius(4.83, 10 * 3.261563777, 0.65);
    expect(r.R).toBeGreaterThan(0.9); expect(r.R).toBeLessThan(1.1);
    expect(bvToKelvin(0.65)).toBeCloseTo(5778, -1);
  });
  it("Betelgeuse hesaplaması yayımlanan değerle aynı mertebede; yayımlanan kullanılır", () => {
    // HYG: V 0,45, 498 ışık yılı, B−V 1,85
    const c = computedRadius(0.45, 498, 1.85);
    expect(c.R).toBeGreaterThan(400); expect(c.R).toBeLessThan(1600);
    expect(starRadius(27989, 0.45, 498, 1.85)!.R).toBe(PUBLISHED_RADII[27989].R);
    expect(starRadius(null, 5, null, 0.6)).toBeNull();
  });
});
