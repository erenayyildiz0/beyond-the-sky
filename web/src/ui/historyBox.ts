import { el, show } from "./hud";
import { annotateInto } from "./glossary";
import { t } from "./i18n";
import { fmtInt, type Lang } from "./format";
import { eventAgo, type HistoryEvent } from "../content/history";

/** Olayın tarihi: "1969", "MÖ ~2560", "~66 milyon yıl önce" */
export function historyDate(e: HistoryEvent, lang: Lang) {
  if (e.year != null) {
    const a = e.approx ? "~" : "";
    if (e.year > 0) return a + String(e.year);
    return lang === "tr" ? `MÖ ${a}${-e.year}` : `${a}${-e.year} BC`;
  }
  const n = e.ago!;
  const [v, u] = n >= 1e9 ? [n / 1e9, "bn"] : n >= 1e6 ? [n / 1e6, "mn"] : [n, ""];
  const num = u ? (Number.isInteger(+v.toFixed(2)) ? fmtInt(v, lang) : (+v.toFixed(2)).toLocaleString(lang === "tr" ? "tr-TR" : "en-US")) : fmtInt(n, lang);
  return t(u === "bn" ? "history.agoBn" : u === "mn" ? "history.agoMn" : "history.ago", { n: num });
}

/** Tek satırlık özet: "Apollo 11 Ay'a indi… (1969)" */
export const historyLine = (e: HistoryEvent, lang: Lang) => `${(lang === "tr" ? e.tr : e.en).replace(/\.$/, "")} (${historyDate(e, lang)})`;

/**
 * Tarih çapası kutusu (docs/EXTRAS.md T1): olay(lar)ın fotoğrafı, metni, emeği geçen/lisans ve kaynak bağlantıları.
 * Görseller yerel (public/data/history); kaynak bağlantıları yalnızca çevrimiçiyken.
 */
export class HistoryBox {
  private root: HTMLElement;
  private body: HTMLElement;

  constructor(parent: HTMLElement, private base: string) {
    this.root = el("div", "history-box", undefined, parent);
    const head = el("div", "history-head", undefined, this.root);
    el("div", "history-kicker", t("history.kicker"), head);
    el("button", "fly-small", t("card.close"), head).addEventListener("click", () => this.hide());
    this.body = el("div", "history-body", undefined, this.root);
    this.root.addEventListener("pointerdown", e => e.stopPropagation());
  }

  open(events: HistoryEvent[], lookback: number, obsYear: number, lang: Lang) {
    this.body.replaceChildren();
    for (const e of events) {
      const sec = el("div", "history-item", undefined, this.body);
      if (e.img) {
        const img = el("img", "history-img", undefined, sec);
        img.src = `${this.base}data/history/${e.img}.jpg`; img.alt = lang === "tr" ? e.tr : e.en; img.loading = "lazy";
        if (e.credit) el("div", "history-credit", e.credit, sec);
      }
      el("div", "history-date", historyDate(e, lang), sec);
      annotateInto(el("div", "history-text", undefined, sec), lang === "tr" ? e.tr : e.en);
      const gap = eventAgo(e, obsYear) - lookback;
      if (Math.abs(gap) >= 1) {
        const n = fmtInt(Math.abs(gap) >= 100 ? +Math.abs(gap).toPrecision(2) : Math.round(Math.abs(gap)), lang);
        el("div", "history-gap", t(gap > 0 ? "history.before" : "history.after", { n }), sec);
      }
      if (navigator.onLine) {
        const src = el("div", "pick-src", undefined, sec);
        e.sources.forEach((s, i) => {
          if (i) src.append(" · ");
          const a = el("a", "", s.title, src);
          a.href = s.url; a.target = "_blank"; a.rel = "noopener";
        });
      }
    }
    show(this.root);
  }
  hide() { show(this.root, false); }
  get visible() { return this.root.classList.contains("on"); }
}
