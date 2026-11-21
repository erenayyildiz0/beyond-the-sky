import "./styles.css";
import { loadAssets, readParams } from "./app/assets";
import { Director, type AppContext, type Tunables } from "./app/director";
import { Input } from "./app/input";
import { createRenderer } from "./app/renderer";
import { STAR_DEFAULTS } from "./render/stars";
import { MW_GAIN_DEFAULT } from "./render/skyDome";
import { Act1Lights } from "./scenes/act1Lights";
import { Act2Flight } from "./scenes/act2Flight";
import { Intro } from "./scenes/intro";
import { Compare } from "./scenes/compare";
import { Act3Birth } from "./scenes/act3Birth";
import { T } from "./app/timeline";
import { el } from "./ui/hud";
import { setLang, t } from "./ui/i18n";
import { SciencePanel } from "./ui/sciencePanel";
import { Gyro } from "./app/gyro";
import { requestWakeLock } from "./app/wakeLock";

async function main() {
  const params = readParams();
  setLang(params.lang);
  const canvas = document.getElementById("gl") as HTMLCanvasElement;
  const hud = document.getElementById("hud")!;
  const fade = document.getElementById("fade")!;

  const renderer = createRenderer(canvas);
  if (!renderer) {
    el("div", "fallback", t("fallback.webgl"), hud);
    return;
  }

  // LOADING (SPEC §6.7): metin fontlar yüklenene kadar gösterilmez
  const loading = el("div", "loading", undefined, hud);
  const bar = el("div", "loading-bar", undefined, loading);
  const label = el("div", "loading-label", "", loading);
  const fontsP = Promise.all([
    document.fonts.load('300 1em "Fraunces"'), document.fonts.load('400 1em "Inter"'), document.fonts.load('600 1em "Inter"'),
  ]).then(() => { label.textContent = t("loading", { n: 0 }); label.classList.add("on"); });
  const assets = await loadAssets(renderer, p => {
    bar.style.transform = `scaleX(${p})`;
    if (label.classList.contains("on")) label.textContent = t("loading", { n: Math.round(p * 100) });
  });
  await fontsP;
  loading.remove();

  const tune: Tunables = {
    uBaseSize: STAR_DEFAULTS.uBaseSize, uMaxSize: STAR_DEFAULTS.uMaxSize, uFlyByMax: 28, uRefMag: STAR_DEFAULTS.uRefMag,
    uIntensity: STAR_DEFAULTS.uIntensity, uMWGain: MW_GAIN_DEFAULT, sqmCity: assets.sky.meta.visibility.sqm_city,
    extinctionK: assets.sky.meta.visibility.extinction_k, vMax: T.act2.vMax, galaxySize: 1, showNames: false,
  };
  const input = new Input(canvas);
  const director = new Director(fade, { intro: () => new Intro(), act1: () => new Act1Lights(), act2: () => new Act2Flight(), compare: () => new Compare(), act3: () => new Act3Birth() });
  const ctx: AppContext = { renderer, assets, params, input, hud, tune, director, debug: {}, shared: {}, gyro: new Gyro(), audio: null };
  director.ctx = ctx;
  const panel = new SciencePanel(ctx, document.body);
  window.addEventListener("bts:toggleDebug", () => panel.toggle());

  input.onAction = a => {
    switch (a) {
      case "toggleDebug": panel.toggle(); break;
      case "toggleFullscreen":
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen?.().catch(() => {});
        break;
      case "restart": ctx.shared = {}; director.go("intro"); break;
      case "toggleMute": ctx.audio?.toggleMute(); break;
      default: director.action(a);
    }
  };

  // Jiroskop anahtarı (SPEC §6.3): sağ altta; izin verildiyse görünür
  const gyroBtn = el("button", "gyro-toggle", "", document.body);
  gyroBtn.addEventListener("click", () => { ctx.gyro.enabled = !ctx.gyro.enabled; });
  setInterval(() => {
    gyroBtn.style.display = ctx.gyro.mode !== "off" && director.current !== "intro" ? "" : "none";
    gyroBtn.textContent = ctx.gyro.enabled ? t("gyro.on") : t("gyro.off");
  }, 300);

  const onResize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    director.resize(innerWidth, innerHeight);
  };
  window.addEventListener("resize", onResize);

  await director.go("intro", true);

  let last = performance.now();
  let running = true;
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (document.hidden) ctx.audio?.suspend(); else { ctx.audio?.resume(); requestWakeLock(); }
    last = performance.now();
    if (running) requestAnimationFrame(loop);
  });
  const loop = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    director.update(dt, now);
    panel.update(dt, now);
    director.render(renderer);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

main();
