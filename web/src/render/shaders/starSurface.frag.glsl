// Yıldız fotosferi. Gerçek: renk (sıcaklıktan), boyut, kenar kararması I(μ) = 1 − u(1 − μ), u ≈ 0,6.
// Temsili: granülasyon (Güneş'te ~1.000 km'lik hücreler, ~8 dakikada yenilenir), süpergranül ağı, fakülalar ve lekeler.
uniform vec3 uColor, uTint; // uTint: görüntü tonu (Güneş'te filtreli fotoğraf sarısı, diğerlerinde 1)
uniform float uOpacity, uTime, uGain;
uniform float uCells;       // yarıçap başına granül sayısı (devlerde birkaç dev hücre)
uniform float uContrast;    // granül kontrastı (sıcak yıldızlarda konveksiyon zayıf)
uniform vec4 uSpots[6];     // leke merkezi (yerel birim vektör) + yarıçap (radyan); w = 0 → yok
varying vec3 vN;
varying vec3 vWorld;
varying vec3 vLocal;

vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }

// Hücresel gürültü: (F1, F2). Hücre merkezleri zamanla yavaşça kayar (granüller kaynar).
vec2 worley(vec3 x, float t) {
  vec3 i = floor(x), f = fract(x);
  float F1 = 8.0, F2 = 8.0;
  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int l = -1; l <= 1; l++) {
    vec3 g = vec3(float(l), float(j), float(k));
    vec3 o = hash3(i + g);
    o = 0.5 + 0.42 * sin(t + 6.2831 * o);
    float d = length(g + o - f);
    if (d < F1) { F2 = F1; F1 = d; } else if (d < F2) { F2 = d; }
  }
  return vec2(F1, F2);
}

void main() {
  vec3 V = normalize(cameraPosition - vWorld);
  float mu = max(dot(normalize(vN), V), 0.0);
  float I = 1.0 - 0.6 * (1.0 - mu);
  vec3 p = normalize(vLocal);

  // Granülasyon: parlak sıcak hücre merkezleri, aralarında koyu, soğuk iniş şeritleri
  vec3 q = p * uCells;
  float px = length(fwidth(q));                                  // bir pikselde kaç hücre
  float vis = 1.0 - smoothstep(0.3, 0.9, px);                    // piksel altına inince ortalamaya karış (titreşmesin)
  float g = 1.0;
  if (vis > 0.0) {
    // Kenarlar düz çokgen olmasın: koordinatı yumuşak gürültüyle bük (granüller yuvarlak, şeritler kıvrımlı)
    vec3 warp = vec3(noise(q * 0.7), noise(q * 0.7 + 17.3), noise(q * 0.7 + 41.1)) - 0.5;
    float giant = 1.0 - smoothstep(4.0, 40.0, uCells);           // süperdevlerde birkaç dev, lekeli hücre
    vec3 qw = q + warp * (0.9 + 1.6 * giant);
    vec2 w = worley(qw, uTime * 0.04);
    float dome = 1.0 - w.x * w.x * 1.1;                          // ortası parlak kubbe
    float lane = smoothstep(0.0, 0.25 + 0.5 * giant, w.y - w.x); // geniş, yumuşak koyu şerit
    dome *= mix(1.0, 0.6 + 0.8 * fbm(q * 2.5 + 7.0), giant);
    float gran = (0.5 + 0.5 * dome) * mix(0.3, 1.0, lane);
    g = mix(1.0, gran * 1.45, uContrast * vis);                  // ortalama parlaklık korunur
  }
  // Süpergranül ağı (~30.000 km) ve kenara yakın parlak fakülalar
  float net = noise(p * max(uCells * 0.035, 2.0) + uTime * 0.001);
  float sg = 1.0 + 0.14 * uContrast * (net - 0.5);              // uzaktan da seçilen ağ dokusu
  float fac = 1.0 + 0.3 * uContrast * pow(1.0 - mu, 2.0) * smoothstep(0.6, 0.75, net);

  // Lekeler: koyu gölge (umbra), ışınsal lifli yarı gölge (penumbra)
  float spot = 1.0;
  for (int k = 0; k < 6; k++) {
    vec4 s = uSpots[k];
    if (s.w <= 0.0) continue;
    float d = acos(clamp(dot(p, s.xyz), -1.0, 1.0)) / s.w;
    if (d > 2.6) continue;
    vec3 t1 = normalize(cross(s.xyz, abs(s.y) < 0.9 ? vec3(0, 1, 0) : vec3(1, 0, 0)));
    float ang = atan(dot(p, cross(s.xyz, t1)), dot(p, t1));
    float fil = 0.75 + 0.25 * noise(vec3(cos(ang) * 30.0, sin(ang) * 30.0, d * 3.0));
    float pen = 1.0 - smoothstep(1.7, 2.4, d * (0.9 + 0.2 * fil));
    float umb = 1.0 - smoothstep(0.75, 1.0, d);
    spot *= mix(1.0, mix(0.72 * fil, 0.22, umb), pen);
  }

  // Kenar kararması dalga boyuna bağlı: mavi daha çok kararır → kenar kırmızılaşır. Doygunluk artırıldı (filtreli
  // güneş fotoğraflarındaki gibi; gerçekte Güneş'in rengi beyaza yakın)
  vec3 sat = mix(vec3(dot(uColor, vec3(0.299, 0.587, 0.114))), uColor, 1.8);
  sat = clamp(sat * uTint, 0.0, 1.0);
  vec3 base = mix(sat * vec3(0.95, 0.55, 0.3), sat, smoothstep(0.0, 0.7, mu));
  float dark = g * spot;
  vec3 cool = mix(vec3(1.0, 0.62, 0.4), vec3(1.0), smoothstep(0.25, 1.0, dark));   // soğuk (koyu) bölgeler kızıla kayar
  vec3 col = base * cool * I * g * sg * fac * spot * uGain;
  gl_FragColor = vec4(col * uOpacity, 1.0);
  #include <colorspace_fragment>
}
