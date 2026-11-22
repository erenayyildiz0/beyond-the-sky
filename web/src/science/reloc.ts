// E1 taşıma dönmesi (cihaz konumu): Ankara ENU → yeni ENU. Yalnızca bellekte; ikili veri dosyaları yüklenirken uygulanır.
export type Mat3 = number[][];
export const apply = (m: Mat3, v: number[]) => [0, 1, 2].map(i => m[i][0] * v[0] + m[i][1] * v[1] + m[i][2] * v[2]);
/** null: Ankara (pipeline konumu), dokunma */
export const RELOC: { R: Mat3 | null } = { R: null };
/** stride'lı Float32 dizisinin ilk üç bileşenini (x, y, z) döndür */
export function rotateFloat32(buf: Float32Array, stride: number, count: number, R: Mat3) {
  for (let i = 0; i < count; i++) {
    const k = i * stride, v = apply(R, [buf[k], buf[k + 1], buf[k + 2]]);
    buf[k] = v[0]; buf[k + 1] = v[1]; buf[k + 2] = v[2];
  }
}
