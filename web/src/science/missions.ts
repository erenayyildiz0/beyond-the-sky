// Keşif görevleri (SPEC §2.6): merakı yönlendiren yedi küçük hedef. Saf kontrol fonksiyonları; ilerleme localStorage'da.
import { MALAZGIRT_YEAR, SUN_ABS_MAG_V } from "./constants";
import { absMag, SUN_INVISIBLE_LY } from "./facts";

export const MISSION_IDS = ["sunGone", "fainter", "malazgirt", "alnilam", "sirius", "m31", "birth"] as const;
export type MissionId = (typeof MISSION_IDS)[number];

export const HIP_ALNILAM = 26311;
export const HIP_SIRIUS = 32349;

/** Olaylar: kamera konumu, açılan yıldız kartı, "Buraya uç" varışı, "Eve bak" */
export type MissionEvent =
  | { type: "pos"; homeLy: number }
  | { type: "card"; mag: number; dly: number | null }
  | { type: "arrive"; hip: number | null; star: number | null }
  | { type: "lookHome"; nearHip: number | null; atM31: boolean };

export interface MissionCtx { obsYear: number; birthStar: number | null }

/** Bu olay görevi tamamlıyor mu? (SPEC §2.6 tablosu) */
export function completes(id: MissionId, ev: MissionEvent, c: MissionCtx): boolean {
  switch (id) {
    case "sunGone": return ev.type === "pos" && ev.homeLy > SUN_INVISIBLE_LY;                       // Güneş > 6,5 kadir
    case "fainter": return ev.type === "card" && ev.dly != null && absMag(ev.mag, ev.dly) > SUN_ABS_MAG_V;
    case "malazgirt": return ev.type === "card" && ev.dly != null && ev.dly > c.obsYear - MALAZGIRT_YEAR;
    case "alnilam": return ev.type === "arrive" && ev.hip === HIP_ALNILAM;
    case "sirius": return ev.type === "lookHome" && ev.nearHip === HIP_SIRIUS;
    case "m31": return ev.type === "lookHome" && ev.atM31;
    case "birth": return ev.type === "arrive" && c.birthStar != null && ev.star === c.birthStar;
  }
}

/** İlerleme: tamamlanan görevler (yalnızca kimlikler; kişisel veri değil) */
export class MissionLog {
  done = new Set<MissionId>();
  constructor(private storage: Pick<Storage, "getItem" | "setItem"> | null) {
    try {
      const raw = storage?.getItem("bts.missions");
      for (const id of raw ? (JSON.parse(raw) as string[]) : []) if ((MISSION_IDS as readonly string[]).includes(id)) this.done.add(id as MissionId);
    } catch { /* bozuk kayıt ya da özel mod */ }
  }
  /** Olayı işle; yeni tamamlanan görevleri döndür */
  report(ev: MissionEvent, c: MissionCtx): MissionId[] {
    const fresh = MISSION_IDS.filter(id => !this.done.has(id) && completes(id, ev, c));
    if (fresh.length) {
      fresh.forEach(id => this.done.add(id));
      try { this.storage?.setItem("bts.missions", JSON.stringify([...this.done])); } catch { /* özel mod */ }
    }
    return fresh;
  }
  reset() { this.done.clear(); try { this.storage?.setItem("bts.missions", "[]"); } catch { /* özel mod */ } }
}
