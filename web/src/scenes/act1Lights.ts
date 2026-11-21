import * as THREE from "three";
import type { AppContext, Scene } from "../app/director";
import type { Action } from "../app/input";
import { bindHoldButton, HoldControl } from "../app/input";
import { frameSkyCamera, SkyLook } from "../app/look";
import { T } from "../app/timeline";
import { createSkyDome, SKY_COLORS } from "../render/skyDome";
import { createSkyline } from "../render/skyline";
import { createPlanetGeometry, createSkyStarMaterial, createStarGeometry } from "../render/stars";
import { dirFromAltAz } from "../science/coords";
import { act1SkyState, countVisible, limitMag } from "../science/visibility";
import { fmtDate, fmtDayMonth, fmtInt, fmtTime, isTonight } from "../ui/format";
import { el, onMultiTap, progressRing, show } from "../ui/hud";
import { getLang, t } from "../ui/i18n";

/** Perde 1 ve 3'ün paylaştığı gökyüzü dünyası; bir kez kurulur, dispose edilmez (SPEC §6.2, §6.10). */
export interface SkyWorld {
  scene: THREE.Scene;
  dome: ReturnType<typeof createSkyDome>;
  starGeo: THREE.BufferGeometry;
  starMat: THREE.ShaderMaterial;
  stars: THREE.Points;
  planets: THREE.Points;
  skyline: ReturnType<typeof createSkyline>;
}

let world: SkyWorld | null = null;

export function getSkyWorld(ctx: AppContext): SkyWorld {
  if (world) return world;
  const { sky, milkyWay } = ctx.assets;
  const scene = new THREE.Scene();
  const dome = createSkyDome(sky, milkyWay);
  const starGeo = createStarGeometry(sky);
  const starMat = createSkyStarMaterial(sky, ctx.renderer.getPixelRatio());
  const stars = new THREE.Points(starGeo, starMat);
  stars.frustumCulled = false;
  stars.renderOrder = 1;
  const planets = new THREE.Points(createPlanetGeometry(sky), starMat);
  planets.frustumCulled = false;
  planets.renderOrder = 2;
  const skyline = createSkyline();
  scene.add(dome.mesh, stars, planets, skyline.mesh);
  world = { scene, dome, starGeo, starMat, stars, planets, skyline };
  return world;
}

const tmpV = new THREE.Vector3();

export class Act1Lights implements Scene {
  private ctx!: AppContext;
  private w!: SkyWorld;
  private cam = new THREE.PerspectiveCamera();
  private hold = new HoldControl(T.act1.hold, T.act1.release);
  private look = new SkyLook();
  private t = 0;
  private lockedAt: number | null = null;
  private autoHold = false;
  private shown = 0;
  private ui!: {
    root: HTMLElement; place: HTMLElement; center: HTMLElement; hint: HTMLElement; count: HTMLElement;
    holdWrap: HTMLElement; ring: (p: number) => void; r1: HTMLElement; r2: HTMLElement; up: HTMLButtonElement;
    names: HTMLElement;
  };
  private nameEls: { i: number; dir: THREE.Vector3; e: HTMLElement }[] = [];
  private lastW = 0; private lastH = 0;

  enter(ctx: AppContext) {
    this.ctx = ctx;
    this.w = getSkyWorld(ctx);
    const { sky } = ctx.assets;
    const view = { ...sky.meta.view, az_deg: ctx.params.az ?? sky.meta.view.az_deg };
    const alt0 = frameSkyCamera(this.cam, innerWidth, innerHeight, view);
    this.look.set(alt0, view.az_deg);
    this.lastW = innerWidth; this.lastH = innerHeight;
    this.w.skyline.mesh.visible = true;
    ctx.director.setState("A1_CITY");
    this.buildUi();
  }

  private buildUi() {
    const { sky } = this.ctx.assets;
    const m = sky.meta, lang = getLang();
    const root = el("div", "act1", undefined, this.ctx.hud);
    const place = el("div", "place", t("intro.place", {
      place: m.location.name, date: fmtDate(m.time_local, m.tz, lang), time: fmtTime(m.time_local, m.tz, lang),
    }), root);
    onMultiTap(place, 3, () => window.dispatchEvent(new CustomEvent("bts:toggleDebug")));
    el("div", "badge", t("act1.badge"), root);
    const tonight = isTonight(m.time_local, m.tz);
    const center = el("div", "center-text poem", tonight
      ? t("act1.now.tonight", { place_ablative: m.location.name_ablative, place: m.location.name })
      : t("act1.now.date", { place_ablative: m.location.name_ablative, place: m.location.name, date: fmtDayMonth(m.time_local, m.tz, lang) }),
      root);
    const hint = el("div", "hint", t("act1.drag"), root);
    const count = el("div", "count", "", root);
    const holdWrap = el("div", "hold-wrap", undefined, root);
    const btn = el("button", "hold-btn", undefined, holdWrap);
    btn.setAttribute("aria-label", t("act1.hold"));
    const ring = progressRing(btn);
    el("span", "hold-dot", undefined, btn);
    el("div", "hold-label", t("act1.hold"), holdWrap);
    bindHoldButton(btn, this.hold);
    const r1 = el("div", "reveal poem", t("act1.reveal1"), root);
    const r2 = el("div", "reveal reveal2 poem", t("act1.reveal2", { n: fmtInt(m.counts.dark, lang) }), root);
    const up = el("button", "next-btn", `${t("act1.up")} ›`, root);
    up.addEventListener("click", () => this.goUp());
    const names = el("div", "names", undefined, root);
    this.ui = { root, place, center, hint, count, holdWrap, ring, r1, r2, up, names };
    requestAnimationFrame(() => { show(center); show(hint); });

    // "İsimleri göster": mag < 2 yıldızlar ve ufkun üstündeki gezegenler
    sky.stars.data.forEach((r, i) => {
      if (r[2] < 2 && r[0] > 0) this.nameEls.push({ i, dir: dirFromAltAz(r[0], r[1]), e: el("span", "name", sky.starName(i) ?? "", names) });
    });
    sky.bodies.forEach(b => {
      if (b.alt > 0) this.nameEls.push({ i: -1, dir: dirFromAltAz(b.alt, b.az), e: el("span", "name planet", lang === "tr" ? b.name_tr : b.name_en, names) });
    });
  }

  private goUp() {
    if (this.lockedAt == null) return;
    this.ctx.director.go("act2");
  }

  private get controlsOn() { return this.t >= T.act1.introText; }

  onAction(a: Action) {
    if (a === "holdStart" && this.controlsOn && !this.hold.locked) this.hold.holding = true;
    else if (a === "holdEnd" && !this.autoHold) this.hold.holding = false;
    else if (a === "next") {
      if (this.hold.locked) this.goUp();
      else if (this.controlsOn) this.autoHold = true;      // sunum kumandası: 7 sn otomatik basılı tutma
    }
  }

  update(dt: number) {
    this.t += dt;
    const { ctx, hold } = this;
    const { sky } = ctx.assets;
    const v = sky.meta.visibility;
    const tune = ctx.tune;

    const d = ctx.input.consumeDrag();
    this.look.drag(d.dx, d.dy, this.cam, innerWidth, innerHeight, dt);
    this.look.update(dt, ctx.input.dragging, ctx.input.keys);
    this.look.apply(this.cam);

    if (this.autoHold && !hold.locked) hold.holding = true;
    hold.update(dt);
    if (hold.locked && this.lockedAt == null) { this.lockedAt = this.t; this.autoHold = false; }
    ctx.director.setState(hold.locked ? "A1_REVEALED" : hold.holding || hold.p > 0 ? "A1_HOLDING" : "A1_CITY");

    // Gökyüzü durumu (§3.3–§3.5)
    const s = act1SkyState(hold.p, { ...v, sqm_city: tune.sqmCity });
    const k = tune.extinctionK;
    const dome = this.w.dome.material.uniforms;
    dome.uZenith.value.copy(SKY_COLORS.city.zenith).lerp(SKY_COLORS.dark.zenith, s.q);
    dome.uHorizon.value.copy(SKY_COLORS.city.horizon).lerp(SKY_COLORS.dark.horizon, s.q);
    dome.uMWOpacity.value = s.mwOpacity;
    dome.uM31Opacity.value = s.m31Opacity;
    dome.uMWGain.value = tune.uMWGain;
    dome.uExtK.value = k;
    dome.uSpace.value = 0;
    const su = this.w.starMat.uniforms;
    su.uSqm.value = s.sqm; su.uGlowMag.value = s.glow; su.uExtK.value = k;
    su.uBaseSize.value = tune.uBaseSize; su.uMaxSize.value = tune.uMaxSize; su.uRefMag.value = tune.uRefMag;
    su.uIntensity.value = tune.uIntensity; su.uTime.value = this.t;
    su.uPixelRatio.value = ctx.renderer.getPixelRatio();
    this.w.skyline.material.uniforms.uP.value = hold.p;

    // Sayaç: bütün gökyüzü (yalnızca ekrandaki değil), CPU'da Float64
    const target = countVisible(sky.starAlt, sky.starMag, s.sqm, s.glow, k);
    this.shown += (target - this.shown) * Math.min(1, dt * 12);
    const lang = getLang();
    this.ui.count.textContent = t("act1.count", { n: fmtInt(hold.locked ? target : this.shown, lang) });
    this.ui.ring(hold.p);

    // Zamanlama (§2.2)
    const ui = this.ui;
    const r2At = this.lockedAt == null ? Infinity : this.lockedAt + T.act1.reveal[1];
    show(ui.count, this.controlsOn && this.t < r2At);       // ikinci satır sayıyı zaten söylüyor
    show(ui.holdWrap, this.controlsOn && !hold.locked);
    ui.holdWrap.classList.toggle("active", hold.holding);
    show(ui.center, this.t < T.act1.introText + 4 && hold.p < 0.05 && !hold.locked);
    show(ui.hint, this.t < T.act1.introText + 4 && !hold.locked);
    if (this.lockedAt != null) {
      const since = this.t - this.lockedAt;
      const [r1, r2, up] = T.act1.reveal;
      show(ui.r1, since >= r1);
      show(ui.r2, since >= r2);
      show(ui.up, since >= r2 + up);
    }
    this.updateNames();

    Object.assign(ctx.debug, {
      "p / q": `${hold.p.toFixed(3)} / ${s.q.toFixed(3)}`,
      "SQM zenit": s.sqm.toFixed(2),
      "m_lim zenit": limitMag(s.sqm, 90, s.glow).toFixed(2),
      "CPU sayım": target,
      "bakış alt/az": `${this.look.alt.toFixed(1)}° / ${this.look.az.toFixed(1)}°`,
    });
  }

  private updateNames() {
    const on = this.ctx.tune.showNames;
    this.ui.names.style.display = on ? "" : "none";
    if (!on) return;
    const W = innerWidth, H = innerHeight;
    for (const n of this.nameEls) {
      tmpV.copy(n.dir).multiplyScalar(900).project(this.cam);
      const vis = tmpV.z < 1 && Math.abs(tmpV.x) < 1.1 && Math.abs(tmpV.y) < 1.1;
      n.e.style.display = vis ? "" : "none";
      if (vis) n.e.style.transform = `translate(${((tmpV.x + 1) / 2) * W + 8}px, ${((1 - tmpV.y) / 2) * H - 8}px)`;
    }
  }

  render(r: THREE.WebGLRenderer) {
    r.clear();
    r.render(this.w.scene, this.cam);
  }

  onResize(w: number, h: number) {
    if (w === this.lastW && h === this.lastH && this.cam.aspect === w / h) return;
    this.lastW = w; this.lastH = h;
    const view = this.ctx.assets.sky.meta.view;
    this.cam.fov = w / h >= 1 ? view.vfov_landscape_deg : view.vfov_portrait_deg;
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
  }

  exit() {
    this.ui.root.remove();
  }
}
