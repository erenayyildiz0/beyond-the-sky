// SPEC §6.5.5 uçuş malzemesi — m_app formülü §3.8 ve science/flight.ts apparentMag ile birebir
uniform float uMLim, uSoft, uBaseSize, uMaxSize, uFlyByMax, uRefMag, uPixelRatio, uIntensity, uNoDistShell, uFade;
attribute float aMag;
attribute vec3 aColor;
attribute float aNoDist;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 P = position;                                        // ışık yılı
  float dHome = aNoDist > 0.5 ? uNoDistShell : length(P);
  float dCam = max(length(P - cameraPosition), 1e-3);       // cameraPosition: three.js'in hazır uniform'u
  float mApp = aMag + 5.0 * log(dCam / dHome) / log(10.0);  // §3.8
  float vis = 1.0 - smoothstep(uMLim - uSoft, uMLim + uSoft, mApp);
  float closeUp = 1.0 - smoothstep(0.2, 2.0, dCam);         // 2 ışık yılından yakın: büyüt
  float size = clamp(uBaseSize * pow(10.0, -0.2 * (mApp - uRefMag)), 1.0, mix(uMaxSize, uFlyByMax, closeUp));
  vAlpha = vis * clamp(0.35 + 0.65 * (uRefMag - mApp) / (uRefMag + 1.5), 0.25, 1.0) * uIntensity * uFade;
  vColor = aColor;
  gl_PointSize = size * uPixelRatio;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(P, 1.0);
}
