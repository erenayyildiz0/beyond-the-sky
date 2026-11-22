import { describe, expect, it } from "vitest";
import { EVENTS, eventAgo, eventsFor } from "../src/content/history";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OBS = 2026.91;                                   // 29 Kasım 2026
const ids = (lb: number) => eventsFor(lb, OBS).map(e => e.id);

describe("tarih çapaları (EXTRAS T1)", () => {
  it("her olayın kaynağı var; görseli olanın emeği geçeni yazılı ve dosyası var", () => {
    const dir = fileURLToPath(new URL("../public/data/history/", import.meta.url));
    for (const e of EVENTS) {
      expect(e.sources.length, e.id).toBeGreaterThan(0);
      expect((e.year == null) !== (e.ago == null), e.id).toBe(true);
      if (e.img) { expect(e.credit, e.id).toBeTruthy(); expect(existsSync(`${dir}${e.img}.jpg`), e.img).toBe(true); }
    }
  });
  it("MÖ yılları: MÖ 776 → 2802 yıl önce (0 yılı yok)", () => {
    expect(eventAgo(EVENTS.find(e => e.id === "olympics")!, OBS)).toBeCloseTo(2801.9, 1);
  });
  it("Aldebaran (66,6 ışık yılı) → 1960 civarı: Sputnik / Gagarin", () => {
    expect(ids(66.6)[0]).toBe("gagarin");
    expect(ids(57.9)).toContain("apollo11");
  });
  it("Malazgirt ~956, İstanbul ~574, Andromeda 2,5 milyon → ilk Homo, dinozorlar 66 milyon", () => {
    expect(ids(955)).toContain("malazgirt");
    expect(ids(574)[0]).toBe("istanbul");
    expect(ids(2.5e6)).toContain("homo");
    expect(ids(66e6)[0]).toBe("dinos");
  });
  it("uzay olayları: Güneş Sistemi'nin doğuşu, Gaia-Enceladus, kozmik mikrodalga arka planı, SN 1987A, Kepler 1604", () => {
    expect(ids(4.567e9)).toContain("solarSystem");
    expect(ids(1e10)[0]).toBe("enceladus");
    expect(ids(13.79e9)[0]).toBe("cmb");
    expect(ids(39.9)[0]).toBe("sn1987a");
    expect(ids(422.9)[0]).toBe("keplerSn");
  });
  it("Ay'ın uzaklığında (1,3 sn) ve boşluklarda olay yok", () => {
    expect(ids(4e-8)).toEqual([]);
    expect(ids(150)).toEqual([]);
  });
  it("pipeline görsel listesiyle aynı kimlikler", () => {
    const py = readFileSync(fileURLToPath(new URL("../../pipeline/bts/history.py", import.meta.url)), "utf8");
    for (const e of EVENTS) if (e.img) expect(py.includes(`"${e.img}":`), e.img).toBe(true);
  });
});
