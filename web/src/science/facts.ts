// Keşif bilgi kartı satırları (SPEC §3.16). Hepsi veriden hesaplanır; saf fonksiyonlar.
import { LY_KM, PC_LY, SUN_ABS_MAG_V, VOYAGER1_KM_S } from "./constants";
import { effectiveMag, limitMag } from "./visibility";

const YEAR_S = 365.25 * 86_400;

/** Uzaklıktan (ışık yılı) görünür kadire: m = M + 5·log10(d_pc / 10) */
export const magAt = (absMag: number, dly: number) => absMag + 5 * Math.log10(dly / PC_LY / 10);
/** Oradan Güneş'in görünür kadiri */
export const sunMagFrom = (dly: number) => magAt(SUN_ABS_MAG_V, dly);
/** Güneş'in 6,5 kadire düştüğü uzaklık (≈ 70,4 ışık yılı) */
export const SUN_INVISIBLE_LY = PC_LY * 10 * 10 ** ((6.5 - SUN_ABS_MAG_V) / 5);

export type SunState = "easy" | "dark" | "none";
export const sunState = (m: number): SunState => (m <= 4 ? "easy" : m <= 6.5 ? "dark" : "none");

/** Mutlak kadir ve görünür ışıkta Güneş'e göre parlaklık (bolometrik değil) */
export const absMag = (mag: number, dly: number) => mag - 5 * Math.log10(dly / PC_LY / 10);
export const relLum = (mag: number, dly: number) => 10 ** (-0.4 * (absMag(mag, dly) - SUN_ABS_MAG_V));

/** Voyager 1'in hızıyla yolculuk süresi (yıl); 1 ışık yılı ≈ 17.635 yıl */
export const voyagerYears = (dly: number) => (dly * LY_KM) / VOYAGER1_KM_S / YEAR_S;

export type LumClass = "V" | "IV" | "III" | "II" | "I";
export type SpecLetter = "O" | "B" | "A" | "F" | "G" | "K" | "M";

/**
 * Tayf metninden harf ve ışıtma sınıfı. Birleşik tayf ("comp" ya da "+") yanıltıcıdır: null (satır gösterilmez).
 * Sınıf sırası: Ia, Ib, III, II, IV, V (önce uzun olan eşleşsin).
 */
export function parseSpect(spect: string | null | undefined): { letter: SpecLetter | null; cls: LumClass | null } | null {
  if (!spect) return { letter: null, cls: null };
  if (/comp|\+/i.test(spect)) return null;
  const letter = (/[OBAFGKM]/.exec(spect)?.[0] ?? null) as SpecLetter | null;
  const m = /(Ia|Ib|III|II|IV|V|I)/.exec(spect.replace(/^[^OBAFGKM]*[OBAFGKM][0-9.]*/, ""));
  const raw = m?.[1] ?? null;
  const cls: LumClass | null = raw == null ? null : raw === "Ia" || raw === "Ib" || raw === "I" ? "I" : (raw as LumClass);
  return { letter, cls };
}

/** Bu gece (21:00) Ankara'dan: ufkun altında / şehirde bile / yalnızca ışıklar sönünce / çıplak gözle görünmez */
export type Tonight = "below" | "city" | "dark" | "none";
export function tonight(mag: number, altDeg: number, v: { sqm_city: number; sqm_dark: number; glow_city_mag: number; glow_dark_mag: number; extinction_k: number }): Tonight {
  if (altDeg <= 0) return "below";
  const m = effectiveMag(mag, altDeg, v.extinction_k);
  if (m < limitMag(v.sqm_city, altDeg, v.glow_city_mag)) return "city";
  if (m < limitMag(v.sqm_dark, altDeg, v.glow_dark_mag)) return "dark";
  return "none";
}

/** Takımyıldız adları: Türkçe karşılığı olanlar (SPEC §3.16), diğerleri IAU'nun Latince tam adı */
export const CON_TR: Record<string, string> = {
  And: "Andromeda", Aql: "Kartal", Aqr: "Kova", Ari: "Koç", Aur: "Arabacı", Boo: "Çoban", CMa: "Büyük Köpek",
  CMi: "Küçük Köpek", CVn: "Av Köpekleri", Cam: "Zürafa", Cap: "Oğlak", Cas: "Kraliçe", Cen: "Erboğa", Cep: "Kral",
  Cet: "Balina", Cnc: "Yengeç", Col: "Güvercin", Com: "Berenis'in Saçı", CrA: "Güney Tacı", CrB: "Kuzey Tacı",
  Crt: "Kupa", Crv: "Karga", Cru: "Güney Haçı", Cyg: "Kuğu", Del: "Yunus", Dra: "Ejderha", Equ: "Tay", Eri: "Irmak",
  Gem: "İkizler", Her: "Herkül", Hya: "Suyılanı", Lac: "Kertenkele", Leo: "Aslan", LMi: "Küçük Aslan", Lep: "Tavşan",
  Lib: "Terazi", Lup: "Kurt", Lyn: "Vaşak", Lyr: "Çalgı", Mon: "Tekboynuz", Oph: "Yılancı", Ori: "Avcı",
  Peg: "Kanatlı At", Per: "Kahraman", Psc: "Balıklar", PsA: "Güney Balığı", Sge: "Ok", Sgr: "Yay", Sco: "Akrep",
  Sct: "Kalkan", Ser: "Yılan", Sex: "Sekstant", Tau: "Boğa", Tri: "Üçgen", UMa: "Büyükayı", UMi: "Küçükayı",
  Vir: "Başak", Vul: "Tilki",
};
export const CON_LATIN: Record<string, string> = {
  And: "Andromeda", Ant: "Antlia", Aps: "Apus", Aql: "Aquila", Aqr: "Aquarius", Ara: "Ara", Ari: "Aries", Aur: "Auriga",
  Boo: "Boötes", CMa: "Canis Major", CMi: "Canis Minor", CVn: "Canes Venatici", Cae: "Caelum", Cam: "Camelopardalis",
  Cap: "Capricornus", Car: "Carina", Cas: "Cassiopeia", Cen: "Centaurus", Cep: "Cepheus", Cet: "Cetus", Cha: "Chamaeleon",
  Cir: "Circinus", Cnc: "Cancer", Col: "Columba", Com: "Coma Berenices", CrA: "Corona Australis", CrB: "Corona Borealis",
  Crt: "Crater", Cru: "Crux", Crv: "Corvus", Cyg: "Cygnus", Del: "Delphinus", Dor: "Dorado", Dra: "Draco", Equ: "Equuleus",
  Eri: "Eridanus", For: "Fornax", Gem: "Gemini", Gru: "Grus", Her: "Hercules", Hor: "Horologium", Hya: "Hydra", Hyi: "Hydrus",
  Ind: "Indus", LMi: "Leo Minor", Lac: "Lacerta", Leo: "Leo", Lep: "Lepus", Lib: "Libra", Lup: "Lupus", Lyn: "Lynx", Lyr: "Lyra",
  Men: "Mensa", Mic: "Microscopium", Mon: "Monoceros", Mus: "Musca", Nor: "Norma", Oct: "Octans", Oph: "Ophiuchus", Ori: "Orion",
  Pav: "Pavo", Peg: "Pegasus", Per: "Perseus", Phe: "Phoenix", Pic: "Pictor", PsA: "Piscis Austrinus", Psc: "Pisces",
  Pup: "Puppis", Pyx: "Pyxis", Ret: "Reticulum", Scl: "Sculptor", Sco: "Scorpius", Sct: "Scutum", Ser: "Serpens", Sex: "Sextans",
  Sge: "Sagitta", Sgr: "Sagittarius", Tau: "Taurus", Tel: "Telescopium", TrA: "Triangulum Australe", Tri: "Triangulum",
  Tuc: "Tucana", UMa: "Ursa Major", UMi: "Ursa Minor", Vel: "Vela", Vir: "Virgo", Vol: "Volans", Vul: "Vulpecula",
};
export const conName = (con: string, lang: "tr" | "en") => (lang === "tr" ? CON_TR[con] : undefined) ?? CON_LATIN[con] ?? con;
