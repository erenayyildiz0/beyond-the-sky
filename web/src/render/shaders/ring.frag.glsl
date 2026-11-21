// Satürn halkaları (R1): yarıçaplar NASA Saturn Fact Sheet (C, B, Cassini aralığı, A); saydamlık profili yaklaşık; gezegenin gölgesi
uniform vec3 uSunPos, uCenter;
uniform float uRadius, uOpacity;
uniform vec4 uEdges;      // C iç, B iç (= C dış), Cassini iç (= B dış), A iç (= Cassini dış) — gezegen yarıçapı biriminde
uniform float uAOut;
varying vec3 vWorld;
varying vec2 vLocal;
void main() {
  float r = length(vLocal) / uRadius;
  float a = 0.0;
  if (r > uEdges.x && r < uEdges.y) a = 0.18;                                   // C halkası
  else if (r >= uEdges.y && r < uEdges.z) a = 0.85 + 0.05 * sin(r * 300.0);      // B halkası
  else if (r >= uEdges.z && r < uEdges.w) a = 0.06;                             // Cassini aralığı
  else if (r >= uEdges.w && r < uAOut) a = 0.6 + 0.05 * sin(r * 260.0);       // A halkası
  if (a <= 0.0) discard;
  vec3 L = normalize(uSunPos - vWorld);
  vec3 oc = uCenter - vWorld;
  float t = dot(oc, L);
  float shadow = (t > 0.0 && length(oc - L * t) < uRadius) ? 0.12 : 1.0;
  vec3 col = vec3(0.86, 0.78, 0.64) * shadow;
  gl_FragColor = vec4(col * uOpacity * a, a * uOpacity);
  #include <colorspace_fragment>
}
