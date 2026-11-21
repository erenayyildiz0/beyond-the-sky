// Galaksi katmanı (R2, temsili): yüz-üstü harita, düzlemin yüksekliğine göre dikey yoğunluk.
// Emisyon: w = Δ/(√(2π)·h) · exp(−z²/2h²), h(r) = hDisk + hBulge·exp(−r/rBulge) → yüzden bakışta katmanların toplamı ≈ harita.
// Renk: harita ham sRGB değerleriyle örneklenir ve çevrilmeden toplanır (her katmanı ayrı ayrı sRGB'ye çevirip toplamak
// sRGB eğrisi yüzünden 2–3 kat fazla parlak sonuç verir); katmanların toplamı haritanın kendisine eşit olur.
// Toz katmanı: siyah, saydamlık 1 − exp(−τ/n) (n toz katmanı); τ = 1,2·A (görsel denge).
uniform sampler2D uMap;
uniform float uZ, uDelta, uHDisk, uHBulge, uRBulge, uOpacity, uGain, uDust, uDustN, uCamFade;
varying vec2 vUv;
varying vec2 vP;
void main() {
  vec4 t = texture2D(uMap, vUv);
  float r = length(vP);
  if (uDust > 0.5) {
    float a = (1.0 - exp(-1.2 * t.a / uDustN)) * uOpacity * uCamFade;
    if (a < 0.002) discard;
    gl_FragColor = vec4(0.0, 0.0, 0.0, a);
    return;
  }
  float h = uHDisk + uHBulge * exp(-r / uRBulge);
  float w = min(1.0, uDelta / (2.5066 * h) * exp(-0.5 * uZ * uZ / (h * h)));
  vec3 c = t.rgb * w * uGain * uOpacity * uCamFade;
  if (max(c.r, max(c.g, c.b)) < 0.0015) discard;
  gl_FragColor = vec4(c, 1.0);
}
