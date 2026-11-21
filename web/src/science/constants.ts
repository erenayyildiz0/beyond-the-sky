export const C_KM_S = 299_792.458;               // ışık hızı (tanım gereği tam)
export const AU_KM = 149_597_870.7;              // IAU 2012
export const LY_KM = 9.4607304725808e12;         // Jülyen yılı × c
export const LIGHT_DAY_KM = C_KM_S * 86_400;     // 25.902.068.371 km ≈ 173,14 AB
export const EARTH_RADIUS_KM = 6371.0;           // ortalama yarıçap
export const PROXIMA_LY = 4.2465;                // Proxima Centauri (SPEC §3.10)
export const VOYAGER1_KM_S = 17.0;               // ~16,9–17,0 km/s (Güneş'e göre)
export const VOYAGER1_LAUNCH_UTC = "1977-09-05T12:56:00Z";
export const VOYAGER1_LIGHT_DAY_UTC = "2026-11-18T10:16:07Z"; // NASA / JPL
export const SUN_GALACTOCENTRIC_LY = 26_700;     // ~8,18 kpc (GRAVITY 2019)
export const MW_DIAMETER_LY = 100_000;           // yaklaşık; ekranda "~100.000"

// Ortalama yarıçaplar (km): NASA Planetary Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet); Güneş: IAU 2015 B3 nominal
export const SUN_RADIUS_KM = 695_700;
export const MOON_RADIUS_KM = 1_737.4;
export const PLANET_RADIUS_KM: Record<string, number> = {
  mercury: 2_439.7, venus: 6_051.8, mars: 3_389.5, jupiter: 69_911, saturn: 58_232, uranus: 25_362, neptune: 24_622,
};
