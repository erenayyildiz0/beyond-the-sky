import { describe, expect, it } from "vitest";
import { starLook } from "../src/render/starSurface";

describe("yıldız yüzeyi görünümü", () => {
  it("Güneş'te yarıçap başına ~700 granül (~1.000 km)", () => { expect(starLook(5772, 1).cells).toBeCloseTo(700, 0); });
  it("süperdevlerde birkaç dev hücre, korona ve çıkıntı zayıf", () => {
    const b = starLook(3600, 764);                       // Betelgeuse
    expect(b.cells).toBeLessThan(8);
    expect(b.prom).toBeLessThan(0.05);
    expect(b.corona).toBeLessThan(starLook(5772, 1).corona / 2);
  });
  it("sıcak yıldızda granül kontrastı düşük, leke yok", () => {
    const r = starLook(12100, 78.9);                      // Rigel
    expect(r.contrast).toBeLessThan(0.4);
    expect(r.spots).toBe(false);
  });
});
