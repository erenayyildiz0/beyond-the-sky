import { describe, expect, it } from "vitest";
import { planeHeights, planeWeight } from "../src/render/galaxy";

describe("uyarlamalı galaksi katmanları", () => {
  it("her 4. katman (ağırlık ×4) yüzden bakışta toplamı korur", () => {
    const s = { halfLy: 60_000, hDiskLy: 1000, hBulgeLy: 3000, rBulgeLy: 6000 };
    const { delta, z } = planeHeights(s, 24);
    const mid = Math.floor(z.length / 2);
    for (const r of [0, 10_000, 30_000]) {
      const all = z.reduce((a, zi) => a + planeWeight(zi, r, s, delta), 0);
      const some = z.filter((_, i) => (i - mid) % 4 === 0).reduce((a, zi) => a + planeWeight(zi, r, s, delta * 4), 0);
      expect(Math.abs(some - all) / all, `r=${r}`).toBeLessThan(0.25);
    }
  });
});
