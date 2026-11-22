import { Z_MIN, type Stop } from "../science/flight";
import { el, show } from "./hud";
import { t } from "./i18n";
import { termTitle } from "./glossary";

/**
 * Ölçek cetveli (SPEC §6.5.6): sağ kenar, ekran yüksekliğinin %70'i, z doğrusal (alt = ev, üst = en uzak durak).
 * Durak işaretine dokununca o durağa; şeridin herhangi bir yerine dokununca ya da imleci sürükleyince o uzaklığa uçulur.
 * Sürüklerken hayalet imleç ve uzaklık etiketi gösterilir; bırakınca uçuş başlar.
 */
export class Ruler {
  root: HTMLElement;
  private cursor: HTMLElement;
  private ghost: HTMLElement;
  private ghostLabel: HTMLElement;
  private track: HTMLElement;
  private marks: { stop: Stop; e: HTMLElement }[] = [];
  private zMax: number;
  private dragging = false;

  constructor(parent: HTMLElement, stops: Stop[], onGo: (s: Stop) => void,
              private onScrub: (z: number) => void = () => {}, private describe: (z: number) => string = () => "") {
    this.zMax = Math.max(...stops.map(s => s.z)) + 0.05;
    this.root = el("div", "ruler", undefined, parent);
    el("div", "ruler-line", undefined, this.root);
    this.track = el("div", "ruler-track", undefined, this.root);
    this.track.setAttribute("role", "slider");
    this.track.setAttribute("aria-label", t("ruler.scrub"));
    let prev = -1, nudge = 0;
    for (const s of [...stops].sort((a, b) => a.z - b.z)) {
      const m = el("button", "ruler-mark", undefined, this.root);
      const f = this.frac(s.z);
      m.style.bottom = `${f * 100}%`;
      nudge = f - prev < 0.03 ? (nudge >= 0 ? -1 : 1) : 0;   // yakın duraklar: adları yukarı/aşağı kaydır
      if (nudge) m.style.setProperty("--nudge", `${nudge * 11}px`);
      prev = f;
      el("span", "ruler-tick", undefined, m);
      el("span", "ruler-name", t(`ruler.${s.key}`), m);
      const tip = termTitle(t(`ruler.${s.key}`));
      if (tip) m.title = tip;
      m.addEventListener("click", () => onGo(s));
      this.marks.push({ stop: s, e: m });
    }
    this.cursor = el("div", "ruler-cursor", undefined, this.root);
    this.ghost = el("div", "ruler-ghost", undefined, this.root);
    this.ghostLabel = el("div", "ruler-ghost-label", "", this.ghost);
    // Şerit ve imleç: dokun ya da sürükle
    const zAt = (y: number) => {
      const r = this.track.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (r.bottom - y) / r.height));
      return Z_MIN + f * (this.zMax - Z_MIN);
    };
    const move = (y: number) => {
      const z = zAt(y);
      this.ghost.style.bottom = `${this.frac(z) * 100}%`;
      this.ghostLabel.textContent = this.describe(z);
      return z;
    };
    const down = (e: PointerEvent) => {
      e.preventDefault(); e.stopPropagation();
      this.dragging = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      move(e.clientY); show(this.ghost);
    };
    const mv = (e: PointerEvent) => { if (this.dragging) move(e.clientY); };
    const up = (e: PointerEvent) => {
      if (!this.dragging) return;
      this.dragging = false; show(this.ghost, false);
      const z = move(e.clientY);
      // Bir durağın çentiğine ~5 px yakınsa o durağa (konum ve bakışıyla) git
      const px = this.track.getBoundingClientRect().height / (this.zMax - Z_MIN);
      const near = this.marks.reduce((b, m) => (Math.abs(m.stop.z - z) < Math.abs(b.stop.z - z) ? m : b));
      if (Math.abs(near.stop.z - z) * px < 5) onGo(near.stop); else this.onScrub(z);
    };
    for (const h of [this.track, this.cursor]) {
      h.addEventListener("pointerdown", down);
      h.addEventListener("pointermove", mv);
      h.addEventListener("pointerup", up);
      h.addEventListener("pointercancel", () => { this.dragging = false; show(this.ghost, false); });
    }
  }

  private frac(z: number) { return Math.min(1, Math.max(0, (z - Z_MIN) / (this.zMax - Z_MIN))); }

  update(z: number) {
    this.cursor.style.bottom = `${this.frac(z) * 100}%`;
    for (const m of this.marks) m.e.classList.toggle("near", Math.abs(m.stop.z - z) < 0.18);
  }
}
