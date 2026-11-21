import { describe, expect, it } from "vitest";
import { act1SkyState, airmass, countVisible, mwVisible, nelm, visibility } from "../src/science/visibility";

describe("visibility (SPEC §3.3) — Python ile aynı değerler", () => {
  it("NELM", () => {
    expect(nelm(18.0)).toBeCloseTo(3.97, 2);
    expect(nelm(22.0)).toBeCloseTo(6.62, 2);
    expect(nelm(20)).toBeGreaterThan(nelm(19));
  });
  it("hava kütlesi", () => {
    expect(airmass(90)).toBeCloseTo(1.0, 3);
    expect(Math.abs(airmass(30) - 1.994)).toBeLessThan(0.01);
    expect(Math.abs(airmass(0) - 37.9)).toBeLessThan(0.2);
    expect(airmass(-4)).toBe(airmass(0));
  });
  it("yumuşak görünürlük", () => {
    expect(visibility(3, 5)).toBe(1);
    expect(visibility(7, 5)).toBe(0);
    expect(visibility(5, 5)).toBeCloseTo(0.5, 6);
  });
  it("Samanyolu: önce çekirdekler, karanlıkta neredeyse tamamı", () => {
    // Doku parlaklık yüzdelikleri (kazanç 0,25): %25 0,010 · %50 0,020 · %95 0,081 · %99 0,124
    expect(mwVisible(0.124, 18)).toBe(0);              // şehirde hiçbir şey
    expect(mwVisible(0.124, 19.4)).toBe(0);            // banliyö: henüz yok
    expect(mwVisible(0.124, 20)).toBeGreaterThan(0.05); // SQM 20: en parlak %1 çok soluk
    expect(mwVisible(0.124, 21)).toBeGreaterThan(0.6);  // SQM 21: çekirdekler belirgin
    expect(mwVisible(0.020, 20)).toBe(0);              //          ortanca henüz yok
    expect(mwVisible(0.020, 21.5)).toBeGreaterThan(0.1);
    expect(mwVisible(0.020, 22)).toBeGreaterThan(0.7); // karanlıkta ortanca da güçlü
    expect(mwVisible(0.010, 22)).toBeGreaterThan(0.45);
    let prev = -1;
    for (let s = 18; s <= 22; s += 0.25) { const v = mwVisible(0.05, s); expect(v).toBeGreaterThanOrEqual(prev); prev = v; }
  });
  it("ufkun altı sayılmaz", () => {
    expect(countVisible(new Float64Array([-1, 45]), new Float64Array([0, 0]), 18, 1.5, 0.25)).toBe(1);
  });
  it("Perde 1 durumu uçlarda şehir/karanlık", () => {
    const v = { sqm_city: 18, sqm_dark: 22, glow_city_mag: 1.5, glow_dark_mag: 0.5 };
    const c = act1SkyState(0, v);
    expect(c.q).toBeCloseTo(0, 12); expect(c.sqm).toBe(18); expect(c.glow).toBe(1.5);
    expect(c.m31Opacity).toBe(0);
    const d = act1SkyState(1, v);
    expect(d.q).toBeCloseTo(1, 12); expect(d.sqm).toBeCloseTo(22, 12); expect(d.skyLum).toBeCloseTo(1, 12);
    expect(d.m31Opacity).toBeCloseTo(0.35, 12);
  });
});
