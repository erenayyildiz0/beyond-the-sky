// R4 (docs/EXTRAS.md): yıldızların gerçek boyutu. Saf fonksiyonlar.
import { SUN_RADIUS_KM } from "./constants";

export const T_SUN = 5772;          // K — IAU 2015 B3 nominal etkin sıcaklık
export const MBOL_SUN = 4.74;       // IAU 2015 B2 bolometrik mutlak kadir

/** B−V → sıcaklık (Ballesteros 2012; pipeline catalog.bv_to_kelvin ile aynı) */
export const bvToKelvin = (bv: number) => 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));

// Bolometrik düzeltme BC_V(log T): Flower 1996, katsayılar Torres 2010 (AJ 140, 1158) Tablo 1
const BC_A = [-0.190537291496456e5, 0.155144866764412e5, -0.421278819301717e4, 0.381476328422343e3];
const BC_B = [-0.370510203809015e5, 0.385672629965804e5, -0.150651486316025e5, 0.261724637119416e4, -0.170623810323864e3];
const BC_C = [-0.118115450538963e6, 0.137145973583929e6, -0.636233812100225e5, 0.147412923562646e5, -0.170587278406872e4, 0.788731721804990e2];
export function bolometricCorrection(T: number) {
  const lt = Math.log10(T);
  const co = lt < 3.7 ? BC_A : lt < 3.9 ? BC_B : BC_C;
  return co.reduce((s, c, i) => s + c * lt ** i, 0);
}

/**
 * Yarıçap (Güneş yarıçapı): Stefan–Boltzmann, R/R☉ = √(L/L☉) · (T☉/T)².
 * L, görünür kadir + Hipparcos uzaklığı + bolometrik düzeltmeden. Uzak devlerde uzaklık belirsizliği büyüktür (yaklaşık).
 */
export function computedRadius(mag: number, dly: number, bv: number) {
  const T = bvToKelvin(bv);
  const Mv = mag - 5 * Math.log10(dly / 3.261563777 / 10);
  const L = 10 ** (-0.4 * (Mv + bolometricCorrection(T) - MBOL_SUN));
  return { R: Math.sqrt(L) * (T_SUN / T) ** 2, T, L };
}

/** Yayımlanmış ölçümler (interferometri vb.); HIP numarasıyla. Hesaplananın yerine bunlar kullanılır. */
export const PUBLISHED_RADII: Record<number, { R: number; source: string }> = {
  32349: { R: 1.711, source: "Liebert ve ark. 2005, ApJ 630, L69" },                 // Sirius A
  69673: { R: 25.4, source: "Ramírez & Allende Prieto 2011, ApJ 743, 135" },        // Arcturus
  21421: { R: 44.2, source: "Richichi & Roccatagliata 2005, A&A 433, 305" },         // Aldebaran
  24436: { R: 78.9, source: "Moravveji ve ark. 2012, ApJ 747, 108" },               // Rigel
  27989: { R: 764, source: "Joyce ve ark. 2020, ApJ 902, 63" },                    // Betelgeuse
};

export function starRadius(hip: number | null, mag: number, dly: number | null, bv: number) {
  const pub = hip != null ? PUBLISHED_RADII[hip] : undefined;
  const T = bvToKelvin(bv);
  if (pub) return { R: pub.R, T, source: pub.source, measured: true };
  if (dly == null) return null;
  const c = computedRadius(mag, dly, bv);
  return { R: c.R, T, source: null, measured: false };
}

export const solarRadiiToKm = (r: number) => r * SUN_RADIUS_KM;

/** Sıcaklık → sRGB (0..1), Tanner Helland (2012) yaklaşımı; pipeline catalog.kelvin_to_rgb ile aynı (beyaza karıştırılmadan) */
export function kelvinToRgb(T: number): [number, number, number] {
  const t = T / 100;
  const r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -0.0755148492;
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const c = (x: number) => Math.min(255, Math.max(0, x)) / 255;
  return [c(r), c(g), c(b)];
}
