varying vec3 vWorld;
varying vec2 vLocal;
void main() {
  vLocal = position.xy;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
