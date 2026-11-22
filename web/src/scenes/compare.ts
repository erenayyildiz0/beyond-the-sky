import * as THREE from "three";
import { loadDataTexture } from "../app/assets";
import type { AppContext, Scene } from "../app/director";
import type { Action } from "../app/input";
import vert from "../render/shaders/planet.vert.glsl?raw";
import planetFrag from "../render/shaders/planet.frag.glsl?raw";
import { PLANET_LOOK } from "../render/solar";
import { applyStarLook, createStarSurfaceMaterial } from "../render/starSurface";
import { createBlackHole } from "../render/blackHole";
import { createPulsar } from "../render/pulsar";
import { precompile } from "../render/layers";
import { EARTH_RADIUS_KM, MOON_RADIUS_KM, PLANET_RADIUS_KM, RS_KM_PER_MSUN, SUN_RADIUS_KM } from "../science/constants";
import { kelvinToRgb, PUBLISHED_RADII } from "../science/stars";
import { smoothstep } from "../science/visibility";
import { fmtDec, fmtInt, fmtKm } from "../ui/format";
import { el, show } from "../ui/hud";
import { getLang, t } from "../ui/i18n";

/** Karşılaştırılan cisim: yarıçap (km) ve kaynak. Yalnızca kaynaklı değerler (R4, docs/EXTRAS.md). */
interface Item {
  key: string; tr: string; en: string; rKm: number; source: string;
  // gezegen görünümü · yıldız sıcaklığı (K) · pulsar (dönme frekansı, Hz) · kara delik (olay ufku; disk temsili)
  look: { kind: number; color: string; map?: string } | { star: number } | { pulsarHz: number } | { bh: true };
  note?: { tr: string; en: string };
}

const bhR = (mSun: number) => mSun * RS_KM_PER_MSUN;
// Antares: sınır kararmalı açısal çap θ = 37,38 mas (Ohnaka ve ark. 2013, A&A 555, A24), paralaks 5,89 mas
// (van Leeuwen 2007, Hipparcos) → R = (θ/2)·d ≈ 682 R☉
const ANTARES_R_SUN = (37.38 / 2) / 5.89 * 215.032;

const NASA = "NASA Planetary Fact Sheet";
export const ITEMS: Item[] = [
  { key: "psr", tr: "Pulsar PSR J0030+0451", en: "Pulsar PSR J0030+0451", rKm: 12.71, source: "Riley ve ark. 2019, ApJL 887, L21 (NICER)",
    look: { pulsarHz: 205.53 },
    note: { tr: "Nötron yıldızı: 1,34 Güneş kütlesi bir şehir boyutunda; saniyede 205 tur döner (burada çok yavaşlatıldı). Işın demetleri temsili.",
            en: "Neutron star: 1.34 solar masses in a city-sized ball, spinning 205 times a second (slowed down here). Beams are illustrative." } },
  { key: "cygx1", tr: "Cygnus X-1 (kara delik)", en: "Cygnus X-1 (black hole)", rKm: bhR(21.2), source: "Miller-Jones ve ark. 2021, Science 371, 1046 (21,2 M☉); Rs = 2GM/c²",
    look: { bh: true },
    note: { tr: "Olay ufku yarıçapı. Işığın bükülmesi Schwarzschild çözümünden hesaplanır; toplanma diski temsili.",
            en: "Event-horizon radius. Light bending is computed from the Schwarzschild solution; the accretion disc is illustrative." } },
  { key: "moon", tr: "Ay", en: "Moon", rKm: MOON_RADIUS_KM, source: NASA, look: { kind: 0, color: "#a0a0a0", map: "moon_2k.jpg" } },
  { key: "mercury", tr: "Merkür", en: "Mercury", rKm: PLANET_RADIUS_KM.mercury, source: NASA, look: { kind: 1, color: "#8C8780", map: "planet_mercury.jpg" } },
  { key: "mars", tr: "Mars", en: "Mars", rKm: PLANET_RADIUS_KM.mars, source: NASA, look: { kind: 3, color: "#C26B40", map: "planet_mars.jpg" } },
  { key: "siriusb", tr: "Sirius B (beyaz cüce)", en: "Sirius B (white dwarf)", rKm: 0.008098 * SUN_RADIUS_KM, source: "Bond ve ark. 2017, ApJ 840, 70",
    look: { star: 25369 },
    note: { tr: "Beyaz cüce: Dünya'dan küçük, ama kütlesi Güneş'inki kadar (1,02 M☉).", en: "White dwarf: smaller than Earth, yet as massive as the Sun (1.02 M☉)." } },
  { key: "venus", tr: "Venüs", en: "Venus", rKm: PLANET_RADIUS_KM.venus, source: NASA, look: { kind: 2, color: "#EDD9A8", map: "planet_venus.jpg" } },
  { key: "earth", tr: "Dünya", en: "Earth", rKm: EARTH_RADIUS_KM, source: NASA, look: { kind: 0, color: "#3366aa", map: "earth_day_4k.jpg" } },
  { key: "neptune", tr: "Neptün", en: "Neptune", rKm: PLANET_RADIUS_KM.neptune, source: NASA, look: { kind: 6, color: "#5679D9", map: "planet_neptune.jpg" } },
  { key: "uranus", tr: "Uranüs", en: "Uranus", rKm: PLANET_RADIUS_KM.uranus, source: NASA, look: { kind: 5, color: "#AEDCE6", map: "planet_uranus.jpg" } },
  { key: "saturn", tr: "Satürn", en: "Saturn", rKm: PLANET_RADIUS_KM.saturn, source: NASA, look: { kind: 4, color: "#E3CC99", map: "planet_saturn.jpg" } },
  { key: "jupiter", tr: "Jüpiter", en: "Jupiter", rKm: PLANET_RADIUS_KM.jupiter, source: NASA, look: { kind: 0, color: "#D8C3A0", map: "planet_jupiter.jpg" } },
  { key: "trappist1", tr: "TRAPPIST-1", en: "TRAPPIST-1", rKm: 0.1192 * SUN_RADIUS_KM, source: "Agol ve ark. 2021, PSJ 2, 1", look: { star: 2566 },
    note: { tr: "Yedi Dünya boyutlu gezegeni olan kırmızı cüce; Jüpiter'den biraz büyük.", en: "Red dwarf with seven Earth-sized planets; only a little larger than Jupiter." } },
  { key: "proxima", tr: "Proxima Centauri", en: "Proxima Centauri", rKm: 0.1542 * SUN_RADIUS_KM, source: "Boyajian ve ark. 2012, ApJ 757, 112", look: { star: 3042 } },
  { key: "sun", tr: "Güneş", en: "Sun", rKm: SUN_RADIUS_KM, source: "IAU 2015 B3", look: { star: 5772 } },
  { key: "alphacena", tr: "Alfa Erboğa A", en: "Alpha Centauri A", rKm: 1.2234 * SUN_RADIUS_KM, source: "Kervella ve ark. 2017, A&A 597, A137", look: { star: 5795 } },
  { key: "sirius", tr: "Sirius A", en: "Sirius A", rKm: PUBLISHED_RADII[32349].R * SUN_RADIUS_KM, source: PUBLISHED_RADII[32349].source, look: { star: 9940 } },
  { key: "sgra", tr: "Sgr A* (Samanyolu'nun merkezindeki kara delik)", en: "Sgr A* (the Milky Way's central black hole)", rKm: bhR(4.297e6),
    source: "GRAVITY Collaboration 2022, A&A 657, L12 (4,297 milyon M☉); Rs = 2GM/c²", look: { bh: true },
    note: { tr: "Olay ufku, Merkür'ün yörüngesinin beşte biri kadar. Gölgesi ~2,6 kat büyük görünür (EHT 2022'de fotoğrafladı).",
            en: "Its event horizon is a fifth of Mercury's orbit. The shadow looks ~2.6 times larger (imaged by the EHT in 2022)." } },
  { key: "arcturus", tr: "Arcturus", en: "Arcturus", rKm: PUBLISHED_RADII[69673].R * SUN_RADIUS_KM, source: PUBLISHED_RADII[69673].source, look: { star: 4286 } },
  { key: "aldebaran", tr: "Aldebaran", en: "Aldebaran", rKm: PUBLISHED_RADII[21421].R * SUN_RADIUS_KM, source: PUBLISHED_RADII[21421].source, look: { star: 3910 } },
  { key: "rigel", tr: "Rigel", en: "Rigel", rKm: PUBLISHED_RADII[24436].R * SUN_RADIUS_KM, source: PUBLISHED_RADII[24436].source, look: { star: 12100 } },
  { key: "deneb", tr: "Deneb", en: "Deneb", rKm: 203 * SUN_RADIUS_KM, source: "Schiller & Przybilla 2008, A&A 479, 849", look: { star: 8525 } },
  { key: "antares", tr: "Antares", en: "Antares", rKm: ANTARES_R_SUN * SUN_RADIUS_KM, source: "Ohnaka ve ark. 2013, A&A 555, A24 (açısal çap) + Hipparcos uzaklığı (van Leeuwen 2007)", look: { star: 3660 } },
  { key: "betelgeuse", tr: "Betelgeuse", en: "Betelgeuse", rKm: PUBLISHED_RADII[27989].R * SUN_RADIUS_KM, source: PUBLISHED_RADII[27989].source, look: { star: 3600 } },
  { key: "vycma", tr: "VY Canis Majoris", en: "VY Canis Majoris", rKm: 1420 * SUN_RADIUS_KM, source: "Wittkowski ve ark. 2012, A&A 540, L12", look: { star: 3490 } },
  { key: "m87", tr: "M87* (dev kara delik)", en: "M87* (supermassive black hole)", rKm: bhR(6.5e9), source: "EHT Collaboration 2019, ApJL 875, L6 (6,5 milyar M☉); Rs = 2GM/c²",
    look: { bh: true },
    note: { tr: "İlk fotoğraflanan kara delik (2019). Olay ufku Güneş Sistemi'nin gezegenlerini rahatça içine alır.",
            en: "The first black hole ever imaged (2019). Its event horizon would swallow every planetary orbit of the Solar System." } },
];
/** Yerleşim ve çerçeve çarpanları: kara deliğin diski ve gölgesi, pulsarın ışınları yarıçapın dışına taşar */
const EXT = (it: Item) => ("bh" in it.look ? 9 : "pulsarHz" in it.look ? 3 : 1);
const FRAME = (it: Item) => ("bh" in it.look ? 3 : 1);
// Yıldız sıcaklıkları (yalnızca renk için): Sirius A 9.940 K, Arcturus 4.286 K (Ramírez & Allende Prieto 2011),
// Aldebaran 3.910 K, Rigel 12.100 K (Przybilla 2006), Betelgeuse ~3.600 K (Levesque 2005), VY CMa 3.490 K (Wittkowski 2012),
// Proxima 3.042 K (Boyajian 2012), Sirius B 25.369 K (Bond 2017), TRAPPIST-1 2.566 K (Agol 2021), Alfa Erboğa A ~5.795 K,
// Deneb 8.525 K (Schiller & Przybilla 2008), Antares 3.660 K (Ohnaka 2013). Renk yaklaşık (Tanner Helland).

const SPEED = 0.7;                   // cisim/sn

/** Boyut karşılaştırması (R4): cisimler yarıçap sırasıyla yan yana; kamera kaydırdıkça bir sonrakine geçip uzaklaşır. */
export class Compare implements Scene {
  private ctx!: AppContext;
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(50, 1, 1, 10);
  private x: number[] = [];
  private f = 0;                     // odak (0 … n−1, sürekli)
  private target = 0;
  private hold = 0;
  private ui!: { root: HTMLElement; title: HTMLElement; size: HTMLElement; src: HTMLElement; note: HTMLElement; slider: HTMLInputElement; labels: HTMLElement[] };
  private light = new THREE.Vector3(-3e12, 1.5e12, 3e12);
  private pulsars: ReturnType<typeof createPulsar>[] = [];
  /** Kara delik efekt dörtgenleri tam ekran ve ayıklanmaz: yalnızca etki küresi görüş konisindeyken çizilir */
  private holes: { mesh: THREE.Object3D; sphere: THREE.Sphere }[] = [];
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4();
  private shownKey = "";

  enter(ctx: AppContext) {
    this.ctx = ctx;
    ctx.director.setState("EXPLORE");
    let x = 0;
    ITEMS.forEach((it, i) => {
      if (i > 0) x += EXT(ITEMS[i - 1]) * ITEMS[i - 1].rKm + 0.35 * it.rKm + EXT(it) * it.rKm;
      this.x.push(x);
      this.scene.add(this.makeBody(it, x));
    });
    // Arka plan: yordamsal yıldızlar (kara deliklerin büktüğü gökyüzüyle aynı)
    const bg = createBlackHole(new THREE.Vector3(), 1e-9, { disk: 0, full: true });
    bg.mat.transparent = false;
    bg.mesh.renderOrder = -1;
    this.scene.add(bg.mesh);
    this.buildUi();
    this.onResize(innerWidth, innerHeight);
    this.update(0);
    precompile(ctx.renderer, this.scene, this.cam);          // ilk göründüğünde derleme takılması olmasın
  }

  private makeBody(it: Item, x: number): THREE.Object3D {
    let mat: THREE.ShaderMaterial;
    if ("pulsarHz" in it.look) {
      const p = createPulsar(it.rKm, it.look.pulsarHz);
      p.group.position.set(x, 0, 0);
      this.pulsars.push(p);
      return p.group;
    }
    if ("bh" in it.look) {
      // Disk ekvator düzleminde, bize ~75° eğik (temsili); efekt karesi 9 Rs
      // Tam jeodezik hesap 10 Rs içinde (gölge, foton halkası ve disk orada); dışında zayıf alan sapması
      const n = new THREE.Vector3(0, 1, 0.27).normalize();
      const mesh = createBlackHole(new THREE.Vector3(x, 0, 0), it.rKm, { diskN: n, diskOut: 8, halfRs: 9, disk: 1.8, rm: 10 }).mesh;
      this.holes.push({ mesh, sphere: new THREE.Sphere(new THREE.Vector3(x, 0, 0), 13 * it.rKm) });
      return mesh;
    }
    if ("star" in it.look) {
      const [r, g, b] = kelvinToRgb(it.look.star);
      mat = createStarSurfaceMaterial();
      applyStarLook(mat, null, new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace), it.look.star, it.rKm / SUN_RADIUS_KM, x + 1);
    } else {
      const look = it.look;
      mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: planetFrag, uniforms: {
        uMap: { value: null }, uHasMap: { value: 0 }, uKind: { value: look.kind }, uColor: { value: new THREE.Color(look.color) },
        uSunPos: { value: this.light }, uOpacity: { value: 1 }, uCenter: { value: new THREE.Vector3(x, 0, 0) }, uRadius: { value: it.rKm },
        uRingN: { value: new THREE.Vector3(0, 1, 0) }, uRingIn: { value: 0 }, uRingOut: { value: 0 },
        uMinnaert: { value: PLANET_LOOK[it.key]?.[2] ?? 1 }, uAtmo: { value: new THREE.Vector4(...(PLANET_LOOK[it.key]?.[3] ?? [0, 0, 0, 0])) },
      } });
      if (look.map) loadDataTexture(this.ctx.renderer, look.map).then(tx => { mat.uniforms.uMap.value = tx; mat.uniforms.uHasMap.value = 1; }).catch(e => console.warn(e));
    }
    const m = new THREE.Mesh(new THREE.SphereGeometry(it.rKm, 96, 48), mat);
    m.position.set(x, 0, 0);
    m.rotation.z = it.key === "uranus" ? 1.7 : 0.4;
    return m;
  }

  private buildUi() {
    const root = el("div", "compare", undefined, this.ctx.hud);
    const head = el("div", "compare-head on", undefined, root);
    el("div", "compare-kicker", t("compare.title"), head);
    const title = el("div", "compare-title", "", head);
    const size = el("div", "compare-size", "", head);
    const src = el("div", "compare-src", "", head);
    const note = el("div", "compare-src compare-note", "", head);
    const labels = ITEMS.map(it => el("div", "compare-label", getLang() === "tr" ? it.tr : it.en, root));
    const bar = el("div", "compare-bar on", undefined, root);
    const mk = (label: string, dir: number) => {
      const b = el("button", "fly-btn", label, bar);
      b.addEventListener("pointerdown", e => { e.preventDefault(); b.setPointerCapture(e.pointerId); this.hold = dir; });
      const end = () => { if (this.hold === dir) this.hold = 0; };
      b.addEventListener("pointerup", end); b.addEventListener("pointercancel", end); b.addEventListener("lostpointercapture", end);
    };
    mk(`‹ ${t("compare.smaller")}`, -1);
    const slider = el("input", "compare-slider", undefined, bar);
    slider.type = "range"; slider.min = "0"; slider.max = String(ITEMS.length - 1); slider.step = "0.001"; slider.value = "0";
    slider.addEventListener("input", () => { this.target = +slider.value; });
    mk(`${t("compare.bigger")} ›`, 1);
    const close = el("button", "fly-small compare-close on", `${t("compare.back")} ›`, root);
    close.addEventListener("click", () => this.ctx.director.go("act2"));
    this.ui = { root, title, size, src, note, slider, labels };
  }

  onAction(a: Action) {
    const i = Math.round(this.target);
    if (a === "next") this.target = Math.min(ITEMS.length - 1, i + 1);
    else if (a === "back") this.target = Math.max(0, i - 1);
  }

  update(dt: number) {
    const keys = this.ctx.input.keys;
    const k = this.hold + (keys.has("ArrowRight") || keys.has("ArrowUp") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("ArrowDown") ? 1 : 0);
    const n = ITEMS.length - 1;
    const d = this.ctx.input.consumeDrag();
    const z = this.ctx.input.consumeZoom();
    if (k) this.target += k * SPEED * dt;
    if (d.dx) this.target -= d.dx / innerWidth * 2;
    if (z) this.target += z;
    this.target = Math.min(n, Math.max(0, this.target));
    this.f += (this.target - this.f) * (1 - Math.exp(-dt / 0.35));
    if (document.activeElement !== this.ui.slider) this.ui.slider.value = String(this.f);

    // Kamera: yarıçap ve konum logaritmik/yumuşak ara değer; cisim ekran yüksekliğinin ~%40'ı
    const i0 = Math.floor(this.f), i1 = Math.min(n, i0 + 1), s = this.f - i0;
    const r = Math.exp(Math.log(ITEMS[i0].rKm * FRAME(ITEMS[i0])) * (1 - s) + Math.log(ITEMS[i1].rKm * FRAME(ITEMS[i1])) * s);
    const cx = this.x[i0] + (this.x[i1] - this.x[i0]) * smoothstep(0, 1, s);
    const D = r / (0.4 * Math.tan(this.cam.fov * Math.PI / 360));
    this.cam.position.set(cx - 0.6 * r, 0.25 * r, D);
    this.cam.lookAt(cx - 0.6 * r, 0, 0);
    this.cam.near = D * 0.01; this.cam.far = D * 1e4;              // derinlik hassasiyeti: menzil 10^6 (uzaktakiler zaten piksel altı)
    for (const p of this.pulsars) p.update();
    this.cam.updateProjectionMatrix();
    this.cam.updateMatrixWorld();
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(this.cam.projectionMatrix, this.cam.matrixWorldInverse));
    for (const h of this.holes) h.mesh.visible = this.frustum.intersectsSphere(h.sphere);

    const cur = ITEMS[Math.round(this.f)], lang = getLang();
    if (this.shownKey !== cur.key) { this.shownKey = cur.key; this.showText(cur, lang); }
    this.placeLabels();
  }

  /** Başlık ve satırlar yalnızca odak değişince yazılır (her karede DOM yeniden düzenlenmesin) */
  private showText(cur: Item, lang: "tr" | "en") {
    this.ui.title.textContent = lang === "tr" ? cur.tr : cur.en;
    const vsEarth = cur.rKm / EARTH_RADIUS_KM, vsSun = cur.rKm / SUN_RADIUS_KM;
    const rel = vsSun >= 0.5 ? t("compare.vsSun", { n: fmtDec(vsSun, vsSun < 10 ? 2 : 0, lang) })
      : vsEarth < 0.05 ? t("compare.earthTimes", { n: fmtInt(1 / vsEarth, lang) })
      : t("compare.vsEarth", { n: fmtDec(vsEarth, vsEarth < 10 ? 2 : 1, lang) });
    this.ui.size.textContent = `${t("compare.radius")}: ${fmtKm(cur.rKm, lang)} · ${rel}`;
    this.ui.src.textContent = `${t("compare.source")}: ${cur.source}`;
    this.ui.note.textContent = cur.note ? cur.note[lang] : "";
  }

  private v = new THREE.Vector3();
  private labelPos: string[] = [];
  private placeLabels() {
    const v = this.v;
    ITEMS.forEach((it, i) => {
      v.set(this.x[i], -it.rKm * 1.15, 0).project(this.cam);
      const px = (v.x + 1) / 2 * innerWidth, py = (1 - v.y) / 2 * innerHeight;
      const big = it.rKm / (this.cam.position.z * Math.tan(this.cam.fov * Math.PI / 360)) * innerHeight / 2;   // görünen yarıçap (px)
      const vis = v.z < 1 && px > -100 && px < innerWidth + 100 && big > 3;
      show(this.ui.labels[i], vis);
      if (vis && v.z > -1) {
        const tr = `translate(${px.toFixed(1)}px, ${Math.min(py, innerHeight - 150).toFixed(1)}px) translateX(-50%)`;
        if (this.labelPos[i] !== tr) { this.labelPos[i] = tr; this.ui.labels[i].style.transform = tr; }
      }
    });
  }

  render(r: THREE.WebGLRenderer) { r.clear(); r.render(this.scene, this.cam); }
  onResize(w: number, h: number) { this.cam.aspect = w / h; this.cam.fov = w / h >= 1 ? 45 : 65; this.cam.updateProjectionMatrix(); }
  exit() { this.ui.root.remove(); }
}
