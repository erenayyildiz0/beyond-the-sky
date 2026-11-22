// Merak notları (SPEC §8.2): elle yazılmış, her biri kaynaklı. Yeni not yalnızca NASA, ESA ya da hakemli yayına dayanan
// bir kaynakla eklenir; kaynağı olmayan not eklenmez. İngilizce çeviri aynı anlamda; yeni sayı eklenmez.
// key: HIP numarası ya da cisim anahtarı ("m31", "voyager").

export interface CuriosityNote { key: number | string; tr: string; en: string; sources: { title: string; url: string }[] }

export const NOTES: CuriosityNote[] = [
  {
    key: 32349, // Sirius
    tr: "Sirius'un yanında, Dünya'dan küçük ama kütlesi Güneş'inkinin %98'i kadar olan bir beyaz cüce dolaşır: Sirius B. Sirius'tan bakan biri Güneş'i ikinci kadirden sıradan bir yıldız olarak görürdü.",
    en: "A white dwarf smaller than Earth but with 98% of the Sun's mass orbits Sirius: Sirius B. Someone looking from Sirius would see the Sun as an ordinary second-magnitude star.",
    sources: [
      { title: "ESA: Weighing the Dog Star's companion", url: "https://www.esa.int/Science_Exploration/Space_Science/Weighing_the_Dog_Star_s_companion" },
      { title: "NASA: Hubble weighs Dog Star's companion", url: "https://science.nasa.gov/missions/hubble/astronomers-use-hubble-to-weigh-dog-stars-companion/" },
    ],
  },
  {
    key: 91262, // Vega
    tr: "Yaklaşık 14.000 yıl önce kuzey kutup yıldızı Vega'ydı. Dünya'nın ekseni yavaşça yalpaladığı için yaklaşık 12.000 yıl sonra yeniden kutup yıldızı olacak.",
    en: "About 14,000 years ago the northern pole star was Vega. Because Earth's axis slowly wobbles, it will be the pole star again in about 12,000 years.",
    sources: [{ title: "NASA: Summer Triangle Corner: Vega", url: "https://science.nasa.gov/solar-system/summer-triangle-corner-vega/" }],
  },
  {
    key: 11767, // Polaris
    tr: "Kutup yıldızı her zaman Polaris değildi ve olmayacak. Dünya'nın ekseni yaklaşık 26.000 yılda bir tur atarak gökyüzünde daire çizer.",
    en: "The pole star wasn't always Polaris, and won't always be. Earth's axis traces a circle on the sky, completing a turn in about 26,000 years.",
    sources: [{ title: "NASA APOD: When Vega is North", url: "https://apod.nasa.gov/rjn/apod/ap150508.html" }],
  },
  {
    key: 27989, // Betelgeuse
    tr: "Güneş'in yerinde olsaydı yüzeyi Jüpiter'in yörüngesini geçerdi. 2019–2020'de parlaklığının üçte ikisinden fazlasını kaybetti; Hubble, yıldızın yüzeyinden fırlattığı maddenin oluşturduğu toz bulutunun ışığı kapattığını buldu.",
    en: "In the Sun's place, its surface would extend past Jupiter's orbit. In 2019–2020 it lost more than two-thirds of its brightness; Hubble found that a dust cloud formed from material ejected from its surface had blocked the light.",
    sources: [{ title: "NASA: Hubble finds Betelgeuse's dimming is due to a traumatic outburst", url: "https://science.nasa.gov/missions/hubble-space-telescope/hubble-finds-that-betelgeuses-mysterious-dimming-is-due-to-a-traumatic-outburst" }],
  },
  {
    key: 21421, // Aldebaran
    tr: "1972'de fırlatılan Pioneer 10 kabaca Aldebaran yönünde ilerliyor. Oraya varması iki milyon yıldan fazla sürecek.",
    en: "Pioneer 10, launched in 1972, is heading roughly toward Aldebaran. It will take more than two million years to get there.",
    sources: [{ title: "NASA: Pioneer 10 Sends Last Signal", url: "https://science.nasa.gov/missions/pioneer/pioneer-10-sends-last-signal/" }],
  },
  {
    key: 14576, // Algol
    tr: "Adı Arapça \"gulyabani\" anlamına gelen bir sözcükten gelir. Aslında iki yıldızdır: her 2 gün 20 saat 49 dakikada bir sönük olan parlak olanın önünden geçer ve Algol gözle görülür şekilde söner.",
    en: "Its name comes from an Arabic word meaning \"ghoul\". It is really two stars: every 2 days 20 hours 49 minutes the fainter one passes in front of the brighter one, and Algol visibly dims.",
    sources: [
      { title: "Britannica: Algol", url: "https://www.britannica.com/place/Algol-star" },
      { title: "Sky & Telescope: Algol", url: "https://skyandtelescope.org/stargazing-and-observing/behold-algol-star-secret/" },
    ],
  },
  {
    key: 17702, // Ülker / Alcyone
    tr: "Ülker, yaklaşık 100 milyon yıl önce aynı gaz bulutundan doğmuş, bin kadar yıldızlık bir küme. Yani dinozorlar varken bu yıldızlar yeni doğmuştu.",
    en: "The Pleiades is a cluster of about a thousand stars born from the same gas cloud roughly 100 million years ago. So these stars were newborn while dinosaurs were alive.",
    sources: [
      { title: "NASA: TESS triples size of Pleiades", url: "https://svs.gsfc.nasa.gov/14928" },
      { title: "NASA: Messier 45", url: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-45" },
    ],
  },
  {
    key: "m31",
    tr: "Uzun süre Samanyolu ile 4–5 milyar yıl içinde kesin çarpışacağı düşünüldü. 2025'te Hubble ve Gaia verisiyle yapılan bir çalışma, önümüzdeki 10 milyar yılda çarpışma olasılığını yaklaşık %50 buldu.",
    en: "For a long time it was thought to be certain to collide with the Milky Way within 4–5 billion years. A 2025 study using Hubble and Gaia data put the chance of a collision in the next 10 billion years at about 50%.",
    sources: [{ title: "ESA: Hubble and Gaia revisit fate of our galaxy", url: "https://www.esa.int/Science_Exploration/Space_Science/Hubble_and_Gaia_revisit_fate_of_our_galaxy" }],
  },
  {
    key: "voyager",
    tr: "Voyager 1 yaklaşık 40.000 yıl sonra, çıplak gözle görünmeyen kırmızı cüce Gliese 445'e Güneş'ten daha yakın olacak.",
    en: "In about 40,000 years Voyager 1 will be closer to Gliese 445, a red dwarf invisible to the naked eye, than to the Sun.",
    sources: [{ title: "NASA: Reaching for the stars", url: "https://www.nasa.gov/image-article/reaching-stars" }],
  },
];

export const noteFor = (key: number | string) => NOTES.find(n => n.key === key) ?? null;
