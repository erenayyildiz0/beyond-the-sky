import * as THREE from "three";
import { RELOC, rotateFloat32 } from "../science/reloc";

export interface View { az_deg: number; horizon_screen_y: number; vfov_landscape_deg: number; vfov_portrait_deg: number }
export interface VisibilityCfg { sqm_city: number; sqm_dark: number; glow_city_mag: number; glow_dark_mag: number; extinction_k: number }
export interface Body { key: string; name_tr: string; name_en: string; alt: number; az: number; dist_au: number; mag: number; rgb: [number, number, number] }
export interface Galaxy { key: string; enu_dir: number[]; dist_ly: number; alt: number; az: number; draw_radius_ly: number; normal_enu?: number[]; major_enu?: number[] }

/** sky.json v2 (SPEC §5.11) */
export interface SkyJson {
  version: number;
  meta: {
    /** local: cihaz konumu (E1, yalnızca bellekte); name_dative: Türkçe yönelme hâli (yoksa "{name}'ya") */
    location: { name: string; name_ablative: string; lat: number; lon: number; height_m: number; local?: boolean; name_dative?: string };
    time_utc: string; time_local: string; obs_year_frac: number; tz: string;
    sun: { alt: number; az: number; dist_au: number };
    moon: { alt: number; az: number; illum: number; distance_km: number; light_time_s: number };
    visibility: VisibilityCfg;
    counts: { city: number; dark: number };
    stats: { dark_dist_ly_p50: number; dark_dist_ly_p95: number; dark_nodist: number; nodist_shell_ly: number };
    view: View;
    warnings: string[];
    sources: string[];
  };
  stars: { fields: string[]; data: [number, number, number, number, number, number, number | null, number | null][] };
  names: { i: number; name: string }[];
  labels: number[];
  constellations: Record<string, [number, number][]>;
  frames: { icrs_to_enu: number[][]; gal_to_enu: number[][]; ecliptic_pole_enu: number[] };
  path: { u_cas: number[]; u_target: number[]; closest: { i: number; along_ly: number; miss_ly: number }[] };
  bodies: Body[];
  voyager1: { enu_dir: number[]; dist_au: number; source: string };
  galaxies: Galaxy[];
  birth: { first_year: number; rows: [number, number, number][] };
  cosmic?: {
    count: number; h0: number; max_mly: number;
    clusters: { key: string; name_tr: string; name_en: string; enu_mly: number[]; dist_mly: number }[];
  };
  smallbodies?: { count: number; groups: { key: string; n: number; h_max: number | null; r_au_p50: number }[]; jd_tdb: number };
  realism: {
    ankara_patch: { lat_min: number; lat_max: number; lon_min: number; lon_max: number };
    poles_enu: Record<string, number[]>;
    galaxy_maps: Record<string, { half_kly: number; h_disk_kly: number; h_bulge_kly: number; r_bulge_kly: number }>;
  };
}

/** sky.json + sütun dizileri (CPU hesapları Float64Array ile, SPEC §3.3 eşlik kuralı). */
export interface Sky extends SkyJson {
  starAlt: Float64Array;
  starAz: Float64Array;
  starMag: Float64Array;
  starDly: (number | null)[];
  starName: (i: number) => string | null;
}

export function prepareSky(json: SkyJson): Sky {
  const n = json.stars.data.length;
  const starAlt = new Float64Array(n), starAz = new Float64Array(n), starMag = new Float64Array(n);
  const starDly: (number | null)[] = new Array(n);
  json.stars.data.forEach((r, i) => { starAlt[i] = r[0]; starAz[i] = r[1]; starMag[i] = r[2]; starDly[i] = r[6]; });
  const names = new Map(json.names.map(x => [x.i, x.name]));
  const starName = (i: number) => {
    const nm = names.get(i);
    if (nm) return nm;
    const hip = json.stars.data[i]?.[7];
    return hip ? `HIP ${hip}` : null;
  };
  return { ...json, starAlt, starAz, starMag, starDly, starName };
}

/** URL parametreleri (SPEC §2.1). */
export interface Params {
  lang: "tr" | "en";
  az: number | null;
  debug: boolean;
  presenter: boolean;
  autoplay: boolean;
  z: number | null;
  born: number | null;
  explore: boolean;
  /** ?goto=moon|jupiter|saturn|… ya da durak anahtarı: uçuşta doğrudan oraya git (prova/test) */
  goto: string | null;
  /** ?compare=1: doğrudan boyut karşılaştırması */
  compare: boolean;
  /** E1: girişte konum akışını kendiliğinden başlat (dünyalar kurulduktan sonra yeniden yükleme için) */
  loc: boolean;
}

export function readParams(search = location.search): Params {
  const q = new URLSearchParams(search);
  const num = (k: string) => (q.has(k) && Number.isFinite(+q.get(k)!) ? +q.get(k)! : null);
  return {
    lang: q.get("lang") === "en" ? "en" : "tr",
    az: num("az"),
    debug: q.get("debug") === "1",
    presenter: q.get("presenter") === "1",
    autoplay: q.get("autoplay") === "1",
    z: num("z"),
    born: num("born"),
    explore: q.get("explore") === "1",
    goto: q.get("goto"),
    compare: q.get("compare") === "1",
    loc: q.get("loc") === "1",
  };
}

export interface Assets {
  sky: Sky;
  milkyWay: THREE.Texture;
  variant: { milkyWay: "4k" | "2k"; earth: "8k" | "4k" };
}

const BASE = import.meta.env.BASE_URL;

export function chooseVariants(maxTextureSize: number, coarse = matchMedia("(pointer: coarse)").matches) {
  return {
    milkyWay: (maxTextureSize >= 4096 && !coarse ? "4k" : "2k") as "4k" | "2k",
    earth: (maxTextureSize >= 8192 && !coarse ? "8k" : "4k") as "8k" | "4k",
  };
}

async function fetchWithProgress(url: string, onBytes: (loaded: number, total: number) => void): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url}: ${res.status}`);
  const total = +(res.headers.get("content-length") ?? 0);
  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onBytes(loaded, total);
  }
  return new Blob(chunks);
}

/** sky.json, Samanyolu dokusu ve fontları yükler; ilerleme 0..1. */
export async function loadAssets(renderer: THREE.WebGLRenderer, onProgress: (p: number) => void): Promise<Assets> {
  const variant = chooseVariants(renderer.capabilities.maxTextureSize);
  const parts = { sky: [0, 900_000], mw: [0, variant.milkyWay === "4k" ? 2_800_000 : 600_000] };
  const report = () => {
    const l = parts.sky[0] + parts.mw[0], t = parts.sky[1] + parts.mw[1];
    onProgress(Math.min(1, l / t));
  };
  const skyP = fetchWithProgress(`${BASE}data/sky.json`, (l, t) => { parts.sky = [l, t || parts.sky[1]]; report(); })
    .then(b => b.text()).then(s => prepareSky(JSON.parse(s) as SkyJson));
  const mwP = fetchWithProgress(`${BASE}data/milkyway_altaz_${variant.milkyWay}.webp`, (l, t) => { parts.mw = [l, t || parts.mw[1]]; report(); })
    .then(b => createImageBitmap(b, { imageOrientation: "flipY" }))
    .then(bmp => {
      const tex = new THREE.Texture(bmp as unknown as HTMLImageElement);
      tex.flipY = false;                         // ImageBitmap zaten çevrildi: v=1 görüntünün üstü
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = false;               // az = 0/360° dikişinde çizgi olmasın (SPEC §13.2)
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      return tex;
    });
  const [sky, milkyWay] = await Promise.all([skyP, mwP, document.fonts.ready]);
  onProgress(1);
  return { sky, milkyWay, variant };
}

/**
 * E1 (cihaz konumu): göksel koordinatlardaki yıldız listesi ve Samanyolu dokusu (pipeline: stars_icrs.json, milkyway_icrs_*.webp).
 * Yalnızca kullanıcı "Konumumu kullan" derse yüklenir.
 */
export async function loadRelocationData(variant: "4k" | "2k") {
  const [icrs, bmp] = await Promise.all([
    fetch(`${BASE}data/stars_icrs.json`).then(r => { if (!r.ok) throw new Error(`stars_icrs.json: ${r.status}`); return r.json() as Promise<{ data: [number, number][] }>; }),
    fetch(`${BASE}data/milkyway_icrs_${variant}.webp`).then(r => { if (!r.ok) throw new Error(`milkyway_icrs_${variant}.webp: ${r.status}`); return r.blob(); })
      .then(b => createImageBitmap(b, { imageOrientation: "flipY" })),
  ]);
  const tex = new THREE.Texture(bmp as unknown as HTMLImageElement);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;                   // RA = 0h dikişinde çizgi olmasın
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.userData.icrs = true;                      // skyDome: göksel örnekleme
  tex.needsUpdate = true;
  return { icrs: icrs.data, milkyWay: tex };
}

type TexOpts = { srgb?: boolean; clamp?: boolean };
/** refs: dokuyu kullanan yer sayısı; sıfıra inince ekran kartından silinir (releaseDataTexture) */
const texCache = new Map<string, { p: Promise<THREE.Texture>; refs: number }>();
/** Ekran kartındaki dokular: WebGL bağlamı geri gelince görüntüleri dosyadan yeniden çözülür */
const live = new Map<string, THREE.Texture>();

const uploads: { r: THREE.WebGLRenderer; tex: THREE.Texture; done: (t: THREE.Texture) => void }[] = [];
/** Dokuyu ekran kartına önceden gönder; büyük dokular aynı karede yığılmasın diye karede bir tane. */
function queueUpload(r: THREE.WebGLRenderer, tex: THREE.Texture): Promise<THREE.Texture> {
  return new Promise(done => {
    uploads.push({ r, tex, done });
    if (uploads.length === 1) requestAnimationFrame(drainUploads);
  });
}
function drainUploads() {
  const u = uploads.shift();
  if (!u) return;
  u.r.initTexture(u.tex);
  // Ekran kartına kopyalandı: çözülmüş görüntü bellekte ikinci kez durmasın (telefonda ekran kartı ve RAM aynı bellek).
  // Bundan sonra dokunun ayarı needsUpdate ile değiştirilmemeli; bağlam kaybında görüntü reviveTextures ile geri gelir.
  if (u.tex.userData.closeAfterUpload) (u.tex.image as ImageBitmap).close();
  u.done(u.tex);
  if (uploads.length) requestAnimationFrame(drainUploads);
}

function decode(file: string) {
  return fetch(`${BASE}data/${file}`)
    .then(r => { if (!r.ok) throw new Error(`${file}: ${r.status}`); return r.blob(); })
    // premultiplyAlpha: "none" — galaksi haritalarında alfa saydamlık değil toz derinliği; renk alfayla çarpılmamalı
    .then(b => createImageBitmap(b, { imageOrientation: "flipY", premultiplyAlpha: "none" }));
}

let reviveBound = false;
/** WebGL bağlamı geri gelince (telefonda arka plandan dönüş, bellek baskısı) kapatılmış görüntüleri yeniden çöz ve gönder */
function bindRevive(r: THREE.WebGLRenderer) {
  if (reviveBound) return;
  reviveBound = true;
  r.domElement.addEventListener("webglcontextrestored", () => {
    for (const [file, tex] of live) decode(file).then(bmp => {
      if (live.get(file) !== tex) { bmp.close(); return; }             // bu arada bırakıldı
      // Yeni kaynak: three.js bağlam gelince kapalı (0×0) görüntüyle değişmez depolama ayırmış olabilir; aynı kaynağa
      // tex.image ile yazmak o depolamaya sığmaz. Yeni kaynak için doğru boyutta yeniden ayırır; malzemeler aynı dokuyu görür.
      tex.source = new THREE.Source(bmp); tex.needsUpdate = true;
      return queueUpload(r, tex);
    }).catch(e => console.warn(e));
  });
}

/**
 * public/data altındaki bir dokuyu bir kez yükler (ImageBitmap, v=1 görüntünün üstü). Sarma gibi ayarlar burada verilir:
 * doku ekran kartına gönderildikten sonra görüntüsü kapatılır, ayarı değiştirilemez. Her çağrı bir kullanım sayılır;
 * kullanım bitince releaseDataTexture çağrılırsa doku ekran kartından silinir (çağrılmazsa uygulama boyunca kalır).
 */
export function loadDataTexture(renderer: THREE.WebGLRenderer, file: string, opts: TexOpts = {}): Promise<THREE.Texture> {
  const hit = texCache.get(file);
  if (hit) { hit.refs++; return hit.p; }
  bindRevive(renderer);
  const p = decode(file).then(bmp => {
    const tex = new THREE.Texture(bmp as unknown as HTMLImageElement);
    tex.flipY = false;
    tex.colorSpace = opts.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    tex.wrapS = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    tex.userData.closeAfterUpload = true;
    tex.needsUpdate = true;
    if (texCache.get(file)?.p === p) live.set(file, tex);
    return queueUpload(renderer, tex);           // ilk göründüğü karede takılmasın
  });
  texCache.set(file, { p, refs: 1 });
  return p;
}

/** loadDataTexture'ın bir kullanımını bırakır; kullanan kalmayınca doku ekran kartından silinir. */
export function releaseDataTexture(file: string) {
  const e = texCache.get(file);
  if (!e || --e.refs > 0) return;
  texCache.delete(file);
  e.p.then(t => { if (live.get(file) === t) live.delete(file); t.dispose(); }).catch(() => {});
}

/**
 * Yalnızca gerektiğinde ekran kartında duran doku (telefon belleği): update(yükle, bırak) her kare çağrılır.
 * İki koşul arasında boşluk bırakılmalı; sınırda gidip gelince doku sürekli yüklenip silinmesin.
 */
export class LazyTexture {
  on = false;
  private gen = 0;
  constructor(private r: THREE.WebGLRenderer, readonly file: string, private set: (t: THREE.Texture | null) => void, private opts: TexOpts = {}) {}
  update(load: boolean, drop: boolean) {
    if (!this.on && load) {
      this.on = true;
      const g = ++this.gen;
      loadDataTexture(this.r, this.file, this.opts).then(t => { if (g === this.gen) this.set(t); }).catch(e => console.warn(e));
    } else if (this.on && drop) {
      this.on = false;
      this.gen++;                                // yolda olan yükleme artık atanmasın
      this.set(null);
      releaseDataTexture(this.file);
    }
  }
}

let cosmicP: Promise<{ data: Float32Array; names: Map<number, string> }> | null = null;
/** 2MRS galaksileri (R3): cosmic.bin (Float32 × 6: x, y, z [milyon ışık yılı, ENU], r [bin ışık yılı], tür, eksen oranı) */
export function loadCosmic() {
  if (cosmicP) return cosmicP;
  cosmicP = Promise.all([
    fetch(`${BASE}data/cosmic.bin`).then(r => { if (!r.ok) throw new Error(`cosmic.bin: ${r.status}`); return r.arrayBuffer(); }),
    fetch(`${BASE}data/cosmic_names.json`).then(r => r.json() as Promise<{ i: number; name: string }[]>),
  ]).then(([buf, names]) => {
    const data = new Float32Array(buf);
    if (RELOC.R) rotateFloat32(data, 6, data.length / 6, RELOC.R);             // E1: konuma taşı
    return { data, names: new Map(names.map(x => [x.i, x.name])) };
  });
  return cosmicP;
}

let smallP: Promise<ArrayBuffer> | null = null;
/** Asteroit ve Kuiper kuşağı: smallbodies.bin (Float32 × 3: güneş merkezli ENU [AB]; ardından Uint8 grup) */
export function loadSmallBodies() {
  if (smallP) return smallP;
  smallP = fetch(`${BASE}data/smallbodies.bin`).then(r => { if (!r.ok) throw new Error(`smallbodies.bin: ${r.status}`); return r.arrayBuffer(); })
    .then(buf => {
      // E1: güneş merkezli ENU konumları yeni konumun çerçevesine (N × 3 float32, ardından N × uint8 grup → N = bayt / 13)
      if (RELOC.R) { const n = buf.byteLength / 13; rotateFloat32(new Float32Array(buf, 0, n * 3), 3, n, RELOC.R); }
      return buf;
    });
  return smallP;
}

let detailP: Promise<{ ci: (number | null)[]; con: string[]; spect: (string | null)[] }> | null = null;
/** catalog_detail.json (SPEC §5.14): B−V, takımyıldız, tayf; satır sırası sky.json ile aynı. Arka planda. */
export function loadDetail() {
  if (detailP) return detailP;
  detailP = fetch(`${BASE}data/catalog_detail.json`).then(r => r.json()).then((j: { data: [number | null, string, string | null][] }) => ({
    ci: j.data.map(r => r[0]), con: j.data.map(r => r[1]), spect: j.data.map(r => r[2]),
  }));
  return detailP;
}
