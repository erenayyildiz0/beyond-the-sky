import { describe, expect, it } from "vitest";
import { completes, HIP_ALNILAM, HIP_SIRIUS, MissionLog } from "../src/science/missions";

const c = { obsYear: 2026.91, birthStar: 274 };
// SPEC §9.2: her görevin tamamlanma koşulu, sınırın iki yanında
describe("görevler", () => {
  it("1 · Güneş'in görünmez olduğu yer: 70,4 ışık yılı", () => {
    expect(completes("sunGone", { type: "pos", homeLy: 70.5 }, c)).toBe(true);
    expect(completes("sunGone", { type: "pos", homeLy: 70.3 }, c)).toBe(false);
  });
  it("2 · Güneş'ten sönük yıldız: mutlak kadir > 4,83", () => {
    expect(completes("fainter", { type: "card", mag: 5.2, dly: 11.4 }, c)).toBe(true);     // yakın, sönük bir cüce: M ≈ 7,5
    expect(completes("fainter", { type: "card", mag: -1.44, dly: 8.6 }, c)).toBe(false);  // Sirius
    expect(completes("fainter", { type: "card", mag: 5, dly: null }, c)).toBe(false);
  });
  it("3 · Malazgirt'ten önce yola çıkan ışık: dly > obs − 1071 (955,9)", () => {
    expect(completes("malazgirt", { type: "card", mag: 1, dly: 956 }, c)).toBe(true);
    expect(completes("malazgirt", { type: "card", mag: 1, dly: 955 }, c)).toBe(false);
  });
  it("4 · Alnilam'a uç", () => {
    expect(completes("alnilam", { type: "arrive", hip: HIP_ALNILAM, star: 30 }, c)).toBe(true);
    expect(completes("alnilam", { type: "arrive", hip: 26727, star: 32 }, c)).toBe(false);    // Alnitak
  });
  it("5 · Sirius'ta Eve bak, 6 · Andromeda'da Eve bak", () => {
    expect(completes("sirius", { type: "lookHome", nearHip: HIP_SIRIUS, atM31: false }, c)).toBe(true);
    expect(completes("sirius", { type: "lookHome", nearHip: null, atM31: false }, c)).toBe(false);
    expect(completes("m31", { type: "lookHome", nearHip: null, atM31: true }, c)).toBe(true);
    expect(completes("m31", { type: "lookHome", nearHip: HIP_SIRIUS, atM31: false }, c)).toBe(false);
  });
  it("7 · Doğum yıldızına uç (yalnızca yıl girildiyse)", () => {
    expect(completes("birth", { type: "arrive", hip: 3821, star: 274 }, c)).toBe(true);
    expect(completes("birth", { type: "arrive", hip: 3821, star: 274 }, { ...c, birthStar: null })).toBe(false);
  });
  it("ilerleme kaydedilir ve yeniden yüklenir", () => {
    const mem = new Map<string, string>();
    const st = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const a = new MissionLog(st);
    expect(a.report({ type: "pos", homeLy: 80 }, c)).toEqual(["sunGone"]);
    expect(a.report({ type: "pos", homeLy: 90 }, c)).toEqual([]);                          // bir kez
    expect(new MissionLog(st).done.has("sunGone")).toBe(true);
    a.reset(); expect(new MissionLog(st).done.size).toBe(0);
  });
});
