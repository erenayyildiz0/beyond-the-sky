import * as THREE from "three";
import { createMarkers } from "./markers";
import { applyStarLook, createCorona, createStarSurfaceMaterial } from "./starSurface";

/**
 * star katmanı (R4): birim = Güneş yarıçapı, orijin = en yakın yıldız. Gerçek boyutlu disk (granüllü fotosfer),
 * çevresinde korona/kromosfer/çıkıntılar ve uzaktan temsili hale.
 */
export function createStarBodyLayer() {
  const scene = new THREE.Scene();
  const mat = createStarSurfaceMaterial(1.3);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), mat);
  const corona = createCorona(new THREE.Vector3(), 1);
  const glow = createMarkers([{ pos: new THREE.Vector3(), size: 26, color: "#ffffff" }], 1);
  glow.material.depthTest = true;                              // hale merkezde; disk onu örter → hale yalnızca diskin dışında
  scene.add(sphere, glow.obj, corona.mesh);
  let radius = 1, weight = 1, rPxLast = 0;
  return {
    scene,
    /** seed: yıldıza özgü (katalog sırası) — lekeler ve çıkıntılar her yıldızda farklı ama kararlı */
    set(rSun: number, color: THREE.Color, T: number, seed: number) {
      radius = rSun;
      sphere.scale.setScalar(rSun);
      corona.set(new THREE.Vector3(), rSun);
      applyStarLook(mat, corona.mat, color, T, rSun, seed);
      const c = glow.obj.geometry.getAttribute("aColor") as THREE.BufferAttribute;
      c.setXYZ(0, color.r, color.g, color.b); c.needsUpdate = true;
    },
    applyWeight(w: number) {
      weight = w;
      mat.uniforms.uOpacity.value = w;
      glow.material.uniforms.uOpacity.value = 0.35 * w * (1 - THREE.MathUtils.smoothstep(rPxLast, 25, 90));   // yakında korona devralır
      corona.mat.uniforms.uOpacity.value = w * THREE.MathUtils.smoothstep(rPxLast, 2, 12);
    },
    /** camUnits: kamera (Güneş yarıçapı biriminde, yıldıza göre) */
    update(camUnits: THREE.Vector3, fovDeg: number, viewH: number, pr: number) {
      const d = Math.max(camUnits.length(), radius * 1.01);
      const rPx = (radius / d) / Math.tan(fovDeg * Math.PI / 360) * viewH / 2;
      rPxLast = rPx;
      const sz = glow.obj.geometry.getAttribute("aSize") as THREE.BufferAttribute;
      sz.setX(0, Math.min(500, Math.max(20, rPx * 6))); sz.needsUpdate = true;
      glow.material.uniforms.uPixelRatio.value = pr;
      this.applyWeight(weight);
      return rPx;
    },
    nearFar(c: THREE.Vector3): [number, number] {
      const d = c.length();
      return [Math.max(1e-4, (d - radius) * 0.3), d * 10 + 10];
    },
  };
}
