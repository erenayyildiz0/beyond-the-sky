// Yakındaki yıldızın diski (R4): kenar kararması I(μ) = 1 − u(1 − μ), u ≈ 0,6; renk sıcaklıktan
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vN;
varying vec3 vWorld;
void main() {
  float mu = max(dot(normalize(vN), normalize(cameraPosition - vWorld)), 0.0);
  float I = 1.0 - 0.6 * (1.0 - mu);
  vec3 col = mix(uColor * vec3(1.0, 0.75, 0.6), uColor, smoothstep(0.0, 0.5, mu)) * I * 1.9;   // yüzey en parlak yer
  gl_FragColor = vec4(col * uOpacity, 1.0);
  #include <colorspace_fragment>
}
