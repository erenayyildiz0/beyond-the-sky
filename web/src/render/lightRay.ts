import * as THREE from "three";

/**
 * Işık çizgisi (SPEC §6.5.6): yıldızdan orijine (Güneş) akan ışık; süre 1,2 + 0,9·log10(1 + dly) sn (ölçekli değil).
 * Deep katmanında (ışık yılı). Üstündeki yıl sayacını çağıran taraf HTML ile yazar.
 */
export function createLightRay() {
  const pos = new Float32Array(6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: "#FFE7B0", transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
  const line = new THREE.Line(geo, mat);
  line.frustumCulled = false;
  line.renderOrder = 3;
  const from = new THREE.Vector3(), head = new THREE.Vector3();
  let t = 0, dur = 0, active = false;
  return {
    line,
    head,
    /** from: yıldız konumu (ışık yılı) */
    start(p: THREE.Vector3, dly: number) {
      from.copy(p); t = 0; dur = 1.2 + 0.9 * Math.log10(1 + dly); active = true;
      pos.set([p.x, p.y, p.z, p.x, p.y, p.z]);
      geo.attributes.position.needsUpdate = true;
    },
    stop() { active = false; mat.opacity = 0; },
    /** k: 0 → 1 ilerleme (yıl sayacı için); bitince 2 sn kalır, sonra söner. null: etkin değil */
    update(dt: number): number | null {
      if (!active) return null;
      t += dt;
      const k = Math.min(1, t / dur);
      head.copy(from).multiplyScalar(1 - k);
      pos[3] = head.x; pos[4] = head.y; pos[5] = head.z;
      geo.attributes.position.needsUpdate = true;
      mat.opacity = 0.85 * (1 - THREE.MathUtils.smoothstep(t, dur + 2, dur + 3));
      if (t > dur + 3) { active = false; mat.opacity = 0; return null; }
      return k;
    },
  };
}
