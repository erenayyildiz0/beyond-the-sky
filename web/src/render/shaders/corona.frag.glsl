// Yıldızın çevresi (tam ekran; her piksel için görüş ışınının yıldız merkezine en yakın geçişi r, yıldız yarıçapı biriminde).
// Korona parlaklık profili Baumbach (1937): I ∝ 0,0532 r^−2,5 + 1,425 r^−7 + 2,565 r^−17. Gerçekte diskin milyonda biri
// kadar sönüktür (yalnızca tam tutulmada görülür); burada kontrast sıkıştırılarak gösterilir. Ekvator akıntıları (streamer),
// kutup tüyleri, kromosfer (Hα kırmızısı) ve çıkıntıların (prominence) biçimi temsilidir.
uniform mat4 uInvProj;
uniform vec3 uCenter;       // görüş uzayında yıldız merkezi
uniform vec3 uPole;         // görüş uzayında dönme ekseni
uniform float uRadius, uOpacity, uTime, uCorona, uProm;
uniform vec3 uColor;
uniform vec4 uProms[8];     // açı (radyan), yarı genişlik (radyan), yükseklik (R), tohum; y = 0 → yok
varying vec2 vNdc;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }

void main() {
  vec4 v = uInvProj * vec4(vNdc, 1.0, 1.0);
  vec3 D = normalize(v.xyz / v.w);
  float tca = dot(uCenter, D);
  if (tca <= 0.0) discard;                                   // yıldız arkada
  vec3 off = D * tca - uCenter;
  float r = length(off) / uRadius;
  if (r < 1.0 || r > 4.5) discard;                           // disk (önündeki korona ihmal) ya da çok uzak

  // Gök düzleminde konum açısı: 0 = kuzey kutbu
  vec3 Vd = normalize(uCenter);
  vec3 pn = uPole - Vd * dot(uPole, Vd);
  pn = length(pn) > 1e-4 ? normalize(pn) : normalize(cross(Vd, vec3(1, 0, 0)));
  vec3 e2 = cross(Vd, pn);
  float ang = atan(dot(off, e2), dot(off, pn));
  vec2 cs = vec2(cos(ang), sin(ang));
  float eq = 1.0 - cs.x * cs.x;                              // 1 ekvator, 0 kutup (izdüşümde)
  float h = r - 1.0;

  // Korona: akıntılar ekvatorda uzun ve parlak, kutuplarda ince ışınsal tüyler
  float stream = fbm(vec3(cs * 2.5, uTime * 0.0015 + 1.3));
  float rays = noise(vec3(cs * 55.0, h * 0.6));
  float reach = 1.0 + 2.2 * eq * smoothstep(0.35, 0.75, stream);           // akıntılar dışarı uzanır
  float re = 1.0 + h / reach;
  float bau = (0.0532 * pow(re, -2.5) + 1.425 * pow(re, -7.0) + 2.565 * pow(re, -17.0)) / 4.0425;
  float Ic = pow(bau, 0.38) * (0.55 + 0.45 * eq) * (0.75 + 0.5 * rays) * (1.0 - smoothstep(3.2, 4.5, r));
  vec3 coronaCol = mix(vec3(1.0, 0.97, 0.93), uColor, 0.35);

  // Kromosfer: ince kırmızı katman, dikenli (spikül) üst kenar
  float spic = 0.006 + 0.006 * noise(vec3(cs * 260.0, uTime * 0.05));
  float chrom = 1.0 - smoothstep(0.0, spic, h);

  // Çıkıntılar: kenardan yükselen kıvrımlı yaylar ve lifli perdeler
  float prom = 0.0;
  for (int k = 0; k < 8; k++) {
    vec4 P = uProms[k];
    if (P.y <= 0.0) continue;
    float da = atan(sin(ang - P.x), cos(ang - P.x));
    float s = da / P.y;
    if (abs(s) > 1.25 || h > P.z * 1.5) continue;
    float twist = 0.18 * P.z * sin(s * 7.0 + P.w * 5.0 + uTime * 0.03);                  // burgu
    float arc = P.z * sqrt(max(0.0, 1.0 - s * s)) + twist * (1.0 - s * s);
    float th = P.z * (0.12 + 0.1 * noise(vec3(s * 6.0, P.w, uTime * 0.02)));
    float dh = h - arc;
    float tube = exp(-dh * dh / (th * th)) + 0.35 * exp(-abs(dh) / (2.5 * th));       // dolu yay + çevresinde parıltı
    // Yayın altını dolduran lifli plazma perdesi (yukarı akan ipliksi yapılar)
    float fib = noise(vec3(s * 22.0 + 3.0 * noise(vec3(s * 4.0, h / P.z * 3.0, P.w)), h / P.z * 5.0 - uTime * 0.05, P.w));
    float curtain = (1.0 - smoothstep(arc * 0.55, arc * 1.02, h)) * smoothstep(1.0, 0.4, abs(s)) * smoothstep(0.3, 0.7, fib);
    float knots = 0.55 + 0.9 * fbm(vec3(s * 10.0, h / P.z * 8.0, P.w + uTime * 0.02));
    prom += (tube + 0.9 * curtain) * knots * smoothstep(1.25, 0.9, abs(s)) * smoothstep(-0.002, 0.004, h);
  }

  vec3 col = coronaCol * Ic * 0.55 * uCorona
           + vec3(1.0, 0.32, 0.28) * chrom * 0.9 * uProm
           + mix(vec3(0.9, 0.2, 0.15), vec3(1.0, 0.62, 0.42), smoothstep(0.6, 1.6, prom)) * min(prom, 2.0) * 0.75 * uProm;
  gl_FragColor = vec4(col * uOpacity, 1.0);
  #include <colorspace_fragment>
}
