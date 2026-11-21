import * as THREE from "three";
import vert from "./shaders/earth.vert.glsl?raw";
import frag from "./shaders/starBody.frag.glsl?raw";
import { createMarkers } from "./markers";

/** star katmanı (R4): birim = Güneş yarıçapı, orijin = en yakın yıldız. Gerçek boyutlu disk + temsili hale. */
export function createStarBodyLayer() {
  const scene = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { uColor: { value: new THREE.Color(1, 1, 1) }, uOpacity: { value: 1 } } });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), mat);
  const glow = createMarkers([{ pos: new THREE.Vector3(), size: 26, color: "#ffffff" }], 1);
  glow.material.depthTest = true;                              // hale merkezde; disk onu örter → hale yalnızca diskin dışında
  scene.add(sphere, glow.obj);
  let radius = 1;
  return {
    scene,
    set(rSun: number, color: THREE.Color) {
      radius = rSun;
      sphere.scale.setScalar(rSun);
      mat.uniforms.uColor.value.copy(color);
      const c = glow.obj.geometry.getAttribute("aColor") as THREE.BufferAttribute;
      c.setXYZ(0, color.r, color.g, color.b); c.needsUpdate = true;
    },
    applyWeight(w: number) { mat.uniforms.uOpacity.value = w; glow.material.uniforms.uOpacity.value = 0.35 * w; },
    /** camUnits: kamera (Güneş yarıçapı biriminde, yıldıza göre) */
    update(camUnits: THREE.Vector3, fovDeg: number, viewH: number, pr: number) {
      const d = Math.max(camUnits.length(), radius * 1.01);
      const rPx = (radius / d) / Math.tan(fovDeg * Math.PI / 360) * viewH / 2;
      const sz = glow.obj.geometry.getAttribute("aSize") as THREE.BufferAttribute;
      sz.setX(0, Math.min(500, Math.max(20, rPx * 6))); sz.needsUpdate = true;
      glow.material.uniforms.uPixelRatio.value = pr;
      return rPx;
    },
    nearFar(c: THREE.Vector3): [number, number] {
      const d = c.length();
      return [Math.max(1e-4, (d - radius) * 0.3), d * 10 + 10];
    },
  };
}
