import { describe, expect, it } from "vitest";
import { buildMask, PHONE_LONG_FOV_DEG, skylineFromLuminance, verticalFov } from "../src/science/photoMask";

// Yapay gece fotoğrafı: üstte şehir parlaması (aşağı doğru aydınlanan), altta koyu binalar ve parlak pencereler
function scene(w = 160, h = 120) {
  const truth = Array.from({ length: w }, (_, x) => 60 + Math.round(20 * Math.sin(x / 9)) + (x % 37 < 12 ? -15 : 0));
  const L = new Float32Array(w * h);
  let lights = 0;
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    if (y < truth[x]) L[y * w + x] = 0.18 + 0.2 * y / h + 0.01 * Math.sin(x * 0.7 + y);   // gürültülü, yavaş geçiş
    else {
      const win = (x % 6 < 2) && (y % 7 < 2) && ((x * 13 + y * 7) % 5 === 0);
      L[y * w + x] = win ? 0.85 : 0.05;
      if (win) lights++;
    }
  }
  return { L, w, h, truth, lights };
}

describe("E2 gökyüzü maskesi", () => {
  it("ufuk çizgisi bina çizgisine yakın (sütunların %90'ında ±4 px)", () => {
    const s = scene();
    const sk = skylineFromLuminance(s.L, s.w, s.h);
    const ok = sk.filter((v, x) => Math.abs(v - s.truth[x]) <= 4).length;
    expect(ok / s.w).toBeGreaterThan(0.9);
  });
  it("ışıklar ufkun altında bulunur, gökyüzünde ışık yok; maske alttan üste", () => {
    const s = scene();
    const sk = skylineFromLuminance(s.L, s.w, s.h);
    const m = buildMask(s.L, s.w, s.h, sk);
    expect(m.lightCount).toBeGreaterThan(s.lights * 0.8);
    // en üst satır (dokuda son satır) gökyüzü, en alt satır (dokuda ilk satır) zemin
    const top = (s.h - 1) * s.w * 4, bottom = 0;
    expect(m.data[top]).toBe(255); expect(m.data[bottom]).toBe(0);
    for (let x = 0; x < s.w; x++) expect(m.data[((s.h - 1) * s.w + x) * 4 + 1]).toBe(0);
  });
  it("görüş açısı: 26 mm eşdeğeri uzun kenar 69,4°; yatay fotoğrafta dikey FOV daha dar", () => {
    expect(PHONE_LONG_FOV_DEG).toBeCloseTo(69.4, 1);
    expect(verticalFov(PHONE_LONG_FOV_DEG, 0.75)).toBeCloseTo(69.4, 1);
    expect(verticalFov(PHONE_LONG_FOV_DEG, 4 / 3)).toBeCloseTo(2 * Math.atan(Math.tan(69.4 * Math.PI / 360) * 0.75) * 180 / Math.PI, 1);
  });
});
