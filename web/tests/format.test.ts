import { describe, expect, it } from "vitest";
import { fmtDate, fmtDec, fmtInt, fmtKm, fmtLightTime, fmtLy, isTonight, upperTr } from "../src/ui/format";

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
    expect(fmtLightTime(0)).toBe("0 saniye"); expect(fmtLightTime(0, "en")).toBe("0 seconds");
    expect(fmtLightTime(417 / 299792.458)).toBe("0,0014 saniye");
    expect(fmtLightTime(492.2)).toBe("8 dakika 12 saniye");
    expect(fmtLightTime(4.08 * 3600)).toBe("4 saat 5 dakika");
    expect(fmtLightTime(86400)).toBe("1 gün");
    expect(fmtLightTime(1200 * Y)).toBe("1.200 yıl");
    expect(fmtLightTime(26700 * Y)).toBe("27.000 yıl");
    expect(fmtLightTime(2.5e6 * Y)).toBe("2,5 milyon yıl");
    expect(fmtLightTime(492.2, "en")).toBe("8 minutes 12 seconds");
    expect(fmtLightTime(41 * 60 + 59.6)).toBe("42 dakika");            // 60 saniye taşar
    expect(fmtLightTime(2 * 3600 + 59.8 * 60)).toBe("3 saat");
    expect(fmtLightTime(1200 * Y, "en")).toBe("1,200 years");
    expect(fmtLightTime(2.4e9 * Y)).toBe("2,40 milyar yıl");             // milyondan sonra milyar
    expect(fmtLightTime(13.79e9 * Y)).toBe("13,79 milyar yıl");
    expect(fmtLightTime(320e6 * Y)).toBe("320 milyon yıl");
    expect(fmtLightTime(2.4e9 * Y, "en")).toBe("2.40 billion years");
  });
  it("fmtLy", () => {
    expect(fmtLy(4.2465)).toBe("4,25");
    expect(fmtLy(2109)).toBe("2.109");
    expect(fmtLy(53_815_582)).toBe("53,8 milyon");
    expect(fmtLy(1.39e9)).toBe("1,39 milyar");
    expect(fmtLy(53_815_582, "en")).toBe("53.8 million");
  });
  it("fmtKm", () => {
    expect(fmtKm(0.9)).toBe("0,9 km");
    expect(fmtKm(372_193)).toBe("372.193 km");
    expect(fmtKm(149.6e6)).toBe("149,6 milyon km");
    expect(fmtKm(9.4607e12)).toBe("9,46 trilyon km");
    expect(fmtKm(2.08e19)).toBe("20,8 kentilyon km");
    expect(fmtKm(4.4e23)).toBe("440,0 sekstilyon km");
    expect(fmtKm(372_193, "en")).toBe("372,193 km");
    expect(fmtKm(149.6e6, "en")).toBe("149.6 million km");
    expect(fmtKm(2.08e19, "en")).toBe("20.8 quintillion km");
  });
});
