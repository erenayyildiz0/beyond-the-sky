export type Lang = "tr" | "en";

const locale = (lang: Lang) => (lang === "tr" ? "tr-TR" : "en-US");

export const fmtInt = (n: number, lang: Lang = "tr") =>
  new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 0 }).format(Math.round(n));

export const fmtDec = (n: number, d: number, lang: Lang = "tr") =>
  new Intl.NumberFormat(locale(lang), { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);

export const fmtDate = (iso: string, tz: string, lang: Lang = "tr") =>
  new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(new Date(iso));

export const fmtDayMonth = (iso: string, tz: string, lang: Lang = "tr") =>
  new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "long", timeZone: tz }).format(new Date(iso));

export const fmtTime = (iso: string, tz: string, lang: Lang = "tr") =>
  new Intl.DateTimeFormat(locale(lang), { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).format(new Date(iso));

/** Gözlem tarihi, verilen saat diliminde bugünle aynı gün mü? (SPEC §6.9 "Bu gece" mi?) */
export function isTonight(iso: string, tz: string, now = new Date()) {
  const d = (x: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(x);
  return d(new Date(iso)) === d(now);
}

export const upperTr = (s: string, lang: Lang = "tr") => (lang === "tr" ? s.toLocaleUpperCase("tr-TR") : s.toUpperCase());

export function fmtLightTime(s: number, lang: Lang = "tr") {
  const nf = (n: number, d = 0) =>
    new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
  const T = lang === "tr"
    ? { s: ["saniye", "saniye"], m: ["dakika", "dakika"], h: ["saat", "saat"], d: ["gün", "gün"], y: ["yıl", "yıl"] }
    : { s: ["second", "seconds"], m: ["minute", "minutes"], h: ["hour", "hours"], d: ["day", "days"], y: ["year", "years"] };
  const w = (u: keyof typeof T, n: number) => T[u][n === 1 ? 0 : 1];
  const Y = 365.25 * 86400;
  if (s < 60) {
    // çok kısa sürelerde anlamlı basamak (alçak irtifa): 0,00014 saniye
    const d = s >= 10 ? 0 : s >= 0.01 ? 2 : Math.min(8, Math.max(2, Math.ceil(-Math.log10(Math.max(s, 1e-9))) + 1));
    const n = +s.toFixed(d); return `${nf(n, d)} ${w("s", n)}`;
  }
  if (s < 3600) {
    let m = Math.floor(s / 60), r = Math.round(s - 60 * m);
    if (r === 60) { m += 1; r = 0; }                   // SPEC'teki koddan düzeltme: "41 dakika 60 saniye" olmasın
    if (m === 60) return `${nf(1)} ${w("h", 1)}`;
    return r ? `${nf(m)} ${w("m", m)} ${nf(r)} ${w("s", r)}` : `${nf(m)} ${w("m", m)}`;
  }
  if (s < 86400 * 0.95) {
    let h = Math.floor(s / 3600), m = Math.round((s - 3600 * h) / 60);
    if (m === 60) { h += 1; m = 0; }
    return m ? `${nf(h)} ${w("h", h)} ${nf(m)} ${w("m", m)}` : `${nf(h)} ${w("h", h)}`;
  }
  if (s < Y * 0.95) { const d = Math.round(s / 86400); return `${nf(d)} ${w("d", d)}`; }
  const y = s / Y;
  if (y < 100) { const n = +y.toFixed(1); return `${nf(n, 1)} ${w("y", n)}`; }
  if (y < 10000) { const n = Math.round(y); return `${nf(n)} ${w("y", n)}`; }
  if (y < 1e6) { const n = Math.round(y / 1000) * 1000; return `${nf(n)} ${w("y", n)}`; }
  const n = +(y / 1e6).toFixed(1);
  return lang === "tr" ? `${nf(n, 1)} milyon yıl` : `${nf(n, 1)} million years`;
}

/** Mesafe (km): 1 milyonun altında tam sayı, üstünde "149,6 milyon km" … "20,8 kentilyon km". */
export function fmtKm(km: number, lang: Lang = "tr") {
  if (km < 10) return `${fmtDec(km, 1, lang)} km`;
  if (km < 1e6) return `${fmtInt(km, lang)} km`;
  const units: [number, string][] = lang === "tr"
    ? [[1e18, "kentilyon"], [1e15, "katrilyon"], [1e12, "trilyon"], [1e9, "milyar"], [1e6, "milyon"]]
    : [[1e18, "quintillion"], [1e15, "quadrillion"], [1e12, "trillion"], [1e9, "billion"], [1e6, "million"]];
  for (const [v, w] of units) {
    if (km >= v) { const n = km / v; return `${fmtDec(n, n < 10 ? 2 : 1, lang)} ${w} km`; }
  }
  return `${fmtInt(km, lang)} km`;
}
