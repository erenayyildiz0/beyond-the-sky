// "Gördüğün her şey" küresi (SPEC §6.5.5): çok saydam, kenarda Fresnel ile parlar
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vN;
varying vec3 vWorld;
void main() {
  float f = pow(1.0 - abs(dot(normalize(vN), normalize(cameraPosition - vWorld))), 2.5);
  float a = (0.012 + 0.12 * f) * uOpacity;          // çift yüz: içi çok saydam, kenar belirgin
  gl_FragColor = vec4(uColor * a, a);
  #include <colorspace_fragment>
}
