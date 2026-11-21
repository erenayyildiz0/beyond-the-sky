varying vec2 vUv;
varying vec2 vP;          // düzlemde konum (ışık yılı, galaksi merkezine göre)
void main() {
  vUv = uv;
  vP = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
