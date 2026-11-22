import { describe, expect, it } from "vitest";
import { CON_TR, conName, parseSpect, relLum, SUN_INVISIBLE_LY, sunMagFrom, sunState, tonight, voyagerYears } from "../src/science/facts";
import { bvToKelvin } from "../src/science/stars";

// SPEC §3.16 ve §9.2 (facts)
describe("bilgi kartı satırları", () => {
  it("oradan Güneş: Sirius 1,94 · Vega 4,26 · 70,4 ışık yılında 6,50", () => {
    expect(sunMagFrom(8.6)).toBeCloseTo(1.94, 1);
    expect(sunMagFrom(25.04)).toBeCloseTo(4.26, 1);
    expect(sunMagFrom(70.4)).toBeCloseTo(6.5, 2);
    expect(SUN_INVISIBLE_LY).toBeCloseTo(70.4, 1);
  });
  it("Güneş görünürlük metni sınırları", () => {
    expect(sunState(4)).toBe("easy"); expect(sunState(4.01)).toBe("dark");
    expect(sunState(6.5)).toBe("dark"); expect(sunState(6.51)).toBe("none");
  });
  it("görünür ışıkta Güneş'e göre: Sirius ~22, Vega ~49, Achird ~1,3", () => {
    expect(relLum(-1.44, 8.6)).toBeGreaterThan(21); expect(relLum(-1.44, 8.6)).toBeLessThan(24);
    expect(Math.round(relLum(0.03, 25.04))).toBeGreaterThanOrEqual(48);
    expect(Math.round(relLum(0.03, 25.04))).toBeLessThanOrEqual(50);
    expect(relLum(3.46, 19.42)).toBeCloseTo(1.3, 1);
  });
  it("Güneş B−V 0,65 → 5.778 K (Ballesteros)", () => { expect(Math.round(bvToKelvin(0.65) / 10) * 10).toBeCloseTo(5780, -1); });
  it("Voyager 1 ile Sirius ~152.000 yıl", () => { expect(voyagerYears(8.6) / 1000).toBeCloseTo(152, 0); });
  it("tür: G0V → V, K5III → III, F5IV-V → IV, B8Ia → I, M1: comp → gösterme", () => {
    expect(parseSpect("G0V")).toEqual({ letter: "G", cls: "V" });
    expect(parseSpect("K5III")?.cls).toBe("III");
    expect(parseSpect("F5IV-V")?.cls).toBe("IV");
    expect(parseSpect("B8Ia")?.cls).toBe("I");
    expect(parseSpect("K2IIIp")?.cls).toBe("III");
    expect(parseSpect("A0m...")).toEqual({ letter: "A", cls: null });
    expect(parseSpect("M1: comp")).toBeNull();
    expect(parseSpect("A1V+DA")).toBeNull();
  });
  it("takımyıldız: Cas → Kraliçe, Car → Carina", () => {
    expect(CON_TR.Cas).toBe("Kraliçe");
    expect(conName("Car", "tr")).toBe("Carina");
    expect(conName("Cas", "en")).toBe("Cassiopeia");
  });
  it("bu gece: ufkun altı / şehirde / karanlıkta", () => {
    const v = { sqm_city: 18.5, sqm_dark: 22, glow_city_mag: 2, glow_dark_mag: 0.5, extinction_k: 0.2 };
    expect(tonight(0, -1, v)).toBe("below");
    expect(tonight(0, 60, v)).toBe("city");
    expect(tonight(5.5, 60, v)).toBe("dark");
    expect(tonight(9, 60, v)).toBe("none");
  });
});
