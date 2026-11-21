import { describe, expect, it } from "vitest";
import { planeHeights, planeWeight } from "../src/render/galaxy";

describe("katmanlı galaksi (R2)", () => {
  const mw = { halfLy: 60_000, hDiskLy: 1000, hBulgeLy: 3000, rBulgeLy: 6000 };
  for (const planes of [32, 16]) {
    it(`yüzden bakışta katmanların toplamı ≈ 1 (${planes} katman)`, () => {
      const { delta, z } = planeHeights(mw, planes);
      for (const r of [0, 3000, 10_000, 26_700, 45_000]) {
        const sum = z.reduce((a, zi) => a + planeWeight(zi, r, mw, delta), 0);
        expect(sum, `r=${r}`).toBeGreaterThan(0.85);
        expect(sum, `r=${r}`).toBeLessThan(1.15);
      }
    });
  }
  it("disk merkezde kalın, dışarıda ince", () => {
    const { delta } = planeHeights(mw, 32);
    expect(planeWeight(3000, 0, mw, delta)).toBeGreaterThan(planeWeight(3000, 30_000, mw, delta));
  });
});
