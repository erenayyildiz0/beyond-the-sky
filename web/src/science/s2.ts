// Sgr A* çevresindeki S2 yıldızının Kepler yörüngesi (GRAVITY Collaboration 2020, A&A 636, L5).
import { AU_KM, S2_ORBIT, SGRA_MASS_MSUN } from "./constants";

const DEG = Math.PI / 180;
const GM_SGR_M3_S2 = SGRA_MASS_MSUN * 1.3271244e20;

/** Eksantrik anomali E'den Sgr A* merkezli ICRS konum (AB), uzaklık (AB) ve hız (km/s). */
function fromEccentricAnomaly(E: number, raDeg: number, decDeg: number, distPc: number) {
  const { aArcsec, e, iDeg, OmegaDeg, omegaDeg } = S2_ORBIT;
  const a = aArcsec * distPc;
  const rAU = a * (1 - e * Math.cos(E));
  const nu = Math.atan2(Math.sqrt(1 - e * e) * Math.sin(E), Math.cos(E) - e);
  const u = omegaDeg * DEG + nu;
  const Om = OmegaDeg * DEG, inc = iDeg * DEG;
  const cu = Math.cos(u), su = Math.sin(u), cO = Math.cos(Om), sO = Math.sin(Om), ci = Math.cos(inc), si = Math.sin(inc);

  // Gök düzlemi (Ω kuzeyden doğuya) ve bakış doğrultusu (gözlemciden uzağa pozitif)
  const north = rAU * (cu * cO - su * sO * ci);
  const east = rAU * (cu * sO + su * cO * ci);
  const away = rAU * su * si;

  const alpha = raDeg * DEG, delta = decDeg * DEG;
  const ca = Math.cos(alpha), sa = Math.sin(alpha), cd = Math.cos(delta), sd = Math.sin(delta);
  const Ex = -sa, Ey = ca, Ez = 0;
  const Nx = -sd * ca, Ny = -sd * sa, Nz = cd;
  const Lx = cd * ca, Ly = cd * sa, Lz = sd;

  const icrsAU: [number, number, number] = [
    east * Ex + north * Nx + away * Lx,
    east * Ey + north * Ny + away * Ly,
    east * Ez + north * Nz + away * Lz,
  ];
  const rM = rAU * AU_KM * 1000, aM = a * AU_KM * 1000;
  const vKmS = Math.sqrt(GM_SGR_M3_S2 * (2 / rM - 1 / aM)) / 1000;
  return { icrsAU, rAU, vKmS };
}

/** Verilen kesirli yılda S2'nin Sgr A*'a göre ICRS konumu (AB), uzaklığı (AB) ve yörünge hızı (km/s). */
export function s2Position(yearFrac: number, raDeg: number, decDeg: number, distPc: number): {
  icrsAU: [number, number, number]; rAU: number; vKmS: number;
} {
  const { e, periodYr, tPeriYr } = S2_ORBIT;
  const M0 = 2 * Math.PI * (yearFrac - tPeriYr) / periodYr;
  const M = Math.atan2(Math.sin(M0), Math.cos(M0));
  let E = M === 0 ? 0 : M > 0 ? Math.PI : -Math.PI;
  for (let k = 0; k < 25; k++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-14) break;
  }
  return fromEccentricAnomaly(E, raDeg, decDeg, distPc);
}

/** Bir tam S2 yörüngesi (E: 0..2π, n nokta), Sgr A*'a göre ICRS AB. */
export function s2OrbitPoints(n: number, raDeg: number, decDeg: number, distPc: number): number[][] {
  const pts: number[][] = [];
  const denom = Math.max(1, n - 1);
  for (let k = 0; k < n; k++) {
    const E = (k / denom) * 2 * Math.PI;
    pts.push(fromEccentricAnomaly(E, raDeg, decDeg, distPc).icrsAU);
  }
  return pts;
}
