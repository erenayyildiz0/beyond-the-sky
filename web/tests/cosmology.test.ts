import { describe, expect, it } from "vitest";
import { AGE_GYR, CMB_DIST_MLY, comovingMly, lightTravelGyr, lookbackGyr, redshiftAt } from "../src/science/cosmology";

describe("kozmoloji (Planck 2018, düz ΛCDM)", () => {
  it("evrenin yaşı ≈ 13,79 milyar yıl", () => { expect(AGE_GYR).toBeGreaterThan(13.7); expect(AGE_GYR).toBeLessThan(13.9); });
  it("son saçılma yüzeyi ≈ 13,87 Gpc ≈ 45,2 milyar ışık yılı", () => {
    expect(CMB_DIST_MLY / 3261.563777).toBeGreaterThan(13.7);
    expect(CMB_DIST_MLY / 3261.563777).toBeLessThan(14.0);
  });
  it("yakında Hubble yasası: d ≈ cz/H0", () => {
    expect(comovingMly(0.01) / (0.01 * 299792.458 / 67.66 * 3.261563777)).toBeCloseTo(1, 2);
  });
  it("tersine çevirme ve ışık yolculuğu", () => {
    expect(redshiftAt(comovingMly(2))).toBeCloseTo(2, 3);
    expect(lightTravelGyr(1000)).toBeLessThan(1.0);                 // 1 milyar ışık yılında ~0,98 milyar yıl
    expect(lightTravelGyr(1000)).toBeGreaterThan(0.95);
    expect(lookbackGyr(1)).toBeCloseTo(7.9, 0);                      // z = 1 → ~7,9 milyar yıl
  });
});
