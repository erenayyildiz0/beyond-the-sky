import { el, show } from "./hud";
import { t } from "./i18n";

export interface PickInfo {
  title: string; subtitle?: string; lines: string[]; fly: "here" | "home" | null;
  /** Merak notu (SPEC §8.2) ve kaynakları; bağlantılar yalnızca çevrimiçiyken */
  note?: { text: string; sources: { title: string; url: string }[] };
  footer?: string;
  /** "Işığını izle" düğmesi (uzaklığı bilinen yıldızlar) */
  trace?: boolean;
  /** Dokunulabilir satırlar (ör. tarih çapası: "Işığı yola çıktığında: …") */
  links?: { text: string; onClick: () => void }[];
}

/** Dokunulan cismin kartı (SPEC §6.12): başlık, §3.16 satırları, merak notu; Buraya uç · Işığını izle · Kapat. */
export class PickCard {
  private root: HTMLElement;
  private title: HTMLElement;
  private sub: HTMLElement;
  private body: HTMLElement;
  private note: HTMLElement;
  private links: HTMLElement;
  private foot: HTMLElement;
  private fly: HTMLButtonElement;
  private trace: HTMLButtonElement;
  onFly: () => void = () => {};
  onTrace: () => void = () => {};
  onClose: () => void = () => {};

  constructor(parent: HTMLElement) {
    this.root = el("div", "pick-card", undefined, parent);
    this.title = el("div", "pick-title", "", this.root);
    this.sub = el("div", "pick-sub", "", this.root);
    this.body = el("div", "pick-body", "", this.root);
    this.links = el("div", "pick-links", "", this.root);
    this.note = el("div", "pick-note", "", this.root);
    this.foot = el("div", "pick-foot", "", this.root);
    const row = el("div", "pick-actions", undefined, this.root);
    this.fly = el("button", "pick-fly", t("card.flyHere"), row);
    this.trace = el("button", "", t("card.traceLight"), row);
    const close = el("button", "pick-close", t("card.close"), row);
    this.fly.addEventListener("click", () => { this.hide(); this.onFly(); });
    this.trace.addEventListener("click", () => this.onTrace());
    close.addEventListener("click", () => { this.hide(); this.onClose(); });
    this.root.addEventListener("pointerdown", e => e.stopPropagation());
  }

  open(info: PickInfo) {
    this.title.textContent = info.title;
    this.sub.textContent = info.subtitle ?? "";
    this.sub.style.display = info.subtitle ? "" : "none";
    this.body.replaceChildren(...info.lines.map(l => el("div", "", l)));
    this.links.replaceChildren(...(info.links ?? []).map(l => {
      const b = el("button", "pick-link", `${l.text} ›`);
      b.addEventListener("click", l.onClick);
      return b;
    }));
    this.links.style.display = info.links?.length ? "" : "none";
    this.note.replaceChildren();
    if (info.note) {
      el("div", "", info.note.text, this.note);
      if (navigator.onLine) {
        const src = el("div", "pick-src", undefined, this.note);
        info.note.sources.forEach((s, i) => {
          if (i) src.append(" · ");
          const a = el("a", "", s.title, src);
          a.href = s.url; a.target = "_blank"; a.rel = "noopener";
        });
      }
    }
    this.note.style.display = info.note ? "" : "none";
    this.foot.textContent = info.footer ?? "";
    this.foot.style.display = info.footer ? "" : "none";
    this.fly.textContent = info.fly === "home" ? t("card.goHome") : t("card.flyHere");
    this.fly.style.display = info.fly ? "" : "none";
    this.trace.style.display = info.trace ? "" : "none";
    show(this.root);
  }
  hide() { show(this.root, false); }
  get visible() { return this.root.classList.contains("on"); }
}
