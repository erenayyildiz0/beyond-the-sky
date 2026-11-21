// SPEC §6.4 — hava kütlesi formülü §3.3 ile aynı
uniform sampler2D uMW;
uniform float uMWOpacity, uMWGain, uExtK, uSpace;
uniform vec3 uZenith, uHorizon;
uniform vec3 uM31Dir, uM31Major;       // M31 yönü ve büyük ekseni (three.js birim vektörleri)
uniform float uM31Opacity;
varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  float alt = asin(clamp(d.y, -1.0, 1.0));
  if (alt < 0.0 && uSpace < 0.5) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  float az = atan(d.x, -d.z);
  if (az < 0.0) az += 6.28318530718;
  vec2 uv = vec2(az / 6.28318530718, 0.5 + alt / 3.14159265359);   // v=1 görüntünün üstü
  float altDeg = alt * 57.29577951308232;
  float ext = 1.0;
  if (uSpace < 0.5) {
    float X = 1.0 / (sin(max(alt, 0.0)) + 0.50572 * pow(max(altDeg, 0.0) + 6.07995, -1.6364));
    ext = pow(10.0, -0.4 * uExtK * (X - 1.0));
  }
  vec3 mw = texture2D(uMW, uv).rgb * uMWGain * uMWOpacity * ext;
  // Andromeda lekesi (§3.4): 3,2° × 1,0° elips
  vec3 minor = normalize(cross(uM31Dir, uM31Major));
  float a = dot(d, uM31Major) / 0.0279, b = dot(d, minor) / 0.0087;     // yarı eksenler (rad)
  float m31 = (dot(d, uM31Dir) > 0.0) ? exp(-(a * a + b * b) * 2.0) * uM31Opacity * ext : 0.0;
  float h = pow(1.0 - clamp(altDeg, 0.0, 90.0) / 90.0, 2.5);
  vec3 sky = mix(uZenith, uHorizon, h) * (1.0 - uSpace);
  gl_FragColor = vec4(sky + mw + m31 * vec3(0.91, 0.86, 0.78), 1.0);
  #include <colorspace_fragment>
}
