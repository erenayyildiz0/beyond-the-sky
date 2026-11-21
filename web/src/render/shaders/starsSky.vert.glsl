// SPEC §6.4 gökyüzü malzemesi — nelm/airmass §3.3 ve visibility.ts/visibility.py ile birebir
uniform float uSqm, uGlowMag, uExtK, uSoft, uBaseSize, uMaxSize, uRefMag, uPixelRatio, uTime, uTwinkle, uIntensity;
attribute float aMag;
attribute vec3 aColor;
attribute float aPhase;
attribute float aPlanet;
varying vec3 vColor;
varying float vAlpha;
const float DEG = 0.017453292519943295;

float nelm(float s) { return 7.93 - 5.0 * log(pow(10.0, 4.316 - s / 5.0) + 1.0) / log(10.0); }
float airmass(float altDeg) { float a = max(altDeg, 0.0); return 1.0 / (sin(a * DEG) + 0.50572 * pow(a + 6.07995, -1.6364)); }

void main() {
  vec3 d = normalize(position);
  float altDeg = asin(clamp(d.y, -1.0, 1.0)) / DEG;
  float X = airmass(altDeg);
  float mEff = aMag + uExtK * (X - 1.0);
  float s = 1.0 - sin(max(altDeg, 0.0) * DEG);
  float mLim = nelm(uSqm - uGlowMag * s * s);
  // DİKKAT: smoothstep'te edge0 < edge1 olmalı; ters sırada sonuç tanımsız
  float vis = altDeg > 0.0 ? 1.0 - smoothstep(mLim - uSoft, mLim + uSoft, mEff) : 0.0;
  float tw = (1.0 - aPlanet) * uTwinkle * clamp(X - 1.0, 0.0, 3.0) * 0.05
           * sin(uTime * (3.0 + aPhase * 4.0) + aPhase * 6.2831853);
  float intensity = clamp(0.35 + 0.65 * (uRefMag - mEff) / (uRefMag + 1.5), 0.25, 1.0);
  vAlpha = vis * intensity * uIntensity * (1.0 + tw);
  vColor = aColor;
  gl_PointSize = clamp(uBaseSize * pow(10.0, -0.2 * (mEff - uRefMag)), 1.0, uMaxSize) * uPixelRatio;
  gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + d * 900.0, 1.0);
}
