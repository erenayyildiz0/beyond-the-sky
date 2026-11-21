// SPEC §6.3 — jiroskop izni ve örnekleri. Yönelim verisi yalnızca bellekte; kaydedilmez, gönderilmez.
import * as THREE from "three";
import { headingToAlpha, orientationToQuaternion, wrap180 } from "../science/orientation";

export class Gyro {
  mode: "absolute" | "relative" | "off" = "off";
  enabled = false;                       // kullanıcı anahtarı (Jiroskop açık/kapalı)
  yawOffsetDeg = 0;                      // "Kuzeyi düzelt" (yatay sürükleme)
  q = new THREE.Quaternion();
  hasSample = false;
  private iosOffset: number | null = null;
  private last = { a: 0, b: 0, g: 0, s: 0 };

  /** iOS 13+: MUTLAKA kullanıcı dokunuşunun içinde çağır */
  async enable(): Promise<"absolute" | "relative" | "off"> {
    const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
    if (!DOE || !window.isSecureContext) return (this.mode = "off");
    if (typeof DOE.requestPermission === "function") {
      try { if ((await DOE.requestPermission()) !== "granted") return (this.mode = "off"); } catch { return (this.mode = "off"); }
    }
    const useAbs = "ondeviceorientationabsolute" in window;     // Android Chrome
    this.mode = useAbs ? "absolute" : "relative";
    window.addEventListener(useAbs ? "deviceorientationabsolute" : "deviceorientation", this.handler as EventListener, true);
    this.enabled = true;
    return this.mode;
  }

  private handler = (e: DeviceOrientationEvent) => {
    if (e.alpha == null || e.beta == null || e.gamma == null) return;
    let alpha = e.alpha;
    const heading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;   // iOS
    if (typeof heading === "number" && heading >= 0) {
      this.mode = "absolute";
      const off = e.alpha - headingToAlpha(heading);
      this.iosOffset = this.iosOffset == null ? off : this.iosOffset + 0.05 * wrap180(off - this.iosOffset);   // gürültüyü yumuşat
      alpha = e.alpha - this.iosOffset;
    }
    const so = (screen.orientation?.angle ?? (window as unknown as { orientation?: number }).orientation ?? 0) as number;
    this.last = { a: alpha, b: e.beta, g: e.gamma, s: so };
    this.hasSample = true;
    this.compute();
  };

  /** Son örnekten (yaw ofsetiyle) quaternion */
  compute() { orientationToQuaternion(this.last.a + this.yawOffsetDeg, this.last.b, this.last.g, this.last.s, this.q); return this.q; }

  get active() { return this.enabled && this.mode !== "off" && this.hasSample; }
}
