import { findTerms, type Term } from "../content/glossary";
import { getLang } from "./i18n";

let pop: HTMLElement | null = null;
let popFor: HTMLElement | null = null;

function closePop() { pop?.classList.remove("on"); popFor = null; }

function openPop(anchor: HTMLElement, term: Term) {
  if (!pop) {
    pop = document.createElement("div");
    pop.className = "glossary-pop";
    pop.setAttribute("role", "tooltip");
    document.body.appendChild(pop);
    // Başka bir yere dokununca kapanır (yakalama evresinde: canvas'ın dokunuşu da kapatır)
    document.addEventListener("pointerdown", e => { if (popFor && e.target !== popFor && !pop!.contains(e.target as Node)) closePop(); }, true);
    window.addEventListener("resize", closePop);
  }
  if (popFor === anchor) { closePop(); return; }
  popFor = anchor;
  pop.textContent = term.def[getLang()];
  pop.classList.add("on");
  const r = anchor.getBoundingClientRect(), W = innerWidth, H = innerHeight;
  const w = Math.min(320, W - 24);
  pop.style.width = `${w}px`;
  pop.style.left = `${Math.max(12, Math.min(W - w - 12, r.left + r.width / 2 - w / 2))}px`;
  const below = r.bottom + 8, ph = pop.offsetHeight;
  pop.style.top = `${below + ph < H - 8 ? below : Math.max(8, r.top - ph - 8)}px`;
}

/**
 * Metni öğeye yazar; sözlükteki terimler (ilk geçtikleri yerde) noktalı altı çizili ve dokunulabilir olur.
 * Metin değişmediyse dokunmaz (her karede çağrılabilir).
 */
export function annotateInto(e: HTMLElement & { _gl?: string }, text: string) {
  const key = `${getLang()}|${text}`;
  if (e._gl === key) return;
  e._gl = key;
  const hits = findTerms(text, getLang());
  if (!hits.length) { e.textContent = text; return; }
  const frag = document.createDocumentFragment();
  let i = 0;
  for (const h of hits) {
    if (h.start > i) frag.append(text.slice(i, h.start));
    const s = document.createElement("span");
    s.className = "term";
    s.textContent = text.slice(h.start, h.end);
    s.tabIndex = 0;
    s.addEventListener("pointerdown", ev => ev.stopPropagation());
    s.addEventListener("click", ev => { ev.stopPropagation(); openPop(s, h.term); });
    s.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openPop(s, h.term); } });
    frag.append(s);
    i = h.end;
  }
  if (i < text.length) frag.append(text.slice(i));
  e.replaceChildren(frag);
}

/** Durak adı gibi kısa metinler için yalnızca açıklama (fareyle üzerine gelince) */
export function termTitle(text: string) {
  const h = findTerms(text, getLang())[0];
  return h ? h.term.def[getLang()] : "";
}
