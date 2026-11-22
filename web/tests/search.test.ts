import { describe, expect, it } from "vitest";
import { fold, searchNames, type SearchEntry } from "../src/ui/search";

const E: SearchEntry[] = [
  { key: "a", name: "Ülker", mag: 2.85 }, { key: "b", name: "Sirius", mag: -1.44 }, { key: "c", name: "η Cas", mag: 3.46 },
  { key: "d", name: "Alnilam", mag: 1.69 }, { key: "e", name: "Polaris Australis", mag: 5.4 }, { key: "f", name: "Polaris", mag: 1.97 },
  { key: "g", name: "γ² Vel", mag: 1.8 },
];
const idx = E.map(e => ({ e, f: fold(e.name) }));
const first = (q: string) => searchNames(idx, q)[0]?.name;

describe("arama (SPEC §9.2)", () => {
  it("Türkçe karakter katlama", () => { expect(fold("Ülker")).toBe("ulker"); expect(fold("İĞÜŞÖÇı")).toBe("igusoci"); });
  it("ulker → Ülker, SIRIUS → Sirius, eta cas → η Cas, alnilam → Alnilam", () => {
    expect(first("ulker")).toBe("Ülker"); expect(first("SIRIUS")).toBe("Sirius");
    expect(first("eta cas")).toBe("η Cas"); expect(first("η Cas")).toBe("η Cas"); expect(first("alnilam")).toBe("Alnilam");
  });
  it("üst simge ve sıralama: önce baştan eşleşen, sonra parlak", () => {
    expect(first("gamma2")).toBe("γ² Vel");
    expect(searchNames(idx, "polaris").map(e => e.name)).toEqual(["Polaris", "Polaris Australis"]);
    expect(searchNames(idx, "")).toEqual([]);
  });
});
