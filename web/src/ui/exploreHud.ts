import { el, show } from "./hud";
import { t } from "./i18n";
import { fmtDec, type Lang } from "./format";
import { lightLeft, trLocative } from "../science/years";
import { sunMagFrom, sunState } from "../science/facts";

const TIPS = ["explore.tip.look", "explore.tip.fly", "explore.tip.tap"] as const;

/**
 * Keşif ekranı (SPEC §2.6, §6.12): alt bant (Dünya'yı hangi yılda görürsün, Güneş buradan kaç kadir), Güneş işareti
 * (ekrandaysa halka, değilse kenarda ok; görünmezse kesikli) ve sırayla çıkan üç ipucu.
 */
export class ExploreHud {
  readonly bar: HTMLElement;
  private band: HTMLElement;
  private l1: HTMLElement;
  private l2: HTMLElement;
  private sun: HTMLElement;
  private sunArrow: HTMLElement;
  private tip: HTMLElement;
  private tipIdx = 0;
  private idleS = 0;
  private idleShown = false;
  private bandS = 1;

  constructor(root: HTMLElement, private obsYear: number, private tipsSeen: boolean) {
    this.bar = el("div", "explore-bar on", undefined, root);
    this.band = el("div", "explore-band", undefined, root);
    this.l1 = el("div", "", "", this.band);
    this.l2 = el("div", "", "", this.band);
    this.sun = el("div", "sun-mark", undefined, root);
    el("span", "", t("explore.sun"), this.sun);
    this.sunArrow = el("div", "sun-arrow", "➜", root);
    this.tip = el("div", "explore-tip poem", "", root);
    if (!tipsSeen) { this.tip.textContent = t(TIPS[0]); show(this.tip); }
  }

  /** Kullanıcı bir şey yaptı: o anki ipucu kaybolur, sıradaki gelir. true: bütün ipuçları görüldü (bir kez kaydet) */
  advanceTip(kind: "look" | "fly" | "tap"): boolean {
    this.idleS = 0;
    if (this.tipsSeen || this.tipIdx >= TIPS.length) {
      if (kind === "tap" && this.idleShown) show(this.tip, false);
      return false;
    }
    if (TIPS[this.tipIdx] !== `explore.tip.${kind}`) return false;
    this.tipIdx++;
    if (this.tipIdx >= TIPS.length) { show(this.tip, false); this.tipsSeen = true; return true; }
    show(this.tip, false);
    setTimeout(() => { this.tip.textContent = t(TIPS[this.tipIdx]); show(this.tip); }, 600);
    return false;
  }

  /**
   * dLy: Güneş'e uzaklık (ışık yılı). sun: orijinin ekran izdüşümü (NDC; z > 1 arkada). Bant 250 ms'de bir yazılır.
   * active: Keşif modu ve serbest uçuş (Perde 3 dönüşünde gizli). bandRoom: alt bant için yer var (durak kartı kapalı).
   */
  update(dt: number, dLy: number, sun: { x: number; y: number; z: number }, lang: Lang, active: boolean, bandRoom = true) {
    this.idleS += dt;
    if (active && !this.idleShown && this.idleS > 60 && this.tipsSeen) {      // 60 sn hareketsiz: bir kez "Bir yıldıza dokun"
      this.idleShown = true;
      this.tip.textContent = t("explore.tip.tap"); show(this.tip);
    }
    show(this.bar, active);
    const far = dLy >= 0.01;
    show(this.band, active && far && bandRoom);                       // durak kartı açıkken yer onun
    this.bandS += dt;
    if (active && far && this.bandS > 0.25) {
      this.bandS = 0;
      const ll = lightLeft(dLy, this.obsYear);
      const yr = ll.bc != null ? (lang === "tr" ? `MÖ ${ll.bc}` : `${ll.bc} BC`) : String(ll.year);
      const yrTr = ll.bc != null ? `MÖ ${trLocative(ll.bc)}` : trLocative(ll.year);
      this.l1.textContent = t("explore.homeView", { yıl_de: (ll.approx ? "~" : "") + yrTr, year: (ll.approx ? "~" : "") + yr });
      const m = sunMagFrom(dLy);
      this.l2.textContent = t("explore.sunHere", { m: fmtDec(m, 1, lang), state: t(`explore.sun.${sunState(m)}`) });
    }
    // Güneş işareti: yalnızca Güneş Sistemi'nin dışında (içeride Güneş zaten görünür)
    const on = active && far;
    const behind = sun.z > 1 || sun.z < -1;
    const inView = !behind && Math.abs(sun.x) < 0.92 && Math.abs(sun.y) < 0.92;
    show(this.sun, on && inView); show(this.sunArrow, on && !inView);
    if (!on) return;
    const W = innerWidth, H = innerHeight;
    this.sun.classList.toggle("faint", sunMagFrom(dLy) > 6.5);
    if (inView) {
      this.sun.style.transform = `translate(${(sun.x + 1) / 2 * W}px, ${(1 - sun.y) / 2 * H}px) translate(-50%, -50%)`;
    } else {
      let ax = sun.x, ay = sun.y;
      if (behind) { ax = -ax; ay = -ay; }
      const ang = Math.atan2(-ay, ax), r = Math.min(W, H) * 0.42;
      this.sunArrow.style.transform = `translate(${W / 2 + Math.cos(ang) * r}px, ${H / 2 + Math.sin(ang) * r}px) translate(-50%, -50%) rotate(${ang}rad)`;
    }
  }
}
