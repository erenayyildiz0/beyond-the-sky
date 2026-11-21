import * as THREE from "three";

/** Tek WebGLRenderer (SPEC §6.2). Oluşturulamazsa null döner (WebGL yok). */
export function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer | null {
  try {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.autoClear = false;                          // Perde 2 katmanları için (§6.5)
    r.setClearColor(0x000000, 1);
    r.setSize(innerWidth, innerHeight, false);
    return r;
  } catch {
    return null;
  }
}
