// Gözlemlenebilir evrenin sınırı (R5): Planck CMB haritası, galaktik eşdikdörtgen (u = l/360°, v = 0,5 + b/180°)
uniform sampler2D uMap;
uniform mat3 uToGal;       // three.js yönü → galaktik birim vektör
uniform float uOpacity;
varying vec3 vDir;
void main() {
  vec3 g = normalize(uToGal * normalize(vDir));
  float l = atan(g.y, g.x);
  if (l < 0.0) l += 6.28318530718;
  float b = asin(clamp(g.z, -1.0, 1.0));
  vec3 c = texture2D(uMap, vec2(l / 6.28318530718, 0.5 + b / 3.14159265359)).rgb;
  gl_FragColor = vec4(c * uOpacity, 1.0);
  #include <colorspace_fragment>
}
