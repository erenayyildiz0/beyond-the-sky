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
import { T } from "./app/timeline";
import { el } from "./ui/hud";
import { setLang, t } from "./ui/i18n";
import { SciencePanel } from "./ui/sciencePanel";

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
  const director = new Director(fade, { intro: () => new Intro(), act1: () => new Act1Lights(), act2: () => new Act2Flight() });
  const ctx: AppContext = { renderer, assets, params, input, hud, tune, director, debug: {} };
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
      case "restart": director.go("intro"); break;
      default: director.action(a);
    }
  };

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
