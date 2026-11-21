uniform vec3 uSun;
uniform float uOpacity;
varying vec3 vN;
void main() {
  float l = max(dot(normalize(vN), uSun), 0.0);
  vec3 c = vec3(0.78, 0.76, 0.72) * (0.03 + 0.97 * l);
  gl_FragColor = vec4(c * uOpacity, 1.0);
  #include <colorspace_fragment>
}
