// Dünya (gerçekçilik paketi R1): gündüz Blue Marble, gece Black Marble + Ankara yüksek çözünürlüklü karosu,
// Güneş yönüne göre yumuşak terminatör, okyanusta Güneş yansıması, alacakaranlık şeridi. §13.1: smoothstep'te edge0 < edge1.
uniform sampler2D uDay, uNight, uPatch;
uniform vec4 uPatchBounds;   // enlem min, enlem maks, boylam min, boylam maks (derece)
uniform float uHasDay, uHasPatch, uOpacity;
uniform vec3 uSun;           // Güneş yönü (three.js, birim)
varying vec2 vUv;
varying vec3 vN;
varying vec3 vWorld;

void main() {
  vec3 N = normalize(vN);
  float d = dot(N, uSun);
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 day = mix(vec3(0.04, 0.10, 0.20), texture2D(uDay, vUv).rgb, uHasDay);
  float lit = smoothstep(-0.08, 0.22, d);
  // Okyanus maskesi (Blue Marble'da okyanus koyu ve mavi) → Güneş yansıması
  float ocean = uHasDay * step(day.r + 0.02, day.b) * (1.0 - smoothstep(0.08, 0.2, dot(day, vec3(0.3333))));
  vec3 R = reflect(-uSun, N);
  float spec = pow(max(dot(R, V), 0.0), 60.0) * 0.6 * ocean * lit;
  // Gece ışıkları: küresel harita + Ankara çevresinde 500 m/piksel karo (kenarları yumuşak)
  vec3 night = texture2D(uNight, vUv).rgb;
  float lat = (vUv.y - 0.5) * 180.0, lon = vUv.x * 360.0 - 180.0;
  vec2 pu = vec2((lon - uPatchBounds.z) / (uPatchBounds.w - uPatchBounds.z), (lat - uPatchBounds.x) / (uPatchBounds.y - uPatchBounds.x));
  float inside = step(0.0, pu.x) * step(pu.x, 1.0) * step(0.0, pu.y) * step(pu.y, 1.0);
  float feather = smoothstep(0.0, 0.08, min(pu.x, 1.0 - pu.x)) * smoothstep(0.0, 0.08, min(pu.y, 1.0 - pu.y));
  night = mix(night, texture2D(uPatch, clamp(pu, 0.0, 1.0)).rgb, inside * feather * uHasPatch);
  night *= 1.0 - smoothstep(-0.12, 0.06, d);
  // Alacakaranlık: terminatörde ince turuncu şerit
  float dusk = exp(-pow(d / 0.07, 2.0)) * 0.10;
  vec3 col = day * lit + night + spec * vec3(1.0, 0.95, 0.85) + dusk * vec3(1.0, 0.45, 0.2);
  gl_FragColor = vec4(col * uOpacity, 1.0);
  #include <colorspace_fragment>
}
