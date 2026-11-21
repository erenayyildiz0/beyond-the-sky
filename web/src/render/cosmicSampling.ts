/**
 * Kozmik ölçekte eşit yoğunluklu örneklem (R5).
 *
 * 2MRS akı sınırlı bir taramadır (Ks ≤ 11,75): uzaklaştıkça yalnızca daha parlak galaksiler ölçülebildiğinden galaksi
 * sayı yoğunluğu eve yakın ~15.000 kat fazladır. Bu bir seçim etkisidir, gerçek yapı değil; birkaç yüz milyon ışık
 * yılının üstünde evren homojendir (Scrimgeour ve ark. 2012, MNRAS 425, 116: ~70 h⁻¹ Mpc). Uzaktan bakınca her nokta
 * (gerçek ya da temsili) kendi popülasyonunun yerel yoğunluğuna (aDens) göre seçilir: tutulma olasılığı nt / aDens.
 * Böylece ekrandaki yoğunluk her yerde nt olur; noktaların kendisi ve kümelenmesi değişmez. Yoğunluk birimi: 1/(milyar ışık yılı)³.
 */

const GLY3 = 1e9;                                                   // (milyon ışık yılı)³ → (milyar ışık yılı)³

/** Temsili ağın r'deki ortalama yoğunluğu: r, rMin–rMax arasında log-düzgün örneklendi (her log kabukta eşit sayı). */
export function procDensity(n: number, rMin: number, rMax: number, rMly: number) {
  return n / (Math.log(rMax / rMin) * 4 * Math.PI * rMly ** 3) * GLY3;
}

/** 2MRS'in radyal yoğunluğu (kabuk sayısı / kabuk hacmi, log uzayında yumuşatılmış), her galaksi için. */
export function radialDensity(rMly: Float32Array, binMly = 50) {
  let rMax = binMly;
  for (const r of rMly) if (r > rMax) rMax = r;                    // yayma (...) değil: büyük dizide yığın taşar
  const nb = Math.ceil(rMax / binMly);
  const cnt = new Float64Array(nb);
  for (const r of rMly) cnt[Math.min(nb - 1, Math.floor(r / binMly))]++;
  const logD = Array.from(cnt, (c, i) => Math.log(Math.max(c, 0.5) / (4 / 3 * Math.PI * (((i + 1) * binMly) ** 3 - (i * binMly) ** 3)) * GLY3));
  const sm = logD.map((v, i) => 0.25 * logD[Math.max(0, i - 1)] + 0.5 * v + 0.25 * logD[Math.min(nb - 1, i + 1)]);
  const out = new Float32Array(rMly.length);
  rMly.forEach((r, k) => {                                          // kutu merkezleri arasında doğrusal
    const x = Math.min(nb - 1, Math.max(0, r / binMly - 0.5)), i = Math.min(nb - 2, Math.floor(x)), f = x - i;
    out[k] = Math.exp(nb < 2 ? sm[0] : sm[i] * (1 - f) + sm[i + 1] * f);
  });
  return out;
}

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * Kamera evden D (milyon ışık yılı) uzaktayken hedef yoğunluk ve sis. Sis yarıçapı F = 2D (kameradan uzaklık; sınır
 * eve değil kameraya göre, böylece "ortada parlak top" oluşmaz). nt: temsili ağın D + F'deki yoğunluğu (sis içinde
 * her yerde en az bu kadar nokta var). 2MRS'in içindeyken (D < 1,2 milyar ışık yılı) gerçek galaksilerin hepsi kalır;
 * 1,2–2,2 milyar arasında eşit yoğunluğa geçilir.
 */
export function cosmicSampling(dMly: number, web: { n: number; rMin: number; rMax: number }) {
  const fog = 2 * Math.max(dMly, 1);
  const nt = procDensity(web.n, web.rMin, web.rMax, Math.min(dMly + fog, web.rMax));
  const g = smooth(1200, 2200, dMly);
  return {
    g,
    web: { nt, fog },
    real: { nt: g > 0 ? Math.exp((1 - g) * Math.log(1e12) + g * Math.log(nt)) : 1e12, fog: g > 1e-3 ? fog / g : 0 },
  };
}

/** Noktanın görünürlüğü (0–1); GLSL kopyası cosmic.vert.glsl. u: noktanın tohumlu rastgele sayısı. */
export function keepAlpha(u: number, dens: number, nt: number) {
  return Math.min(1, Math.max(0, 0.5 + (nt / dens - u) / (0.2 * u + 1e-4)));   // rampa ortalı: ortalama oran nt / dens
}
