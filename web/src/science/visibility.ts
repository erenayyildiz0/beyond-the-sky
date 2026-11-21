// SPEC §3.3 — pipeline/bts/visibility.py ve render/shaders/*.glsl ile birebir aynı.
import { DEG } from "./coords";

export const nelm = (sqm: number) => 7.93 - 5 * Math.log10(10 ** (4.316 - sqm / 5) + 1);

export function airmass(altDeg: number) {
  const a = Math.max(altDeg, 0);
  return 1 / (Math.sin(a * DEG) + 0.50572 * Math.pow(a + 6.07995, -1.6364));
}

export const effectiveMag = (mag: number, altDeg: number, k: number) => mag + k * (airmass(altDeg) - 1);

export function localSqm(sqmZenith: number, altDeg: number, glowMag: number) {
  const s = 1 - Math.sin(Math.max(altDeg, 0) * DEG);
  return sqmZenith - glowMag * s * s;
}

export const limitMag = (sqmZenith: number, altDeg: number, glowMag: number) =>
  nelm(localSqm(sqmZenith, altDeg, glowMag));

export function visibility(mEff: number, mLim: number, soft = 0.25) {
  const t = Math.min(1, Math.max(0, (mEff - (mLim - soft)) / (2 * soft)));
  return 1 - t * t * (3 - 2 * t);
}

// CPU sayımı Float64Array ile yapılır (Python ile birebir eşleşsin diye; GPU'daki float32 yalnızca çizim içindir)
export function countVisible(alt: Float64Array, mag: Float64Array, sqmZenith: number, glowMag: number, k: number) {
  let n = 0;
  for (let i = 0; i < alt.length; i++) {
    if (alt[i] > 0 && effectiveMag(mag[i], alt[i], k) < limitMag(sqmZenith, alt[i], glowMag)) n++;
  }
  return n;
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOutSine = (p: number) => -(Math.cos(Math.PI * p) - 1) / 2;

/**
 * Samanyolu görünürlüğü (onaylı sapma, SPEC §3.4'ün yerine; sezgisel): göz, gökyüzü arka planından yeterince
 * parlak bölgeleri görür. Arka plan parlaklığı skyLum = 10^(−0,4·(SQM − 22)) (karanlık gökyüzü = 1).
 * Doku pikselinin doğrusal parlaklığı L (kazanç sonrası) eşik T kadar azaltılır (göz arka planı çıkarır): görünür kesir
 * (L − T) / L. Önce çekirdekler soluk ve yıkanmış belirir, gökyüzü karardıkça güçlenir ve sönük kısımlar ortaya çıkar.
 * GLSL kopyası: render/shaders/skyDome.frag.glsl
 */
export const MW_FLOOR = 0.005, MW_SLOPE = 0.02;
export const skyLum = (sqm: number) => 10 ** (-0.4 * (sqm - 22));
export const mwThreshold = (sqm: number) => MW_FLOOR + MW_SLOPE * Math.max(skyLum(sqm) - 1, 0);
/** Bir doku pikselinin görünür kesri (0..1) */
export const mwVisible = (L: number, sqm: number) => Math.min(1, Math.max(0, (L - mwThreshold(sqm)) / Math.max(L, 1e-5)));

/** Perde 1 ilerlemesi p → gökyüzü durumu (SPEC §3.3, §3.4). */
export function act1SkyState(p: number, v: { sqm_city: number; sqm_dark: number; glow_city_mag: number; glow_dark_mag: number }) {
  const q = easeInOutSine(p);
  const sqm = lerp(v.sqm_city, v.sqm_dark, q);
  return {
    q, sqm,
    glow: lerp(v.glow_city_mag, v.glow_dark_mag, q),
    skyLum: skyLum(sqm),
    m31Opacity: 0.35 * smoothstep(19.8, 21.0, sqm),
  };
}
