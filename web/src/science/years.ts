// SPEC §3.11 — ışığın yola çıktığı yıl ve Türkçe bulunma eki
export function lightLeft(dly: number, obsYear: number) {
  const y = obsYear - dly;
  const step = dly < 100 ? 1 : dly < 1000 ? 10 : 100;
  const year = step === 1 ? Math.floor(y) : Math.round(y / step) * step;
  return { year, approx: step > 1, bc: year <= 0 ? 1 - year : null };
}

export function trLocative(n: number) {             // "-de/-da/-te/-ta"
  const a = Math.abs(n), u = a % 10, t = Math.floor(a / 10) % 10;
  const U = ["", "de", "de", "te", "te", "te", "da", "de", "de", "da"];      // bir iki üç dört beş altı yedi sekiz dokuz
  const T = ["", "da", "de", "da", "ta", "de", "ta", "te", "de", "da"];      // on yirmi otuz kırk elli altmış yetmiş seksen doksan
  return `${n}'${u ? U[u] : t ? T[t] : "de"}`;                               // yüz, bin → de
}

/** SPEC §8 notu: fmtLightTime sonucu + bulunma eki, son kelimeye göre ("8 dakika 12 saniyede", "4 saat 5 dakikada") */
export function trDurationLocative(s: string) {
  const map: Record<string, string> = { saniye: "saniyede", dakika: "dakikada", saat: "saatte", "gün": "günde", "yıl": "yılda" };
  const words = s.split(" ");
  const last = words[words.length - 1];
  if (map[last]) words[words.length - 1] = map[last];
  return words.join(" ");
}

import type { Sky } from "../app/assets";

export type BirthResult =
  | { kind: "match" | "nearest"; star: number; year: number; deltaLy: number; up: boolean }
  | { kind: "tooYoung" }
  | { kind: "none" };

/** SPEC §6.6 / §3.12 — doğum yılının yıldızı (tablo pipeline'da önceden hesaplandı) */
export function findBirthStar(sky: Sky, Y: number): BirthResult {
  const obs = sky.meta.obs_year_frac;
  const age = obs - (Y + 0.5);
  if (age < 7.6) return { kind: "tooYoung" };
  const row = sky.birth.rows.find(r => r[0] === Y);
  if (!row) return { kind: "none" };
  const [, i, delta] = row;
  if (Math.abs(delta) > 2.5) return { kind: "none" };
  const dly = sky.starDly[i]!;
  return { kind: Math.abs(delta) <= 1 ? "match" : "nearest",
           star: i, year: Math.floor(obs - dly), deltaLy: delta, up: sky.starAlt[i] > 5 };
}

/** Azimuttan 8 yönlü ad anahtarı (SPEC §6.6) */
export const dirKey = (azDeg: number) => (["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const)[Math.round((((azDeg % 360) + 360) % 360) / 45) % 8];
