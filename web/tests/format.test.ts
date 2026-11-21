import { describe, expect, it } from "vitest";
import { fmtDate, fmtDec, fmtInt, fmtLightTime, isTonight, upperTr } from "../src/ui/format";

describe("format (SPEC §6.9, §3.10)", () => {
  it("sayılar", () => {
    expect(fmtInt(3189, "tr")).toBe("3.189");
    expect(fmtDec(1.242, 2, "tr")).toBe("1,24");
    expect(fmtInt(3189, "en")).toBe("3,189");
    expect(fmtDec(1.242, 2, "en")).toBe("1.24");
  });
  it("Türkçe büyük harf", () => {
    expect(upperTr("simülasyon")).toBe("SİMÜLASYON");
  });
  it("tarih", () => {
    expect(fmtDate("2026-11-29T21:00:00+03:00", "Europe/Istanbul", "tr")).toBe("29 Kasım 2026");
    expect(isTonight("2026-11-29T21:00:00+03:00", "Europe/Istanbul", new Date("2026-11-29T10:00:00Z"))).toBe(true);
    expect(isTonight("2026-11-29T21:00:00+03:00", "Europe/Istanbul", new Date("2026-11-21T10:00:00Z"))).toBe(false);
  });
  it("fmtLightTime", () => {
    const Y = 365.25 * 86400;
    expect(fmtLightTime(1.242)).toBe("1,24 saniye");
    expect(fmtLightTime(492.2)).toBe("8 dakika 12 saniye");
    expect(fmtLightTime(4.08 * 3600)).toBe("4 saat 5 dakika");
    expect(fmtLightTime(86400)).toBe("1 gün");
    expect(fmtLightTime(1200 * Y)).toBe("1.200 yıl");
    expect(fmtLightTime(26700 * Y)).toBe("27.000 yıl");
    expect(fmtLightTime(2.5e6 * Y)).toBe("2,5 milyon yıl");
    expect(fmtLightTime(492.2, "en")).toBe("8 minutes 12 seconds");
    expect(fmtLightTime(1200 * Y, "en")).toBe("1,200 years");
  });
});
