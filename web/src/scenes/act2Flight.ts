import * as THREE from "three";
import type { AppContext, Scene } from "../app/director";
import type { Action } from "../app/input";
import { loadEarthTexture } from "../app/assets";
import { hFovDeg } from "../app/look";
import { T } from "../app/timeline";
import { createEarthLayer } from "../render/earth";
import { createDeepScene, layerFov, renderLayers, type ScaleLayer } from "../render/layers";
import { SKY_COLORS } from "../render/skyDome";
import { createFlightStarMaterial } from "../render/stars";
import { createSolarLayer } from "../render/solar";
import { C_KM_S, LY_KM } from "../science/constants";
import { DEG, dirFromAltAz } from "../science/coords";
import {
  baseLook, cameraPosKm, earthWeight, exposureLimit, FlightControl, lookQuaternion, pathDir, routeFromSky,
  solarWeight, stopsFromSky, upRef, Z_MIN, type Look, type Route, type Stop,
} from "../science/flight";
import { smoothstep } from "../science/visibility";
import { fmtDec, fmtLightTime } from "../ui/format";
import { el, show } from "../ui/hud";
import { getLang, t } from "../ui/i18n";
import { Ruler } from "../ui/ruler";
import { getSkyWorld } from "./act1Lights";

/** Uçuş dünyası: üç ölçek katmanı; bir kez kurulur, Perde 3 ve Keşif de kullanır (SPEC §6.12). */
interface FlightWorld {
  layers: ScaleLayer[];
  deep: ReturnType<typeof createDeepScene>;
  starMat: THREE.ShaderMaterial;
  earth: ReturnType<typeof createEarthLayer>;
  solar: ReturnType<typeof createSolarLayer>;
  route: Route;
  stops: Stop[];
  starPos: Float32Array;
}

let world: FlightWorld | null = null;

function getFlightWorld(ctx: AppContext): FlightWorld {
  if (world) return world;
  const { sky, milkyWay } = ctx.assets;
  const sw = getSkyWorld(ctx);
  const starMat = createFlightStarMaterial(sky, ctx.renderer.getPixelRatio());
  const stars = new THREE.Points(sw.starGeo, starMat);                 // tek geometri, ikinci malzeme
  stars.frustumCulled = false;
  stars.renderOrder = 1;
  const deep = createDeepScene(sky, milkyWay, stars);
  const solar = createSolarLayer(sky);
  const earth = createEarthLayer(sky);
  const cam = () => new THREE.PerspectiveCamera(60, 1, 1, 10);
  const layers: ScaleLayer[] = [
    { name: "deep", scene: deep.scene, camera: cam(), unitKm: deep.unitKm, originKm: deep.originKm, weight: () => 1,
      applyWeight: () => {}, nearFar: d => [Math.max(1e-6, d * 1e-4), d * 10 + 5e6] },
    { name: "solar", scene: solar.scene, camera: cam(), unitKm: solar.unitKm, originKm: solar.originKm, weight: solarWeight,
      applyWeight: w => solar.applyWeight(w), nearFar: d => solar.nearFar(d) },
    { name: "earth", scene: earth.scene, camera: cam(), unitKm: earth.unitKm, originKm: earth.originKm, weight: earthWeight,
      applyWeight: w => earth.applyWeight(w), nearFar: d => earth.nearFar(d) },
  ];
  loadEarthTexture(ctx.renderer, ctx.assets.variant.earth).then(tex => earth.setNightTexture(tex)).catch(e => console.warn(e));
  world = {
    layers, deep, starMat, earth, solar, route: routeFromSky(sky), stops: stopsFromSky(sky),
    starPos: sw.starGeo.getAttribute("position").array as Float32Array,
  };
  return world;
}

const smooth01 = (x: number) => smoothstep(0, 1, x);
const opposite = (l: Look): Look => (l === "back" ? "forward" : "back");
const _v = new THREE.Vector3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler();

export class Act2Flight implements Scene {
  private ctx!: AppContext;
  private w!: FlightWorld;
  private phase: "takeoff" | "flight" = "takeoff";
  private tTake = 0;
  private time = 0;
  private fc = new FlightControl();
  private stopZ: number[] = [];
  // bakış
  private look: Look = "back";
  private lookFrom: Look | null = null;
  private lookT = 0;
  private flip = false;
  private windowLook: Look = "back";
  private yaw = 0; private pitch = 0;              // kullanıcı ofseti (derece)
  private sinceUser = 99;
  // çerçeve
  private camPosKm = new THREE.Vector3();
  private q = new THREE.Quaternion();
  private idleS = 0;
  private btnThrottle = 0;
  // kalkış
  private takeCam = new THREE.PerspectiveCamera();
  private takeFrom = { alt: 30, az: 80 };
  private ui!: {
    root: HTMLElement; light: HTMLElement; lightVal: HTMLElement; ruler: Ruler; hint: HTMLElement; controls: HTMLElement;
    labels: HTMLElement; lblEarth: HTMLElement; lblSolar: HTMLElement; lblStars: HTMLElement; lblExposure: HTMLElement;
    moon: HTMLElement; voyager: HTMLElement;
  };

  enter(ctx: AppContext) {
    this.ctx = ctx;
    this.w = getFlightWorld(ctx);
    this.stopZ = this.w.stops.map(s => s.z);
    this.fc.vMax = ctx.tune.vMax;
    const startZ = ctx.shared.startZ;
    ctx.shared.startZ = undefined;
    this.buildUi();
    if (startZ != null) {
      this.startFlight(Math.min(19.318, Math.max(Z_MIN, startZ)));
    } else {
      this.phase = "takeoff";
      this.takeFrom = ctx.shared.act1Look ?? { alt: 30, az: ctx.assets.sky.meta.view.az_deg };
      ctx.director.setState("A2_TAKEOFF");
    }
    this.onResize(innerWidth, innerHeight);
  }

  private buildUi() {
    const m = this.ctx.assets.sky.meta;
    const root = el("div", "act2", undefined, this.ctx.hud);
    const light = el("div", "light-counter", undefined, root);
    el("div", "light-label", t("act2.light", { place_ablative: m.location.name_ablative, place: m.location.name }), light);
    const lightVal = el("div", "light-value", "", light);
    const ruler = new Ruler(root, this.w.stops, s => { this.fc.goTo(s.z); this.idleS = 0; });
    const hint = el("div", "fly-hint", t("act2.hint"), root);
    const controls = el("div", "fly-controls", undefined, root);
    const mk = (label: string, dir: number) => {
      const b = el("button", "fly-btn", label, controls);
      const start = (e: PointerEvent) => { e.preventDefault(); b.setPointerCapture(e.pointerId); this.btnThrottle = dir; this.fc.cancelGoTo(); b.classList.add("down"); };
      const end = () => { if (this.btnThrottle === dir) this.btnThrottle = 0; b.classList.remove("down"); };
      b.addEventListener("pointerdown", start);
      b.addEventListener("pointerup", end);
      b.addEventListener("pointercancel", end);
      b.addEventListener("lostpointercapture", end);
    };
    mk(t("act2.backward"), -1);
    mk(t("act2.forward"), 1);
    const labels = el("div", "layer-labels", undefined, root);
    const lblEarth = el("div", "layer-label", t("label.earth"), labels);
    const lblSolar = el("div", "layer-label", t("label.solar"), labels);
    const lblStars = el("div", "layer-label", t("label.stars"), labels);
    const lblExposure = el("div", "layer-label exposure", t("act2.exposure"), labels);
    const moon = el("div", "body-label", t("body.moon"), root);
    const voyager = el("div", "body-label", t("body.voyager"), root);
    this.ui = { root, light, lightVal, ruler, hint, controls, labels, lblEarth, lblSolar, lblStars, lblExposure, moon, voyager };
  }

  private startFlight(z: number) {
    this.phase = "flight";
    this.fc.z = z;
    this.look = this.windowLook = baseLook(z);
    this.lookFrom = null;
    this.ctx.director.setState("A2_FLIGHT");
    show(this.ui.light); show(this.ui.controls); show(this.ui.ruler.root); show(this.ui.labels);
  }

  onAction(a: Action) {
    if (this.phase !== "flight") return;
    const z = this.fc.z;
    if (a === "next") {
      const s = this.w.stops.find(s => s.z > z + 0.02);
      if (s) this.fc.goTo(s.z);
    } else if (a === "back") {
      const s = [...this.w.stops].reverse().find(s => s.z < z - 0.02);
      this.fc.goTo(s ? s.z : Z_MIN);
    } else if (a === "lookBack") {
      this.flip = !this.flip;
    }
    this.idleS = 0;
  }

  update(dt: number) {
    this.time += dt;
    if (this.phase === "takeoff") return this.updateTakeoff(dt);
    const { ctx, fc } = this;
    const keys = ctx.input.keys;
    fc.vMax = ctx.tune.vMax;
    const keyThrottle = (keys.has("ArrowUp") || keys.has("KeyW") ? 1 : 0) - (keys.has("ArrowDown") || keys.has("KeyS") ? 1 : 0);
    fc.throttle = Math.max(-1, Math.min(1, this.btnThrottle + keyThrottle));
    const dz = ctx.input.consumeZoom();
    if (fc.throttle !== 0 || dz !== 0) fc.cancelGoTo();
    fc.update(dt, this.stopZ, dz);
    const busy = fc.throttle !== 0 || dz !== 0 || fc.flying;
    this.idleS = busy ? 0 : this.idleS + dt;
    show(this.ui.hint, this.idleS > T.act2.idleHintS);

    this.updateLook(dt);
    const z = fc.z;
    cameraPosKm(z, pathDir(z, this.w.route.U, this.w.route.uCas, this.w.route.uTarget, _v), this.camPosKm);

    // deep katmanı
    const tune = ctx.tune;
    const dome = this.w.deep.dome;
    dome.mesh.position.copy(this.camPosKm).divideScalar(LY_KM);
    dome.material.uniforms.uMWOpacity.value = 1 - smoothstep(15.0, 16.4, z);
    dome.material.uniforms.uMWGain.value = tune.uMWGain;
    const su = this.w.starMat.uniforms;
    const mLim = exposureLimit(z);
    su.uMLim.value = mLim;
    su.uBaseSize.value = tune.uBaseSize; su.uMaxSize.value = tune.uMaxSize; su.uFlyByMax.value = tune.uFlyByMax;
    su.uRefMag.value = tune.uRefMag; su.uIntensity.value = tune.uIntensity;
    su.uPixelRatio.value = ctx.renderer.getPixelRatio();
    this.w.earth.update(z, this.time);
    const voyStop = this.w.stops.find(s => s.key === "voyager")!.z;
    this.w.solar.update(ctx.renderer.getPixelRatio(), 1 - smoothstep(0.15, 0.4, Math.abs(z - voyStop)));

    // HUD
    const lang = getLang();
    this.ui.lightVal.textContent = fmtLightTime(10 ** z / C_KM_S, lang);
    this.ui.ruler.update(z);
    const ew = earthWeight(z), sw = solarWeight(z);
    show(this.ui.lblEarth, ew > 0.5);
    show(this.ui.lblSolar, sw > 0.5);
    show(this.ui.lblStars, z > 11.8);
    show(this.ui.lblExposure, mLim > 6.7);

    // Bilim paneli
    const camLy = _v.copy(this.camPosKm).divideScalar(LY_KM);
    const near = this.nearestStar(camLy);
    Object.assign(ctx.debug, {
      "z": z.toFixed(3),
      "D": `${(10 ** z).toExponential(3)} km · ${fmtDec(10 ** z / LY_KM, 4, lang)} ışık yılı`,
      "ışık süresi": fmtLightTime(10 ** z / C_KM_S, lang),
      "ağırlıklar": `deep 1 · solar ${sw.toFixed(2)} · earth ${ew.toFixed(2)}`,
      "uMLim": mLim.toFixed(2),
      "bakış": `${this.look}${this.flip ? " (çevrildi)" : ""}`,
      "en yakın yıldız": near.i >= 0 ? `${ctx.assets.sky.starName(near.i) ?? "adsız"} · ${fmtDec(near.d, 2, lang)} ışık yılı` : "—",
    });
  }

  private nearestStar(c: THREE.Vector3) {
    const p = this.w.starPos;
    let best = Infinity, bi = -1;
    for (let i = 0; i < p.length; i += 3) {
      const dx = p[i] - c.x, dy = p[i + 1] - c.y, dz = p[i + 2] - c.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < best) { best = d2; bi = i / 3; }
    }
    return { i: bi, d: Math.sqrt(best) };
  }

  private baseQuat(z: number, look: Look, out: THREE.Quaternion) {
    const r = this.w.route;
    const d = pathDir(z, r.U, r.uCas, r.uTarget, new THREE.Vector3());
    if (look === "back") d.negate();
    return lookQuaternion(d, upRef(z, r), out);
  }

  private updateLook(dt: number) {
    const z = this.fc.z;
    const win = baseLook(z);
    if (win !== this.windowLook) { this.windowLook = win; this.flip = false; }   // "Geriye bak" bir sonraki pencereye kadar
    const want = this.flip ? opposite(win) : win;
    if (want !== this.look) { this.lookFrom = this.look; this.look = want; this.lookT = 0; }
    this.baseQuat(z, this.look, this.q);
    if (this.lookFrom) {
      this.lookT += dt;
      const k = smooth01(this.lookT / T.act2.lookTurnS);
      this.baseQuat(z, this.lookFrom, _q1);
      this.q.copy(_q1.slerp(this.q, k));
      if (k >= 1) this.lookFrom = null;
    }
    // Kullanıcı ofseti: sürükleme ve ←/→; bırakınca 2 sn'de sıfıra döner (§6.3)
    const { input } = this.ctx;
    const d = input.consumeDrag();
    const cam = this.w.layers[0].camera;
    if (d.dx || d.dy) {
      this.yaw += d.dx * hFovDeg(cam) / innerWidth;
      this.pitch += d.dy * cam.fov / innerHeight;
      this.sinceUser = 0;
    }
    const k = 60 * dt;
    if (input.keys.has("ArrowLeft")) { this.yaw -= k; this.sinceUser = 0; }
    if (input.keys.has("ArrowRight")) { this.yaw += k; this.sinceUser = 0; }
    if (!input.dragging) this.sinceUser += dt;
    this.pitch = Math.max(-80, Math.min(80, this.pitch));
    if (this.sinceUser > 0.3 && !input.dragging) {
      const decay = Math.exp(-dt / 0.5);                     // ~2 sn'de sıfıra yakın
      this.yaw *= decay; this.pitch *= decay;
    }
    _e.set(this.pitch * DEG, this.yaw * DEG, 0, "YXZ");
    this.q.multiply(_q2.setFromEuler(_e));                   // q = qBase · qUser
  }

  private updateTakeoff(dt: number) {
    this.tTake += dt;
    const tk = T.act2.takeoff;
    const s = this.ctx.assets.sky;
    const sw = getSkyWorld(this.ctx);
    const k = smooth01(this.tTake / tk.turn);
    const alt = this.takeFrom.alt + (88 - this.takeFrom.alt) * k;
    this.takeCam.up.set(0, 1, 0);
    this.takeCam.lookAt(dirFromAltAz(alt, this.takeFrom.az));
    // atmosferin üstüne çıkma: sönüm ve titreme 0, siluet ve ufuk rengi söner, Samanyolu tam
    const du = sw.dome.material.uniforms;
    du.uExtK.value = s.meta.visibility.extinction_k * (1 - k);
    du.uZenith.value.copy(SKY_COLORS.dark.zenith).multiplyScalar(1 - k);
    du.uHorizon.value.copy(SKY_COLORS.dark.horizon).multiplyScalar(1 - k);
    du.uMWOpacity.value = 1;
    const su = sw.starMat.uniforms;
    su.uExtK.value = s.meta.visibility.extinction_k * (1 - k);
    su.uTwinkle.value = 1 - k;
    su.uTime.value = this.time;
    sw.skyline.material.uniforms.uOpacity.value = 1 - k;
    if (this.tTake >= tk.turn && this.tTake - dt < tk.turn) this.ctx.director.fadeTo(1, tk.fadeOut * 1000);
    if (this.tTake >= tk.turn + tk.fadeOut) {
      this.startFlight(Z_MIN);
      this.ctx.director.fadeTo(0, tk.fadeIn * 1000);
    }
  }

  render(r: THREE.WebGLRenderer) {
    if (this.phase === "takeoff") {
      r.clear();
      r.render(getSkyWorld(this.ctx).scene, this.takeCam);
      return;
    }
    renderLayers(r, this.w.layers, this.camPosKm, this.q, this.fc.z);
    this.placeBodyLabel(this.ui.moon, this.w.layers[2].camera, this.w.earth.moonPos, earthWeight(this.fc.z) > 0.2);
    this.placeBodyLabel(this.ui.voyager, this.w.layers[1].camera, this.w.solar.voyagerPos,
      solarWeight(this.fc.z) > 0.2 && this.fc.z > 9.5);
  }

  private placeBodyLabel(e: HTMLElement, cam: THREE.PerspectiveCamera, p: THREE.Vector3, on: boolean) {
    if (!on) { show(e, false); return; }
    _v.copy(p).project(cam);
    const vis = _v.z < 1 && Math.abs(_v.x) < 0.95 && Math.abs(_v.y) < 0.95;
    show(e, vis);
    if (vis) e.style.transform = `translate(${((_v.x + 1) / 2) * innerWidth + 10}px, ${((1 - _v.y) / 2) * innerHeight - 10}px)`;
  }

  onResize(w: number, h: number) {
    const fov = layerFov(w, h);
    for (const L of this.w.layers) { L.camera.fov = fov; L.camera.aspect = w / h; L.camera.updateProjectionMatrix(); }
    const view = this.ctx.assets.sky.meta.view;
    this.takeCam.fov = w / h >= 1 ? view.vfov_landscape_deg : view.vfov_portrait_deg;
    this.takeCam.aspect = w / h;
    this.takeCam.near = 0.1; this.takeCam.far = 5000;
    this.takeCam.updateProjectionMatrix();
  }

  exit() {
    this.ui.root.remove();
    const sw = getSkyWorld(this.ctx);                         // Perde 1 gökyüzünü geri yükle (Perde 3 ve baştan başla)
    sw.skyline.material.uniforms.uOpacity.value = 1;
    sw.starMat.uniforms.uTwinkle.value = 1;
  }
}

