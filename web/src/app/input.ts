export type Action =
  | "next" | "back" | "restart" | "toggleMute" | "toggleDebug" | "toggleFullscreen"
  | "holdStart" | "holdEnd"            // Perde 1 basılı tutma
  | "lookBack"                         // Perde 2 "Geriye bak"
  | "nextStop" | "prevStop";           // sunum kumandası (Perde 2)

/** Perde 1 basılı tutma ilerlemesi (SPEC §6.4). */
export class HoldControl {
  p = 0; holding = false; locked = false;
  holdS: number; releaseS: number;
  constructor(holdS = 7, releaseS = 3.5) { this.holdS = holdS; this.releaseS = releaseS; }
  update(dt: number) {
    if (this.locked) return;
    this.p += this.holding ? dt / this.holdS : -dt / this.releaseS;
    this.p = Math.min(1, Math.max(0, this.p));
    if (this.p >= 1) { this.locked = true; this.holding = false; }
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
  dragging = false;
  keys = new Set<string>();
  private down: { id: number; x: number; y: number; t: number; moved: number } | null = null;

  constructor(private canvas: HTMLElement) {
    canvas.addEventListener("pointerdown", this.pd);
    canvas.addEventListener("pointermove", this.pm);
    canvas.addEventListener("pointerup", this.pu);
    canvas.addEventListener("pointercancel", this.pu);
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

  private pd = (e: PointerEvent) => {
    if (this.down) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.down = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
    this.dragging = true;
  };
  private pm = (e: PointerEvent) => {
    const d = this.down;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    d.moved += Math.hypot(dx, dy);
    d.x = e.clientX; d.y = e.clientY;
    this.dragDx += dx; this.dragDy += dy;
  };
  private pu = (e: PointerEvent) => {
    const d = this.down;
    if (!d || d.id !== e.pointerId) return;
    this.down = null;
    this.dragging = false;
    if (e.type === "pointerup" && d.moved < TAP_PX && performance.now() - d.t < TAP_MS) this.onTap(e.clientX, e.clientY);
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
    if (!hold.locked) hold.holding = true;
  };
  const end = () => { hold.holding = false; };
  btn.addEventListener("pointerdown", start);
  btn.addEventListener("pointerup", end);
  btn.addEventListener("pointercancel", end);
  btn.addEventListener("lostpointercapture", end);
}
