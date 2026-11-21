// Güneş diski (R1): kenar kararması I(μ)/I(1) = 1 − u(1 − μ), u ≈ 0,6 (görünür ışık)
uniform float uOpacity;
varying vec3 vN;
varying vec3 vWorld;
void main() {
  float mu = max(dot(normalize(vN), normalize(cameraPosition - vWorld)), 0.0);
  float I = 1.0 - 0.6 * (1.0 - mu);
  vec3 col = mix(vec3(1.0, 0.55, 0.25), vec3(1.0, 0.96, 0.88), smoothstep(0.0, 0.6, mu)) * I;
  gl_FragColor = vec4(col * uOpacity, 1.0);
  #include <colorspace_fragment>
}
