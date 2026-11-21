varying vec3 vDir;
void main() {
  vDir = position;                                         // küre merkezi = ev (orijin)
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
