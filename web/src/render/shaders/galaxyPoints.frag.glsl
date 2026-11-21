varying vec3 vColor;
varying float vAlpha;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = vAlpha * exp(-r * r * 4.0) * (1.0 - smoothstep(0.8, 1.0, r));
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor * a, a);
  #include <colorspace_fragment>
}
