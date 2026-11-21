uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vN;
varying vec3 vWorld;
void main() {
  vec3 V = normalize(cameraPosition - vWorld);
  float f = pow(1.0 - max(dot(normalize(vN), V), 0.0), 3.0) * 0.6;
  gl_FragColor = vec4(uColor * f * uOpacity, f * uOpacity);
  #include <colorspace_fragment>
}
