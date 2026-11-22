import type * as THREE from "three";
import { hasSkyWorld } from "./act1Lights";
import { chooseNight, relocateSky, visibilityFor, type Pollution } from "../science/relocate";
import { RELOC } from "../science/reloc";
import { loadRelocationData } from "../app/assets";
import { placeVars } from "../ui/place";
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
      place: placeVars(m).label, date: fmtDate(m.time_local, m.tz, lang), time: fmtTime(m.time_local, m.tz, lang),
    }), root);
    el("h1", "intro-title poem", t("intro.title"), root);
    let seen = false;
    try { seen = localStorage.getItem("bts.storySeen") === "1"; } catch { /* özel mod */ }
    if (seen) {                                                // §6.7: hikâyeyi bitirene iki seçenek
      const row = el("div", "intro-row", undefined, root);
      const a = el("button", "start-btn cta", t("explore.watchStory"), row);
      a.addEventListener("click", () => this.start());
      const b = el("button", "start-btn", `${t("explore.skipToExplore")} ›`, row);
      b.addEventListener("click", () => this.start("explore"));
    } else {
      const start = el("button", "start-btn cta", t("intro.start"), root);
      start.addEventListener("click", () => this.start());
    }
    el("div", "intro-sound", t("intro.sound"), root);
    this.buildLocation(root);
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

  /**
   * E1 — Konumumu kullan (docs/EXTRAS.md): izin → ışık kirliliği seçimi → gökyüzü bu konum ve ilk aysız gece için tarayıcıda
   * hesaplanır. Konum yalnızca bellekte; kaydedilmez, gönderilmez.
   */
  private buildLocation(root: HTMLElement) {
    const box = el("div", "loc", undefined, root);
    const m = this.ctx.assets.sky.meta;
    if (m.location.local) {
      const again = el("button", "loc-link", t("loc.ankara"), box);
      again.addEventListener("click", () => {                          // Ankara'ya dön: hiçbir şey saklanmadı, yeniden yükle
        const u = new URL(location.href); u.searchParams.delete("loc"); location.href = u.toString();
      });
      el("div", "loc-note", t("loc.note", { sqm: m.visibility.sqm_city.toLocaleString(getLang() === "tr" ? "tr-TR" : "en-US") }), box);
      if (this.nautical) el("div", "loc-note", t("loc.nautical"), box);
      return;
    }
    const btn = el("button", "loc-link", `📍 ${t("loc.use")}`, box);
    const msg = el("div", "loc-note", "", box);
    this.locMsg = (text: string) => { msg.textContent = text; };
    const ask = () => {
      if (hasSkyWorld()) {                                            // dünyalar Ankara için kuruldu: temiz sayfada başla
        const u = new URL(location.href); u.searchParams.set("loc", "1"); location.href = u.toString(); return;
      }
      if (!navigator.geolocation) { msg.textContent = t("loc.unavailable"); return; }
      msg.textContent = t("loc.asking");
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude: lat, longitude: lon, altitude } = pos.coords;
        btn.remove();
        msg.textContent = t("loc.pollution");
        const row = el("div", "intro-row loc-row", undefined, box);
        for (const p of ["city", "suburb", "rural"] as const) {
          el("button", "loc-choice", t(`loc.${p}`), row).addEventListener("click", () => {
            row.remove(); msg.textContent = t("loc.computing");
            this.relocate(lat, lon, altitude ?? 0, p).catch(e => { console.warn(e); msg.textContent = t("loc.failed"); });
          });
        }
        el("div", "loc-note", t("loc.private"), box);
      }, () => { msg.textContent = t("loc.denied"); }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
    };
    btn.addEventListener("click", ask);
    if (this.ctx.params.loc) { this.ctx.params.loc = false; ask(); }
  }

  private async relocate(lat: number, lon: number, heightM: number, p: Pollution) {
    const ctx = this.ctx, a = ctx.assets;
    const found = chooseNight(lat, lon, heightM, new Date());
    if (!found) { this.locMsg(t("loc.noNight")); return; }
    const night = found.date;
    const data = await loadRelocationData(a.variant.milkyWay);
    const vis = visibilityFor(p, a.sky.meta.visibility);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { sky, R } = relocateSky(a.sky, data.icrs, { lat, lon, heightM, name: "", nameAblative: "" }, night, vis, tz);
    a.sky = sky; a.milkyWay = data.milkyWay; RELOC.R = R;
    ctx.tune.sqmCity = vis.sqm_city;
    ctx.shared = {};
    this.nautical = found.sunLimit > -18;
    this.build();                                                // yer/tarih satırı ve Ankara'ya dön bağlantısı
  }

  private nautical = false;
  private locMsg: (text: string) => void = () => {};

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
