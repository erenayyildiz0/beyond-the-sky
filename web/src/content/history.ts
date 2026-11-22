// Tarih çapaları (docs/EXTRAS.md T1; SPEC §16 "Tarih çapaları"): bulunduğun uzaklıktan gelen ışık yola çıktığında
// Dünya'da ve uzay tarihinde ne oluyordu. Her olay kaynaklı; kaynağı olmayan olay eklenmez. Görseller pipeline'dan
// (bts/history.py) web/public/data/history/{img}.jpg olarak gelir; hepsi kamu malı ya da özgür lisanslı.
// year: takvim yılı (MÖ için negatif: MÖ 776 → -776); ago: gözlem anından kaç yıl önce (derin zaman, yaklaşık).

export type HistoryKind = "space" | "world" | "deep";
export interface HistoryEvent {
  id: string; kind: HistoryKind; year?: number; ago?: number; approx?: boolean;
  tr: string; en: string;
  img?: string; credit?: string;
  sources: { title: string; url: string }[];
}

const NASA = "NASA (kamu malı)";

export const EVENTS: HistoryEvent[] = [
  // Uzay tarihi
  { id: "jwst", kind: "space", year: 2021, tr: "James Webb Uzay Teleskobu fırlatıldı.", en: "The James Webb Space Telescope launched.",
    img: "jwst", credit: "NASA/Bill Ingalls (kamu malı)", sources: [{ title: "NASA: Webb", url: "https://science.nasa.gov/mission/webb/" }] },
  { id: "sl9", kind: "space", year: 1994, tr: "Shoemaker-Levy 9 kuyruklu yıldızının parçaları Jüpiter'e çarptı.", en: "Fragments of comet Shoemaker-Levy 9 slammed into Jupiter.",
    img: "sl9", credit: "NASA/JPL (kamu malı)", sources: [{ title: "NASA: Comet Shoemaker-Levy 9", url: "https://science.nasa.gov/solar-system/comets/p-shoemaker-levy-9/" }] },
  { id: "sn1987a", kind: "space", year: 1987, tr: "Büyük Macellan Bulutu'nda bir süpernova görüldü: SN 1987A.", en: "A supernova was seen in the Large Magellanic Cloud: SN 1987A.",
    img: "sn1987a", credit: "NASA, ESA / Hubble (kamu malı)", sources: [{ title: "NASA: The dawn of a new era for Supernova 1987A", url: "https://science.nasa.gov/missions/hubble/the-dawn-of-a-new-era-for-supernova-1987a/" }] },
  { id: "tunguska", kind: "space", year: 1908, tr: "Sibirya'da Tunguska üzerinde bir gök cismi havada patladı.", en: "A space rock exploded in the air over Tunguska, Siberia.",
    sources: [{ title: "Britannica: Tunguska event", url: "https://www.britannica.com/event/Tunguska-event" }] },
  { id: "keplerSn", kind: "space", year: 1604, tr: "Kepler, Samanyolu'nda çıplak gözle görülen bir süpernovayı gözledi.", en: "Kepler observed a supernova in the Milky Way, visible to the naked eye.",
    img: "kepler_snr", credit: "NASA/CXC (kamu malı) · süpernovanın bugünkü kalıntısı", sources: [{ title: "NASA Chandra: Kepler's supernova remnant", url: "https://chandra.harvard.edu/photo/2013/kepler/" }] },
  { id: "tycho", kind: "space", year: 1572, tr: "Tycho Brahe, Kraliçe takımyıldızında yeni bir yıldız gördü: bir süpernova.", en: "Tycho Brahe saw a new star in Cassiopeia: a supernova.",
    sources: [{ title: "NASA Chandra: Tycho's supernova remnant", url: "https://chandra.harvard.edu/photo/2011/tycho/" }] },
  { id: "halley1066", kind: "space", year: 1066, tr: "Halley kuyruklu yıldızı göründü; Bayeux duvar halısına işlendi.", en: "Halley's Comet appeared and was stitched into the Bayeux Tapestry.",
    img: "bayeux", credit: "Bayeux duvar halısı, 11. yüzyıl, Wikimedia Commons (kamu malı)", sources: [{ title: "NASA: Comet 1P/Halley", url: "https://science.nasa.gov/solar-system/comets/1p-halley/" }] },
  { id: "eht", kind: "space", year: 2019, tr: "Bir kara deliğin ilk görüntüsü yayımlandı: M87*.", en: "The first image of a black hole was released: M87*.",
    sources: [{ title: "ESO: eso1907", url: "https://www.eso.org/public/news/eso1907/" }] },
  { id: "pluto", kind: "space", year: 2015, tr: "New Horizons Plüton'un yanından geçti.", en: "New Horizons flew past Pluto.",
    img: "pluto", credit: "NASA/JHUAPL/SwRI (kamu malı)", sources: [{ title: "NASA: New Horizons", url: "https://science.nasa.gov/mission/new-horizons/" }] },
  { id: "voyagerIs", kind: "space", year: 2012, tr: "Voyager 1 yıldızlararası uzaya geçti.", en: "Voyager 1 entered interstellar space.",
    sources: [{ title: "NASA: Voyager", url: "https://science.nasa.gov/mission/voyager/" }] },
  { id: "exoplanet", kind: "space", year: 1995, tr: "Güneş benzeri bir yıldızın çevresinde ilk ötegezegen bulundu: 51 Pegasi b.", en: "The first exoplanet around a Sun-like star was found: 51 Pegasi b.",
    sources: [{ title: "Nobel Prize in Physics 2019", url: "https://www.nobelprize.org/prizes/physics/2019/summary/" }] },
  { id: "hubble", kind: "space", year: 1990, tr: "Hubble Uzay Teleskobu yörüngeye yerleştirildi.", en: "The Hubble Space Telescope was deployed into orbit.",
    img: "hubble", credit: NASA, sources: [{ title: "NASA: Hubble", url: "https://science.nasa.gov/mission/hubble/" }] },
  { id: "paleBlueDot", kind: "space", year: 1990, tr: "Voyager 1, Güneş'ten 6 milyar km uzaktayken Dünya'yı çekti: Soluk Mavi Nokta.", en: "Voyager 1 photographed Earth from 6 billion km from the Sun: the Pale Blue Dot.",
    img: "pale_blue_dot", credit: "NASA/JPL-Caltech (kamu malı)", sources: [{ title: "NASA: The Pale Blue Dot", url: "https://science.nasa.gov/resource/voyager-1s-pale-blue-dot/" }] },
  { id: "voyager", kind: "space", year: 1977, tr: "Voyager 1 ve 2 fırlatıldı.", en: "Voyager 1 and 2 launched.",
    img: "voyager", credit: "NASA/JPL (kamu malı)", sources: [{ title: "NASA: Voyager", url: "https://science.nasa.gov/mission/voyager/" }] },
  { id: "apollo11", kind: "space", year: 1969, tr: "Apollo 11 Ay'a indi; insanlar ilk kez başka bir gök cismine ayak bastı.", en: "Apollo 11 landed on the Moon; people walked on another world for the first time.",
    img: "apollo11", credit: NASA, sources: [{ title: "NASA: Apollo 11", url: "https://www.nasa.gov/mission/apollo-11/" }] },
  { id: "earthrise", kind: "space", year: 1968, tr: "Apollo 8 Ay'ın çevresinde döndü ve \"Dünya'nın Doğuşu\" fotoğrafını çekti.", en: "Apollo 8 orbited the Moon and took the \"Earthrise\" photograph.",
    img: "earthrise", credit: NASA, sources: [{ title: "NASA: Apollo 8", url: "https://www.nasa.gov/mission/apollo-8/" }] },
  { id: "gagarin", kind: "space", year: 1961, tr: "Yuri Gagarin uzaya çıkan ilk insan oldu.", en: "Yuri Gagarin became the first human in space.",
    sources: [{ title: "Britannica: Yuri Gagarin", url: "https://www.britannica.com/biography/Yuri-Gagarin" }] },
  { id: "sputnik", kind: "space", year: 1957, tr: "İlk yapay uydu Sputnik 1 fırlatıldı.", en: "Sputnik 1, the first artificial satellite, was launched.",
    sources: [{ title: "Britannica: Sputnik", url: "https://www.britannica.com/technology/Sputnik" }] },
  { id: "plutoFound", kind: "space", year: 1930, tr: "Clyde Tombaugh Plüton'u keşfetti.", en: "Clyde Tombaugh discovered Pluto.",
    sources: [{ title: "NASA: Pluto", url: "https://science.nasa.gov/dwarf-planets/pluto/" }] },
  { id: "hubbleM31", kind: "space", year: 1923, tr: "Edwin Hubble, Andromeda'da bir değişen yıldız (V1) buldu; Andromeda'nın Samanyolu'nun dışında ayrı bir galaksi olduğu böyle anlaşıldı.", en: "Edwin Hubble found a variable star (V1) in Andromeda; this is how we learned Andromeda is a separate galaxy beyond the Milky Way.",
    sources: [{ title: "NASA: Hubble views the star that changed the universe", url: "https://science.nasa.gov/missions/hubble/hubble-views-the-star-that-changed-the-universe/" }] },
  { id: "relativity", kind: "space", year: 1915, tr: "Einstein genel görelilik kuramını tamamladı.", en: "Einstein completed the general theory of relativity.",
    sources: [{ title: "Britannica: General relativity", url: "https://www.britannica.com/science/general-relativity" }] },
  { id: "neptune", kind: "space", year: 1846, tr: "Neptün, hesaplanan konumunda gözlenerek keşfedildi.", en: "Neptune was discovered, observed at its predicted position.",
    img: "neptune", credit: "NASA/JPL (kamu malı)", sources: [{ title: "NASA: Neptune", url: "https://science.nasa.gov/neptune/" }] },
  { id: "uranus", kind: "space", year: 1781, tr: "William Herschel Uranüs'ü keşfetti; teleskopla bulunan ilk gezegen.", en: "William Herschel discovered Uranus, the first planet found with a telescope.",
    img: "uranus", credit: "NASA/JPL-Caltech (kamu malı)", sources: [{ title: "NASA: Uranus", url: "https://science.nasa.gov/uranus/" }] },
  { id: "principia", kind: "space", year: 1687, tr: "Newton Principia'yı yayımladı: hareket yasaları ve evrensel kütle çekimi.", en: "Newton published the Principia: the laws of motion and universal gravitation.",
    img: "principia", credit: "Wikimedia Commons (kamu malı)", sources: [{ title: "Britannica: Principia", url: "https://www.britannica.com/topic/Principia" }] },
  { id: "galileo", kind: "space", year: 1610, tr: "Galileo teleskopla Jüpiter'in dört uydusunu gördü.", en: "Galileo saw four moons of Jupiter through his telescope.",
    img: "sidereus", credit: "Wikimedia Commons (kamu malı)", sources: [{ title: "Britannica: Galileo", url: "https://www.britannica.com/biography/Galileo-Galilei" }] },
  { id: "copernicus", kind: "space", year: 1543, tr: "Kopernik, Dünya'nın Güneş'in çevresinde döndüğü modeli yayımladı.", en: "Copernicus published the model in which Earth orbits the Sun.",
    img: "copernicus", credit: "Wikimedia Commons (kamu malı)", sources: [{ title: "Britannica: Nicolaus Copernicus", url: "https://www.britannica.com/biography/Nicolaus-Copernicus" }] },
  { id: "crab", kind: "space", year: 1054, tr: "Çinli gökbilimciler yaklaşık bir ay gündüz bile görülen bir \"konuk yıldız\" kaydetti; kalıntısı bugünkü Yengeç Bulutsusu.", en: "Chinese astronomers recorded a \"guest star\" visible in the daytime sky for nearly a month; its remnant is today's Crab Nebula.",
    sources: [{ title: "NASA: Messier 1", url: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-1/" }] },
  // Dünya tarihi
  { id: "republic", kind: "world", year: 1923, tr: "Türkiye Cumhuriyeti ilan edildi.", en: "The Republic of Turkey was proclaimed.",
    sources: [{ title: "Britannica: Kemal Atatürk", url: "https://www.britannica.com/biography/Kemal-Ataturk" }] },
  { id: "istanbul", kind: "world", year: 1453, tr: "İstanbul fethedildi.", en: "Constantinople was conquered by the Ottomans.",
    img: "istanbul", credit: "Fausto Zonaro, Wikimedia Commons (kamu malı)", sources: [{ title: "Britannica: Fall of Constantinople", url: "https://www.britannica.com/event/Fall-of-Constantinople-1453" }] },
  { id: "malazgirt", kind: "world", year: 1071, tr: "Malazgirt Savaşı yapıldı.", en: "The Battle of Manzikert was fought.",
    img: "malazgirt", credit: "Rohan Ustası, 15. yüzyıl el yazması (Boccaccio, De casibus), Wikimedia Commons (kamu malı)", sources: [{ title: "Britannica: Battle of Manzikert", url: "https://www.britannica.com/event/Battle-of-Manzikert" }] },
  { id: "olympics", kind: "world", year: -776, tr: "Kayıtlardaki ilk Olimpiyat Oyunları (geleneksel tarih).", en: "The first recorded Olympic Games (traditional date).",
    sources: [{ title: "Britannica: Olympic Games", url: "https://www.britannica.com/sports/Olympic-Games" }] },
  { id: "pyramid", kind: "world", year: -2560, approx: true, tr: "Mısır'da Büyük Piramit yapılıyordu.", en: "The Great Pyramid was being built in Egypt.",
    sources: [{ title: "Britannica: Pyramids of Giza", url: "https://www.britannica.com/topic/Pyramids-of-Giza" }] },
  { id: "writing", kind: "world", year: -3200, approx: true, tr: "Mezopotamya'da yazı ortaya çıktı: çivi yazısı.", en: "Writing appeared in Mesopotamia: cuneiform.",
    img: "cuneiform", credit: "The Metropolitan Museum of Art (CC0)", sources: [{ title: "Britannica: Cuneiform", url: "https://www.britannica.com/topic/cuneiform" }] },
  { id: "gobekli", kind: "world", year: -9600, approx: true, tr: "Göbeklitepe'de anıtsal yapılar kuruluyordu.", en: "Monumental structures were being built at Göbekli Tepe.",
    img: "gobekli", credit: "Teomancimit, Wikimedia Commons (CC BY-SA 3.0)", sources: [{ title: "UNESCO: Göbekli Tepe", url: "https://whc.unesco.org/en/list/1572" }] },
  // Derin zaman
  { id: "holocene", kind: "deep", ago: 11_700, tr: "Son buzul çağı sona erdi.", en: "The last ice age ended.",
    sources: [{ title: "ICS: International Chronostratigraphic Chart", url: "https://stratigraphy.org/chart" }] },
  { id: "lgm", kind: "deep", ago: 20_000, tr: "Buzullar en geniş halindeydi (son buzul maksimumu).", en: "Ice sheets were at their largest (Last Glacial Maximum).",
    sources: [{ title: "Clark ve ark. 2009, Science 325, 710", url: "https://www.science.org/doi/10.1126/science.1172873" }] },
  { id: "sapiens", kind: "deep", ago: 300_000, tr: "Bilinen en eski Homo sapiens fosilleri bu çağdan.", en: "The oldest known Homo sapiens fossils date from this time.",
    sources: [{ title: "Hublin ve ark. 2017, Nature 546, 289", url: "https://www.nature.com/articles/nature22336" }] },
  { id: "homo", kind: "deep", ago: 2_800_000, tr: "İnsan cinsinin (Homo) bilinen en eski fosili bu çağdan.", en: "The oldest known fossil of our genus, Homo, dates from this time.",
    sources: [{ title: "Villmoare ve ark. 2015, Science 347, 1352", url: "https://www.science.org/doi/10.1126/science.aaa1343" }] },
  { id: "tools", kind: "deep", ago: 3_300_000, tr: "Bilinen en eski taş aletler yapıldı.", en: "The oldest known stone tools were made.",
    sources: [{ title: "Harmand ve ark. 2015, Nature 521, 310", url: "https://www.nature.com/articles/nature14464" }] },
  { id: "dinos", kind: "deep", ago: 66_000_000, tr: "Bir asteroit çarptı; dinozorların çağı sona erdi.", en: "An asteroid struck; the age of dinosaurs ended.",
    img: "chicxulub", credit: "NASA/JPL-Caltech (kamu malı)", sources: [{ title: "Renne ve ark. 2013, Science 339, 684", url: "https://www.science.org/doi/10.1126/science.1230492" }] },
  { id: "permian", kind: "deep", ago: 252_000_000, tr: "Dünya tarihinin en büyük kitlesel yok oluşu yaşandı.", en: "The largest mass extinction in Earth's history took place.",
    sources: [{ title: "Burgess ve ark. 2014, PNAS 111, 3316", url: "https://www.pnas.org/doi/10.1073/pnas.1317692111" }] },
  { id: "cambrian", kind: "deep", ago: 538_800_000, tr: "Kambriyen başladı: hayvan yaşamı hızla çeşitlendi.", en: "The Cambrian began: animal life diversified rapidly.",
    sources: [{ title: "ICS: International Chronostratigraphic Chart", url: "https://stratigraphy.org/chart" }] },
  { id: "life", kind: "deep", ago: 3_700_000_000, tr: "Dünya'daki yaşamın bilinen en eski izleri bu çağdan.", en: "The oldest known traces of life on Earth date from this time.",
    sources: [{ title: "Nutman ve ark. 2016, Nature 537, 535", url: "https://www.nature.com/articles/nature19355" }] },
  { id: "moon", kind: "deep", ago: 4_510_000_000, tr: "Genç Dünya'ya dev bir cisim çarptı; saçılan maddeden Ay oluştu.", en: "A giant body struck the young Earth; the Moon formed from the debris.",
    sources: [{ title: "Barboni ve ark. 2017, Science Advances 3, e1602365", url: "https://www.science.org/doi/10.1126/sciadv.1602365" },
              { title: "NASA: How the Moon formed", url: "https://science.nasa.gov/moon/formation/" }] },
  { id: "solarSystem", kind: "deep", ago: 4_567_000_000, tr: "Güneş yeni doğmuştu; çevresindeki gaz ve toz diskinde gezegenlerin ilk katıları yoğuşuyordu.", en: "The Sun had just been born; the first solids of the planets were condensing in the disc of gas and dust around it.",
    img: "disk", credit: "NASA/JPL-Caltech (kamu malı) · sanatçı çizimi (temsili)", sources: [{ title: "Connelly ve ark. 2012, Science 338, 651", url: "https://www.science.org/doi/10.1126/science.1226919" }] },
  { id: "enceladus", kind: "deep", ago: 10_000_000_000, tr: "Samanyolu, Gaia-Enceladus adlı daha küçük bir galaksiyle birleşti.", en: "The Milky Way merged with a smaller galaxy called Gaia-Enceladus.",
    img: "milkyway", credit: "NASA/JPL-Caltech (kamu malı) · sanatçı çizimi (temsili)", sources: [{ title: "Helmi ve ark. 2018, Nature 563, 85", url: "https://www.nature.com/articles/s41586-018-0625-x" }] },
  { id: "thickDisk", kind: "deep", ago: 13_000_000_000, tr: "Samanyolu'nun kalın diski oluşmaya başladı.", en: "The Milky Way's thick disc began to form.",
    sources: [{ title: "Xiang & Rix 2022, Nature 603, 599", url: "https://www.nature.com/articles/s41586-022-04496-5" }] },
  { id: "firstGalaxies", kind: "deep", ago: 13_500_000_000, tr: "Evren 300 milyon yaşından gençti; bilinen en uzak galaksiler (JADES-GS-z14-0) parlıyordu.", en: "The universe was less than 300 million years old; the most distant known galaxies (JADES-GS-z14-0) were shining.",
    img: "xdf", credit: "NASA, ESA / Hubble eXtreme Deep Field (kamu malı) · en derin Hubble görüntüsü", sources: [{ title: "Carniani ve ark. 2024, Nature 633, 318", url: "https://www.nature.com/articles/s41586-024-07860-9" }] },
  { id: "cmb", kind: "deep", ago: 13_800_000_000, tr: "Evren yaklaşık 380.000 yaşındaydı; ilk serbest ışık yola çıktı. Bugün onu kozmik mikrodalga arka planı olarak görüyoruz.", en: "The universe was about 380,000 years old; the first free light set out. Today we see it as the cosmic microwave background.",
    img: "cmb", credit: "ESA and the Planck Collaboration (CC BY-SA 3.0 IGO)", sources: [{ title: "ESA: Planck and the cosmic microwave background", url: "https://www.esa.int/Science_Exploration/Space_Science/Planck/Planck_and_the_cosmic_microwave_background" }] },
  { id: "earth", kind: "deep", ago: 4_540_000_000, tr: "Dünya oluşuyordu.", en: "Earth was forming.",
    sources: [{ title: "USGS: Age of the Earth", url: "https://pubs.usgs.gov/gip/geotime/age.html" }] },
];

/** Olayın gözlem anından kaç yıl önce olduğu */
export const eventAgo = (e: HistoryEvent, obsYear: number) => e.ago ?? obsYear - (e.year! < 0 ? e.year! + 1 : e.year!);

/**
 * Işığın yola çıktığı an (lookback yıl önce) için en yakın olaylar. Pencere: tarihsel ölçekte ±max(3, %6),
 * derin zamanda ±%15 (olayların kendisi de yaklaşık). En fazla n olay, yakınlığa göre.
 */
export function eventsFor(lookback: number, obsYear: number, n = 2): HistoryEvent[] {
  if (lookback < 1) return [];
  const w = lookback < 20_000 ? Math.max(3, 0.06 * lookback) : 0.15 * lookback;
  return EVENTS.map(e => ({ e, d: Math.abs(eventAgo(e, obsYear) - lookback) }))
    .filter(x => x.d <= w).sort((a, b) => a.d - b.d).slice(0, n).map(x => x.e);
}
