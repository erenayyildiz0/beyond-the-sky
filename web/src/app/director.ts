import type * as THREE from "three";
import type { Action, Input } from "./input";
import type { Assets, Params } from "./assets";
import { T } from "./timeline";

export type State =
  | "LOADING" | "INTRO" | "A1_CITY" | "A1_HOLDING" | "A1_REVEALED"
  | "A2_TAKEOFF" | "A2_FLIGHT" | "A3_BIRTH" | "A3_RETURN" | "A3_LAND" | "A3_LIGHTS"
  | "OUTRO" | "EXPLORE" | "CREDITS";

export interface Scene {
  enter(ctx: AppContext): Promise<void> | void;
  update(dt: number, nowMs: number): void;      // dt saniye
  render(renderer: THREE.WebGLRenderer): void;
  onResize(w: number, h: number): void;
  onAction?(a: Action): void;
  exit(): void;                                 // dinleyicileri kaldır; Perde 1 ve uçuş varlıklarını dispose etme (Perde 3 kullanır)
}

/** Bilim panelinden canlı ayarlanan değerler (SPEC §6.9). */
export interface Tunables {
  uBaseSize: number; uMaxSize: number; uFlyByMax: number; uRefMag: number; uIntensity: number; uMWGain: number;
  sqmCity: number; extinctionK: number; vMax: number; galaxySize: number; showNames: boolean;
}

export interface AppContext {
  gyro: import("./gyro").Gyro;
  audio: import("../audio/drone").Drone | null;
  renderer: THREE.WebGLRenderer;
  assets: Assets;
  params: Params;
  input: Input;
  hud: HTMLElement;
  tune: Tunables;
  director: Director;
  /** Bilim paneline sahnenin canlı göstergeleri */
  debug: Record<string, string | number>;
  /** Sahneler arası aktarılan durum */
  shared: { act1Look?: { alt: number; az: number }; startZ?: number;
    /** Boyut karşılaştırmasından dönünce uçuş kaldığı yerden sürsün */
    flight?: { C: number[]; f: number[]; u: number[] };
    /** Perde 3: doğum yılı sonucu — yalnızca bellekte (SPEC §6.6, gizlilik) */
    birth?: import("../science/years").BirthResult | { kind: "skip" };
    /** Keşif modu (SPEC §2.6) */
    explore?: boolean };
}

export type SceneId = "intro" | "act1" | "act2" | "compare" | "act3";

export class Director {
  state: State = "LOADING";
  private scene: Scene | null = null;
  private sceneId: SceneId | null = null;
  private busy = false;
  ctx!: AppContext;

  constructor(private fade: HTMLElement, private factories: Record<SceneId, () => Scene>) {}

  setState(s: State) { this.state = s; }
  get current() { return this.sceneId; }

  /** Varsayılan geçiş: #fade 0 → 1 (500 ms), sahne değişimi, 1 → 0. */
  async go(id: SceneId, instant = false) {
    if (this.busy) return;
    this.busy = true;
    if (!instant) await this.fadeTo(1);
    this.scene?.exit();
    this.scene = this.factories[id]();
    this.sceneId = id;
    await this.scene.enter(this.ctx);
    this.scene.onResize(innerWidth, innerHeight);
    if (!instant) await this.fadeTo(0);
    this.busy = false;
  }

  /** #fade karartması; sahneler kendi geçişleri için de kullanır (ör. kalkış). */
  fadeTo(o: number, ms: number = T.fadeMs) {
    this.fade.style.transition = `opacity ${ms}ms ease`;
    this.fade.style.opacity = String(o);
    return new Promise<void>(r => setTimeout(r, ms));
  }

  update(dt: number, now: number) { this.scene?.update(dt, now); }
  render(r: THREE.WebGLRenderer) { this.scene?.render(r); }
  resize(w: number, h: number) { this.scene?.onResize(w, h); }
  action(a: Action) { if (!this.busy) this.scene?.onAction?.(a); }
}
