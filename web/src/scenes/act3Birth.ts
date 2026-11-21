import * as THREE from "three";
import type { AppContext, Scene } from "../app/director";
import type { Action } from "../app/input";
import { frameSkyCamera, hFovDeg, SkyLook } from "../app/look";
import { T } from "../app/timeline";
import { dirFromAltAz } from "../science/coords";
import { dirKey, trLocative } from "../science/years";
import { el, show } from "../ui/hud";
import { t } from "../ui/i18n";
import { applySkyState, getSkyWorld, type SkyWorld } from "./act1Lights";

/**
 * Perde 3 (SPEC §2.4, §6.6): A3_LAND → A3_LIGHTS → OUTRO. Ankara'nın karanlık gökyüzüne iniş, doğum yıldızı halkayla,
 * ekran dışındaysa yön oku; ışıklar yavaşça geri yanar, halka kalır. Doğum yılı yalnızca bellekte (ctx.shared.birth).
 */
export class Act3Birth implements Scene {
  private ctx!: AppContext;
  private w!: SkyWorld;
  private cam = new THREE.PerspectiveCamera();
  private look = new SkyLook();
  private t = 0;
  private p = 1;
  private star: number | null = null;
  private starDir = new THREE.Vector3();
  private settled = false;
  private turn: { from: { alt: number; az: number }; to: { alt: number; az: number } } | null = null;
  private ui!: { root: HTMLElement; text: HTMLElement; ring: HTMLElement; arrow: HTMLElement; lights: HTMLElement; outro: HTMLElement; l1: HTMLElement; l2: HTMLElement; logo: HTMLElement; btns: HTMLElement };

  enter(ctx: AppContext) {
    this.ctx = ctx;
    this.w = getSkyWorld(ctx);
    const sky = ctx.assets.sky;
    ctx.director.setState("A3_LAND");
    const alt0 = frameSkyCamera(this.cam, innerWidth, innerHeight, sky.meta.view);
    this.look.set(alt0, sky.meta.view.az_deg);
    this.w.skyline.material.uniforms.uOpacity.value = 1;
    this.w.skyline.material.uniforms.uDrop.value = 0;
    this.w.starMat.uniforms.uTwinkle.value = 1;

    const b = ctx.shared.birth;
    const place = sky.meta.location.name;
    let text = "";
    if (b && (b.kind === "match" || b.kind === "nearest")) {
      this.star = b.star;
      const name = sky.starName(b.star) ?? "";
      text = b.up ? t(b.kind === "match" ? "act3.match" : "act3.nearest", { name, yıl_de: trLocative(b.year), year: b.year, place })
        : t("act3.below", { dir: t(`dir.${dirKey(sky.starAz[b.star])}` as "dir.n") });
    } else if (b && b.kind === "tooYoung") {
      this.star = sky.stars.data.findIndex(r => r[7] === 32349);              // Sirius
      text = t("act3.tooYoung");
    }
    if (this.star != null && this.star >= 0) {
      this.starDir.copy(dirFromAltAz(sky.starAlt[this.star], sky.starAz[this.star]));
      if (sky.starAlt[this.star] > 5) {                                      // jiroskop yok: kamera 2 sn'de yıldıza döner
        const to = { alt: Math.min(70, sky.starAlt[this.star]), az: sky.starAz[this.star] };
        this.turn = { from: { alt: this.look.alt, az: this.look.az }, to };
      }
    } else this.star = null;

    const root = el("div", "act3", undefined, ctx.hud);
    const textEl = el("div", "act3-text poem", text, root);
    const ring = el("div", "birth-ring", undefined, root);
    const arrow = el("div", "birth-arrow", "➜", root);
    const lights = el("div", "act3-text poem", t("act3.lights"), root);
    const outro = el("div", "outro", undefined, root);
    const l1 = el("div", "outro-line poem", t("outro.line1"), outro);
    const l2 = el("div", "outro-line poem", t("outro.line2"), outro);
    const logo = el("div", "outro-logo", "Beyond the Sky", outro);
    const btns = el("div", "outro-btns", undefined, outro);
    const ex = el("button", "next-btn-inline", `${t("outro.explore")} ›`, btns);
    ex.addEventListener("click", () => { ctx.shared = {}; ctx.director.go("act2"); });
    const rs = el("button", "fly-small", t("outro.restart"), btns);
    rs.addEventListener("click", () => { ctx.shared = {}; ctx.director.go("intro"); });
    this.ui = { root, text: textEl, ring, arrow, lights, outro, l1, l2, logo, btns };
    ctx.audio?.swell();                                          // A3_LAND
    if (ctx.gyro.active && this.star != null) textEl.textContent += " " + t("act3.turn");
    requestAnimationFrame(() => show(textEl, !!text));
  }

  onAction(a: Action) {
    if (a === "next" && this.t < T.act3.landHold) this.t = T.act3.landHold;   // sunum kumandası: ilerle
  }

  update(dt: number) {
    this.t += dt;
    const { ctx } = this;
    const d = ctx.input.consumeDrag();
    if (d.dx || d.dy) this.turn = null;
    if (ctx.gyro.active) this.turn = null;
    if (this.turn) {
      const k = Math.min(1, this.t / 2);
      const e = k * k * (3 - 2 * k);
      const dAz = ((this.turn.to.az - this.turn.from.az + 540) % 360) - 180;
      this.look.set(this.turn.from.alt + (this.turn.to.alt - this.turn.from.alt) * e, this.turn.from.az + dAz * e);
      if (k >= 1) this.turn = null;
    }
    if (ctx.gyro.active) {                                     // gerçek yönelim; yıldız ekran dışındaysa yön oku
      if (d.dx) { ctx.gyro.yawOffsetDeg += d.dx * hFovDeg(this.cam) / innerWidth; ctx.gyro.compute(); }
      this.cam.quaternion.slerp(ctx.gyro.q, 1 - Math.exp(-dt / 0.08));
    } else {
      this.look.drag(d.dx, d.dy, this.cam, innerWidth, innerHeight, dt);
      this.look.update(dt, ctx.input.dragging, ctx.input.keys);
      this.look.apply(this.cam);
    }

    // A3_LIGHTS: ışıklar 6 sn'de geri yanar (p 1 → 0)
    const L = T.act3.landHold, S = T.act3.lightsOnS;
    if (this.t > L) { ctx.director.setState("A3_LIGHTS"); this.p = Math.max(0, 1 - (this.t - L) / S); }
    const sky = applySkyState(ctx, this.w, this.p, this.t);
    if (this.t > L) ctx.audio?.setProgress(sky.q);
    if (this.t > L + S && !this.settled) { this.settled = true; ctx.audio?.settle(); }
    show(this.ui.text, this.t < L + S * 0.5 && !!this.ui.text.textContent);
    show(this.ui.lights, this.t > L + S * 0.6 && this.t < L + S + 3);
    // OUTRO (§2.5): iki satır sırayla, logo, düğmeler
    const o = L + S + 3, g = T.outro.lineGap;
    if (this.t > o) { ctx.director.setState("OUTRO"); try { localStorage.setItem("bts.storySeen", "1"); } catch { /* özel mod */ } }
    show(this.ui.outro, this.t > o);
    show(this.ui.l1, this.t > o); show(this.ui.l2, this.t > o + g); show(this.ui.logo, this.t > o + 2 * g); show(this.ui.btns, this.t > o + 2 * g + 1);
    this.placeRing();
  }

  /** Halka (18 px, nefes alır) ya da ekran dışındaysa kenarda yön oku (SPEC §6.6) */
  private placeRing() {
    const { ring, arrow } = this.ui;
    if (this.star == null || this.t > T.act3.landHold + T.act3.lightsOnS + 3) { show(ring, false); show(arrow, false); return; }
    const v = this.starDir.clone().multiplyScalar(900).project(this.cam);
    const behind = v.z > 1;
    const W = innerWidth, H = innerHeight;
    const on = !behind && Math.abs(v.x) < 0.92 && Math.abs(v.y) < 0.92;
    show(ring, on); show(arrow, !on);
    if (on) {
      const s = 1 + 0.12 * Math.sin(this.t * 2.5);
      ring.style.transform = `translate(${(v.x + 1) / 2 * W}px, ${(1 - v.y) / 2 * H}px) translate(-50%, -50%) scale(${s})`;
    } else {
      let ax = v.x, ay = v.y;
      if (behind) { ax = -ax; ay = -ay; }
      const ang = Math.atan2(-ay, ax);
      const r = Math.min(W, H) * 0.42;
      arrow.style.transform = `translate(${W / 2 + Math.cos(ang) * r}px, ${H / 2 + Math.sin(ang) * r}px) translate(-50%, -50%) rotate(${ang}rad)`;
    }
  }

  render(r: THREE.WebGLRenderer) { r.clear(); r.render(this.w.scene, this.cam); }
  onResize(w: number, h: number) {
    const view = this.ctx.assets.sky.meta.view;
    this.cam.fov = w / h >= 1 ? view.vfov_landscape_deg : view.vfov_portrait_deg;
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
  }
  exit() { this.ui.root.remove(); }
}
