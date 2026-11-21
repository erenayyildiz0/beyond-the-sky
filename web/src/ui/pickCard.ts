import { el, show } from "./hud";
import { t } from "./i18n";

export interface PickInfo { title: string; lines: string[]; fly: "here" | "home" | null }

/** Dokunulan cisim için küçük kart (tam §3.16 kartları Keşif'te). */
export class PickCard {
  private root: HTMLElement;
  private title: HTMLElement;
  private body: HTMLElement;
  private fly: HTMLButtonElement;
  onFly: () => void = () => {};
  onClose: () => void = () => {};

  constructor(parent: HTMLElement) {
    this.root = el("div", "pick-card", undefined, parent);
    this.title = el("div", "pick-title", "", this.root);
    this.body = el("div", "pick-body", "", this.root);
    const row = el("div", "pick-actions", undefined, this.root);
    this.fly = el("button", "pick-fly", t("card.flyHere"), row);
    const close = el("button", "pick-close", t("card.close"), row);
    this.fly.addEventListener("click", () => { this.hide(); this.onFly(); });
    close.addEventListener("click", () => { this.hide(); this.onClose(); });
    this.root.addEventListener("pointerdown", e => e.stopPropagation());
  }

  open(info: PickInfo) {
    this.title.textContent = info.title;
    this.body.replaceChildren(...info.lines.map(l => el("div", "", l)));
    this.fly.textContent = info.fly === "home" ? t("card.goHome") : t("card.flyHere");
    this.fly.style.display = info.fly ? "" : "none";
    show(this.root);
  }
  hide() { show(this.root, false); }
  get visible() { return this.root.classList.contains("on"); }
}
