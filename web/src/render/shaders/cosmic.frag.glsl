varying float vKind;
varying float vBA;
varying float vRot;
varying float vAlpha;
varying float vSize;
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float c = cos(vRot), s = sin(vRot);
  p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  p.y /= max(vBA, 0.15);                                   // eğiklik: eksen oranı
  float r = length(p) * 2.0;
  if (r > 1.0) discard;
  vec3 col; float a;
  if (vKind < 0.5) {                                       // eliptik/mercimek: düzgün, sıcak renk
    a = exp(-r * r * 6.0);
    col = vec3(1.0, 0.86, 0.68);
  } else if (vKind < 1.5) {                                // sarmal: çekirdek + mavi disk + kol izi (büyükken)
    float th = atan(p.y, p.x);
    float arm = 0.5 + 0.5 * cos(2.0 * th - 6.0 * log(max(r, 0.05)));
    float disk = exp(-r * 3.2) * mix(1.0, 0.35 + 0.65 * arm, smoothstep(6.0, 24.0, vSize));
    a = 0.75 * exp(-r * r * 30.0) + 0.6 * disk;
    col = mix(vec3(0.78, 0.86, 1.0), vec3(1.0, 0.88, 0.7), exp(-r * r * 20.0));
  } else {                                                 // düzensiz / bilinmiyor
    a = exp(-r * r * 4.0) * 0.8;
    col = vec3(0.85, 0.9, 1.0);
  }
  a *= vAlpha * (1.0 - smoothstep(0.8, 1.0, r));
  if (a < 0.004) discard;
  gl_FragColor = vec4(col * a, a);
  #include <colorspace_fragment>
}
