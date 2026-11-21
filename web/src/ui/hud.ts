/** Küçük DOM yardımcıları (UI framework yok, SPEC §4.1). */
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text?: string, parent?: HTMLElement) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  parent?.appendChild(e);
  return e;
}

export function show(e: HTMLElement, on = true) { e.classList.toggle("on", on); }

/** n dokunuşu ms içinde yakalar (ör. tarih satırına üç kez dokunma → bilim paneli). */
export function onMultiTap(e: HTMLElement, n: number, fn: () => void, ms = 600) {
  let times: number[] = [];
  e.addEventListener("pointerdown", () => {
    const now = performance.now();
    times = [...times.filter(t => now - t < ms), now];
    if (times.length >= n) { times = []; fn(); }
  });
}

export function progressRing(parent: HTMLElement, size = 88, stroke = 3) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.classList.add("ring");
  const mk = (cls: string) => {
    const k = document.createElementNS(ns, "circle");
    k.setAttribute("cx", String(size / 2)); k.setAttribute("cy", String(size / 2)); k.setAttribute("r", String(r));
    k.setAttribute("class", cls);
    svg.appendChild(k);
    return k;
  };
  mk("ring-bg");
  const fg = mk("ring-fg");
  fg.style.strokeDasharray = String(c);
  fg.style.strokeDashoffset = String(c);
  parent.appendChild(svg);
  return (p: number) => { fg.style.strokeDashoffset = String(c * (1 - p)); };
}
