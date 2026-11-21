// Galaksi parçacıkları (SPEC §3.13): Güneş çevresi silinir, kameraya çok yakın olanlar söner
uniform float uSize, uPixelRatio, uOpacity, uNearR;
uniform vec3 uSunLocal;
attribute vec3 aColor;
attribute float aSize;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  float dCam = length(w.xyz - cameraPosition);
  float hole = uSunLocal.x > -1e8 ? smoothstep(2500.0, 6000.0, length(position - uSunLocal)) : 1.0;
  vAlpha = uOpacity * hole * smoothstep(uNearR * 0.001, uNearR * 0.01, dCam);
  vColor = aColor;
  gl_PointSize = aSize * uSize * uPixelRatio;
  gl_Position = projectionMatrix * viewMatrix * w;
}
