import { el, show } from "./hud";
import { t } from "./i18n";
import { MISSION_IDS, type MissionId, type MissionLog } from "../science/missions";

/** ★ Görevler (SPEC §2.6, §6.12): sayaç düğmesi, liste paneli ve tamamlanınca 4 sn'lik not (Paylaş ile). */
export class MissionsUi {
  readonly button: HTMLButtonElement;
  private panel: HTMLElement;
  private toast: HTMLElement;
  private toastTimer = 0;
  onShare: (id: MissionId) => void = () => {};
  onOpen: () => void = () => {};

  constructor(bar: HTMLElement, root: HTMLElement, private log: MissionLog, private birthKnown: () => boolean) {
    this.button = el("button", "fly-small", "", bar);
    this.panel = el("div", "jump-menu missions", undefined, root);
    this.toast = el("div", "mission-toast", undefined, root);
    this.button.addEventListener("click", () => (this.open ? this.close() : this.show()));
    this.panel.addEventListener("pointerdown", e => e.stopPropagation());
    this.toast.addEventListener("pointerdown", e => e.stopPropagation());
    this.refresh();
  }

  get open() { return this.panel.classList.contains("on"); }
  close() { show(this.panel, false); }
  refresh() { this.button.textContent = `★ ${t("explore.missions")} (${this.log.done.size}/${MISSION_IDS.length})`; }

  private show() {
    this.onOpen();
    this.panel.replaceChildren(...MISSION_IDS.map(id => {
      const done = this.log.done.has(id);
      const row = el("div", `mission-row${done ? " done" : ""}`);
      el("span", "mission-mark", done ? "★" : "☆", row);
      el("span", "", t(`mission.${id}` as "mission.sunGone"), row);
      if (id === "birth" && !this.birthKnown() && !done) el("span", "mission-hint", ` · ${t("mission.birthHint")}`, row);
      return row;
    }));
    show(this.panel);
  }

  /** Yeni tamamlanan görev: zil çağıran taraftadır; 4 sn not + Paylaş */
  announce(id: MissionId) {
    this.refresh();
    if (this.open) this.show();
    this.toast.replaceChildren(
      el("div", "mission-done", `★ ${t("mission.done")}`),
      el("div", "mission-note poem", t(`mission.note.${id}` as "mission.note.sunGone")),
    );
    const share = el("button", "fly-small", t("card.share"), this.toast);
    share.addEventListener("click", () => this.onShare(id));
    show(this.toast);
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => show(this.toast, false), 6000);
  }
}
