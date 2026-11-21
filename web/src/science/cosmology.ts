// Gözlemlenebilir evren (onaylı ek, docs/EXTRAS.md R5): düz ΛCDM, Planck 2018 (Planck Collaboration 2020, A&A 641, A6,
// Tablo 2 — TT,TE,EE+lowE+lensing+BAO): H0 = 67,66 km/s/Mpc, Ωm = 0,3111. Işınım Ωr = 9,1e−5 (fotonlar + 3,046 nötrino).
// 1 milyar ışık yılının üstünde "uzaklık / c" yerine gerçek ışık yolculuğu süresi (geri bakış zamanı) kullanılır.
export const H0 = 67.66, OM = 0.3111, OR = 9.1e-5, OL = 1 - OM - OR;
const C_KM_S = 299_792.458;
const MPC_TO_MLY = 3.261563777;
export const HUBBLE_DIST_MLY = (C_KM_S / H0) * MPC_TO_MLY;          // c/H0 ≈ 14.450 milyon ışık yılı
export const HUBBLE_TIME_GYR = 977.792 / H0;                        // 1/H0 ≈ 14,45 milyar yıl
export const Z_RECOMBINATION = 1089.8;                              // son saçılma (Planck 2018)

const E = (z: number) => Math.sqrt(OR * (1 + z) ** 4 + OM * (1 + z) ** 3 + OL);

// ln(1+z) ızgarasında tablo: z, eşhareketli uzaklık (Mly), geri bakış zamanı (Gyr)
const N = 4000, X_MAX = Math.log(1 + 1e5);
const TZ = new Float64Array(N + 1), TD = new Float64Array(N + 1), TT = new Float64Array(N + 1);
(() => {
  let d = 0, t = 0;
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * X_MAX, z = Math.expm1(x);
    if (i > 0) {
      const x0 = ((i - 1) / N) * X_MAX, xm = (x0 + x) / 2, dx = x - x0;
      // dz = (1+z) dx → D: ∫ (1+z)/E dx ; t: ∫ 1/E dx  (Simpson)
      const f = (xx: number) => { const zz = Math.expm1(xx); return [(1 + zz) / E(zz), 1 / E(zz)]; };
      const [a0, b0] = f(x0), [am, bm] = f(xm), [a1, b1] = f(x);
      d += (dx / 6) * (a0 + 4 * am + a1);
      t += (dx / 6) * (b0 + 4 * bm + b1);
    }
    TZ[i] = z; TD[i] = d * HUBBLE_DIST_MLY; TT[i] = t * HUBBLE_TIME_GYR;
  }
})();

function interp(xs: Float64Array, ys: Float64Array, x: number) {
  if (x <= xs[0]) return ys[0];
  let lo = 0, hi = xs.length - 1;
  if (x >= xs[hi]) return ys[hi];
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
  const k = (x - xs[lo]) / (xs[hi] - xs[lo]);
  return ys[lo] + k * (ys[hi] - ys[lo]);
}

/** Kırmızıya kayma → eşhareketli uzaklık (milyon ışık yılı) */
export const comovingMly = (z: number) => interp(TZ, TD, z);
/** Kırmızıya kayma → geri bakış (ışık yolculuğu) zamanı (milyar yıl) */
export const lookbackGyr = (z: number) => interp(TZ, TT, z);
/** Eşhareketli uzaklık (Mly) → kırmızıya kayma */
export const redshiftAt = (dMly: number) => interp(TD, TZ, dMly);
/** Eşhareketli uzaklıktaki bir noktadan ışığın bize gelme süresi (milyar yıl) */
export const lightTravelGyr = (dMly: number) => lookbackGyr(redshiftAt(dMly));
/** Evrenin yaşı (milyar yıl) ve son saçılma yüzeyinin eşhareketli uzaklığı (milyon ışık yılı) */
export const AGE_GYR = TT[N];
export const CMB_DIST_MLY = comovingMly(Z_RECOMBINATION);
