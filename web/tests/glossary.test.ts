import { describe, expect, it } from "vitest";
import { findTerms, TERMS } from "../src/content/glossary";

const ids = (s: string, l: "tr" | "en" = "tr") => findTerms(s, l).map(h => h.term.id);
describe("sözlük", () => {
  it("Türkçe eklerle eşleşir, her terim bir kez", () => {
    expect(ids("Işığın Ankara'dan buraya ulaşması · 66,6 ışık yılı · 6,4 kadir")).toEqual(["ly", "mag"]);
    expect(ids("Sgr A*'nın çevresinde S2 dolanır")).toEqual(["sgra", "s2"]);
    expect(ids("Samanyolu galaksisinin merkezindeki kara delik")).toEqual(["mw", "galaxy", "bh"]);
  });
  it("kısaltmalar kelime içinde eşleşmez", () => {
    expect(ids("ABD ve Rsx ve S25")).toEqual([]);
    expect(ids("Uzaklık 5,2 AB")).toEqual(["au"]);
  });
  it("İngilizce", () => { expect(ids("Exposure boosted · 2MRS · comoving distance", "en")).toEqual(["exposure", "2mrs", "comoving"]); });
  it("her terimin iki dilde açıklaması var", () => { for (const t of TERMS) { expect(t.def.tr.length).toBeGreaterThan(10); expect(t.def.en.length).toBeGreaterThan(10); } });
});
