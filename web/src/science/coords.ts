import * as THREE from "three";

export const DEG = Math.PI / 180;

/** Pipeline'dan gelen her ENU vektörü yalnızca bu fonksiyonla çevrilir (SPEC §3.1). */
export const enuToThree = (e: number, n: number, u: number, out = new THREE.Vector3()) => out.set(e, u, -n);

export function dirFromAltAz(altDeg: number, azDeg: number, out = new THREE.Vector3()) {
  const alt = altDeg * DEG, az = azDeg * DEG;
  return out.set(Math.cos(alt) * Math.sin(az), Math.sin(alt), -Math.cos(alt) * Math.cos(az));
}

export function altAzFromDir(d: THREE.Vector3) {
  const alt = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
  let az = Math.atan2(d.x, -d.z);
  if (az < 0) az += 2 * Math.PI;
  return { altDeg: alt / DEG, azDeg: az / DEG };
}

export function latLonToVec3(latDeg: number, lonDeg: number, r = 1, out = new THREE.Vector3()) {
  const lat = latDeg * DEG, lon = lonDeg * DEG;
  return out.set(r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), -r * Math.cos(lat) * Math.sin(lon));
}

/** Dünya modelini döndürür: (lat, lon) noktası +y'ye (yukarı), oranın kuzeyi −z'ye düşer. */
export function earthQuaternionFor(latDeg: number, lonDeg: number, out = new THREE.Quaternion()) {
  const a = latDeg * DEG, o = lonDeg * DEG;
  const up = latLonToVec3(latDeg, lonDeg);
  const north = new THREE.Vector3(-Math.sin(a) * Math.cos(o), Math.cos(a), Math.sin(a) * Math.sin(o));
  const east = new THREE.Vector3().crossVectors(north, up);
  const south = north.clone().negate();
  const m = new THREE.Matrix4().makeBasis(east, up, south).transpose();
  return out.setFromRotationMatrix(m);
}
