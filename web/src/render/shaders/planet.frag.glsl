// Güneş'e göre basit Lambert gölgeleme (solar katmanı, AB birimi)
uniform vec3 uSunPos;
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vN;
varying vec3 vWorld;
void main() {
  float l = max(dot(normalize(vN), normalize(uSunPos - vWorld)), 0.0);
  gl_FragColor = vec4(uColor * (0.03 + 0.97 * l) * uOpacity, 1.0);
  #include <colorspace_fragment>
}
