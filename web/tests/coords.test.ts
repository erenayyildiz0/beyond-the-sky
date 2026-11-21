import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { altAzFromDir, dirFromAltAz, earthQuaternionFor, enuToThree, latLonToVec3 } from "../src/science/coords";
import { frameSkyCamera } from "../src/app/look";

const close = (v: THREE.Vector3, x: number, y: number, z: number, eps = 1e-9) => {
  expect(v.x).toBeCloseTo(x, 9); expect(v.y).toBeCloseTo(y, 9); expect(v.z).toBeCloseTo(z, 9);
  expect(v.distanceTo(new THREE.Vector3(x, y, z))).toBeLessThan(eps + 1e-12);
};

describe("coords (SPEC §3.1)", () => {
  it("dirFromAltAz yönleri", () => {
    close(dirFromAltAz(0, 0), 0, 0, -1);      // kuzey
    close(dirFromAltAz(0, 90), 1, 0, 0);      // doğu
    close(dirFromAltAz(0, 180), 0, 0, 1);
    close(dirFromAltAz(0, 270), -1, 0, 0);
    close(dirFromAltAz(90, 123), 0, 1, 0);
  });

  it("ileri-geri dönüşüm", () => {
    for (let alt = -85; alt <= 85; alt += 17) {
      for (let az = 3; az < 360; az += 29) {
        const r = altAzFromDir(dirFromAltAz(alt, az));
        expect(Math.abs(r.altDeg - alt)).toBeLessThan(1e-9);
        expect(Math.abs(r.azDeg - az)).toBeLessThan(1e-9);
      }
    }
  });

  it("enuToThree", () => {
    close(enuToThree(1, 0, 0), 1, 0, 0);
    close(enuToThree(0, 1, 0), 0, 0, -1);
    close(enuToThree(0, 0, 1), 0, 1, 0);
  });

  it("Dünya yönelimi: Ankara yukarıda, kuzey kutbu −z tarafında", () => {
    const q = earthQuaternionFor(39.9208, 32.8541);
    const ank = latLonToVec3(39.9208, 32.8541).applyQuaternion(q);
    close(ank, 0, 1, 0, 1e-9);
    const np = latLonToVec3(90, 0).applyQuaternion(q);
    expect(np.x).toBeCloseTo(0, 4); expect(np.y).toBeCloseTo(0.6417, 4); expect(np.z).toBeCloseTo(-0.7669, 4);
    const east = latLonToVec3(39.9208, 33.8541).applyQuaternion(q);
    expect(east.x).toBeGreaterThan(0);
  });

  it("kadraj: vFOV 60 → alt0 ≈ 19,1°, vFOV 90 → ≈ 31,0°", () => {
    const view = { az_deg: 80, horizon_screen_y: 0.8, vfov_landscape_deg: 60, vfov_portrait_deg: 90 };
    const cam = new THREE.PerspectiveCamera();
    expect(frameSkyCamera(cam, 1920, 1080, view)).toBeCloseTo(19.1, 1);
    expect(frameSkyCamera(cam, 1080, 1920, view)).toBeCloseTo(31.0, 1);
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    expect(altAzFromDir(dir).azDeg).toBeCloseTo(80, 6);
  });
});
