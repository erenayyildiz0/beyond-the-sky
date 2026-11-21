import { describe, expect, it } from "vitest";
import { lightLeft, trDurationLocative, trLocative } from "../src/science/years";

describe("years (SPEC §3.11)", () => {
  it("lightLeft", () => {
    expect(lightLeft(25.04, 2026.912)).toEqual({ year: 2001, approx: false, bc: null });
    expect(lightLeft(432.6, 2026.912)).toMatchObject({ year: 1590, approx: true });
    expect(lightLeft(1411.9, 2026.912)).toMatchObject({ year: 600, approx: true });
    expect(lightLeft(3166.6, 2026.912)).toMatchObject({ year: -1100, bc: 1101 });
  });
  it("trLocative: §3.11'deki 14 örnek", () => {
    const ok = ["2007'de", "2010'da", "2001'de", "1984'te", "1960'ta", "1590'da", "1530'da", "1160'ta", "600'de", "2000'de", "1940'ta", "1970'te", "1983'te", "1966'da"];
    for (const s of ok) expect(trLocative(parseInt(s, 10))).toBe(s);
  });
  it("süre + bulunma eki", () => {
    expect(trDurationLocative("8 dakika 12 saniye")).toBe("8 dakika 12 saniyede");
    expect(trDurationLocative("4 saat 5 dakika")).toBe("4 saat 5 dakikada");
    expect(trDurationLocative("1 gün")).toBe("1 günde");
  });
});

import { t } from "../src/ui/i18n";
describe("i18n Türkçe yer tutucu", () => {
  it("{yıl_de} doldurulur", () => {
    expect(t("act2.label.star", { name: "Vega", dist: "25,0", yıl_de: "2001'de" })).toBe("Vega · 25,0 ışık yılı · ışığı 2001'de yola çıktı");
  });
});
