uniform float uOpacity;
uniform float uGlow;        // 0: dolu disk, 1: yumuşak parıltı
varying vec3 vColor;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float disk = 1.0 - smoothstep(0.7, 1.0, r);
  float glow = exp(-r * r * 4.0) + 0.6 * exp(-r * 10.0);
  float a = mix(disk, glow, uGlow) * uOpacity;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor * a, a);
  #include <colorspace_fragment>
}
