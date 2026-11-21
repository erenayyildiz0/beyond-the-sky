// Gezegenler (R1): Jüpiter Cassini haritası (PIA07782); diğerleri gerçek renk ve bant yapısına dayalı temsili doku.
// Aydınlatma Güneş'in konumuna göre Lambert. uKind: 0 doku · 1 kayalık (Merkür) · 2 Venüs · 3 Mars · 4 Satürn · 5 Uranüs · 6 Neptün
uniform sampler2D uMap;
uniform float uKind, uOpacity, uHasMap;
uniform vec3 uColor, uSunPos, uRingN;   // uRingN: halka düzlemi normali (Satürn), 0 ise yok
uniform float uRingIn, uRingOut;        // halka yarıçapları (gezegen yarıçapı biriminde)
uniform vec3 uCenter;
uniform float uRadius;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vWorld;
varying vec3 vLocal;

float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }

vec3 albedo() {
  float lat = vLocal.y;                                  // yerel +y = kuzey kutbu
  if (uKind < 0.5) return texture2D(uMap, vUv).rgb;
  if (uKind < 1.5) return uColor * (0.75 + 0.35 * fbm(vLocal * 9.0)) * (1.0 - 0.25 * smoothstep(0.62, 0.7, fbm(vLocal * 22.0)));
  if (uKind < 2.5) return uColor * (0.9 + 0.12 * fbm(vec3(lat * 6.0, vLocal.xz * 2.0)));
  if (uKind < 3.5) {
    vec3 c = mix(uColor, uColor * 0.55, smoothstep(0.45, 0.65, fbm(vLocal * 4.0)));
    return mix(c, vec3(0.95), smoothstep(0.88, 0.93, abs(lat)));   // kutup başlıkları
  }
  float bands = sin(lat * (uKind < 4.5 ? 26.0 : 14.0) + fbm(vLocal * 3.0) * 1.5);
  float k = uKind < 4.5 ? 0.12 : (uKind < 5.5 ? 0.03 : 0.08);
  return uColor * (1.0 + k * bands);
}

void main() {
  vec3 N = normalize(vN);
  vec3 L = normalize(uSunPos - vWorld);
  float l = max(dot(N, L), 0.0);
  // Satürn: halkaların gezegen üstüne düşen gölgesi
  if (uRingIn > 0.0) {
    float t = -dot(vWorld - uCenter, uRingN) / dot(L, uRingN);
    if (t > 0.0) {
      float r = length(vWorld + L * t - uCenter) / uRadius;
      if (r > uRingIn && r < uRingOut) l *= 0.35;
    }
  }
  vec3 col = albedo() * (0.02 + 0.98 * l);
  gl_FragColor = vec4(col * uOpacity, 1.0);
  #include <colorspace_fragment>
}
