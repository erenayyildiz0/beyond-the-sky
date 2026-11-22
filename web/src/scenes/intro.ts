import type * as THREE from "three";
import type { AppContext, Scene } from "../app/director";
import type { Action } from "../app/input";
import { fmtDate, fmtTime } from "../ui/format";
import { el, show } from "../ui/hud";
import { getLang, setLang, t } from "../ui/i18n";
import { Drone } from "../audio/drone";
import { requestWakeLock } from "../app/wakeLock";

/** INTRO (SPEC §6.7): siyah ekran, yer/tarih, "Başını kaldır.", "Başla". Jiroskop ve ses M6'da. */
export class Intro implements Scene {
  private root!: HTMLElement;
  private ctx!: AppContext;

  enter(ctx: AppContext) {
    this.ctx = ctx;
    ctx.director.setState("INTRO");
    this.build();
  }

  private build() {
    this.root?.remove();
    const m = this.ctx.assets.sky.meta, lang = getLang();
    const root = this.root = el("div", "intro", undefined, this.ctx.hud);
    el("div", "intro-place", t("intro.place", {
      place: m.location.name, date: fmtDate(m.time_local, m.tz, lang), time: fmtTime(m.time_local, m.tz, lang),
    }), root);
    el("h1", "intro-title poem", t("intro.title"), root);
    let seen = false;
    try { seen = localStorage.getItem("bts.storySeen") === "1"; } catch { /* özel mod */ }
    if (seen) {                                                // §6.7: hikâyeyi bitirene iki seçenek
      const row = el("div", "intro-row", undefined, root);
      const a = el("button", "start-btn", t("explore.watchStory"), row);
      a.addEventListener("click", () => this.start());
      const b = el("button", "start-btn", `${t("explore.skipToExplore")} ›`, row);
      b.addEventListener("click", () => this.start("explore"));
    } else {
      const start = el("button", "start-btn", t("intro.start"), root);
      start.addEventListener("click", () => this.start());
    }
    el("div", "intro-sound", t("intro.sound"), root);
    const sw = el("div", "lang-switch", undefined, root);
    for (const l of ["tr", "en"] as const) {
      const b = el("button", l === lang ? "sel" : "", l.toUpperCase(), sw);
      b.addEventListener("click", () => {
        setLang(l);
        const u = new URL(location.href);
        if (l === "en") u.searchParams.set("lang", "en"); else u.searchParams.delete("lang");
        history.replaceState(null, "", u);
        this.build();
      });
    }
    requestAnimationFrame(() => show(root));
  }

  private started = false;

  /** "Başla": hepsi aynı dokunuşun içinde — ses, jiroskop izni (iOS), Wake Lock, dokunmatikte tam ekran (SPEC §6.7) */
  private start(mode: "story" | "explore" = "story") {
    if (this.started) return;
    this.started = true;
    const ctx = this.ctx;
    try { if (!ctx.audio) { ctx.audio = new Drone(); } ctx.audio.start(); } catch { /* ses yok */ }
    ctx.gyro.enable().catch(() => {});
    requestWakeLock();
    if (matchMedia("(pointer: coarse)").matches) document.documentElement.requestFullscreen?.().catch(() => {});
    if (mode === "explore" || ctx.params.explore) { ctx.shared.explore = true; ctx.director.go("act2"); return; }
    if (this.ctx.params.compare) { this.ctx.director.go("compare"); return; }
    const z = this.ctx.params.z;
    if (z != null || this.ctx.params.goto) {                                     // ?z=15.3 → Perde 2 doğrudan bu ölçekten (§2.1)
      this.ctx.shared.startZ = z ?? 4.4;
      this.ctx.director.go("act2");
    } else this.ctx.director.go("act1");
  }

  onAction(a: Action) { if (a === "next") this.start(); }
  private tAuto = 0;
  update(dt: number) {
    this.tAuto += dt;
    if (this.ctx.params.autoplay && this.tAuto > 1.5) this.start();      // ?autoplay=1 (yedek ekran kaydı)
  }
  render(r: THREE.WebGLRenderer) { r.clear(); }
  onResize() {}
  exit() { this.root.remove(); }
}
