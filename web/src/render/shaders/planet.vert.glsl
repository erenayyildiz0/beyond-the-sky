varying vec2 vUv;
varying vec3 vN;
varying vec3 vWorld;
varying vec3 vLocal;
void main() {
  vUv = uv;
  vLocal = normalize(position);
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
