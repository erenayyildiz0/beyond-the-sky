import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { prepareSky, type SkyJson } from "../src/app/assets";
import { birthTable, chooseNight, icrsToEnu, relocateSky, sqmForNelm, visibilityFor } from "../src/science/relocate";
import { nelm } from "../src/science/visibility";

const rd = (f: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`../public/data/${f}`, import.meta.url)), "utf8"));
const sky = prepareSky(rd("sky.json") as SkyJson);
const icrs = (rd("stars_icrs.json") as { data: [number, number][] }).data;
const m = sky.meta, L = m.location;
const date = new Date(m.time_utc);
const ankara = { lat: L.lat, lon: L.lon, heightM: L.height_m, name: L.name, nameAblative: L.name_ablative };
const polaris = sky.stars.data.findIndex(r => r[7] === 11767);

describe("E1 konumumu kullan (EXTRAS kabul ölçütleri)", () => {
  it("Ankara: ICRS → ENU matrisi pipeline'ınkiyle aynı (< 1e-3)", () => {
    const M = icrsToEnu(L.lat, L.lon, L.height_m, date);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) expect(Math.abs(M[i][j] - sky.frames.icrs_to_enu[i][j])).toBeLessThan(1e-3);
  });
  const { sky: re } = relocateSky(sky, icrs, ankara, date, m.visibility, m.tz);
  it("Ankara: yıldız konumları 0,05° içinde, sayımlar ±2 içinde", () => {
    let worst = 0;
    for (let i = 0; i < sky.starAlt.length; i += 7) worst = Math.max(worst, Math.abs(re.starAlt[i] - sky.starAlt[i]));
    expect(worst).toBeLessThan(0.05);
    expect(Math.abs(re.meta.counts.city - m.counts.city)).toBeLessThanOrEqual(2);
    expect(Math.abs(re.meta.counts.dark - m.counts.dark)).toBeLessThanOrEqual(2);
  });
  it("Ankara: doğum tablosu, gezegenler, Ay ve Güneş pipeline ile tutarlı", () => {
    const same = re.birth.rows.filter((r, k) => r[1] === sky.birth.rows[k][1]).length;
    expect(same / sky.birth.rows.length).toBeGreaterThan(0.97);
    for (const b of sky.bodies) {
      const nb = re.bodies.find(x => x.key === b.key)!;
      expect(Math.abs(nb.alt - b.alt), b.key).toBeLessThan(0.1);
    }
    expect(Math.abs(re.meta.moon.alt - m.moon.alt)).toBeLessThan(0.2);
    expect(Math.abs(re.meta.sun.alt - m.sun.alt)).toBeLessThan(0.1);
  });
  it("başka şehirde Kutup Yıldızı'nın yüksekliği enlemle < 1°", () => {
    for (const [lat, lon] of [[41.01, 28.98], [59.33, 18.07], [-33.87, 151.21]]) {
      const { sky: s } = relocateSky(sky, icrs, { ...ankara, lat, lon }, date, m.visibility, "UTC");
      expect(Math.abs(s.starAlt[polaris] - lat)).toBeLessThan(1);
    }
  });
  it("gece seçimi: Ankara'da 21 Kasım'dan aramak 29 Kasım'ı bulur (SPEC §5.5)", () => {
    const n = chooseNight(L.lat, L.lon, L.height_m, new Date(2026, 10, 21))!;
    expect(n.getDate()).toBe(29); expect(n.getHours()).toBe(21);
  });
  it("ışık kirliliği: Bortle NELM → SQM tersi tutarlı; şehir < banliyö < kırsal ≤ karanlık", () => {
    expect(nelm(sqmForNelm(5.8))).toBeCloseTo(5.8, 3);
    const c = visibilityFor("city", m.visibility), s = visibilityFor("suburb", m.visibility), r = visibilityFor("rural", m.visibility);
    expect(c.sqm_city).toBeLessThan(s.sqm_city); expect(s.sqm_city).toBeLessThan(r.sqm_city); expect(r.sqm_city).toBeLessThanOrEqual(m.visibility.sqm_dark);
  });
  it("doğum tablosu: alt dizisiyle birebir pipeline kuralı (2007 → Achird)", () => {
    const rows = birthTable(sky.starMag, sky.starDly, icrs.map(x => x[1]), sky.starAlt, m.obs_year_frac, L.lat);
    const r2007 = rows.find(r => r[0] === 2007)!;
    expect(sky.stars.data[r2007[1]][7]).toBe(3821);
  });
});
