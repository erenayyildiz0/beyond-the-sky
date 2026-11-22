/**
 * Hareket ve performans ayarları (SPEC §6.10).
 * - prefers-reduced-motion: boşta nefes yok, kalkış ve dönüş kısa, uçuş (goTo) süreleri yarıya iner; yalnızca yumuşak geçişler.
 * - Düşük performans: Perde 1'in ilk 2 saniyesinde ortalama fps 40'ın altındaysa DPR 1 ve galaksilerde telefon sayıları.
 */
export const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Uçuş ve otomatik dönüş süreleri için çarpan */
export const motionScale = () => (reducedMotion() ? 0.5 : 1);

export const PERF = { low: false, measured: false };
const isPhone = () => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
/** Galaksi, Yerel Grup ve kozmik ağ parçacıkları için "telefon" sayıları */
export const lightGeometry = () => isPhone() || PERF.low;

/** Perde 1'in ilk 2 saniyesi: kare sayısı ve süre birikir; bitince bir kez karar verilir */
export class FpsProbe {
  private t = 0;
  private n = 0;
  /** dt: kare süresi (sn). Karar verildiyse true (yalnızca bir kez) */
  step(dt: number): boolean {
    if (PERF.measured) return false;
    this.t += dt; this.n++;
    if (this.t < 2) return false;
    PERF.measured = true;
    PERF.low = this.n / this.t < 40;
    return true;
  }
}
