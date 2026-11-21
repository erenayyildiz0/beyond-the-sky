// 2MRS galaksileri (R3): konum gerçek (uzaklık kırmızıya kaymadan), görünüm temsili.
// Nokta boyutu galaksinin gerçek ölçekli görünen çapı (sınırlı); çok küçükken parlaklık nokta boyutuyla korunur.
// Uzaktan eşit yoğunluklu örneklem (cosmicSampling.ts keepAlpha ile aynı): nokta nt / aDens olasılıkla kalır; uFog > 0 ise
// kameradan uzaklığa göre sis.
uniform float uFocal, uPixelRatio, uOpacity, uMaxPx, uNt, uFog;
attribute float aR;        // yarıçap (milyon ışık yılı)
attribute float aKind;     // 0 eliptik · 1 sarmal · 2 düzensiz · 3 bilinmiyor
attribute float aBA;       // eksen oranı
attribute float aRot;      // ekrandaki yönelim (temsili, tohumlu)
attribute float aDens;     // bulunduğu popülasyonun yerel yoğunluğu (1/milyar ışık yılı³)
attribute float aU;        // tohumlu rastgele sayı [0, 1)
varying float vKind;
varying float vBA;
varying float vRot;
varying float vAlpha;
varying float vSize;
void main() {
  float keep = clamp(0.5 + (uNt / aDens - aU) / (0.2 * aU + 1e-4), 0.0, 1.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  if (uFog > 0.0) keep *= 1.0 - smoothstep(0.6 * uFog, uFog, length(mv.xyz));
  if (keep <= 0.0) { gl_PointSize = 0.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float d = max(-mv.z, 1e-6);
  float px = 2.0 * aR / d * uFocal;                       // görünen çap (piksel)
  float s = clamp(px, 2.0, uMaxPx);
  vAlpha = keep * uOpacity * clamp(px / 1.5, 0.35, 1.0) * (1.0 - smoothstep(uMaxPx * 0.6, uMaxPx * 1.6, px));   // çok yakındakiler söner
  vKind = aKind; vBA = aBA; vRot = aRot; vSize = s;
  gl_PointSize = s * uPixelRatio;
  gl_Position = projectionMatrix * mv;
}
