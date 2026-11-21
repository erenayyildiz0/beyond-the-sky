import { describe, expect, it } from "vitest";
import { cosmicSampling, keepAlpha, procDensity, radialDensity } from "../src/render/cosmicSampling";

const web = { n: 200_000, rMin: 1390, rMax: 44_000 };

describe("kozmik ölçekte eşit yoğunluklu örneklem", () => {
  it("temsili ağın log-düzgün yoğunluğu toplam sayıyı verir", () => {
    let tot = 0;
    const N = 4000, L = Math.log(web.rMax / web.rMin);
    for (let i = 0; i < N; i++) {                                    // ∫ n(r) 4πr² dr, log adımlarla
      const r = web.rMin * Math.exp(L * (i + 0.5) / N);
      tot += procDensity(web.n, web.rMin, web.rMax, r) / 1e9 * 4 * Math.PI * r ** 3 * (L / N);
    }
    expect(tot).toBeCloseTo(web.n, -1);
  });

  it("uzaktan gerçek ve temsili noktalar aynı yoğunlukta, sis içinde ağ her yerde yeterli", () => {
    const s = cosmicSampling(2400, web);
    expect(s.g).toBe(1);
    expect(s.real.nt).toBeCloseTo(s.web.nt, 6);
    for (const r of [web.rMin, 3000, 2400 + s.web.fog]) expect(procDensity(web.n, web.rMin, web.rMax, r)).toBeGreaterThanOrEqual(s.web.nt * 0.999);
  });

  it("2MRS'in içindeyken gerçek galaksilerin hepsi kalır", () => {
    const s = cosmicSampling(300, web);
    expect(s.real.fog).toBe(0);
    expect(keepAlpha(0.999, 5e5, s.real.nt)).toBe(1);
  });

  it("seyreltme beklenen oranda nokta tutar ve yoğun kabuğu düzleştirir", () => {
    const dens = 1000, nt = 10, M = 200_000;
    let kept = 0;
    for (let i = 0; i < M; i++) kept += keepAlpha((i + 0.5) / M, dens, nt);
    expect(kept / M).toBeCloseTo(nt / dens, 3);
  });

  it("radyal yoğunluk: düzgün dağılımda sabit", () => {
    const r = new Float32Array(100_000).map((_, i) => 1000 * Math.cbrt((i + 0.5) / 100_000));
    const d = radialDensity(r);
    const exact = 100_000 / (4 / 3 * Math.PI * 1000 ** 3) * 1e9;
    for (const k of [20_000, 50_000, 90_000]) expect(d[k] / exact).toBeCloseTo(1, 1);
  });
});
