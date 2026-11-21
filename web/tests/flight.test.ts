import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { prepareSky, type SkyJson } from "../src/app/assets";
import { T } from "../src/app/timeline";
import { C_KM_S, LY_KM } from "../src/science/constants";
import { dirFromAltAz, latLonToVec3 } from "../src/science/coords";
import {
  apparentMag, baseLook, cameraPosKm, earthWeight, exposureLimit, FlightControl, flightFrame, pathDir, routeFromSky,
  solarWeight, stopsFromSky, Z_MAX, Z_MIN,
} from "../src/science/flight";
import { fmtLightTime } from "../src/ui/format";

const sky = prepareSky(JSON.parse(readFileSync(fileURLToPath(new URL("../public/data/sky.json", import.meta.url)), "utf8")) as SkyJson);
const r = routeFromSky(sky);

describe("rota (SPEC §3.9)", () => {
  it("pathDir sürekli: 0,001 adımda ardışık kamera yönü açısı < 0,5°", () => {
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    let max = 0;
    pathDir(Z_MIN, r.U, r.uCas, r.uTarget, a);
    for (let z = Z_MIN + 0.001; z <= Z_MAX; z += 0.001) {
      pathDir(z, r.U, r.uCas, r.uTarget, b);
      max = Math.max(max, a.angleTo(b));
      a.copy(b);
    }
    expect(max * 180 / Math.PI).toBeLessThan(0.5);
  });
  it("bölümler: z ≤ 11 tepe, 13–15,75 û_cas, ≥ 16,6 hedef", () => {
    expect(pathDir(8, r.U, r.uCas, r.uTarget).angleTo(r.U)).toBeLessThan(1e-12);
    expect(pathDir(14, r.U, r.uCas, r.uTarget).angleTo(r.uCas)).toBeLessThan(1e-12);
    expect(pathDir(18, r.U, r.uCas, r.uTarget).angleTo(r.uTarget)).toBeLessThan(1e-12);
    expect(r.uCas.angleTo(dirFromAltAz(69.27, 5.25)) * 180 / Math.PI).toBeLessThan(0.1);
  });
  it("Achird z ≈ 14,26'da 0,97 ışık yılı yakından geçer", () => {
    const i = sky.stars.data.findIndex(x => x[7] === 3821);
    const P = dirFromAltAz(sky.starAlt[i], sky.starAz[i]).multiplyScalar(sky.starDly[i]!);
    let best = { z: 0, d: Infinity };
    for (let z = 13.5; z <= 15; z += 0.0005) {
      const C = cameraPosKm(z, pathDir(z, r.U, r.uCas, r.uTarget)).divideScalar(LY_KM);
      const d = C.distanceTo(P);
      if (d < best.d) best = { z, d };
    }
    expect(best.z).toBeCloseTo(14.26, 1);
    expect(Math.abs(best.d - 0.97)).toBeLessThan(0.05);
  });
  it("bakış quaternion'u: kalkışta aşağı bakar, kuzey ekranın üstünde", () => {
    const { q } = flightFrame(Z_MIN, "back", r);
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    expect(fwd.y).toBeCloseTo(-1, 9);
    expect(up.z).toBeCloseTo(-1, 9);                  // three.js −z = Kuzey
    for (const z of [11.5, 13, 16, 18.6]) {           // her yerde dik, birim
      const f = flightFrame(z, "forward", r);
      const u2 = new THREE.Vector3(0, 1, 0).applyQuaternion(f.q);
      const f2 = new THREE.Vector3(0, 0, -1).applyQuaternion(f.q);
      expect(Math.abs(u2.dot(f2))).toBeLessThan(1e-9);
      expect(f2.angleTo(pathDir(z, r.U, r.uCas, r.uTarget))).toBeLessThan(1e-9);
    }
  });
});

describe("bakış ve parlaklık (SPEC §3.8–§3.9)", () => {
  it("baseLook tablosu", () => {
    const cases: [number, string][] = [[5, "back"], [12.29, "back"], [12.3, "forward"], [15.89, "forward"], [15.9, "back"],
      [16.49, "back"], [16.5, "forward"], [17.8, "back"], [18.49, "back"], [18.5, "forward"], [19.3, "forward"]];
    for (const [z, l] of cases) expect(baseLook(z), `z=${z}`).toBe(l);
  });
  it("apparentMag ve exposureLimit", () => {
    expect(apparentMag(3.5, 19.4, 19.4)).toBeCloseTo(3.5, 12);
    expect(apparentMag(3.5, 19.4, 194)).toBeCloseTo(8.5, 12);
    expect(exposureLimit(15)).toBeCloseTo(6.62, 12);
    expect(exposureLimit(16.3)).toBeCloseTo(11.62, 12);
  });
  it("katman ağırlıkları uçlarda 0/1", () => {
    expect(earthWeight(5)).toBe(1); expect(earthWeight(7.5)).toBe(0);
    expect(solarWeight(5)).toBe(0); expect(solarWeight(8)).toBe(1); expect(solarWeight(12)).toBe(0);
  });
});

describe("duraklar ve ışık süresi (SPEC §3.10)", () => {
  const stops = Object.fromEntries(stopsFromSky(sky).map(s => [s.key, s.z]));
  const lt = (z: number) => fmtLightTime(10 ** z / C_KM_S);
  it("z değerleri", () => {
    expect(stops.earth).toBeCloseTo(4.398, 3);
    expect(stops.moon).toBeCloseTo(5.571, 3);
    expect(stops.sun).toBeCloseTo(8.169, 3);
    expect(stops.neptune).toBeCloseTo(9.644, 3);
    expect(stops.voyager).toBeCloseTo(10.413, 3);
    expect(stops.nearest).toBeCloseTo(13.604, 3);
    expect(stops.achird).toBeCloseTo(14.264, 3);
    expect(stops.cas).toBeCloseTo(15.334, 3);
    expect(stops.bubble).toBeCloseTo(16.206, 3);
    expect(stops.galaxy).toBeCloseTo(18.152, 3);
    expect(stops.m31).toBe(Z_MAX);
  });
  it("ışık sayacı", () => {
    expect(lt(stops.moon)).toBe("1,24 saniye");
    expect(lt(stops.sun)).toBe("8 dakika 12 saniye");
    expect(lt(stops.neptune)).toBe("4 saat 5 dakika");
    expect(lt(stops.voyager)).toBe("1 gün");
    expect(lt(stops.m31)).toBe("2,2 milyon yıl");
  });
});

describe("FlightControl (SPEC §6.5.3)", () => {
  const step = (fc: FlightControl, s: number, stops: number[] = [], dt = 1 / 60) => { for (let t = 0; t < s; t += dt) fc.update(dt, stops); };
  it("throttle 1 ile 1 sn sonra z artmış", () => {
    const fc = new FlightControl(); fc.throttle = 1; step(fc, 1);
    expect(fc.z).toBeGreaterThan(Z_MIN + 0.3);
  });
  it("Z_MAX'ı ve Z_MIN'i geçmiyor", () => {
    const fc = new FlightControl(); fc.throttle = 1; step(fc, 40);
    expect(fc.z).toBe(Z_MAX);
    fc.throttle = -1; step(fc, 40);
    expect(fc.z).toBe(Z_MIN);
  });
  it("durak yakınında hız düşük", () => {
    const a = new FlightControl(), b = new FlightControl();
    a.z = b.z = 8.169; a.throttle = b.throttle = 1;
    step(a, 0.3, []); step(b, 0.3, [8.169]);
    expect(Math.abs(b.z - 8.169)).toBeLessThan(T.act2.detentZ);   // b hâlâ durak penceresinde
    expect(Math.abs(b.v)).toBeLessThan(Math.abs(a.v) * T.act2.detentFactor + 1e-3);
  });
  it("goTo süresinde hedefe varıyor", () => {
    const fc = new FlightControl();
    fc.goTo(14.264);
    step(fc, T.act2.flyToS + 0.05);
    expect(fc.z).toBeCloseTo(14.264, 9);
    expect(fc.flying).toBe(false);
  });
});

describe("Dünya dokusu yönü (SPEC §3.1)", () => {
  it("latLonToVec3 ile SphereGeometry UV eşlemesi aynı", () => {
    const g = new THREE.SphereGeometry(1, 72, 36);
    const pos = g.getAttribute("position"), uv = g.getAttribute("uv");
    for (let i = 0; i < pos.count; i += 37) {
      const u = uv.getX(i), v = uv.getY(i);
      if (v < 0.01 || v > 0.99) continue;                     // kutuplarda boylam tanımsız
      const lat = (v - 0.5) * 180, lon = u * 360 - 180;
      const p = latLonToVec3(lat, lon);
      expect(p.distanceTo(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)))).toBeLessThan(1e-6);
    }
  });
});
