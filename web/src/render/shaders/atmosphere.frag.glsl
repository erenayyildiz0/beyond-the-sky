// Atmosfer (R1): kenarda saçılma; aydınlık tarafta mavi, terminatörde turuncu, gece tarafında çok soluk
uniform vec3 uColor;
uniform vec3 uSun;
uniform float uOpacity;
varying vec3 vN;
varying vec3 vWorld;
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vWorld);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  float d = dot(N, uSun);
  float day = smoothstep(-0.35, 0.3, d);
  vec3 col = mix(vec3(1.0, 0.5, 0.25), uColor, smoothstep(-0.05, 0.35, d));
  float a = rim * (0.05 + 0.9 * day) * uOpacity;
  gl_FragColor = vec4(col * a, a);
  #include <colorspace_fragment>
}
