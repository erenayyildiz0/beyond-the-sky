import { describe, expect, it } from "vitest";
import { AdaptiveRes } from "../src/app/adaptiveRes";

const run = (a: AdaptiveRes, fps: number, sec: number) => { for (let t = 0; t < sec; t += 1 / fps) a.step(1 / fps); };

describe("uyarlamalı çözünürlük", () => {
  it("tam hızda dokunmaz", () => { const a = new AdaptiveRes(2); run(a, 60, 20); expect(a.pr).toBe(2); });
  it("sürekli yavaşsa en alta kadar düşer", () => { const a = new AdaptiveRes(2); run(a, 25, 30); expect(a.pr).toBe(1); });
  it("tek takılma düşürmez", () => { const a = new AdaptiveRes(1); run(a, 60, 2); a.step(0.1); run(a, 60, 2); expect(a.pr).toBe(1); });
  it("rahatlayınca geri çıkar", () => { const a = new AdaptiveRes(1); run(a, 25, 3); expect(a.pr).toBeLessThan(1); run(a, 60, 60); expect(a.pr).toBe(1); });
  it("yükseltince yine yavaşlıyorsa gidip gelmez", () => {
    const a = new AdaptiveRes(1);
    run(a, 25, 1.6); const low = a.pr; expect(low).toBeLessThan(1);
    run(a, 60, 9); expect(a.pr).toBe(1);                 // yükseltti
    run(a, 25, 1.6); expect(a.pr).toBe(low);             // hemen yavaşladı → tavan düştü
    run(a, 60, 30); expect(a.pr).toBe(low);
  });
});
