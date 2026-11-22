// E1 — Konumumu kullan (docs/EXTRAS.md): gökyüzünü cihaz konumu için tarayıcıda hesapla. Konum yalnızca bellekte.
// Uzak cisimlerin (yıldızlar, galaksiler, kozmik ağ, dönme eksenleri) yönleri ICRS'te sabittir: Ankara için yazılmış ENU
// vektörleri tek bir dönmeyle taşınır, R = M_yeni · M_Ankaraᵀ (M: ICRS → yerel ENU; presesyon, nütasyon ve Dünya'nın dönmesi
// astronomy-engine'den). Güneş, Ay ve gezegenler yeni gecenin tarihi için efemeristen hesaplanır. Pipeline mantığının
// (bts/sky.py zaman seçimi, bts/birth.py doğum tablosu) birebir karşılığıdır.
import * as A from "astronomy-engine";
import { prepareSky, type Sky, type SkyJson, type VisibilityCfg } from "../app/assets";
import { AU_KM, C_KM_S } from "./constants";
import { countVisible, nelm } from "./visibility";
import { apply, type Mat3 } from "./reloc";

export type { Mat3 } from "./reloc";
export interface Place { lat: number; lon: number; heightM: number; name: string; nameAblative: string }

const DEG = Math.PI / 180;
const mul = (a: Mat3, b: Mat3): Mat3 => a.map(r => [0, 1, 2].map(j => r[0] * b[0][j] + r[1] * b[1][j] + r[2] * b[2][j]));
const tr = (a: Mat3): Mat3 => [0, 1, 2].map(i => [a[0][i], a[1][i], a[2][i]]);

/** ICRS (J2000 ekvatoral) → yerel ENU (x Doğu, y Kuzey, z Yukarı): enu = M · icrs */
export function icrsToEnu(lat: number, lon: number, heightM: number, date: Date): Mat3 {
  const t = A.MakeTime(date), obs = new A.Observer(lat, lon, heightM);
  const rot = A.Rotation_EQJ_HOR(t, obs);                       // HOR: x kuzey, y batı, z başucu
  const cols = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(e => {
    const h = A.RotateVector(rot, new A.Vector(e[0], e[1], e[2], t));
    return [-h.y, h.x, h.z];
  });
  return [0, 1, 2].map(i => [cols[0][i], cols[1][i], cols[2][i]]);
}

export const altAzFromEnu = (v: number[]) => {
  const n = Math.hypot(v[0], v[1], v[2]);
  const alt = Math.asin(Math.max(-1, Math.min(1, v[2] / n))) / DEG;
  const az = (Math.atan2(v[0], v[1]) / DEG + 360) % 360;
  return { alt, az };
};
const raDecToVec = (ra: number, dec: number) => [Math.cos(dec * DEG) * Math.cos(ra * DEG), Math.cos(dec * DEG) * Math.sin(ra * DEG), Math.sin(dec * DEG)];

function moonSunAlt(date: Date, obs: A.Observer) {
  const t = A.MakeTime(date);
  const alt = (b: A.Body) => { const e = A.Equator(b, t, obs, true, true); return A.Horizon(t, obs, e.ra, e.dec).altitude; };
  return { moon: alt(A.Body.Moon), sun: alt(A.Body.Sun) };
}

/** Zaman seçimi (SPEC §5.5): cihaz saatiyle 21:00'de Ay −10°, Güneş −18° altında olan ilk gece (30 gün içinde) */
export function chooseNight(lat: number, lon: number, heightM: number, from: Date, opts = { hour: 21, days: 30, maxMoon: -10, maxSun: -18 }) {
  const obs = new A.Observer(lat, lon, heightM);
  for (let d = 0; d < opts.days; d++) {
    const local = new Date(from.getFullYear(), from.getMonth(), from.getDate() + d, opts.hour, 0, 0);
    const { moon, sun } = moonSunAlt(local, obs);
    if (moon < opts.maxMoon && sun < opts.maxSun) return local;
  }
  return null;
}

/**
 * Işık kirliliği seçimi (EXTRAS E1): Bortle ölçeğinin çıplak göz limit kadiri (Bortle 2001, Sky & Telescope 101(2), 126)
 * sınıf ortası → SQM, uygulamanın kendi NELM–SQM dönüşümünün (Schaefer 1990, visibility.ts nelm) tersiyle.
 * Şehir merkezi Bortle 8 (4,1–4,5), banliyö Bortle 5 (5,6–6,0), kırsal Bortle 3 (6,6–7,0).
 */
export const BORTLE_NELM = { city: 4.3, suburb: 5.8, rural: 6.8 } as const;
export type Pollution = keyof typeof BORTLE_NELM;
export function sqmForNelm(target: number) {
  let lo = 15, hi = 23;                                          // nelm(sqm) monoton artan: ikiye bölme
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (nelm(m) < target) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
/** Seçilen SQM için ufuk parlaması: Ankara şehir ve karanlık değerleri arasında SQM ile doğrusal (SPEC §3.3 sezgiseli) */
export function visibilityFor(p: Pollution, base: VisibilityCfg): VisibilityCfg {
  const sqm = Math.min(base.sqm_dark, sqmForNelm(BORTLE_NELM[p]));
  const k = (sqm - base.sqm_city) / (base.sqm_dark - base.sqm_city);
  const glow = base.glow_city_mag + (base.glow_dark_mag - base.glow_city_mag) * Math.max(0, Math.min(1, k));
  return { ...base, sqm_city: +sqm.toFixed(2), glow_city_mag: +glow.toFixed(2) };
}

/** Doğum yılı tablosu (bts/birth.py ile aynı): [yıl, yıldız, fark] */
export function birthTable(mag: ArrayLike<number>, dly: (number | null)[], dec: ArrayLike<number>, alt: ArrayLike<number>, obsYear: number, lat: number,
                           cfg = { mag_limit: 6.0, max_ly: 160, min_peak_alt_deg: 5, up_alt_deg: 5, prefer_up_tolerance_ly: 1.0, first_year: 1900 }) {
  const ia: number[] = [], iu: number[] = [];
  for (let i = 0; i < mag.length; i++) {
    const d = dly[i];
    if (d == null || !(mag[i] <= cfg.mag_limit) || !(d < cfg.max_ly) || !(dec[i] > lat - 90 + cfg.min_peak_alt_deg)) continue;
    ia.push(i);
    if (alt[i] > cfg.up_alt_deg) iu.push(i);
  }
  const nearest = (idx: number[], a: number) => idx.reduce((b, i) => (Math.abs(dly[i]! - a) < Math.abs(dly[b]! - a) ? i : b), idx[0]);
  const rows: [number, number, number][] = [];
  for (let Y = cfg.first_year; Y <= Math.floor(obsYear); Y++) {
    const a = obsYear - (Y + 0.5);
    const ju = iu.length ? nearest(iu, a) : -1;
    const j = ju >= 0 && Math.abs(dly[ju]! - a) <= cfg.prefer_up_tolerance_ly ? ju : nearest(ia, a);
    rows.push([Y, j, Math.round((dly[j]! - a) * 100) / 100]);
  }
  return rows;
}

const BODY: Record<string, A.Body> = {
  mercury: A.Body.Mercury, venus: A.Body.Venus, mars: A.Body.Mars, jupiter: A.Body.Jupiter,
  saturn: A.Body.Saturn, uranus: A.Body.Uranus, neptune: A.Body.Neptune,
};

const decimalYear = (d: Date) => {
  const y = d.getUTCFullYear(), s = Date.UTC(y, 0, 1), e = Date.UTC(y + 1, 0, 1);
  return y + (d.getTime() - s) / (e - s);
};
/** Yerel saat ofsetli ISO metni: "2026-12-03T21:00:00+03:00" */
export function localIso(d: Date) {
  const p = (n: number) => String(Math.abs(n)).padStart(2, "0");
  const off = -d.getTimezoneOffset();
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00${off >= 0 ? "+" : "-"}${p(Math.trunc(off / 60))}:${p(off % 60)}`;
}


/**
 * Gökyüzünü yeni konum ve gece için yeniden kur. icrs: stars_icrs.json (sky.json ile aynı sıra, [ra, dec] derece).
 * Dönüş: aynı biçimde yeni Sky ve taşıma dönmesi R.
 */
export function relocateSky(sky: Sky, icrs: [number, number][], place: Place, date: Date, vis: VisibilityCfg, tz: string): { sky: Sky; R: Mat3 } {
  const M = icrsToEnu(place.lat, place.lon, place.heightM, date);
  const R = mul(M, tr(sky.frames.icrs_to_enu));
  const rot = (v: number[]) => apply(R, v);
  const n = sky.stars.data.length;
  const alt = new Float64Array(n), mag = new Float64Array(n), dec = new Float64Array(n);
  const data = sky.stars.data.map((r, i) => {
    const [ra, de] = icrs[i];
    const h = altAzFromEnu(apply(M, raDecToVec(ra, de)));
    alt[i] = h.alt; mag[i] = r[2]; dec[i] = de;
    return [+h.alt.toFixed(3), +h.az.toFixed(3), r[2], r[3], r[4], r[5], r[6], r[7]] as typeof r;
  });
  const t = A.MakeTime(date), obs = new A.Observer(place.lat, place.lon, place.heightM);
  const topo = (b: A.Body) => { const e = A.Equator(b, t, obs, true, true); const h = A.Horizon(t, obs, e.ra, e.dec); return { alt: h.altitude, az: h.azimuth, dist: e.dist }; };
  const bodies = sky.bodies.map(b => {
    const body = BODY[b.key];
    if (body == null) return b;
    const p = topo(body);
    return { ...b, alt: +p.alt.toFixed(3), az: +p.az.toFixed(3), dist_au: +p.dist.toFixed(6), mag: +A.Illumination(body, t).mag.toFixed(2) };
  });
  const sun = topo(A.Body.Sun), moon = topo(A.Body.Moon);
  const moonKm = moon.dist * AU_KM;
  const obsYear = +decimalYear(date).toFixed(3);
  const k = vis.extinction_k;
  const dly = sky.starDly;
  const json: SkyJson = {
    ...sky,
    meta: {
      ...sky.meta,
      location: { name: place.name, name_ablative: place.nameAblative, lat: place.lat, lon: place.lon, height_m: place.heightM, local: true },
      time_utc: date.toISOString(), time_local: localIso(date), obs_year_frac: obsYear, tz,
      sun: { alt: +sun.alt.toFixed(2), az: +sun.az.toFixed(2), dist_au: +sun.dist.toFixed(5) },
      moon: { alt: +moon.alt.toFixed(2), az: +moon.az.toFixed(2), illum: +A.Illumination(A.Body.Moon, t).phase_fraction.toFixed(3),
              distance_km: Math.round(moonKm), light_time_s: +(moonKm / C_KM_S).toFixed(3) },
      visibility: vis,
      counts: { city: countVisible(alt, mag, vis.sqm_city, vis.glow_city_mag, k), dark: countVisible(alt, mag, vis.sqm_dark, vis.glow_dark_mag, k) },
    },
    stars: { ...sky.stars, data },
    frames: { icrs_to_enu: M, gal_to_enu: mul(R, sky.frames.gal_to_enu), ecliptic_pole_enu: rot(sky.frames.ecliptic_pole_enu) },
    path: { ...sky.path, u_cas: rot(sky.path.u_cas), u_target: rot(sky.path.u_target) },
    bodies,
    voyager1: { ...sky.voyager1, enu_dir: rot(sky.voyager1.enu_dir) },
    galaxies: sky.galaxies.map(g => {
      const d = rot(g.enu_dir), h = altAzFromEnu(d);
      return { ...g, enu_dir: d, alt: +h.alt.toFixed(3), az: +h.az.toFixed(3),
        ...(g.normal_enu ? { normal_enu: rot(g.normal_enu) } : {}), ...(g.major_enu ? { major_enu: rot(g.major_enu) } : {}) };
    }),
    birth: { ...sky.birth, rows: birthTable(mag, dly, dec, alt, obsYear, place.lat) },
    cosmic: sky.cosmic ? { ...sky.cosmic, clusters: sky.cosmic.clusters.map(c => ({ ...c, enu_mly: rot(c.enu_mly) })) } : undefined,
    realism: { ...sky.realism, poles_enu: Object.fromEntries(Object.entries(sky.realism.poles_enu).map(([key, v]) => [key, rot(v)])) },
  };
  return { sky: prepareSky(json), R };
}
