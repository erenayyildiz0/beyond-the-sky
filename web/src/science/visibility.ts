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

/** Perde 1 ilerlemesi p → gökyüzü durumu (SPEC §3.3, §3.4). */
export function act1SkyState(p: number, v: { sqm_city: number; sqm_dark: number; glow_city_mag: number; glow_dark_mag: number }) {
  const q = easeInOutSine(p);
  const sqm = lerp(v.sqm_city, v.sqm_dark, q);
  return {
    q, sqm,
    glow: lerp(v.glow_city_mag, v.glow_dark_mag, q),
    mwOpacity: Math.pow(smoothstep(20.3, 21.7, sqm), 1.2),
    m31Opacity: 0.35 * smoothstep(19.8, 21.0, sqm),
  };
}
