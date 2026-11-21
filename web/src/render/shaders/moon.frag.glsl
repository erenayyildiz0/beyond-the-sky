// Ay (R1): LRO renkli harita; Güneş yönüne göre evre. Ay yüzeyi Lambert'ten daha "düz" görünür (Lommel–Seeliger karışımı).
uniform sampler2D uMap;
uniform float uHasMap;
uniform vec3 uSun;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vWorld;
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vWorld);
  float mu0 = max(dot(N, uSun), 0.0), mu = max(dot(N, V), 1e-3);
  float ls = 2.0 * mu0 / (mu0 + mu);
  float l = mix(mu0, ls, 0.5);
  vec3 albedo = mix(vec3(0.62, 0.60, 0.57), texture2D(uMap, vUv).rgb, uHasMap);
  gl_FragColor = vec4(albedo * (0.015 + 1.1 * l) * uOpacity, 1.0);
  #include <colorspace_fragment>
}
