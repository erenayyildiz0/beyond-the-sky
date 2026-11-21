// 2MRS galaksileri (R3): konum gerçek (uzaklık kırmızıya kaymadan), görünüm temsili.
// Nokta boyutu galaksinin gerçek ölçekli görünen çapı (sınırlı); çok küçükken parlaklık nokta boyutuyla korunur.
uniform float uFocal, uPixelRatio, uOpacity, uMaxPx;
attribute float aR;        // yarıçap (milyon ışık yılı)
attribute float aKind;     // 0 eliptik · 1 sarmal · 2 düzensiz · 3 bilinmiyor
attribute float aBA;       // eksen oranı
attribute float aRot;      // ekrandaki yönelim (temsili, tohumlu)
varying float vKind;
varying float vBA;
varying float vRot;
varying float vAlpha;
varying float vSize;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float d = max(-mv.z, 1e-6);
  float px = 2.0 * aR / d * uFocal;                       // görünen çap (piksel)
  float s = clamp(px, 2.0, uMaxPx);
  vAlpha = uOpacity * clamp(px / 1.5, 0.35, 1.0) * (1.0 - smoothstep(uMaxPx * 0.6, uMaxPx * 1.6, px));   // çok yakındakiler söner
  vKind = aKind; vBA = aBA; vRot = aRot; vSize = s;
  gl_PointSize = s * uPixelRatio;
  gl_Position = projectionMatrix * mv;
}
