import { el, show } from "./hud";

/** Durak kartı (SPEC §6.5.6): alt-ortada başlık + 1–2 satır. */
export class StopCard {
  private root: HTMLElement;
  private title: HTMLElement;
  private text: HTMLElement;
  private key: string | null = null;
  constructor(parent: HTMLElement) {
    this.root = el("div", "stop-card", undefined, parent);
    this.title = el("div", "stop-title", "", this.root);
    this.text = el("div", "stop-text poem", "", this.root);
  }
  /** key değişince içerik yenilenir; null gizler */
  get visible() { return this.root.classList.contains("on"); }
  set(key: string | null, title = "", text = "") {
    if (key === this.key) return;
    this.key = key;
    if (key) { this.title.textContent = title; this.text.textContent = text; }
    show(this.root, key != null);
  }
}
