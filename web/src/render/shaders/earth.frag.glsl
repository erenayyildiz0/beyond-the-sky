// SPEC §6.5.5 — gece ışıkları ve gündüz tonu. §13.1: smoothstep'te edge0 < edge1.
uniform sampler2D uNight;
uniform vec3 uSun;          // Güneş yönü (three.js, birim)
uniform vec3 uDay;
uniform float uOpacity;
varying vec2 vUv;
varying vec3 vN;
void main() {
  float d = dot(normalize(vN), uSun);
  vec3 night = texture2D(uNight, vUv).rgb * (1.0 - smoothstep(-0.1, 0.15, d));
  vec3 day = uDay * 0.6 * smoothstep(-0.1, 0.3, d);
  gl_FragColor = vec4((night + day) * uOpacity, 1.0);
  #include <colorspace_fragment>
}
