// Kara delik efekti: uzaktayken kameraya dönük kare (merkez çevresinde uHalf yarıçap), yakındayken tam ekran
uniform vec3 uCenter;       // görüş uzayında kara delik merkezi
uniform float uHalf;        // karenin yarı genişliği (katman birimi)
uniform float uFull;        // 1 → tam ekran
uniform mat4 uInvProj;
varying vec3 vView;         // görüş uzayında bu pikselden geçen ışının bir noktası
void main() {
  if (uFull > 0.5) {
    vec4 v = uInvProj * vec4(position.xy, 1.0, 1.0);
    vView = v.xyz / v.w;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  } else {
    vec3 p = uCenter + vec3(position.xy * uHalf, 0.0);
    vView = p;
    gl_Position = projectionMatrix * vec4(p, 1.0);
  }
}
