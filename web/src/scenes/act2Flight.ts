import * as THREE from "three";
import type { AppContext, Scene } from "../app/director";
import type { Action } from "../app/input";
import { loadCosmic, loadDataTexture, loadDetail, loadEarthTexture } from "../app/assets";
import { createStarBodyLayer } from "../render/starBody";
import { kelvinToRgb, starRadius } from "../science/stars";
import { createCosmicScene } from "../render/cosmic";
import { hFovDeg } from "../app/look";
import { createEarthLayer } from "../render/earth";
import { createDeepScene, layerFov, renderLayers, type ScaleLayer } from "../render/layers";
import { createFlightStarMaterial } from "../render/stars";
import { createSolarLayer } from "../render/solar";
import { createGalaxyParticles, createLayeredGalaxy, type GalaxyFrame } from "../render/galaxy";
import { createMarkers } from "../render/markers";
import { enuToThree } from "../science/coords";
import { AU_KM, C_KM_S, EARTH_RADIUS_KM, LY_KM, MOON_RADIUS_KM, PLANET_RADIUS_KM, SUN_RADIUS_KM } from "../science/constants";
import { dirFromAltAz } from "../science/coords";
import {
  ankaraRadiusKm, apparentMag, baseLook, earthWeight, exposureLimit, pathDir, routeFromSky, slerpDir, solarWeight,
  storyStops, Z_MAX, type Route, type StoryStop,
} from "../science/flight";
import {
  altitudeKm, cruiseSpeed, flyPlan, FreeOrientation, freeUpRef, localScaleKm, moveDirection, nearestStar, pointPlan,
  resolveCollisions, type Space,
} from "../science/freeFlight";
import { smoothstep } from "../science/visibility";
import { fmtDec, fmtKm, fmtLightTime, fmtLy } from "../ui/format";
import { el, show } from "../ui/hud";
import { getLang, t } from "../ui/i18n";
import { PickCard, type PickInfo } from "../ui/pickCard";
import { Ruler } from "../ui/ruler";
import { getSkyWorld, type SkyWorld } from "./act1Lights";

/** Yerden uzaya geçiş yüksekliği (km): altında Perde 1 gökyüzü, üstünde katmanlı görüntü. */
const SWITCH_KM = 8;

interface Target { key: string; name: string; posKm: THREE.Vector3; endKm: number; kind: "star" | "body" | "earth" | "galaxy"; dly?: number | null; rKm?: number;
  cosmic?: boolean; note?: string }

/** Uçuş dünyası: üç ölçek katmanı + serbest uçuş uzayı; bir kez kurulur (Perde 3 ve Keşif de kullanır). */
interface FlightWorld {
  layers: ScaleLayer[];
  deep: ReturnType<typeof createDeepScene>;
  starMat: THREE.ShaderMaterial;
  earth: ReturnType<typeof createEarthLayer>;
  solar: ReturnType<typeof createSolarLayer>;
  route: Route;
  space: Space;
  stops: StoryStop[];
  bodies: Target[];
  /** her kare güncellenir: katman ağırlıkları ve near için */
  state: { altKm: number; nearStarLy: number; starW: number };
  galaxies: { key: string; layered: ReturnType<typeof createLayeredGalaxy>; particles: ReturnType<typeof createGalaxyParticles>; local: boolean }[];
  here: ReturnType<typeof createMarkers>;
  cosmic: { c: ReturnType<typeof createCosmicScene>; names: Map<number, string>; data: Float32Array } | null;
  starBody: ReturnType<typeof createStarBodyLayer>;
  starOrigin: THREE.Vector3;
  detail: { ci: (number | null)[] } | null;
}

const MLY_KM = 1e6 * LY_KM;
const cosmicWeight = (z: number) => smoothstep(19.5, 20.3, z);

let world: FlightWorld | null = null;

function getFlightWorld(ctx: AppContext): FlightWorld {
  if (world) return world;
  const { sky, milkyWay } = ctx.assets;
  const lang = getLang();
  const sw = getSkyWorld(ctx);
  const starMat = createFlightStarMaterial(sky, ctx.renderer.getPixelRatio());
  const stars = new THREE.Points(sw.starGeo, starMat);                 // tek geometri, ikinci malzeme
  stars.frustumCulled = false;
  stars.renderOrder = 1;
  const deep = createDeepScene(sky, milkyWay, stars);
  const solar = createSolarLayer(sky);
  const earth = createEarthLayer(sky);
  const state = { altKm: 1, nearStarLy: 4, starW: 0 };
  const starBody = createStarBodyLayer();
  const starOrigin = new THREE.Vector3();
  const cam = () => new THREE.PerspectiveCamera(60, 1, 1, 10);
  const layers: ScaleLayer[] = [
    { name: "deep", scene: deep.scene, camera: cam(), unitKm: deep.unitKm, originKm: deep.originKm, weight: () => 1, applyWeight: () => {},
      nearFar: c => [Math.max(1e-9, Math.min(c.length() * 1e-4, state.nearStarLy * 0.3)), c.length() * 10 + 5e6] },
    { name: "star", scene: starBody.scene, camera: cam(), unitKm: SUN_RADIUS_KM, originKm: starOrigin, weight: () => state.starW,
      applyWeight: w => starBody.applyWeight(w), nearFar: c => starBody.nearFar(c) },
    { name: "solar", scene: solar.scene, camera: cam(), unitKm: solar.unitKm, originKm: solar.originKm, weight: solarWeight,
      applyWeight: w => solar.applyWeight(w), nearFar: c => solar.nearFar(c) },
    { name: "earth", scene: earth.scene, camera: cam(), unitKm: earth.unitKm, originKm: earth.originKm,
      weight: z => earthWeight(z) * smoothstep(6, 25, state.altKm),        // gece ışıkları yükselirken belirir
      applyWeight: w => earth.applyWeight(w), nearFar: c => earth.nearFar(c) },
  ];
  const r = ctx.renderer, big = ctx.assets.variant.earth === "8k";
  loadEarthTexture(r, ctx.assets.variant.earth).then(tex => earth.setNightTexture(tex)).catch(e => console.warn(e));
  // Gerçekçilik paketi R1: gündüz, Ankara karosu, Ay, Jüpiter (arka planda)
  loadDataTexture(r, `earth_day_${big ? "8k" : "4k"}.jpg`).then(t => earth.setDayTexture(t)).catch(e => console.warn(e));
  loadDataTexture(r, "ankara_night_2k.jpg").then(t => earth.setPatchTexture(t)).catch(e => console.warn(e));
  loadDataTexture(r, `moon_${big ? "4k" : "2k"}.jpg`).then(t => earth.setMoonTexture(t)).catch(e => console.warn(e));
  loadDataTexture(r, "planet_jupiter.jpg").then(t => solar.setJupiterTexture(t)).catch(e => console.warn(e));

  const route = routeFromSky(sky);
  const m = sky.meta;
  const earthCenter = new THREE.Vector3(0, -ankaraRadiusKm(m.location.height_m), 0);
  const moonKm = dirFromAltAz(m.moon.alt, m.moon.az).multiplyScalar(m.moon.distance_km);
  const sunKm = solar.sunPos.clone().multiplyScalar(AU_KM);
  const voyKm = solar.voyagerPos.clone().multiplyScalar(AU_KM);
  const planets = solar.bodies.map(({ b, pos }) => ({ b, posKm: pos.clone().multiplyScalar(AU_KM), r: PLANET_RADIUS_KM[b.key] ?? 3000 }));
  const space: Space = {
    earthCenter, surfaceKm: ankaraRadiusKm(m.location.height_m),
    bodies: [
      { key: "moon", pos: moonKm, radiusKm: MOON_RADIUS_KM, minDistKm: 1.5 * MOON_RADIUS_KM },
      { key: "sun", pos: sunKm, radiusKm: SUN_RADIUS_KM, minDistKm: 1.5 * SUN_RADIUS_KM },
      ...planets.map(p => ({ key: p.b.key, pos: p.posKm, radiusKm: p.r, minDistKm: 1.5 * p.r })),
      { key: "voyager", pos: voyKm, radiusKm: 0, minDistKm: 100 },
    ],
    starPosLy: sw.starGeo.getAttribute("position").array as Float32Array,
  };
  const nep = planets.find(p => p.b.key === "neptune")!;
  const stops = storyStops(sky, route, { moon: moonKm, sun: sunKm, neptune: nep.posKm, voyager: voyKm },
    { moon: MOON_RADIUS_KM, sun: SUN_RADIUS_KM, neptune: nep.r }, earthCenter);
  const bodies: Target[] = [
    { key: "earth", name: t("body.earth"), posKm: earthCenter, endKm: 0, kind: "earth" },
    { key: "moon", name: t("body.moon"), posKm: moonKm, endKm: 6 * MOON_RADIUS_KM, kind: "body" },
    { key: "sun", name: t("body.sun"), posKm: sunKm, endKm: 30 * SUN_RADIUS_KM, kind: "body" },
    ...planets.map(p => ({ key: p.b.key, name: lang === "tr" ? p.b.name_tr : p.b.name_en, posKm: p.posKm, endKm: 6 * p.r, kind: "body" as const })),
    { key: "voyager", name: t("body.voyager"), posKm: voyKm, endKm: 50_000, kind: "body" },
  ];
  // --- R2: galaksiler (temsili çizim; konum, yön ve boyut gerçek) ---
  const phone = matchMedia("(pointer: coarse)").matches;
  const v3 = (a: number[]) => enuToThree(a[0], a[1], a[2]);
  const g = sky.frames.gal_to_enu;
  const gx = v3([g[0][0], g[1][0], g[2][0]]).normalize(), gy = v3([g[0][1], g[1][1], g[2][1]]).normalize(), gz = v3([g[0][2], g[1][2], g[2][2]]).normalize();
  const maps = sky.realism.galaxy_maps;
  const galaxies: FlightWorld["galaxies"] = [];
  const addGalaxy = (key: string, f: GalaxyFrame, local: boolean, planes: number, count: number, spiral: boolean, radiusLy: number, sunLocal?: THREE.Vector3) => {
    const m = maps[key];
    const layered = createLayeredGalaxy(f, { halfLy: m.half_kly * 1000, hDiskLy: m.h_disk_kly * 1000, hBulgeLy: m.h_bulge_kly * 1000, rBulgeLy: m.r_bulge_kly * 1000 }, planes);
    layered.group.traverse(o => { o.renderOrder = 2; });
    const particles = createGalaxyParticles(f, count, { sunLocal, nearR: radiusLy, spiral, radiusK: spiral ? radiusLy : radiusLy * 0.5 });
    particles.obj.renderOrder = 3;
    deep.scene.add(layered.group, particles.obj);
    loadDataTexture(r, `galaxy_${key}.webp`, { srgb: false }).then(tx => { tx.wrapS = tx.wrapT = THREE.ClampToEdgeWrapping; layered.setMap(tx); }).catch(e => console.warn(e));
    galaxies.push({ key, layered, particles, local });
  };
  const mwCenter = gx.clone().multiplyScalar(26_700);                 // GRAVITY 2019 (§3.13)
  addGalaxy("mw", { center: mwCenter, x: gx, y: gy, n: gz }, false, phone ? 16 : 32, phone ? 6_000 : 15_000, true, 50_000, new THREE.Vector3(-26_700, 0, 0));
  for (const gal of sky.galaxies) {
    const center = v3(gal.enu_dir).normalize().multiplyScalar(gal.dist_ly);
    let n: THREE.Vector3, x: THREE.Vector3;
    if (gal.normal_enu && gal.major_enu) { n = v3(gal.normal_enu).normalize(); x = v3(gal.major_enu).normalize(); }
    else {                                                            // Macellan Bulutları: düzensiz, bize dönük (temsili)
      n = center.clone().normalize().negate();
      x = new THREE.Vector3().crossVectors(n, new THREE.Vector3(0, 1, 0)).normalize();
    }
    const y = new THREE.Vector3().crossVectors(n, x).normalize();
    x = new THREE.Vector3().crossVectors(y, n).normalize();
    const spiral = gal.key === "m31" || gal.key === "m33";
    const counts: Record<string, number> = { m31: phone ? 3_000 : 8_000, m33: phone ? 1_000 : 3_000, lmc: phone ? 2_000 : 5_000, smc: phone ? 800 : 2_000 };
    addGalaxy(gal.key, { center, x, y, n }, true, phone ? 10 : 20, counts[gal.key] ?? 2000, spiral, gal.draw_radius_ly);
  }
  // "Buradasın" işareti (Güneş, orijin)
  const here = createMarkers([{ pos: new THREE.Vector3(), size: 14, color: "#8FB8FF" }], 0);
  here.obj.renderOrder = 4;
  deep.scene.add(here.obj);
  // Galaksiler dokunulabilir ve "Buraya uç" hedefi
  for (const gg of galaxies) {
    const gal = sky.galaxies.find(x => x.key === gg.key);
    const R = gg.key === "mw" ? 50_000 : gal!.draw_radius_ly;
    bodies.push({ key: gg.key, name: t(`body.${gg.key}` as "body.mw"), posKm: gg.layered.frame.center.clone().multiplyScalar(LY_KM),
      endKm: 2.5 * R * LY_KM, kind: "galaxy", rKm: R * LY_KM });
  }
  // Yeni duraklar: galaksinin üstü (galaktik kuzeyden 120.000 ışık yılı, merkeze bakış) ve Yerel Grup genel görünümü
  const topPos = mwCenter.clone().addScaledVector(gz, 120_000).multiplyScalar(LY_KM);
  stops.push({ key: "galaxyTop", pos: topPos, look: mwCenter.clone().multiplyScalar(LY_KM).sub(topPos).normalize(), z: Math.log10(topPos.length()) });
  const m31c = galaxies.find(x => x.key === "m31")!.layered.frame.center;
  const mid = m31c.clone().add(mwCenter).multiplyScalar(0.5);
  const side = new THREE.Vector3().crossVectors(m31c.clone().normalize(), gz).normalize();
  const lgPos = mid.clone().addScaledVector(side, 3.2e6).addScaledVector(gz, 1.2e6).multiplyScalar(LY_KM);
  stops.push({ key: "localGroup", pos: lgPos, look: mid.clone().multiplyScalar(LY_KM).sub(lgPos).normalize(), z: Math.log10(lgPos.length()) });
  // --- R3: kozmik ölçek (2MRS). Katman veri gelince en başa (en uzak) eklenir ---
  const cosmicMeta = sky.cosmic;
  if (cosmicMeta) {
    for (const cl of cosmicMeta.clusters) {
      bodies.push({ key: `cl:${cl.key}`, name: lang === "tr" ? cl.name_tr : cl.name_en, posKm: v3(cl.enu_mly).multiplyScalar(MLY_KM),
        endKm: 12 * MLY_KM, kind: "galaxy", rKm: 5 * MLY_KM, cosmic: true, note: t("card.cluster") });
    }
    const near = (key: string, off: number) => {
      const c = v3(cosmicMeta.clusters.find(x => x.key === key)!.enu_mly).multiplyScalar(MLY_KM);
      const toHome = c.clone().normalize().negate();
      const side = new THREE.Vector3().crossVectors(c, gz).normalize();
      const pos = c.clone().addScaledVector(toHome, off * MLY_KM).addScaledVector(side, off * MLY_KM);
      return { pos, look: c.clone().sub(pos).normalize() };
    };
    const vg = near("virgo", 3), cm = near("coma", 10);
    stops.push({ key: "virgo", ...vg, z: Math.log10(vg.pos.length()) });
    stops.push({ key: "coma", ...cm, z: Math.log10(cm.pos.length()) });
    // Kozmik ağ: galaksi düzleminde 2,4 milyar ışık yılı uzaktan eve bakış — kaçınma bölgesi yandan, boş bir bant olarak görünür
    const webPos = gy.clone().multiplyScalar(2400 * MLY_KM);
    stops.push({ key: "cosmicWeb", pos: webPos, look: webPos.clone().negate().normalize(), z: Math.log10(webPos.length()) });
  }

  // "Galaksinin dışı": eve değil, Güneş ile galaksi merkezinin ortasına bak (galaksi kadraja sığsın)
  const gs = stops.find(x => x.key === "galaxy");
  if (gs) gs.look = mwCenter.clone().multiplyScalar(0.5 * LY_KM).sub(gs.pos).normalize();
  stops.sort((a, b) => a.z - b.z);

  world = { layers, deep, starMat, earth, solar, route, space, stops, bodies, state, galaxies, here, cosmic: null, starBody, starOrigin, detail: null };
  const w = world;
  loadDetail().then(d => { w.detail = d; }).catch(e => console.warn(e));
  loadCosmic().then(({ data, names }) => {
    const c = createCosmicScene(data);
    const deepCam = layers.find(L => L.name === "deep")!.camera;
    const camera = cam();
    camera.fov = deepCam.fov; camera.aspect = deepCam.aspect; camera.updateProjectionMatrix();
    layers.unshift({ name: "cosmic", scene: c.scene, camera, unitKm: MLY_KM, originKm: new THREE.Vector3(), weight: cosmicWeight,
      applyWeight: wt => { c.material.uniforms.uOpacity.value = wt; c.home.material.uniforms.uOpacity.value = wt; },
      nearFar: v => [Math.max(1e-5, v.length() * 1e-3), v.length() * 10 + 5000] });
    w.cosmic = { c, names, data };
  }).catch(e => console.warn(e));
  return world;
}

interface Plan {
  t: number; turnS: number; dur: number;
  at: ((s: number, out?: THREE.Vector3) => THREE.Vector3) | null;   // null: yalnızca dönüş
  q0: THREE.Quaternion; q1: THREE.Quaternion;
  stopIdx?: number;
}

const _v = new THREE.Vector3(), _v2 = new THREE.Vector3();
const ease = (k: number) => smoothstep(0, 1, k);

export class Act2Flight implements Scene {
  private ctx!: AppContext;
  private w!: FlightWorld;
  private sw!: SkyWorld;
  private time = 0;
  private C = new THREE.Vector3();              // km, orijin Ankara
  private ori = new FreeOrientation();
  private q = new THREE.Quaternion();
  private v = 0;                                // km/sn (işaretli)
  private plan: Plan | null = null;
  private stopIdx = -1;
  private btnThrottle = 0;
  private sinceUser = 99;
  private ascentAuto = true;
  private moved = false;
  private nearStar = { i: -1, dLy: 4 };
  private groundCam = new THREE.PerspectiveCamera();
  private act1Fov = 60;
  private act1State!: { zen: THREE.Color; hor: THREE.Color; skyLum: number; sqm: number; glow: number; k: number };
  private selected: Target | null = null;
  private homeHold: number | null = null;
  private freeHintS = 0;
  private ui!: {
    root: HTMLElement; lightVal: HTMLElement; dist: HTMLElement; ruler: Ruler; hint: HTMLElement; hint2: HTMLElement; controls: HTMLElement;
    labels: HTMLElement; lblEarth: HTMLElement; lblSolar: HTMLElement; lblStars: HTMLElement; lblExposure: HTMLElement;
    lblGalaxy: HTMLElement; lblLocal: HTMLElement; hereLabel: HTMLElement; lblCosmic: HTMLElement; lblZoa: HTMLElement;
    bodyLabels: { b: Target; e: HTMLElement }[]; card: PickCard; extra: HTMLElement;
  };

  enter(ctx: AppContext) {
    this.ctx = ctx;
    this.w = getFlightWorld(ctx);
    this.sw = getSkyWorld(ctx);
    const su = this.sw.starMat.uniforms, du = this.sw.dome.material.uniforms;
    this.act1State = { zen: du.uZenith.value.clone(), hor: du.uHorizon.value.clone(), skyLum: du.uSkyLum.value,
      sqm: su.uSqm.value, glow: su.uGlowMag.value, k: su.uExtK.value };
    const startZ = ctx.shared.startZ;
    ctx.shared.startZ = undefined;
    this.buildUi();
    ctx.input.onTap = (x, y) => this.pick(x, y);
    if (startZ != null) {                                       // ?z= → bu ölçekte rotada başla (prova için)
      const z = Math.min(Z_MAX, Math.max(0, startZ));
      const r = this.w.route;
      const d = pathDir(z, r.U, r.uCas, r.uTarget, new THREE.Vector3());
      this.C.copy(d).multiplyScalar(10 ** z);
      this.ori.f.copy(baseLook(z) === "forward" ? d : d.clone().negate());
      this.ori.u.copy(freeUpRef(this.C, this.w.space, r.north, r.ngp));
      this.ori.levelTo(this.ori.u, 1);
      this.ascentAuto = false;
      this.moved = true;
    } else {                                                    // çatıda, Perde 1'deki bakışla
      const look = ctx.shared.act1Look ?? { alt: 30, az: ctx.assets.sky.meta.view.az_deg };
      this.C.set(0, 0, 0);
      this.ori.f.copy(dirFromAltAz(look.alt, look.az));
      this.ori.u.set(0, 1, 0);
      this.ori.levelTo(new THREE.Vector3(0, 1, 0), 1);
    }
    ctx.director.setState("A2_FLIGHT");
    this.onResize(innerWidth, innerHeight);
    const g = ctx.params.goto;
    if (g) {
      const body = this.w.bodies.find(b => b.key === g);
      const si = this.w.stops.findIndex(s => s.key === g);
      const hip = /^hip:(\d+)$/.exec(g);
      const starIdx = hip ? ctx.assets.sky.stars.data.findIndex(r => r[7] === +hip[1]) : -1;
      if (body) this.flyTo(body); else if (si >= 0) this.goStop(si);
      else if (starIdx >= 0) setTimeout(() => this.flyTo(this.starTarget(starIdx)), 1500);   // ayrıntı dosyası (B−V) gelsin
    }
  }

  private buildUi() {
    const root = el("div", "act2", undefined, this.ctx.hud);
    const m = this.ctx.assets.sky.meta;
    const light = el("div", "light-counter on", undefined, root);
    el("div", "light-label", t("act2.light", { place_ablative: m.location.name_ablative, place: m.location.name }), light);
    const lightVal = el("div", "light-value", "", light);
    const dist = el("div", "light-dist", "", light);
    const ruler = new Ruler(root, this.w.stops.map(s => ({ key: s.key, z: s.z })), s => this.goStop(this.w.stops.findIndex(x => x.key === s.key)));
    show(ruler.root);
    const hint = el("div", "fly-hint", t("act2.ascend"), root);
    const hint2 = el("div", "fly-hint", t("act2.freeHint"), root);
    const controls = el("div", "fly-controls on", undefined, root);
    const mk = (label: string, dir: number) => {
      const b = el("button", "fly-btn", label, controls);
      const start = (e: PointerEvent) => { e.preventDefault(); b.setPointerCapture(e.pointerId); this.btnThrottle = dir; this.plan = null; b.classList.add("down"); };
      const end = () => { if (this.btnThrottle === dir) this.btnThrottle = 0; b.classList.remove("down"); };
      b.addEventListener("pointerdown", start);
      b.addEventListener("pointerup", end);
      b.addEventListener("pointercancel", end);
      b.addEventListener("lostpointercapture", end);
    };
    mk(t("act2.backward"), -1);
    mk(t("act2.forward"), 1);
    const extra = el("div", "fly-extra on", undefined, root);
    const home = el("button", "fly-small", t("act2.lookHome"), extra);
    home.addEventListener("pointerdown", () => { this.homeHold = performance.now(); });
    home.addEventListener("pointerup", () => {
      const long = this.homeHold != null && performance.now() - this.homeHold > 600;
      this.homeHold = null;
      if (long) this.goStop(0); else this.lookAt(new THREE.Vector3(), 1.2);        // uzun bas: eve uç
    });
    const next = el("button", "fly-small", `${t("act2.nextStop")} ›`, extra);
    next.addEventListener("click", () => this.onAction("next"));
    const labels = el("div", "layer-labels on", undefined, root);
    const lblEarth = el("div", "layer-label", t("label.earth"), labels);
    const lblSolar = el("div", "layer-label", t("label.solar"), labels);
    const lblStars = el("div", "layer-label", t("label.stars"), labels);
    const lblExposure = el("div", "layer-label exposure", t("act2.exposure"), labels);
    const lblGalaxy = el("div", "layer-label", t("label.galaxy"), labels);
    const lblLocal = el("div", "layer-label", t("label.localGroup"), labels);
    const hereLabel = el("div", "body-label here", t("act2.here"), root);
    const lblCosmic = el("div", "layer-label", t("label.cosmic"), labels);
    const lblZoa = el("div", "layer-label", t("label.zoa"), labels);
    const order = ["cl:virgo", "cl:coma", "cl:fornax", "cl:perseus", "cl:centaurus", "cl:hydra", "cl:norma", "cl:shapley", "mw", "m31", "m33", "lmc", "smc", "moon", "sun", "jupiter", "saturn", "voyager", "neptune", "uranus", "venus", "mars", "mercury"];
    const bodyLabels = this.w.bodies.filter(b => b.kind !== "earth")
      .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
      .map(b => ({ b, e: el("div", "body-label", b.name, root) }));
    const card = new PickCard(root);
    card.onFly = () => { if (this.selected) this.flyTo(this.selected); };
    this.ui = { root, lightVal, dist, ruler, hint, hint2, controls, labels, lblEarth, lblSolar, lblStars, lblExposure, lblGalaxy, lblLocal, hereLabel, lblCosmic, lblZoa, bodyLabels, card, extra };
  }

  private radiusCache = new Map<number, ReturnType<typeof starRadius>>();
  private starBodyIdx = -1;

  /** R4: yıldızın yarıçapı (yayımlanmış ya da hesaplanmış); km */
  private starInfo(i: number) {
    if (!this.radiusCache.has(i)) {
      const sky = this.ctx.assets.sky, row = sky.stars.data[i];
      const bv = this.w.detail?.ci[i] ?? 0.6;
      this.radiusCache.set(i, starRadius(row[7], row[2], row[6], bv));
    }
    return this.radiusCache.get(i)!;
  }

  /** Yıldız hedefi: kart notu (yarıçap) ve "Buraya uç" mesafesi (yarıçapın 8 katı, R4) */
  private starTarget(i: number): Target {
    const sky = this.ctx.assets.sky, P = this.w.space.starPosLy;
    const name = sky.starName(i) ?? "—";
    const info = this.starInfo(i);
    const lang = getLang();
    const note = info ? (info.measured
      ? t("card.radiusMeasured", { r: fmtDec(info.R, info.R < 10 ? 2 : 0, lang), km: fmtKm(info.R * SUN_RADIUS_KM, lang), src: info.source ?? "" })
      : t("card.radiusComputed", { r: fmtDec(info.R, info.R < 10 ? 1 : 0, lang), t: fmtDec(Math.round(info.T / 10) * 10, 0, lang) })) : undefined;
    return { key: `star:${i}`, name, posKm: new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]).multiplyScalar(LY_KM),
      endKm: info ? Math.max(8 * info.R * SUN_RADIUS_KM, 2e6) : 0.05 * LY_KM, kind: "star", dly: sky.starDly[i], note };
  }

  private layerCam(name: ScaleLayer["name"]) { return this.w.layers.find(L => L.name === name)!.camera; }

  /** Galaksiler ve 2MRS galaksilerinin yüzeyine en yakın uzaklık (km) — boşlukta hızın ölçeği */
  private galaxyGapKm(z: number) {
    let best = Infinity;
    if (z < 16) return best;
    for (const g of this.w.galaxies) best = Math.min(best, this.C.distanceTo(_v.copy(g.layered.frame.center).multiplyScalar(LY_KM)) - g.layered.shape.halfLy * LY_KM);
    const cz = this.w.cosmic;
    if (cz && z > 19) {
      const P = cz.c.positions, cx = this.C.x / MLY_KM, cy = this.C.y / MLY_KM, czz = this.C.z / MLY_KM;
      let b2 = Infinity;
      for (let i = 0; i < P.length; i += 3) {
        const dx = P[i] - cx, dy = P[i + 1] - cy, dz = P[i + 2] - czz;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < b2) b2 = d2;
      }
      best = Math.min(best, Math.sqrt(b2) * MLY_KM);
    }
    return Math.max(best, 0.05 * MLY_KM * smoothstep(19, 20, z) + 1);
  }

  // ---------- hareket planları ----------

  private lookAt(pointKm: THREE.Vector3, dur: number) {
    const f = pointKm.clone().sub(this.C).normalize();
    const q1 = this.quatFor(f);
    this.plan = { t: 0, turnS: dur, dur: 0, at: null, q0: this.q.clone(), q1 };
  }

  private quatFor(f: THREE.Vector3, atC = this.C) {
    const o = new FreeOrientation();
    o.f.copy(f).normalize();
    o.u.copy(this.ori.u);
    o.levelTo(freeUpRef(atC, this.w.space, this.w.route.north, this.w.route.ngp), 1);
    return o.quaternion();
  }

  private flyTo(tg: Target) {
    this.ui.card.hide();
    if (tg.kind === "earth") return this.goStop(0);
    const plan = flyPlan(this.C, tg.posKm, tg.endKm);
    const end = plan.at(1);
    this.plan = { t: 0, turnS: 0.8, dur: plan.dur, at: plan.at, q0: this.q.clone(), q1: this.quatFor(tg.posKm.clone().sub(this.C), this.C) };
    this.planEndLook = { pos: end, target: tg.posKm };
    this.stopIdx = -1;
    this.ascentAuto = false;
  }
  private planEndLook: { pos: THREE.Vector3; target: THREE.Vector3 } | null = null;

  private goStop(i: number) {
    const s = this.w.stops[i];
    if (!s) return;
    this.ui.card.hide();
    const plan = pointPlan(this.C, s.pos);
    this.plan = { t: 0, turnS: 0, dur: plan.dur, at: plan.at, q0: this.q.clone(), q1: this.quatFor(s.look, s.pos), stopIdx: i };
    this.planEndLook = null;
    this.ascentAuto = false;
  }

  onAction(a: Action) {
    const z = Math.log10(Math.max(this.C.length(), 1e-3));
    const atStop = this.stopIdx >= 0 && this.C.distanceTo(this.w.stops[this.stopIdx].pos) < 0.01 * this.w.stops[this.stopIdx].pos.length();
    if (a === "next") {
      const i = atStop ? this.stopIdx + 1 : this.w.stops.findIndex(s => s.z > z + 0.02);
      if (i >= 0 && i < this.w.stops.length) this.goStop(i);
    } else if (a === "back") {
      let i = atStop ? this.stopIdx - 1 : -1;
      if (!atStop) for (let k = this.w.stops.length - 1; k >= 0; k--) if (this.w.stops[k].z < z - 0.02) { i = k; break; }
      if (i >= 0) this.goStop(i);
    } else if (a === "lookBack") {
      this.lookAt(new THREE.Vector3(), 1.2);
    }
  }

  // ---------- kare ----------

  update(dt: number) {
    this.time += dt;
    const { ctx } = this;
    const { input } = ctx;
    const space = this.w.space, route = this.w.route;

    // Bakış: sürükleme ve ←/→
    const d = input.consumeDrag();
    const cam = this.layerCam("deep");
    if (d.dx || d.dy) {
      if (this.plan) this.plan = null;
      this.ori.rotate(-d.dx * hFovDeg(cam) / innerWidth, d.dy * cam.fov / innerHeight);
      this.sinceUser = 0;
      if (altitudeKm(this.C, space) > 20) this.ascentAuto = false;
    }
    const k = 60 * dt;
    if (input.keys.has("ArrowLeft")) { this.ori.rotate(-k, 0); this.sinceUser = 0; this.plan = null; }
    if (input.keys.has("ArrowRight")) { this.ori.rotate(k, 0); this.sinceUser = 0; this.plan = null; }
    if (!input.dragging) this.sinceUser += dt;

    // İleri / Geri
    const keys = input.keys;
    const keyThrottle = (keys.has("ArrowUp") || keys.has("KeyW") ? 1 : 0) - (keys.has("ArrowDown") || keys.has("KeyS") ? 1 : 0);
    const throttle = Math.max(-1, Math.min(1, this.btnThrottle + keyThrottle));
    const dz = input.consumeZoom();
    if (throttle !== 0 || dz !== 0) { this.plan = null; this.moved = true; this.stopIdx = -1; }

    this.nearStar = nearestStar(this.C, space.starPosLy);
    const sInfo = this.nearStar.i >= 0 ? this.starInfo(this.nearStar.i) : null;
    const starRkm = sInfo ? sInfo.R * SUN_RADIUS_KM : 0;
    if (this.plan) this.stepPlan(dt);
    else {
      const scale = Math.min(localScaleKm(this.C, space, this.nearStar.dLy), this.galaxyGapKm(Math.log10(Math.max(this.C.length(), 1e-3))),
        Math.max(this.nearStar.dLy * LY_KM - starRkm, 1));                 // yıldızın yüzeyine uzaklık (R4)
      const target = cruiseSpeed(scale, throttle);
      const tau = throttle !== 0 ? 0.4 : 0.6;
      this.v += (target - this.v) * (1 - Math.exp(-dt / tau));
      if (Math.abs(this.v) < 1e-9 && throttle === 0) this.v = 0;
      // Yükseliş sürerken İleri hep yukarı (kamera aşağı, Ankara'ya bakarken bile); sonra baktığın yöne
      const dir = this.ascentAuto ? _v.copy(this.C).sub(space.earthCenter).normalize() : moveDirection(this.C, space, this.ori.f, _v);
      this.C.addScaledVector(dir, this.v * dt);
      if (dz) this.C.addScaledVector(this.ori.f, scale * dz * 2.3);
      resolveCollisions(this.C, space, this.nearStar.i, sInfo ? Math.max(1.5 * starRkm, 1e5) : undefined);
    }
    const alt = altitudeKm(this.C, space);

    // Yükselişte kamera yavaşça aşağı, Ankara'ya eğilir (kullanıcı sürüklemiyorsa)
    if (this.ascentAuto && !this.plan && this.sinceUser > 2.5) {
      const la = Math.log10(Math.max(alt, 1e-3));
      const kk = smoothstep(Math.log10(20), Math.log10(300), la);
      if (kk > 0) {
        const nadir = space.earthCenter.clone().sub(this.C).normalize();
        this.ori.f.copy(slerpDir(this.ori.f.clone(), nadir, (1 - Math.exp(-dt / 1.6)) * kk));
      }
    }
    if (this.ascentAuto && alt > 2000 && throttle === 0 && !this.plan) this.ascentAuto = false;   // İleri bırakılınca serbest uçuş
    if (!this.plan) this.ori.levelTo(freeUpRef(this.C, space, route.north, route.ngp), 1 - Math.exp(-dt / 0.5));
    if (!this.plan) this.ori.quaternion(this.q);

    this.updateStarBody(sInfo);
    if (!this.ascentAuto) this.freeHintS += dt;
    const z = Math.log10(Math.max(this.C.length(), 1e-3));
    this.w.state.altKm = alt;
    this.w.state.nearStarLy = this.nearStar.dLy;
    this.updateWorlds(z, alt);
    this.updateHud(z, alt, throttle);
  }

  /** R4: en yakın yıldızı gerçek boyutlu disk olarak göster (görünen yarıçap ~1 pikseli geçince) */
  private updateStarBody(info: ReturnType<typeof starRadius>) {
    const i = this.nearStar.i, st = this.w.state;
    if (i < 0 || !info || this.w.state.altKm < 1e6) { st.starW = 0; return; }
    const P = this.w.space.starPosLy;
    this.w.starOrigin.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]).multiplyScalar(LY_KM);
    if (i !== this.starBodyIdx) {
      const [cr, cg, cb] = kelvinToRgb(info.T);                    // yakından: beyaza karıştırılmamış gerçek renk
      this.w.starBody.set(info.R, new THREE.Color().setRGB(cr, cg, cb, THREE.SRGBColorSpace));
      this.starBodyIdx = i;
    }
    const cam = this.layerCam("star");
    const rel = _v.copy(this.C).sub(this.w.starOrigin).divideScalar(SUN_RADIUS_KM);
    const rPx = this.w.starBody.update(rel, cam.fov, innerHeight, this.ctx.renderer.getPixelRatio());
    st.starW = smoothstep(0.5, 2.0, rPx);
  }

  private stepPlan(dt: number) {
    const p = this.plan!;
    p.t += dt;
    const turn = p.turnS > 0 ? ease(Math.min(1, p.t / p.turnS)) : 1;
    if (p.at) {
      const s = Math.min(1, Math.max(0, (p.t - p.turnS) / p.dur));
      p.at(s, this.C);
      const k = p.turnS > 0 ? turn : ease(s);
      this.q.copy(p.q0).slerp(p.q1, k);
      // hedefe kilitli bakış (Buraya uç): dönüş bittiyse hedefe bak
      if (p.turnS > 0 && turn >= 1 && this.planEndLook) {
        this.q.copy(this.quatFor(this.planEndLook.target.clone().sub(this.C)));
      }
      this.ori.setFromQuaternion(this.q);
      if (s >= 1) { if (p.stopIdx != null) this.stopIdx = p.stopIdx; this.plan = null; this.v = 0; this.moved = true; }
    } else {
      this.q.copy(p.q0).slerp(p.q1, turn);
      this.ori.setFromQuaternion(this.q);
      if (turn >= 1) this.plan = null;
    }
  }

  private updateWorlds(z: number, alt: number) {
    const { ctx } = this;
    const tune = ctx.tune;
    const pr = ctx.renderer.getPixelRatio();
    if (alt < SWITCH_KM + 1) {
      // Perde 1 gökyüzü: atmosfer inceldikçe gökyüzü rengi, şehir parlaması, sönüm ve titreme kaybolur; binalar aşağı kayar
      const h = Math.max(0, alt - 0.9);
      const atm = Math.exp(-h / 4);
      const a = this.act1State, v = ctx.assets.sky.meta.visibility;
      const du = this.sw.dome.material.uniforms, su = this.sw.starMat.uniforms, sk = this.sw.skyline.material.uniforms;
      du.uZenith.value.copy(a.zen).multiplyScalar(atm);
      du.uHorizon.value.copy(a.hor).multiplyScalar(atm);
      du.uSkyLum.value = 1 + (a.skyLum - 1) * atm;
      du.uExtK.value = a.k * atm;
      du.uMWGain.value = tune.uMWGain;
      su.uSqm.value = v.sqm_dark + (a.sqm - v.sqm_dark) * atm;
      su.uGlowMag.value = v.glow_dark_mag + (a.glow - v.glow_dark_mag) * atm;
      su.uExtK.value = a.k * atm;
      su.uTwinkle.value = atm;
      su.uTime.value = this.time;
      const dip = Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + h)) * 180 / Math.PI;
      sk.uDrop.value = dip + 12 * smoothstep(0, 3, h);
      sk.uOpacity.value = 1 - smoothstep(1.5, 4, h);
    }
    // R2: galaksiler (Samanyolu 16,6 → 17,4; Yerel Grup 17,6 → 18,4)
    const camLy = _v2.copy(this.C).divideScalar(LY_KM);
    for (const g of this.w.galaxies) {
      const op = g.local ? smoothstep(17.6, 18.4, z) : smoothstep(16.6, 17.4, z);
      g.layered.update(op, camLy, 1.0);
      g.particles.mat.uniforms.uOpacity.value = op * 0.07;          // ince yıldız tozu; ana görünüm katmanlardan
      g.particles.mat.uniforms.uSize.value = tune.galaxySize;
      g.particles.mat.uniforms.uPixelRatio.value = pr;
    }
    this.w.here.material.uniforms.uOpacity.value = smoothstep(16.6, 17.0, z);
    if (this.w.cosmic) {                                           // R3: 2MRS galaksileri
      const cu = this.w.cosmic.c.material.uniforms, cam = this.layerCam("cosmic");
      cu.uFocal.value = innerHeight / 2 / Math.tan(cam.fov * Math.PI / 360);
      cu.uPixelRatio.value = pr;
      this.w.cosmic.c.home.material.uniforms.uPixelRatio.value = pr;
    }
    this.w.here.material.uniforms.uPixelRatio.value = pr;
    // deep katmanı
    const dome = this.w.deep.dome;
    dome.mesh.position.copy(this.C).divideScalar(LY_KM);
    dome.material.uniforms.uMWOpacity.value = 1 - smoothstep(15.0, 16.4, z);
    dome.material.uniforms.uMWGain.value = tune.uMWGain;
    const su = this.w.starMat.uniforms;
    su.uMLim.value = exposureLimit(z);
    su.uBaseSize.value = tune.uBaseSize; su.uMaxSize.value = tune.uMaxSize; su.uFlyByMax.value = tune.uFlyByMax;
    su.uRefMag.value = tune.uRefMag; su.uIntensity.value = tune.uIntensity;
    su.uPixelRatio.value = pr;
    this.w.earth.update(z, this.time, alt);
    const voy = this.w.space.bodies.find(b => b.key === "voyager")!;
    this.w.solar.update(pr, 1 - smoothstep(0.1, 0.5, Math.abs(z - Math.log10(voy.pos.length()))),
      _v.copy(this.C).divideScalar(AU_KM), this.layerCam("solar").fov, innerHeight);
    // Yükselişte FOV Perde 1'inkinden katman FOV'una geçer
    const fov = this.act1Fov + (layerFov(innerWidth, innerHeight) - this.act1Fov) * smoothstep(Math.log10(SWITCH_KM), Math.log10(2000), Math.log10(Math.max(alt, 1e-3)));
    for (const L of this.w.layers) if (Math.abs(L.camera.fov - fov) > 1e-6) { L.camera.fov = fov; L.camera.updateProjectionMatrix(); }
  }

  private updateHud(z: number, alt: number, throttle: number) {
    const lang = getLang();
    const D = this.C.length();
    this.ui.lightVal.textContent = fmtLightTime(D / C_KM_S, lang);
    const ly = D / LY_KM;
    this.ui.dist.textContent = `${t("act2.home")}: ${fmtKm(D, lang)}${ly >= 0.01 ? ` · ${fmtLy(ly, lang)} ${t("act2.ly")}` : ""}`;
    this.ui.ruler.update(z);
    const ew = earthWeight(z) * smoothstep(6, 25, alt), sw = solarWeight(z);
    show(this.ui.lblEarth, ew > 0.5);
    show(this.ui.lblSolar, sw > 0.5);
    show(this.ui.lblStars, z > 11.8);
    show(this.ui.lblExposure, exposureLimit(z) > 6.7);
    show(this.ui.lblGalaxy, smoothstep(16.6, 17.4, z) > 0.5);
    show(this.ui.lblLocal, smoothstep(17.6, 18.4, z) > 0.5 && cosmicWeight(z) < 0.5);
    show(this.ui.lblCosmic, cosmicWeight(z) > 0.5);
    show(this.ui.lblZoa, cosmicWeight(z) > 0.5 && z > 21.5);
    this.ui.hereLabel.textContent = z > 20 ? t("act2.homeLG") : t("act2.here");
    show(this.ui.hint, !this.moved && throttle === 0);
    show(this.ui.hint2, !this.ascentAuto && this.moved && this.freeHintS < 6);
    Object.assign(this.ctx.debug, {
      "konum": `${fmtKm(D, lang)} · yükseklik ${fmtKm(Math.max(alt, 0), lang)}`,
      "z": z.toFixed(3),
      "ışık süresi": fmtLightTime(D / C_KM_S, lang),
      "hız": `${fmtKm(Math.abs(this.v), lang)}/sn`,
      "ağırlıklar": `solar ${sw.toFixed(2)} · earth ${ew.toFixed(2)}`,
      "uMLim": exposureLimit(z).toFixed(2),
      "en yakın yıldız": this.nearStar.i >= 0 ? `${this.ctx.assets.sky.starName(this.nearStar.i) ?? "adsız"} · ${fmtDec(this.nearStar.dLy, 2, lang)} ışık yılı` : "—",
      "durak": this.stopIdx >= 0 ? this.w.stops[this.stopIdx].key : "—",
      "MW merkezine açı": `${(this.ori.f.angleTo(this.w.galaxies[0].layered.frame.center.clone().multiplyScalar(LY_KM).sub(this.C)) * 180 / Math.PI).toFixed(1)}°`,
    });
  }

  // ---------- dokunma ----------

  private pick(x: number, y: number) {
    if (this.plan) { this.plan = null; return; }                 // dokunuş uçuşu durdurur
    const W = innerWidth, H = innerHeight;
    const z = Math.log10(Math.max(this.C.length(), 1e-3));
    const scr = (p: THREE.Vector3, cam: THREE.Camera) => {
      _v2.copy(p).project(cam);
      if (_v2.z >= 1 || _v2.z <= -1) return null;
      return { x: (_v2.x + 1) / 2 * W, y: (1 - _v2.y) / 2 * H };
    };
    let best: { tg: Target; d: number } | null = null;
    const consider = (tg: Target, s: { x: number; y: number } | null, radius: number) => {
      if (!s) return;
      const dd = Math.hypot(s.x - x, s.y - y);
      if (dd < radius && (!best || dd < best.d)) best = { tg, d: dd };
    };
    // Cisimler (36 px), katmanları görünürken
    const solarCam = this.layerCam("solar"), earthCam = this.layerCam("earth");
    const sw = solarWeight(z), ew = earthWeight(z);
    for (const b of this.w.bodies) {
      if (b.key === "earth") {
        if (ew > 0.2) consider(b, scr(_v.copy(b.posKm).sub(this.w.earth.originKm).divideScalar(EARTH_RADIUS_KM), earthCam), 36 + this.screenRadius(b.posKm, EARTH_RADIUS_KM, earthCam.fov));
        else if (sw > 0.2) consider(b, scr(_v.copy(b.posKm).divideScalar(AU_KM), solarCam), 36);
      } else if (b.kind === "galaxy") {
        const local = b.key !== "mw";
        const vis = b.cosmic ? cosmicWeight(z) : local ? smoothstep(17.6, 18.4, z) : smoothstep(16.6, 17.4, z);
        if (vis > 0.3) {
          consider(b, scr(_v.copy(b.posKm).divideScalar(LY_KM), this.layerCam("deep")), 36 + this.screenRadius(b.posKm, b.rKm ?? 0, this.layerCam("deep").fov) * 0.6);
        }
      } else if (b.key === "moon" && ew > 0.2) {
        consider(b, scr(_v.copy(b.posKm).sub(this.w.earth.originKm).divideScalar(EARTH_RADIUS_KM), earthCam), 36 + this.screenRadius(b.posKm, MOON_RADIUS_KM, earthCam.fov));
      } else if (sw > 0.2) {
        const r = b.key === "sun" ? SUN_RADIUS_KM : PLANET_RADIUS_KM[b.key] ?? 0;
        consider(b, scr(_v.copy(b.posKm).divideScalar(AU_KM), solarCam), 36 + this.screenRadius(b.posKm, r, solarCam.fov));
      }
    }
    if (!best) {
      // Yıldızlar (28 px), görünür olanlar (m_app < uMLim)
      const deepCam = this.layerCam("deep");
      const sky = this.ctx.assets.sky, P = this.w.space.starPosLy, shell = sky.meta.stats.nodist_shell_ly;
      const mLim = exposureLimit(z);
      const cx = this.C.x / LY_KM, cy = this.C.y / LY_KM, cz = this.C.z / LY_KM;
      for (let i = 0; i < sky.starMag.length; i++) {
        const px = P[i * 3], py = P[i * 3 + 1], pz = P[i * 3 + 2];
        const dCam = Math.hypot(px - cx, py - cy, pz - cz);
        const dHome = sky.starDly[i] ?? shell;
        if (apparentMag(sky.starMag[i], dHome, dCam) > mLim) continue;
        const s = scr(_v.set(px, py, pz), deepCam);
        if (!s) continue;
        const dd = Math.hypot(s.x - x, s.y - y);
        if (dd < 28 && (!best || dd < best.d)) {
          best = { tg: this.starTarget(i), d: dd };
        }
      }
    }
    if (!best && this.w.cosmic && cosmicWeight(z) > 0.3) {
      // 2MRS galaksileri (20 px)
      const cz = this.w.cosmic, P = cz.c.positions, cam = this.layerCam("cosmic");
      let bi = -1, bd = 20;
      for (let i = 0; i < cz.c.count; i++) {
        const s2 = scr(_v.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]), cam);
        if (!s2) continue;
        const dd = Math.hypot(s2.x - x, s2.y - y);
        if (dd < bd) { bd = dd; bi = i; }
      }
      if (bi >= 0) {
        const kind = Math.round(cz.data[bi * 6 + 4]);
        const rMly = cz.data[bi * 6 + 3] / 1000;
        best = { tg: { key: `g:${bi}`, name: cz.names.get(bi) ?? t("card.unnamed"),
          posKm: new THREE.Vector3(P[bi * 3], P[bi * 3 + 1], P[bi * 3 + 2]).multiplyScalar(MLY_KM),
          endKm: Math.max(4 * rMly, 0.3) * MLY_KM, kind: "galaxy", rKm: rMly * MLY_KM, cosmic: true,
          note: `${t(`card.kind${Math.min(3, Math.max(0, kind))}` as "card.kind0")} · ${t("card.cosmic")}` }, d: bd };
      }
    }
    const chosen = best as { tg: Target; d: number } | null;
    if (!chosen) { this.ui.card.hide(); return; }
    this.selected = chosen.tg;
    this.ui.card.open(this.cardInfo(chosen.tg));
  }

  private screenRadius(posKm: THREE.Vector3, rKm: number, fovDeg: number) {
    const d = posKm.distanceTo(this.C);
    return d > rKm ? (rKm / d) / Math.tan(fovDeg * Math.PI / 360) * innerHeight / 2 : innerHeight;
  }

  private cardInfo(tg: Target): PickInfo {
    const lang = getLang();
    if (tg.kind === "star" && tg.dly == null) return { title: tg.name, lines: [t("card.nodist")], fly: null };
    const D = tg.kind === "earth" ? 0 : tg.posKm.length();
    const lines: string[] = [];
    if (tg.kind !== "earth") {
      const ly = D / LY_KM;
      lines.push(`${t("act2.home")}: ${fmtKm(D, lang)}${ly >= 0.01 ? ` · ${fmtLy(ly, lang)} ${t("act2.ly")}` : ""}`);
      lines.push(t("card.light", { t: fmtLightTime(D / C_KM_S, lang) }));
    }
    if (["mercury", "venus", "mars", "saturn", "uranus", "neptune"].includes(tg.key)) lines.push(t("card.repTexture"));
    if (tg.key === "sun") lines.push(t("card.repGlow"));
    if (tg.note) lines.push(tg.note);
    else if (tg.kind === "galaxy") lines.push(t("card.repGalaxy"));
    return { title: tg.name, lines, fly: tg.kind === "earth" ? "home" : "here" };
  }

  // ---------- çizim ----------

  render(r: THREE.WebGLRenderer) {
    const alt = this.w.state.altKm;
    if (alt < SWITCH_KM) {
      this.groundCam.position.set(0, 0, 0);
      this.groundCam.quaternion.copy(this.q);
      this.groundCam.fov = this.act1Fov;
      this.groundCam.updateProjectionMatrix();
      r.clear();
      r.render(this.sw.scene, this.groundCam);
    } else {
      renderLayers(r, this.w.layers, this.C, this.q, Math.log10(Math.max(this.C.length(), 1e-3)));
    }
    this.placeLabels();
  }

  private placeLabels() {
    const z = Math.log10(Math.max(this.C.length(), 1e-3));
    { // "Buradasın": Güneş (orijin)
      const e = this.ui.hereLabel;
      _v.set(0, 0, 0).project(this.layerCam("deep"));
      const vis = z > 16.9 && _v.z < 1 && _v.z > -1 && Math.abs(_v.x) < 0.95 && Math.abs(_v.y) < 0.95;
      show(e, vis);
      if (vis) e.style.transform = `translate(${((_v.x + 1) / 2) * innerWidth + 12}px, ${((1 - _v.y) / 2) * innerHeight - 10}px)`;
    }
    const solarCam = this.layerCam("solar"), earthCam = this.layerCam("earth");
    const alt = this.w.state.altKm;
    const placed: { x: number; y: number }[] = [];           // çakışan etiketleri gizle (sıra: önem)
    for (const { b, e } of this.ui.bodyLabels) {
      let on = false, cam: THREE.Camera = solarCam;
      if (b.kind === "galaxy") {
        on = (b.cosmic ? cosmicWeight(z) : b.key === "mw" ? smoothstep(16.6, 17.4, z) : smoothstep(17.6, 18.4, z)) > 0.3
          && b.posKm.distanceTo(this.C) > 3 * (b.rKm ?? 0);                       // çok yakındayken etiket yok
        cam = this.layerCam("deep"); _v.copy(b.posKm).divideScalar(LY_KM);
      } else if (b.key === "moon") { on = earthWeight(z) > 0.2 && alt > SWITCH_KM; cam = earthCam; _v.copy(b.posKm).sub(this.w.earth.originKm).divideScalar(EARTH_RADIUS_KM); }
      else { on = solarWeight(z) > 0.2; _v.copy(b.posKm).divideScalar(AU_KM); }
      if (!on) { show(e, false); continue; }
      _v.project(cam);
      const x = ((_v.x + 1) / 2) * innerWidth, y = ((1 - _v.y) / 2) * innerHeight;
      const vis = _v.z < 1 && _v.z > -1 && Math.abs(_v.x) < 0.95 && Math.abs(_v.y) < 0.95
        && !placed.some(p => Math.abs(p.x - x) < 70 && Math.abs(p.y - y) < 16);
      show(e, vis);
      if (vis) { placed.push({ x, y }); e.style.transform = `translate(${x + 10}px, ${y - 10}px)`; }
    }
  }

  onResize(w: number, h: number) {
    const view = this.ctx.assets.sky.meta.view;
    this.act1Fov = w / h >= 1 ? view.vfov_landscape_deg : view.vfov_portrait_deg;
    for (const L of this.w.layers) { L.camera.aspect = w / h; L.camera.updateProjectionMatrix(); }
    this.groundCam.aspect = w / h;
    this.groundCam.near = 0.1; this.groundCam.far = 5000;
    this.groundCam.updateProjectionMatrix();
  }

  exit() {
    this.ui.root.remove();
    this.ctx.input.onTap = () => {};
    // Perde 1 gökyüzünü geri yükle (Perde 3 ve baştan başla)
    const sk = this.sw.skyline.material.uniforms;
    sk.uOpacity.value = 1; sk.uDrop.value = 0;
    this.sw.starMat.uniforms.uTwinkle.value = 1;
  }
}
