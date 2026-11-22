// Schwarzschild kara deliği. Birim: Rs (olay ufku yarıçapı). Her piksel için foton yolu adım adım izlenir:
// x'' = −(3/2) h² x / r⁵ (h = |x × v|, korunur) — bu, Schwarzschild boş jeodeziklerinin düzlemdeki tam denklemidir.
// Gölge (~2,6 Rs), foton halkası ve arka planın bükülmesi bu hesaptan kendiliğinden çıkar. Disk: temsili ince disk
// (iç kenar ISCO = 3 Rs), sıcaklık T ∝ r^−3/4 (1 − √(3/r))^1/4 (Shakura–Sunyaev), Doppler ve kütle çekimsel kızıla kayma.
uniform vec3 uCenter, uDiskN;   // görüş uzayında
uniform float uRs, uHalf, uFull, uOpacity, uTime, uDisk, uDiskOut;
uniform float uRM;              // tam hesap küresinin yarıçapı (Rs); dışında zayıf alan sapması α = 2 Rs / b
uniform mat3 uViewToWorld;      // görüş → dünya (arka plan yönü)
uniform sampler2D uMW;          // Samanyolu (alt-az eşdikdörtgen, skyDome ile aynı eşleme); uHasMW = 0 → yok
uniform float uHasMW, uMWGain;
varying vec3 vView;

float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise(vec2 x) {
  vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  float a = hash13(vec3(i, 0.0)), b = hash13(vec3(i + vec2(1, 0), 0.0)), c = hash13(vec3(i + vec2(0, 1), 0.0)), d = hash13(vec3(i + vec2(1, 1), 0.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Yönteki gökyüzü: yordamsal yıldızlar (+ istenirse Samanyolu dokusu)
vec3 sky(vec3 dv) {
  vec3 d = normalize(uViewToWorld * dv);
  vec3 col = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float sc = k == 0 ? 90.0 : 260.0;
    vec3 p = d * sc, c = floor(p);
    for (int i = 0; i < 2; i++) for (int j = 0; j < 2; j++) for (int l = 0; l < 2; l++) {
      vec3 cc = c + vec3(float(i), float(j), float(l));
      float h = hash13(cc);
      if (h > (k == 0 ? 0.55 : 0.25)) continue;
      vec3 sp = cc + vec3(hash13(cc + 7.1), hash13(cc + 3.3), hash13(cc + 9.7));
      float dd = length(p - sp) * (k == 0 ? 7.0 : 9.0);
      float b = exp(-dd * dd) * (k == 0 ? 1.6 : 0.6) * (0.3 + h * 2.0);
      float t = hash13(cc + 1.7);
      col += b * mix(vec3(1.0, 0.75, 0.55), vec3(0.7, 0.8, 1.0), t);
    }
  }
  if (uHasMW > 0.5) {
    float alt = asin(clamp(d.y, -1.0, 1.0));
    float az = atan(d.x, -d.z);
    if (az < 0.0) az += 6.28318530718;
    col += texture2D(uMW, vec2(az / 6.28318530718, 0.5 + alt / 3.14159265359)).rgb * uMWGain;
  }
  return col;
}

// Disk rengi: sıcaklık oranı → kabaca kara cisim rengi (temsili)
vec3 bbColor(float t) {
  return clamp(vec3(1.0, 0.25 + 0.6 * t, 0.05 + 0.6 * t * t) * (0.2 + 1.2 * t), 0.0, 3.0);
}

void main() {
  vec3 d = normalize(vView);
  vec3 o = -uCenter / uRs;                         // kamera, kara deliğe göre (Rs)
  float rc = length(o);
  float b = length(cross(o, d));                   // çarpma parametresi
  float tca = dot(-o, d);
  float edge = uFull > 0.5 ? 1.0 : 1.0 - smoothstep(0.6, 1.0, length(vView.xy - uCenter.xy) / uHalf);
  if (edge <= 0.0) discard;

  vec3 col = vec3(0.0);
  float trans = 1.0;                               // disk saydamlığı (önden arkaya birleştirme)
  vec3 outDir = d;
  bool captured = false;
  float RM = uRM;                                  // bu yarıçapın dışında zayıf alan: düz çizgi + analitik sapma
  if (b > RM * 0.98 || (tca < 0.0 && rc > RM)) {
    // Zayıf alan: sapma açısı α = 2 Rs / b (Einstein); ışın kara deliğe doğru bükülür
    vec3 toC = normalize(-o - d * tca);
    float a = tca > 0.0 ? 2.0 / b : 0.0;
    outDir = normalize(d * cos(a) + toC * sin(a));
  } else {
    vec3 x = o, v = d;
    if (rc > RM) x = o + d * (tca - sqrt(max(RM * RM - b * b, 0.0)));
    float h2 = dot(cross(x, v), cross(x, v));
    float side = dot(x, uDiskN);
    for (int i = 0; i < 260; i++) {
      float r = length(x);
      if (r < 1.0) { captured = true; break; }
      if (r > RM + 1.0 && dot(x, v) > 0.0) break;
      float dt = clamp(0.08 * r * r / (r + 2.0), 0.02, 2.5);
      // Hız Verlet
      float r2 = r * r;
      vec3 acc = -1.5 * h2 * x / (r2 * r2 * r);
      vec3 xn = x + v * dt + 0.5 * acc * dt * dt;
      float rn = length(xn);
      float rn2 = rn * rn;
      vec3 accn = -1.5 * h2 * xn / (rn2 * rn2 * rn);
      v = normalize(v + 0.5 * (acc + accn) * dt);
      float sn = dot(xn, uDiskN);
      if (uDisk > 0.0 && sign(sn) != sign(side) && trans > 0.01) {
        vec3 p = mix(x, xn, side / (side - sn));
        float rr = length(p);
        if (rr > 3.0 && rr < uDiskOut) {
          float T = pow(3.0 / rr, 0.75) * pow(max(1.0 - sqrt(3.0 / rr), 0.0), 0.25) / 0.488;   // r = 4,08'de 1
          float beta = sqrt(0.5 / (rr - 1.0));                     // dairesel yörünge hızı (c), Schwarzschild
          vec3 vel = normalize(cross(uDiskN, p));
          float gam = 1.0 / sqrt(1.0 - beta * beta);
          float dop = 1.0 / (gam * (1.0 - beta * dot(vel, -v)));   // gözlemciye doğru yayılan foton
          float g = dop * sqrt(1.0 - 1.0 / rr);                    // + kütle çekimsel kızıla kayma
          // Sarmal akış lifleri: açı yarıçapla kayar (içerisi daha hızlı döner)
          vec3 e1 = normalize(cross(uDiskN, abs(uDiskN.y) < 0.9 ? vec3(0, 1, 0) : vec3(1, 0, 0))), e2 = cross(uDiskN, e1);
          float ph = atan(dot(p, e2), dot(p, e1)) + uTime * 0.6 * pow(rr, -1.5) * 8.0;
          float swirl = 0.55 + 0.9 * vnoise(vec2(rr * 2.2, ph * 3.0 / 6.2831 * 6.0 + rr * 1.5)) * vnoise(vec2(rr * 7.0, ph * 9.0 / 6.2831 * 6.0));
          float I = pow(g, 3.0) * T * T * swirl * smoothstep(uDiskOut, uDiskOut * 0.6, rr) * smoothstep(3.0, 3.4, rr);
          float a = clamp(0.8 * smoothstep(3.0, 3.6, rr) * smoothstep(uDiskOut, uDiskOut * 0.5, rr), 0.0, 1.0);
          col += trans * a * bbColor(clamp(T * g * 0.6, 0.0, 1.5)) * I * 0.4 * uDisk;
          trans *= 1.0 - a;
        }
      }
      side = sn;
      x = xn;
    }
    outDir = v;
  }
  if (!captured) col += trans * sky(outDir);
  gl_FragColor = vec4(col, edge * uOpacity);
  #include <colorspace_fragment>
}
