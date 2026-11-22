import type { SkyJson } from "../app/assets";
import { getLang } from "./i18n";

/**
 * Metinlerdeki yer adı ve Türkçe hâlleri. Pipeline konumu (Ankara) sky.json'dan; cihaz konumu (E1) "bulunduğun yer".
 * SPEC §8 notu: "{place}'ya" yalnızca Ankara için doğru; başka adlar için name_dative verilmeli.
 */
export function placeVars(meta: SkyJson["meta"]) {
  const L = meta.location as SkyJson["meta"]["location"] & { local?: boolean; name_dative?: string };
  const tr = getLang() === "tr";
  if (L.local) {
    return tr
      ? { place: "bulunduğun yer", place_ablative: "bulunduğun yerden", place_dative: "bulunduğun yere", place_sky: "senin gökyüzün", label: "Konumun" }
      : { place: "your location", place_ablative: "your location", place_dative: "your location", place_sky: "your sky", label: "Your location" };
  }
  return { place: L.name, place_ablative: L.name_ablative, place_dative: L.name_dative ?? `${L.name}'ya`,
    place_sky: tr ? `${L.name} gökyüzü` : `${L.name} sky`, label: L.name };
}

/** Cümle başı için ilk harfi büyüt (Türkçe kurallarıyla) */
export const capFirst = (s: string) => (s ? s[0].toLocaleUpperCase(getLang() === "tr" ? "tr-TR" : "en-US") + s.slice(1) : s);
