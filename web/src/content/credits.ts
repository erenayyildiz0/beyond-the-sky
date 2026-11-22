// Kaynaklar ve notlar ekranı (SPEC §6.7 CREDITS): veri kaynakları ve lisanslar (§15, docs/EXTRAS.md, README),
// kısa model notları (§14). Yeni veri ya da model eklenince buraya da kaynağıyla ekle.
import type { Lang } from "../ui/format";

export interface CreditSection { title: string; items: string[] }

const tr: CreditSection[] = [
  {
    title: "Veri",
    items: [
      "Yıldızlar: HYG Database v4.1 — David Nash / astronexus (CC BY-SA 4.0); türetilen sky.json da CC BY-SA 4.0. Uzaklıklar Hipparcos paralaksından.",
      "Samanyolu: NASA Goddard SVS, Deep Star Maps 2020 (Ernie Wright; Gaia DR2: ESA/Gaia/DPAC).",
      "Dünya: NASA Black Marble 2016 (gece; Suomi NPP VIIRS), NASA Blue Marble Next Generation (gündüz). Ay: NASA SVS 4720 / LRO.",
      "Işık kirliliği: World Atlas 2015 (Falchi ve ark. 2016), lightpollutionmap.info.",
      "Jüpiter: NASA/JPL/Space Science Institute, Cassini PIA07782. Merkür, Venüs, Mars, Satürn, Uranüs, Neptün: Solar System Scope (CC BY 4.0), NASA görev görüntülerinden.",
      "Dönme eksenleri: IAU WGCCRE 2015 (Archinal ve ark. 2018). Yarıçaplar ve Satürn halkaları: NASA Planetary Fact Sheets.",
      "Asteroit kuşağı, Jüpiter Truvalıları ve Kuiper kuşağı: NASA/JPL Small-Body Database.",
      "Voyager 1: JPL Horizons (id −31). 1 ışık-günü: 18 Kasım 2026 (NASA SVS 15120).",
      "Galaksiler: 2MASS Redshift Survey (Huchra ve ark. 2012, ApJS 199, 26). Andromeda ve Üçgen uzaklıkları: NASA Hubble Messier kataloğu.",
      "Kozmik mikrodalga arka planı: ESA and the Planck Collaboration (CC BY-SA 3.0 IGO).",
      "Yıldız yarıçapları: Liebert ve ark. 2005 (Sirius A), Ramírez & Allende Prieto 2011 (Arcturus), Richichi & Roccatagliata 2005 (Aldebaran), Moravveji ve ark. 2012 (Rigel), Joyce ve ark. 2020 (Betelgeuse), Boyajian ve ark. 2012 (Proxima), Wittkowski ve ark. 2012 (VY CMa).",
      "Sıkı cisimler: Riley ve ark. 2019 (PSR J0030+0451), Miller-Jones ve ark. 2021 (Cygnus X-1), Bond ve ark. 2017 (Sirius B), GRAVITY Collaboration 2020 ve 2022 (Sgr A*, S2), EHT Collaboration 2019 ve 2022 (M87*, Sgr A*).",
    ],
  },
  {
    title: "Modeller ve sabitler",
    items: [
      "Limit kadir ve gökyüzü parlaklığı: Schaefer 1990 (PASP 102, 212). Hava kütlesi: Kasten & Young 1989.",
      "B−V → sıcaklık: Ballesteros 2012. Sıcaklık → renk: Tanner Helland 2012.",
      "Güneş'in galaksi merkezine uzaklığı: GRAVITY Collaboration 2019. Samanyolu ölçüleri: Bland-Hawthorn & Gerhard 2016.",
      "Kozmoloji: Planck Collaboration 2020 (A&A 641, A6), düz ΛCDM. Büyük ölçekte homojenlik: Scrimgeour ve ark. 2012.",
      "Korona parlaklık profili: Baumbach 1937. Kara delik görüntüsü: Schwarzschild jeodezikleri.",
      "Yazılım: Astropy, NumPy (BSD-3), three.js, Vite, Vitest (MIT). Fontlar: SIL Open Font License.",
    ],
  },
  {
    title: "Bilinen sınırlamalar",
    items: [
      "Görünürlük bir tahmindir: Schaefer tabanlı limit kadir, sabit sönüm katsayısı, tek bir zenit SQM değeri ve sezgisel ufuk parlaması. Gerçek gözlem kişiye, havaya ve göz uyumuna göre değişir.",
      "Şehir SQM değeri 2015 atlasından; bugünkü gökyüzü daha parlak olabilir. Atmosferik kırılma ve özhareket uygulanmadı.",
      "Gökyüzü seçilen tek bir an için hesaplanır; canlı değildir. Uçuş sırasında zaman donuktur.",
      "Yıldız uzaklıkları uzak yıldızlarda belirsizdir; uzaklığı ölçülemeyenler uzak bir kabuğa konmuştur. Yıllar uzaklığa göre yuvarlanır.",
      "Uzaklaştıkça yıldızların parlaklığı yapay olarak artırılır (\"Pozlama artırıldı\").",
      "Gerçek yıldız verisi yalnızca çıplak gözle görülebilen ~15.600 yıldızı kapsar. Galaksilerin görünümü, yıldız yüzeyleri ve 2MRS'in ötesindeki kozmik ağ temsilidir; konum, yön ve boyut gerçektir.",
      "Güneş Sistemi'nde yörüngeler daire olarak çizilmiş, gezegenler büyütülmüştür.",
      "Doğum yılı yıldızı, uzaklığı ±1 ışık yılı içinde eşleşen çıplak göz yıldızıdır; ölçüm hataları birkaç ay ile bir yıl arası kaydırabilir.",
      "Jiroskop yönü telefonun pusulasına bağlıdır; birkaç derecelik sapma olabilir.",
    ],
  },
];

const en: CreditSection[] = [
  {
    title: "Data",
    items: [
      "Stars: HYG Database v4.1 — David Nash / astronexus (CC BY-SA 4.0); the derived sky.json is CC BY-SA 4.0 too. Distances from Hipparcos parallax.",
      "Milky Way: NASA Goddard SVS, Deep Star Maps 2020 (Ernie Wright; Gaia DR2: ESA/Gaia/DPAC).",
      "Earth: NASA Black Marble 2016 (night; Suomi NPP VIIRS), NASA Blue Marble Next Generation (day). Moon: NASA SVS 4720 / LRO.",
      "Light pollution: World Atlas 2015 (Falchi et al. 2016), lightpollutionmap.info.",
      "Jupiter: NASA/JPL/Space Science Institute, Cassini PIA07782. Mercury, Venus, Mars, Saturn, Uranus, Neptune: Solar System Scope (CC BY 4.0), from NASA mission imagery.",
      "Rotation axes: IAU WGCCRE 2015 (Archinal et al. 2018). Radii and Saturn's rings: NASA Planetary Fact Sheets.",
      "Asteroid belt, Jupiter Trojans and Kuiper belt: NASA/JPL Small-Body Database.",
      "Voyager 1: JPL Horizons (id −31). One light-day: 18 November 2026 (NASA SVS 15120).",
      "Galaxies: 2MASS Redshift Survey (Huchra et al. 2012, ApJS 199, 26). Andromeda and Triangulum distances: NASA Hubble Messier catalog.",
      "Cosmic microwave background: ESA and the Planck Collaboration (CC BY-SA 3.0 IGO).",
      "Stellar radii: Liebert et al. 2005 (Sirius A), Ramírez & Allende Prieto 2011 (Arcturus), Richichi & Roccatagliata 2005 (Aldebaran), Moravveji et al. 2012 (Rigel), Joyce et al. 2020 (Betelgeuse), Boyajian et al. 2012 (Proxima), Wittkowski et al. 2012 (VY CMa).",
      "Compact objects: Riley et al. 2019 (PSR J0030+0451), Miller-Jones et al. 2021 (Cygnus X-1), Bond et al. 2017 (Sirius B), GRAVITY Collaboration 2020 and 2022 (Sgr A*, S2), EHT Collaboration 2019 and 2022 (M87*, Sgr A*).",
    ],
  },
  {
    title: "Models and constants",
    items: [
      "Limiting magnitude and sky brightness: Schaefer 1990 (PASP 102, 212). Air mass: Kasten & Young 1989.",
      "B−V → temperature: Ballesteros 2012. Temperature → color: Tanner Helland 2012.",
      "Sun's distance to the Galactic center: GRAVITY Collaboration 2019. Milky Way dimensions: Bland-Hawthorn & Gerhard 2016.",
      "Cosmology: Planck Collaboration 2020 (A&A 641, A6), flat ΛCDM. Large-scale homogeneity: Scrimgeour et al. 2012.",
      "Corona brightness profile: Baumbach 1937. Black hole image: Schwarzschild geodesics.",
      "Software: Astropy, NumPy (BSD-3), three.js, Vite, Vitest (MIT). Fonts: SIL Open Font License.",
    ],
  },
  {
    title: "Known limitations",
    items: [
      "Visibility is an estimate: Schaefer-based limiting magnitude, a fixed extinction coefficient, a single zenith SQM value and a heuristic horizon glow. Real observing depends on the person, the weather and dark adaptation.",
      "The city SQM value comes from the 2015 atlas; today's sky may be brighter. Atmospheric refraction and proper motion are ignored.",
      "The sky is computed for one chosen moment; it is not live. Time is frozen during the flight.",
      "Distances to far stars are uncertain; stars without a measured distance sit on a distant shell. Years are rounded from distance.",
      "Stars are artificially brightened as you move away (\"Exposure boosted\").",
      "Real star data covers only the ~15,600 naked-eye stars. Galaxy appearances, stellar surfaces and the cosmic web beyond 2MRS are illustrations; positions, orientations and sizes are real.",
      "In the Solar System, orbits are drawn as circles and planets are enlarged.",
      "Your birth-year star is the naked-eye star whose distance matches within ±1 light-year; measurement errors can shift it by months to a year.",
      "Gyroscope direction depends on the phone's compass; expect a few degrees of error.",
    ],
  },
];

export const credits = (lang: Lang) => (lang === "en" ? en : tr);
