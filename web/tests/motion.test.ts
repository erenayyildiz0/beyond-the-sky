import { describe, expect, it, beforeEach } from "vitest";
import { FpsProbe, PERF } from "../src/app/motion";

describe("düşük performans algısı (SPEC §6.10)", () => {
  beforeEach(() => { PERF.low = false; PERF.measured = false; });
  it("60 fps: düşük değil", () => { const p = new FpsProbe(); for (let i = 0; i < 130; i++) p.step(1 / 60); expect(PERF.measured).toBe(true); expect(PERF.low).toBe(false); });
  it("30 fps: düşük", () => { const p = new FpsProbe(); for (let i = 0; i < 70; i++) p.step(1 / 30); expect(PERF.low).toBe(true); });
  it("karar bir kez verilir", () => { const p = new FpsProbe(); let k = 0; for (let i = 0; i < 300; i++) if (p.step(1 / 30)) k++; expect(k).toBe(1); });
});
