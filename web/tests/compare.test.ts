import { describe, expect, it } from "vitest";
import { ITEMS } from "../src/scenes/compare";

describe("boyut karşılaştırması (R4)", () => {
  it("cisimler yarıçapa göre küçükten büyüğe, hepsi kaynaklı", () => {
    for (let i = 1; i < ITEMS.length; i++) expect(ITEMS[i].rKm, ITEMS[i].key).toBeGreaterThan(ITEMS[i - 1].rKm);
    for (const it of ITEMS) expect(it.source.length, it.key).toBeGreaterThan(3);
  });
  it("Betelgeuse Güneş'in 764 katı, VY CMa 1.420 katı", () => {
    const sun = ITEMS.find(x => x.key === "sun")!.rKm;
    expect(ITEMS.find(x => x.key === "betelgeuse")!.rKm / sun).toBeCloseTo(764, 6);
    expect(ITEMS.find(x => x.key === "vycma")!.rKm / sun).toBeCloseTo(1420, 6);
  });
});
