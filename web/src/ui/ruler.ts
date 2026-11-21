import { Z_MIN, type Stop } from "../science/flight";
import { el } from "./hud";
import { t } from "./i18n";

/** Ölçek cetveli (SPEC §6.5.6): sağ kenar, ekran yüksekliğinin %70'i, z doğrusal (alt = ev, üst = Andromeda). */
export class Ruler {
  root: HTMLElement;
  private cursor: HTMLElement;
  private marks: { stop: Stop; e: HTMLElement }[] = [];

  private zMax: number;

  constructor(parent: HTMLElement, stops: Stop[], onGo: (s: Stop) => void) {
    this.zMax = Math.max(...stops.map(s => s.z)) + 0.05;
    this.root = el("div", "ruler", undefined, parent);
    el("div", "ruler-line", undefined, this.root);
    let prev = -1, nudge = 0;
    for (const s of stops) {
      const m = el("button", "ruler-mark", undefined, this.root);
      const f = this.frac(s.z);
      m.style.bottom = `${f * 100}%`;
      nudge = f - prev < 0.03 ? (nudge >= 0 ? -1 : 1) : 0;   // yakın duraklar: adları yukarı/aşağı kaydır
      if (nudge) m.style.setProperty("--nudge", `${nudge * 11}px`);
      prev = f;
      el("span", "ruler-tick", undefined, m);
      el("span", "ruler-name", t(`ruler.${s.key}`), m);
      m.addEventListener("click", () => onGo(s));
      this.marks.push({ stop: s, e: m });
    }
    this.cursor = el("div", "ruler-cursor", undefined, this.root);
  }

  private frac(z: number) { return Math.min(1, Math.max(0, (z - Z_MIN) / (this.zMax - Z_MIN))); }

  update(z: number) {
    this.cursor.style.bottom = `${this.frac(z) * 100}%`;
    for (const m of this.marks) m.e.classList.toggle("near", Math.abs(m.stop.z - z) < 0.18);
  }
}
