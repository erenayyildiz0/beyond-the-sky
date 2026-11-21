import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { prepareSky, type SkyJson } from "../src/app/assets";
import { countVisible } from "../src/science/visibility";

const path = fileURLToPath(new URL("../public/data/sky.json", import.meta.url));
const sky = prepareSky(JSON.parse(readFileSync(path, "utf8")) as SkyJson);

describe("eşlik: sky.json sayımları = Python sayımları (SPEC §3.3, §9.2)", () => {
  const v = sky.meta.visibility;
  it("şehir", () => {
    expect(countVisible(sky.starAlt, sky.starMag, v.sqm_city, v.glow_city_mag, v.extinction_k)).toBe(sky.meta.counts.city);
  });
  it("karanlık", () => {
    expect(countVisible(sky.starAlt, sky.starMag, v.sqm_dark, v.glow_dark_mag, v.extinction_k)).toBe(sky.meta.counts.dark);
  });
  it("adlar ve etiketler", () => {
    expect(sky.labels).toHaveLength(8);
    expect(sky.starName(sky.labels[0])).toBe("Altair");
  });
});
