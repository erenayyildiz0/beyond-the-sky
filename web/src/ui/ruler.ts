import { Z_MAX, Z_MIN, type Stop } from "../science/flight";
import { el } from "./hud";
import { t } from "./i18n";

/** Ölçek cetveli (SPEC §6.5.6): sağ kenar, ekran yüksekliğinin %70'i, z doğrusal (alt = ev, üst = Andromeda). */
export class Ruler {
  root: HTMLElement;
  private cursor: HTMLElement;
  private marks: { stop: Stop; e: HTMLElement }[] = [];

  constructor(parent: HTMLElement, stops: Stop[], onGo: (s: Stop) => void) {
    this.root = el("div", "ruler", undefined, parent);
    el("div", "ruler-line", undefined, this.root);
    for (const s of stops) {
      const m = el("button", "ruler-mark", undefined, this.root);
      m.style.bottom = `${this.frac(s.z) * 100}%`;
      el("span", "ruler-tick", undefined, m);
      el("span", "ruler-name", t(`ruler.${s.key}`), m);
      m.addEventListener("click", () => onGo(s));
      this.marks.push({ stop: s, e: m });
    }
    this.cursor = el("div", "ruler-cursor", undefined, this.root);
  }

  private frac(z: number) { return (z - Z_MIN) / (Z_MAX - Z_MIN); }

  update(z: number) {
    this.cursor.style.bottom = `${this.frac(z) * 100}%`;
    for (const m of this.marks) m.e.classList.toggle("near", Math.abs(m.stop.z - z) < 0.18);
  }
}
