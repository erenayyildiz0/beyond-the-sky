// E2 — Kendi gökyüzün (docs/EXTRAS.md): fotoğraftan gökyüzü maskesi ve ışık noktaları. Basit yöntem (EXTRAS "ara adım"):
// gece fotoğrafında gökyüzü yukarıda, pürüzsüz bir parlaklık geçişidir; binalar ve ağaçlar onu keser. Her sütunda yukarıdan
// aşağı inilir, pürüzsüzlük bozulunca ufuk çizgisi sayılır; sütunlar arası ortanca süzgeçle düzeltilir. Hatalı olabilir:
// kullanıcı çizgiyi elle kaydırır. Fotoğraf cihazdan çıkmaz.

/**
 * Görüş açısı: tarayıcı kameranın odak uzaklığını vermez. Telefonların ana kamerası tipik olarak 26 mm eşdeğeridir
 * (ör. Apple iPhone teknik özellikleri, "26 mm focal length"); 35 mm film karesinin uzun kenarı 36 mm → uzun kenar FOV
 * 2·atan(18/26) ≈ 69,4°. Kullanıcı iki parmakla ayarlar.
 */
export const PHONE_LONG_FOV_DEG = 2 * Math.atan(18 / 26) * 180 / Math.PI;

/** RGB (0–255, satır satır, üstten) → doğrusal olmayan parlaklık 0..1 */
export function luminance(rgba: Uint8ClampedArray, w: number, h: number) {
  const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = (0.2126 * rgba[i * 4] + 0.7152 * rgba[i * 4 + 1] + 0.0722 * rgba[i * 4 + 2]) / 255;
  return L;
}

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };

/**
 * Her sütun için ufuk satırı (üstten, piksel). Gökyüzü: satır satır parlaklık değişimi küçük ve yavaş. Çizgi, değişim
 * (komşu satırdan ya da gökyüzünün süregelen ortalamasından) eşiği en az `run` satır boyunca aştığı ilk yerdir.
 */
export function skylineFromLuminance(L: Float32Array, w: number, h: number, opts = { jump: 0.06, drift: 0.1, run: 3, smooth: 15 }) {
  const raw: number[] = new Array(w);
  for (let x = 0; x < w; x++) {
    let mean = L[x], n = 1, bad = 0, line = h;
    for (let y = 1; y < h; y++) {
      const v = L[y * w + x], prev = L[(y - 1) * w + x];
      const off = Math.abs(v - prev) > opts.jump || Math.abs(v - mean / n) > opts.drift;
      if (off) { if (++bad >= opts.run) { line = y - opts.run + 1; break; } }
      else { bad = 0; mean += v; n++; if (n > 40) { mean -= mean / n; n--; } }   // kayan ortalama: yavaş geçişe uyar
    }
    raw[x] = line;
  }
  const k = opts.smooth >> 1;
  return raw.map((_, x) => median(raw.slice(Math.max(0, x - k), Math.min(w, x + k + 1))));
}

/**
 * Maske (R: gökyüzü 0..1, G: ışık 0..1); DataTexture için satırlar ALTTAN üste (WebGL v=0 alt).
 * Işık: ufkun altında, çevresinden belirgin parlak pikseller (pencere, lamba); bir piksel genişletilir.
 */
export function buildMask(L: Float32Array, w: number, h: number, skyline: number[], feather = 3) {
  let groundMean = 0, gn = 0;
  for (let x = 0; x < w; x++) for (let y = skyline[x]; y < h; y++) { groundMean += L[y * w + x]; gn++; }
  groundMean = gn ? groundMean / gn : 0;
  const thr = Math.max(0.45, groundMean + 0.25);
  const light = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) for (let y = skyline[x]; y < h; y++) if (L[y * w + x] > thr) light[y * w + x] = 1;
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sky = Math.min(1, Math.max(0, (skyline[x] - y) / feather + 0.5));
      let lt = 0;
      for (let dy = -1; dy <= 1 && !lt; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy >= 0 && yy < h && xx >= 0 && xx < w && light[yy * w + xx]) { lt = 1; break; }
      }
      const o = ((h - 1 - y) * w + x) * 4;                     // alttan üste
      out[o] = Math.round(sky * 255); out[o + 1] = lt ? 255 : 0; out[o + 3] = 255;
    }
  }
  return { data: out, lightCount: light.reduce((a, b) => a + b, 0) };
}

/** Görüntünün uzun kenarının FOV'undan dikey FOV (derece): dikey fotoğrafta uzun kenar dikeydir */
export function verticalFov(longFovDeg: number, aspect: number) {
  if (aspect <= 1) return longFovDeg;                          // dikey (yükseklik ≥ genişlik)
  const t = Math.tan(longFovDeg * Math.PI / 360) / aspect;
  return 2 * Math.atan(t) * 180 / Math.PI;
}

/** Parlaklık dizisini saat yönünün tersine k çeyrek tur döndür (k = 0..3) */
export function rotateLum(L: Float32Array, w: number, h: number, k: number): { L: Float32Array; w: number; h: number } {
  k = ((k % 4) + 4) % 4;
  if (!k) return { L, w, h };
  const nw = k % 2 ? h : w, nh = k % 2 ? w : h, out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // CCW 90: (x, y) → (y, w−1−x); 180: (w−1−x, h−1−y); CCW 270: (h−1−y, x)
    const [nx, ny] = k === 1 ? [y, w - 1 - x] : k === 2 ? [w - 1 - x, h - 1 - y] : [h - 1 - y, x];
    out[ny * nw + nx] = L[y * w + x];
  }
  return { L: out, w: nw, h: nh };
}

/**
 * Jiroskop yoksa yön tahmini: doğru yönde neredeyse her sütun "üstte gökyüzü, altta zemin"dir; ufuk çizgisi sütunun içine düşer.
 * Yan ya da ters dönmüş görüntüde sütunlar baştan sona gökyüzü ya da baştan zemin olur. Skor: ufku %5–95 arasında olan ve
 * ufkun üstü altından parlak olan sütunların oranı. En yüksek skoru veren çeyrek tur; belirgin fark yoksa 0 (döndürme).
 */
export function autoOrient(L: Float32Array, w: number, h: number) {
  const score = [0, 1, 2, 3].map(k => {
    const r = rotateLum(L, w, h, k), sk = skylineFromLuminance(r.L, r.w, r.h);
    let n = 0;
    sk.forEach((v, x) => {
      if (v <= 0.05 * r.h || v >= 0.95 * r.h) return;
      let up = 0, dn = 0;                                        // gökyüzü (gece de gündüz de) zeminden parlaktır
      for (let y = 0; y < r.h; y++) { if (y < v) up += r.L[y * r.w + x]; else dn += r.L[y * r.w + x]; }
      if (up / v > dn / (r.h - v)) n++;
    });
    return n / sk.length;
  });
  const best = score.indexOf(Math.max(...score));
  return score[best] > score[0] + 0.15 ? best : 0;
}

/**
 * Jiroskopla yön: başucunun (dünyanın yukarısı) kamera düzlemindeki izdüşümü (ux sağa, uy yukarı) görüntünün hangi kenarını
 * gösteriyorsa o kenar yukarı gelecek şekilde saat yönünün tersine çeyrek tur sayısı. Telefon ekran döndürmesi kilitliyken
 * yan tutularak çekilen fotoğraf böylece dik olur.
 */
export function quarterTurnsFromUp(ux: number, uy: number) {
  const k = Math.round(Math.atan2(ux, uy) / (Math.PI / 2));
  return ((k % 4) + 4) % 4;
}
