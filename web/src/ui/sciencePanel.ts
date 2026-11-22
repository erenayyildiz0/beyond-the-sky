import type { AppContext, Tunables } from "../app/director";
import { el } from "./hud";

type Slider = { key: keyof Tunables; min: number; max: number; step: number };
const SLIDERS: Slider[] = [
  { key: "uBaseSize", min: 0.5, max: 4, step: 0.05 },
  { key: "uMaxSize", min: 2, max: 20, step: 0.5 },
  { key: "uFlyByMax", min: 8, max: 64, step: 1 },
  { key: "uRefMag", min: 3, max: 8, step: 0.1 },
  { key: "uIntensity", min: 0.2, max: 3, step: 0.05 },
  { key: "uMWGain", min: 0, max: 4, step: 0.05 },
  { key: "sqmCity", min: 16, max: 21, step: 0.1 },
  { key: "extinctionK", min: 0, max: 0.6, step: 0.01 },
  { key: "vMax", min: 0.1, max: 3, step: 0.05 },
  { key: "galaxySize", min: 0.5, max: 4, step: 0.1 },
];

/** Bilim paneli (SPEC §6.9): göstergeler + canlı kaydırıcılar + "Değerleri kopyala". */
export class SciencePanel {
  private root: HTMLElement;
  private stats: HTMLElement;
  private frames = 0; private acc = 0; fps = 0;
  private lastUpdate = 0;
  visible = false;

  constructor(private ctx: AppContext, parent: HTMLElement) {
    this.root = el("div", "science", undefined, parent);
    el("div", "science-title", "Bilim paneli (D)", this.root);
    this.stats = el("pre", "science-stats", "", this.root);
    const form = el("div", "science-sliders", undefined, this.root);
    for (const s of SLIDERS) {
      const row = el("label", "science-row", undefined, form);
      el("span", "", s.key, row);
      const inp = el("input", "", undefined, row);
      inp.type = "range"; inp.min = String(s.min); inp.max = String(s.max); inp.step = String(s.step);
      inp.value = String(ctx.tune[s.key]);
      const val = el("span", "science-val", String(ctx.tune[s.key]), row);
      inp.addEventListener("input", () => {
        (ctx.tune[s.key] as number) = +inp.value;
        val.textContent = inp.value;
      });
    }
    const names = el("label", "science-row", undefined, form);
    const cb = el("input", "", undefined, names);
    cb.type = "checkbox"; cb.checked = ctx.tune.showNames;
    cb.addEventListener("change", () => { ctx.tune.showNames = cb.checked; });
    el("span", "", "İsimleri göster", names);
    const reset = el("button", "science-copy", "Görevleri sıfırla", this.root);     // SPEC §6.12 (sayfa yenilenince)
    reset.addEventListener("click", () => { try { localStorage.removeItem("bts.missions"); reset.textContent = "Sıfırlandı (yenile)"; } catch { /* özel mod */ } });
    const copy = el("button", "science-copy", "Değerleri kopyala", this.root);
    copy.addEventListener("click", async () => {
      const json = JSON.stringify(ctx.tune, null, 2);
      try { await navigator.clipboard.writeText(json); copy.textContent = "Kopyalandı"; }
      catch { console.log(json); copy.textContent = "Konsola yazıldı"; }
      setTimeout(() => { copy.textContent = "Değerleri kopyala"; }, 1500);
    });
    this.root.addEventListener("pointerdown", e => e.stopPropagation());
    this.set(ctx.params.debug);
  }

  set(on: boolean) { this.visible = on; this.root.classList.toggle("on", on); }
  toggle() { this.set(!this.visible); }

  update(dt: number, now: number) {
    this.frames++; this.acc += dt;
    if (this.acc >= 0.5) { this.fps = this.frames / this.acc; this.frames = 0; this.acc = 0; }
    if (!this.visible || now - this.lastUpdate < 250) return;
    this.lastUpdate = now;
    const r = this.ctx.renderer, m = this.ctx.assets.sky.meta;
    const lines: [string, string | number][] = [
      ["fps", this.fps.toFixed(0)],
      ["DPR", r.getPixelRatio()],
      ["maxTextureSize", r.capabilities.maxTextureSize],
      ["doku", `Samanyolu ${this.ctx.assets.variant.milkyWay}`],
      ["durum", this.ctx.director.state],
      ...Object.entries(this.ctx.debug),
      ["zaman", m.time_local],
      ["konum", `${m.location.name} ${m.location.lat}°, ${m.location.lon}°`],
      ["Ay", `alt ${m.moon.alt}° · %${Math.round(m.moon.illum * 100)}`],
    ];
    this.stats.textContent = lines.map(([k, v]) => `${k.padEnd(14)} ${v}`).join("\n");
  }
}
