// SPEC §6.4 — 3D şehir silueti; veri dokusu: R bina, G pencere türü, B sönme eşiği
uniform sampler2D uData;
uniform float uP, uAltMin, uAltMax, uOpacity;
uniform vec3 uBuilding, uCold, uWarm;
varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  float az = atan(d.x, -d.z);
  if (az < 0.0) az += 6.28318530718;
  float altDeg = asin(clamp(d.y, -1.0, 1.0)) * 57.29577951308232;
  vec2 uv = vec2(az / 6.28318530718, (altDeg - uAltMin) / (uAltMax - uAltMin));
  vec4 px = texture2D(uData, uv);
  if (px.r < 0.5) discard;                                     // gökyüzü görünür
  float theta = px.b;
  float on = 1.0 - smoothstep(theta - 0.015, theta, uP);
  vec3 win = px.g > 0.75 ? uWarm : uCold;
  float isWin = px.g > 0.25 ? 1.0 : 0.0;
  vec3 col = mix(uBuilding, win * 0.85, isWin * on);
  if (altDeg < 0.0) col = vec3(0.0);                           // zemin: kubbenin ufuk altıyla aynı siyah
  gl_FragColor = vec4(col, uOpacity);
  #include <colorspace_fragment>
}
