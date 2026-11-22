import * as THREE from "three";
import type { AppContext, Scene } from "../app/director";
import { bindHoldButton, HoldControl, type Action } from "../app/input";
import { T } from "../app/timeline";
import { dirFromAltAz } from "../science/coords";
import { countVisible } from "../science/visibility";
import { autoOrient, buildMask, luminance, PHONE_LONG_FOV_DEG, quarterTurnsFromUp, skylineFromLuminance, verticalFov } from "../science/photoMask";
import { fmtInt } from "../ui/format";
import { el, progressRing, show } from "../ui/hud";
import { getLang, t } from "../ui/i18n";
import { shareFrame } from "../ui/share";
import { applySkyState, getSkyWorld, type SkyWorld } from "./act1Lights";

const overlayVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// Fotoğraf + maske: zemindeki ışıklar rastgele eşiklerle söner (Perde 1 siluetindeki mantık), gökyüzündeki şehir parlaması
// q ile kaybolur ve altından gerçek gökyüzü görünür. Işıkların sönmesi temsili.
const overlayFrag = /* glsl */ `
uniform sampler2D uPhoto, uMask;
uniform float uP, uQ, uShift;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 c = texture2D(uPhoto, vUv).rgb;
  vec2 m = texture2D(uMask, vUv + vec2(0.0, uShift)).rg;
  float sky = m.r;
  float thr = hash(floor(vUv * vec2(90.0, 70.0)));               // her pencere grubunun kendi sönme anı
  float off = smoothstep(thr * 0.9, thr * 0.9 + 0.08, uP);
  vec3 ground = c * mix(1.0, 0.06, m.g * off) * mix(1.0, 0.3, uQ);    // ışıklar söner, sokak ve bina aralarındaki parlama da azalır
  float a = mix(1.0, 1.0 - 0.97 * uQ, sky);                       // gökyüzünde fotoğraf saydamlaşır
  gl_FragColor = vec4(ground, a);
  #include <colorspace_fragment>
}`;

/**
 * E2 — Kendi gökyüzün (docs/EXTRAS.md): uygulamanın içinden gökyüzüne doğru fotoğraf. Basılı tutunca fotoğraftaki ışıklar
 * söner, gökyüzü maskesinin içinde o yönde o gece görünecek gerçek yıldızlar ve Samanyolu belirir. Fotoğraf ve yönelim
 * yalnızca bellekte; kaydedilmez, gönderilmez. Kamera çekimden hemen sonra kapanır.
 */
export class OwnSky implements Scene {
  private ctx!: AppContext;
  private w!: SkyWorld;
  private cam = new THREE.PerspectiveCamera(60, 1, 0.1, 5000);
  private hold = new HoldControl(T.act1.hold, T.act1.release);
  private stream: MediaStream | null = null;
  private video!: HTMLVideoElement;
  private photo: { tex: THREE.Texture; mask: THREE.DataTexture; w: number; h: number } | null = null;
  private q0 = new THREE.Quaternion();
  private yaw = 0; private pitch = 0;                    // elle hizalama (derece)
  private fovLong = PHONE_LONG_FOV_DEG;
  private overlay!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private oScene = new THREE.Scene();
  private oCam = new THREE.Camera();
  private t = 0;
  private shown = 0;
  private ui!: { root: HTMLElement; shoot: HTMLElement; capture: HTMLElement; msg: HTMLElement; edit: HTMLElement; count: HTMLElement;
    ring: (p: number) => void; holdWrap: HTMLElement; shift: HTMLInputElement };

  enter(ctx: AppContext) {
    this.ctx = ctx;
    this.w = getSkyWorld(ctx);
    this.w.skyline.mesh.visible = false;                 // siluet yerine fotoğraf
    ctx.director.setState("EXPLORE");
    this.overlay = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      vertexShader: overlayVert, fragmentShader: overlayFrag, transparent: true, depthTest: false, depthWrite: false,
      uniforms: { uPhoto: { value: null }, uMask: { value: null }, uP: { value: 0 }, uQ: { value: 0 }, uShift: { value: 0 } },
    }));
    this.overlay.frustumCulled = false;
    this.oScene.add(this.overlay);
    this.buildUi();
    this.startCamera();
  }

  private buildUi() {
    const root = el("div", "own", undefined, this.ctx.hud);
    // Çekim ekranı
    const shoot = el("div", "own-shoot on", undefined, root);
    this.video = el("video", "own-video", undefined, shoot);
    this.video.playsInline = true; this.video.muted = true; this.video.autoplay = true;
    el("div", "own-tip", t("own.aim"), shoot);
    const msg = el("div", "own-msg", "", root);
    const capture = el("button", "own-capture cta", t("own.capture"), shoot);
    capture.addEventListener("click", () => this.capture());
    el("button", "fly-small own-back", t("own.back"), root).addEventListener("click", () => this.ctx.director.go("intro"));
    // Düzenleme ve basılı tutma ekranı
    const edit = el("div", "own-edit", undefined, root);
    el("div", "badge", t("own.badge"), edit);
    const count = el("div", "count", "", edit);
    el("div", "own-tip own-align", t("own.align"), edit);
    const holdWrap = el("div", "hold-wrap on", undefined, edit);
    const btn = el("button", "hold-btn cta", undefined, holdWrap);
    btn.setAttribute("aria-label", t("act1.hold"));
    const ring = progressRing(btn);
    el("span", "hold-dot", undefined, btn);
    el("div", "hold-label", t("act1.hold"), holdWrap);
    bindHoldButton(btn, this.hold);
    const tools = el("div", "own-tools", undefined, edit);
    const shiftL = el("label", "own-shift", t("own.horizon"), tools);
    const shift = el("input", "", undefined, shiftL);
    shift.type = "range"; shift.min = "-0.25"; shift.max = "0.25"; shift.step = "0.002"; shift.value = "0";
    shift.addEventListener("input", () => { this.overlay.material.uniforms.uShift.value = -(+shift.value); });
    el("button", "fly-small", `↻ ${t("own.rotate")}`, tools).addEventListener("click", () => this.rotateManual());
    el("button", "fly-small", t("own.retake"), tools).addEventListener("click", () => { this.reset(); this.startCamera(); });
    el("button", "fly-small", t("card.share"), tools).addEventListener("click", () => {
      shareFrame(this.ctx.renderer.domElement, () => this.render(this.ctx.renderer), t("own.shareText")).catch(e => console.warn(e));
    });
    for (const e of [edit]) e.addEventListener("pointerdown", ev => { if ((ev.target as HTMLElement).closest("button, input, label")) ev.stopPropagation(); });
    this.ui = { root, shoot, capture, msg, edit, count, ring, holdWrap, shift };
  }

  private async startCamera() {
    show(this.ui.shoot, true); show(this.ui.edit, false);
    this.ui.msg.textContent = "";
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } }, audio: false });
      this.video.srcObject = this.stream;
      await this.video.play().catch(() => {});
    } catch {
      this.ui.msg.textContent = t("own.noCamera");
    }
  }

  private stopCamera() {
    this.stream?.getTracks().forEach(tr => tr.stop());
    this.stream = null;
    this.video.srcObject = null;
  }

  /** Çek: o anki kare ve telefonun yönelimi; fotoğraf dik konuma çevrilir, ardından maske. Hepsi bellekte. */
  private capture() {
    const v = this.video;
    if (!v.videoWidth) return;
    const W = v.videoWidth, H = v.videoHeight;
    let full = document.createElement("canvas");
    full.width = W; full.height = H;
    full.getContext("2d")!.drawImage(v, 0, 0, W, H);
    const g = this.ctx.gyro;
    this.gyroUsed = g.active;
    let k: number;
    if (g.active) {
      // Başucunun kamera düzlemindeki izdüşümü: telefon yan tutulduysa (ekran döndürmesi kilitli) görüntünün yukarısı başka kenarda
      this.q0.copy(g.q);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.q0.clone().invert());
      k = quarterTurnsFromUp(up.x, up.y);
    } else {                                              // jiroskop yok: bu gecenin başlangıç yönü, ufkun biraz üstü
      const view = this.ctx.assets.sky.meta.view;
      const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), dirFromAltAz(20, view.az_deg), new THREE.Vector3(0, 1, 0));
      this.q0.setFromRotationMatrix(m);
      const sm = this.smallLum(full);
      k = autoOrient(sm.L, sm.w, sm.h);                   // gökyüzünün pürüzsüz ve parlak kenarı yukarı
    }
    this.stopCamera();
    if (k) full = this.turn(full, k, this.gyroUsed);
    this.hold.p = 0; this.hold.locked = false; this.yaw = 0; this.pitch = 0; this.fovLong = PHONE_LONG_FOV_DEG;
    this.setPhoto(full);
    show(this.ui.shoot, false); show(this.ui.edit, true);
  }

  private gyroUsed = false;
  private canvas: HTMLCanvasElement | null = null;

  /** Fotoğrafı saat yönünün tersine k çeyrek tur döndür; jiroskop yönelimi kullanıldıysa gökyüzü kamerası da aynı açıyla döner */
  private turn(src: HTMLCanvasElement, k: number, withCamera: boolean) {
    let c = src;
    for (let i = 0; i < k; i++) {
      const n = document.createElement("canvas");
      n.width = c.height; n.height = c.width;
      const x = n.getContext("2d")!;
      x.translate(0, n.height); x.rotate(-Math.PI / 2); x.drawImage(c, 0, 0);   // sağ kenar yukarı
      c = n;
    }
    if (withCamera) this.q0.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -k * Math.PI / 2));
    return c;
  }

  /** Maske için küçük kopyanın parlaklığı (en fazla 480 px) */
  private smallLum(src: HTMLCanvasElement) {
    const s = Math.min(1, 480 / Math.max(src.width, src.height)), w = Math.round(src.width * s), h = Math.round(src.height * s);
    const small = document.createElement("canvas");
    small.width = w; small.height = h;
    const sc = small.getContext("2d", { willReadFrequently: true })!;
    sc.drawImage(src, 0, 0, w, h);
    return { L: luminance(sc.getImageData(0, 0, w, h).data, w, h), w, h };
  }

  private setPhoto(full: HTMLCanvasElement) {
    this.canvas = full;
    const { L, w, h } = this.smallLum(full);
    const mask = buildMask(L, w, h, skylineFromLuminance(L, w, h));
    const mtex = new THREE.DataTexture(mask.data, w, h, THREE.RGBAFormat);
    mtex.magFilter = THREE.LinearFilter; mtex.minFilter = THREE.LinearFilter; mtex.needsUpdate = true;
    const ptex = new THREE.CanvasTexture(full);
    ptex.colorSpace = THREE.SRGBColorSpace;
    this.photo?.tex.dispose(); this.photo?.mask.dispose();
    this.photo = { tex: ptex, mask: mtex, w: full.width, h: full.height };
    const u = this.overlay.material.uniforms;
    u.uPhoto.value = ptex; u.uMask.value = mtex;
    this.ui.shift.value = "0"; u.uShift.value = 0;
  }

  /** ↻ Döndür: yön tahmini yanlışsa elle */
  private rotateManual() {
    if (!this.canvas) return;
    this.setPhoto(this.turn(this.canvas, 1, this.gyroUsed));
  }

  private reset() {
    this.photo?.tex.dispose(); this.photo?.mask.dispose(); this.photo = null; this.canvas = null;
  }

  onAction(a: Action) {
    if (!this.photo) return;
    if (a === "holdStart" && this.hold.p < 1) this.hold.holding = true;
    else if (a === "holdEnd") this.hold.holding = false;
  }

  update(dt: number) {
    this.t += dt;
    const ctx = this.ctx;
    const d = ctx.input.consumeDrag(), z = ctx.input.consumeZoom();
    if (!this.photo) return;
    // Elle hizalama: sürükle (yönelim), iki parmak / tekerlek (görüş açısı)
    if (d.dx || d.dy) {
      const vfov = this.vfov();
      this.yaw += d.dx * vfov * this.aspect() / innerWidth;
      this.pitch += d.dy * vfov / innerHeight;
    }
    if (z) this.fovLong = Math.min(110, Math.max(20, this.fovLong * Math.exp(-z * 0.5)));
    this.hold.update(dt);
    const s = applySkyState(ctx, this.w, this.hold.p, this.t);
    const u = this.overlay.material.uniforms;
    u.uP.value = this.hold.p; u.uQ.value = s.q;
    ctx.audio?.setProgress(s.q);
    const sky = ctx.assets.sky;
    const target = countVisible(sky.starAlt, sky.starMag, s.sqm, s.glow, ctx.tune.extinctionK);
    this.shown += (target - this.shown) * Math.min(1, dt * 12);
    this.ui.count.textContent = t("act1.count", { n: fmtInt(Math.round(this.shown), getLang()) });
    this.ui.ring(this.hold.p);
    if (this.hold.p > 0.02) this.ui.holdWrap.querySelector(".hold-btn")?.classList.remove("cta");
    show(this.ui.holdWrap, this.hold.p < 1);
    // Kamera: çekim anındaki yönelim + elle düzeltme (yerel eksenlerde)
    const qa = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -this.yaw * Math.PI / 180);
    const qb = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch * Math.PI / 180);
    this.cam.quaternion.copy(qa).multiply(this.q0).multiply(qb);
    this.cam.fov = this.vfov(); this.cam.aspect = this.aspect(); this.cam.updateProjectionMatrix();
  }

  private aspect() { return this.photo ? this.photo.w / this.photo.h : 1; }
  private vfov() { return verticalFov(this.fovLong, this.aspect()); }

  /** Fotoğrafın en-boy oranında, ekrana sığan dikdörtgen (CSS px) */
  private rect() {
    const a = this.aspect(), W = innerWidth, H = innerHeight;
    const w = Math.min(W, H * a), h = w / a;
    return { x: (W - w) / 2, y: (H - h) / 2, w, h };
  }

  render(r: THREE.WebGLRenderer) {
    r.clear();
    if (!this.photo) return;
    const R = this.rect(), H = innerHeight;
    r.setScissorTest(true);
    r.setViewport(R.x, H - R.y - R.h, R.w, R.h); r.setScissor(R.x, H - R.y - R.h, R.w, R.h);
    r.render(this.w.scene, this.cam);                    // gerçek gökyüzü (Perde 1 dünyası: kubbe + yıldızlar)
    r.render(this.oScene, this.oCam);                    // fotoğraf + maske
    r.setScissorTest(false);
    r.setViewport(0, 0, innerWidth, innerHeight);
  }

  onResize() {}
  exit() {
    this.stopCamera();
    this.reset();
    this.w.skyline.mesh.visible = true;
    this.overlay.geometry.dispose(); this.overlay.material.dispose();
    this.ui.root.remove();
  }
}
