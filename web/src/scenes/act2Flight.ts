import type * as THREE from "three";
import type { AppContext, Scene } from "../app/director";
import { el, show } from "../ui/hud";
import { t } from "../ui/i18n";

/** Yer tutucu: Perde 2 (Yolculuk) M3'te yazılacak. */
export class Act2Flight implements Scene {
  private root!: HTMLElement;
  enter(ctx: AppContext) {
    ctx.director.setState("A2_TAKEOFF");
    this.root = el("div", "placeholder", t("dev.next"), ctx.hud);
    requestAnimationFrame(() => show(this.root));
  }
  update() {}
  render(r: THREE.WebGLRenderer) { r.clear(); }
  onResize() {}
  exit() { this.root.remove(); }
}
