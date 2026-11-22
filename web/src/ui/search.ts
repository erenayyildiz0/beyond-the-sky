import { el, iconButton, show } from "./hud";
import { t } from "./i18n";

const GREEK: Record<string, string> = {
  α: "alpha", β: "beta", γ: "gamma", δ: "delta", ε: "epsilon", ζ: "zeta", η: "eta", θ: "theta", ι: "iota", κ: "kappa",
  λ: "lambda", μ: "mu", ν: "nu", ξ: "xi", ο: "omicron", π: "pi", ρ: "rho", σ: "sigma", τ: "tau", υ: "upsilon", φ: "phi",
  χ: "chi", ψ: "psi", ω: "omega", ϑ: "theta", ϕ: "phi",
};

/** Arama katlaması (SPEC §6.12): küçük harf, Türkçe ve aksan katlama, Yunan harfleri Latin adlarıyla; üst simgeler rakam olur. */
export function fold(s: string) {
  return s.toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, c => String("⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c)))
    .replace(/([α-ωϑϕ])(\d?)/g, (_, c: string, d: string) => `${GREEK[c] ?? c}${d} `)      // γ² → "gamma2"
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

export interface SearchEntry { key: string; name: string; mag: number }

/** En fazla n sonuç: önce adın başıyla eşleşenler, sonra herhangi bir kelimenin başı, sonra içerenler; her grupta parlaklığa göre */
export function searchNames(entries: { e: SearchEntry; f: string }[], query: string, n = 8): SearchEntry[] {
  const q = fold(query);
  if (!q) return [];
  const rank = (f: string) => (f.startsWith(q) ? 0 : f.includes(` ${q}`) ? 1 : f.includes(q) ? 2 : 3);
  return entries.map(x => ({ x, r: rank(x.f) })).filter(o => o.r < 3)
    .sort((a, b) => a.r - b.r || a.x.e.mag - b.x.e.mag).slice(0, n).map(o => o.x.e);
}

/** Arama paneli (🔍 Ara): yazdıkça en fazla 8 sonuç; sonuca dokununca onPick */
export class SearchPanel {
  readonly button: HTMLButtonElement;
  private panel: HTMLElement;
  private input: HTMLInputElement;
  private list: HTMLElement;
  private index: { e: SearchEntry; f: string }[];
  onPick: (key: string) => void = () => {};
  onOpen: () => void = () => {};

  constructor(bar: HTMLElement, root: HTMLElement, entries: SearchEntry[]) {
    this.index = entries.map(e => ({ e, f: fold(e.name) }));
    this.button = iconButton(bar, "🔍", t("explore.search"));
    this.panel = el("div", "search-panel", undefined, root);
    this.input = el("input", "search-input", undefined, this.panel);
    this.input.type = "search"; this.input.placeholder = t("explore.search"); this.input.autocomplete = "off";
    this.list = el("div", "search-list", undefined, this.panel);
    this.button.addEventListener("click", () => (this.open ? this.close() : this.show()));
    this.input.addEventListener("input", () => this.render());
    this.input.addEventListener("keydown", e => {
      e.stopPropagation();                                    // ok tuşları uçuşu sürmesin
      if (e.key === "Escape") this.close();
      if (e.key === "Enter") (this.list.firstElementChild as HTMLButtonElement | null)?.click();
    });
    this.input.addEventListener("keyup", e => e.stopPropagation());
    this.panel.addEventListener("pointerdown", e => e.stopPropagation());
  }

  get open() { return this.panel.classList.contains("on"); }
  close() { show(this.panel, false); this.input.blur(); }
  private show() { this.onOpen(); show(this.panel); this.input.value = ""; this.render(); this.input.focus(); }

  private render() {
    this.list.replaceChildren(...searchNames(this.index, this.input.value).map(e => {
      const b = el("button", "jump-item", e.name);
      b.addEventListener("click", () => { this.close(); this.onPick(e.key); });
      return b;
    }));
  }
}
