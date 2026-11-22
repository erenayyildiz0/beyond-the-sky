import { el, iconButton, show } from "./hud";
import { t } from "./i18n";

export interface JumpItem { key: string; label: string }

/** Git menüsü (SPEC §6.12): sabit liste; seçilince kapanır. Liste her açılışta yeniden kurulur ("Senin yıldızın" sonradan gelir). */
export class JumpMenu {
  readonly button: HTMLButtonElement;
  private panel: HTMLElement;
  onPick: (key: string) => void = () => {};

  constructor(bar: HTMLElement, root: HTMLElement, private items: () => JumpItem[]) {
    this.button = iconButton(bar, "☰", t("explore.jump"));
    this.panel = el("div", "jump-menu", undefined, root);
    this.button.addEventListener("click", () => (this.open ? this.close() : this.show()));
    this.panel.addEventListener("pointerdown", e => e.stopPropagation());
  }

  get open() { return this.panel.classList.contains("on"); }
  close() { show(this.panel, false); }

  private show() {
    this.panel.replaceChildren(...this.items().map(it => {
      const b = el("button", "jump-item", it.label);
      b.addEventListener("click", () => { this.close(); this.onPick(it.key); });
      return b;
    }));
    show(this.panel);
  }
}
