import { describe, expect, it } from "vitest";
import { ITEMS, SHADOW_RS, visualRadius } from "../src/scenes/compare";

describe("boyut karşılaştırması (R4)", () => {
  it("cisimler görünen yarıçapa göre küçükten büyüğe (kara delikte gölge), hepsi kaynaklı", () => {
    for (let i = 1; i < ITEMS.length; i++) expect(visualRadius(ITEMS[i]), ITEMS[i].key).toBeGreaterThan(visualRadius(ITEMS[i - 1]));
    for (const it of ITEMS) expect(it.source.length, it.key).toBeGreaterThan(3);
  });
  it("Betelgeuse Güneş'in 764 katı, VY CMa 1.420 katı", () => {
    const sun = ITEMS.find(x => x.key === "sun")!.rKm;
    expect(ITEMS.find(x => x.key === "betelgeuse")!.rKm / sun).toBeCloseTo(764, 6);
    expect(ITEMS.find(x => x.key === "vycma")!.rKm / sun).toBeCloseTo(1420, 6);
  });
});

describe("sıkı cisimler", () => {
  it("Schwarzschild yarıçapı: Güneş kütlesi başına 2,953 km; Sgr A* ≈ 12,69 milyon km, M87* ≈ 19,2 milyar km", async () => {
    const { RS_KM_PER_MSUN, SGRA_MASS_MSUN } = await import("../src/science/constants");
    expect(RS_KM_PER_MSUN).toBeCloseTo(2.95325, 4);
    expect(SGRA_MASS_MSUN * RS_KM_PER_MSUN / 1e7).toBeCloseTo(1.269, 3);
    expect(ITEMS.find(x => x.key === "m87")!.rKm / 1e10).toBeCloseTo(1.92, 2);
  });
  it("pulsar en küçük, M87* en büyük; Sirius B Dünya'dan, Sgr A* Arcturus'tan küçük", () => {
    expect(ITEMS[0].key).toBe("psr");
    expect(ITEMS[ITEMS.length - 1].key).toBe("m87");
    const r = (k: string) => ITEMS.find(x => x.key === k)!.rKm;
    expect(r("siriusb")).toBeLessThan(r("earth"));
    expect(r("sgra")).toBeLessThan(r("arcturus"));
  });
  it("kara delik gölgesi 3√3/2 Rs; Sgr A*'nın gölgesi Aldebaran'dan büyük, Rigel'den küçük — sıra buna göre", () => {
    expect(SHADOW_RS).toBeCloseTo(2.598, 3);
    const k = (key: string) => ITEMS.findIndex(x => x.key === key);
    expect(k("sgra")).toBeGreaterThan(k("aldebaran"));
    expect(k("sgra")).toBeLessThan(k("rigel"));
  });
});
