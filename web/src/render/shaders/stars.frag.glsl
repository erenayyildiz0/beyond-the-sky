// iki yıldız malzemesinde ortak (SPEC §6.4)
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c) * 2.0;
  float core = exp(-r * r * 8.0);
  float halo = exp(-r * 3.0) * 0.25;
  float a = vAlpha * (core + halo) * (1.0 - smoothstep(0.8, 1.0, r));   // kenarda sıfır (köşeli sprite olmasın)
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor * a, a);
  #include <colorspace_fragment>
}
