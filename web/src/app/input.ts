export type Action =
  | "next" | "back" | "restart" | "toggleMute" | "toggleDebug" | "toggleFullscreen"
  | "holdStart" | "holdEnd"            // Perde 1 basılı tutma
  | "lookBack"                         // Perde 2 "Geriye bak"
  | "nextStop" | "prevStop";           // sunum kumandası (Perde 2)

/**
 * Perde 1 ışık seviyesi (SPEC §6.4, onaylı sapma: bırakınca geri gelmez).
 * Basılı tutunca p artar (ışıklar söner), bırakınca olduğu yerde kalır; dimmer ile iki yöne ayarlanır.
 * locked: p bir kez 1'e ulaştı (açılış metinleri tetiklendi). Sonra da ayarlanabilir.
 */
export class HoldControl {
  p = 0; holding = false; locked = false;
  /** Dimmer'dan gelen hedef (null: yok) */
  target: number | null = null;
  holdS: number; releaseS: number;
  constructor(holdS = 7, releaseS = 3.5) { this.holdS = holdS; this.releaseS = releaseS; }
  update(dt: number) {
    if (this.holding) { this.p += dt / this.holdS; this.target = null; }
    else if (this.target != null) {
      const step = dt / 0.35;                                  // dimmer'ı yumuşakça izle
      this.p += Math.max(-step, Math.min(step, this.target - this.p));
      if (Math.abs(this.target - this.p) < 1e-4) this.target = null;
    }
    this.p = Math.min(1, Math.max(0, this.p));
    if (this.p >= 1 && !this.locked) { this.locked = true; this.holding = false; }
  }
}

const TAP_PX = 8, TAP_MS = 300;

/**
 * Pointer + klavye + tekerlek → Action'lar ve sürekli değerler (SPEC §6.2).
 * Sürükleme yalnızca canvas üzerinde; düğmeler dokunuşu kendileri yakalar (setPointerCapture).
 */
export class Input {
  onAction: (a: Action) => void = () => {};
  onTap: (x: number, y: number) => void = () => {};
  dragDx = 0; dragDy = 0;              // son okumadan beri biriken sürükleme (px)
  zoomDz = 0;                          // son okumadan beri pinch + tekerlek (z birimi; + = ileri, evden uzağa)
  dragging = false;
  keys = new Set<string>();
  private pointers = new Map<number, { x: number; y: number; t: number; moved: number }>();
  private pinchDist = 0;

  constructor(private canvas: HTMLElement) {
    canvas.addEventListener("pointerdown", this.pd);
    canvas.addEventListener("pointermove", this.pm);
    canvas.addEventListener("pointerup", this.pu);
    canvas.addEventListener("pointercancel", this.pu);
    canvas.addEventListener("wheel", this.wh, { passive: false });
    window.addEventListener("keydown", this.kd);
    window.addEventListener("keyup", this.ku);
    window.addEventListener("blur", () => this.keys.clear());
    document.addEventListener("contextmenu", e => e.preventDefault());
  }

  consumeDrag() {
    const d = { dx: this.dragDx, dy: this.dragDy };
    this.dragDx = this.dragDy = 0;
    return d;
  }

  consumeZoom() {
    const z = this.zoomDz;
    this.zoomDz = 0;
    return z;
  }

  private dist() {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  private pd = (e: PointerEvent) => {
    if (this.pointers.size >= 2) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 });
    this.dragging = true;
    if (this.pointers.size === 2) this.pinchDist = this.dist();
  };
  private pm = (e: PointerEvent) => {
    const d = this.pointers.get(e.pointerId);
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    d.moved += Math.hypot(dx, dy);
    d.x = e.clientX; d.y = e.clientY;
    if (this.pointers.size === 2) {
      // İki parmak (SPEC §6.5.3): içe sıkıştırmak = ileri (harita uygulamalarındaki gibi uzaklaşır)
      const now = this.dist();
      if (this.pinchDist > 0 && now > 0) this.zoomDz += 2 * Math.log10(this.pinchDist / now);
      this.pinchDist = now;
      return;
    }
    this.dragDx += dx; this.dragDy += dy;
  };
  private pu = (e: PointerEvent) => {
    const d = this.pointers.get(e.pointerId);
    if (!d) return;
    const wasPinch = this.pointers.size === 2;
    this.pointers.delete(e.pointerId);
    for (const p of this.pointers.values()) p.moved = Infinity;     // pinch'ten kalan parmak dokunuş sayılmaz
    this.dragging = this.pointers.size > 0;
    if (!wasPinch && e.type === "pointerup" && d.moved < TAP_PX && performance.now() - d.t < TAP_MS) this.onTap(e.clientX, e.clientY);
  };
  private wh = (e: WheelEvent) => {
    e.preventDefault();
    const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
    this.zoomDz += e.deltaY * k * 0.0015;
  };

  private kd = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    this.keys.add(e.code);
    if (e.repeat) return;
    const map: Record<string, Action> = {
      Enter: "next", NumpadEnter: "next", PageDown: "next", Backspace: "back", PageUp: "back",
      KeyR: "restart", KeyM: "toggleMute", KeyD: "toggleDebug", KeyF: "toggleFullscreen", KeyB: "lookBack",
      Space: "holdStart",
    };
    const a = map[e.code];
    if (a) { e.preventDefault(); this.onAction(a); }
  };
  private ku = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    if (e.code === "Space") this.onAction("holdEnd");
  };
}

/** Basılı tutma düğmesini HoldControl'a bağlar (iOS uzun basma engelleri CSS'te). */
export function bindHoldButton(btn: HTMLElement, hold: HoldControl) {
  const start = (e: PointerEvent) => {
    e.preventDefault();
    btn.setPointerCapture(e.pointerId);
    if (hold.p < 1) hold.holding = true;
  };
  const end = () => { hold.holding = false; };
  btn.addEventListener("pointerdown", start);
  btn.addEventListener("pointerup", end);
  btn.addEventListener("pointercancel", end);
  btn.addEventListener("lostpointercapture", end);
}
