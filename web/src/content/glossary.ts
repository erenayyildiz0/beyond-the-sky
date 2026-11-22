// Sözlük: ekrandaki yabancı gelebilecek terimler için sade açıklamalar. Metinde noktalı altı çizili görünür, dokununca açılır.
// Sayı içeren açıklamalar sabitlerden (constants.ts) ya da uygulamada zaten kaynaklı gösterilen değerlerden gelir.
// tr/en: eşleşme desenleri (düzenli ifade; Türkçe eklere izin verilir). exact: kısa kısaltmalar, ardından harf gelmemeli.

export interface Term { id: string; tr: string[]; en: string[]; exact?: boolean; def: { tr: string; en: string } }

export const TERMS: Term[] = [
  { id: "ly", tr: ["[Iı]şık yıl"], en: ["light-year"], def: {
    tr: "Işığın bir yılda aldığı yol: yaklaşık 9,46 trilyon km. Bir uzaklık ölçüsüdür, zaman değil.",
    en: "The distance light travels in a year: about 9.46 trillion km. It measures distance, not time." } },
  { id: "mag", tr: ["kadir"], en: ["magnitude"], def: {
    tr: "Gökbilimde parlaklık ölçüsü. Sayı büyüdükçe cisim sönükleşir; 5 kadirlik fark 100 kat parlaklık farkıdır. Karanlık bir gökte çıplak göz yaklaşık 6 kadire kadar görür.",
    en: "Astronomers' brightness scale. Bigger numbers are fainter; 5 magnitudes is a factor of 100. Under a dark sky the naked eye reaches about magnitude 6." } },
  { id: "hip", tr: ["Hipparcos"], en: ["Hipparcos"], def: {
    tr: "ESA'nın 1989–1993'te çalışan uydusu. Yıldızların uzaklığını, Dünya Güneş'in çevresinde dolanırken yıldızın gökte yaptığı küçük kaymadan (paralaks) ölçtü.",
    en: "ESA satellite that operated in 1989–1993. It measured star distances from the tiny shift a star shows as Earth orbits the Sun (parallax)." } },
  { id: "con", tr: ["takımyıldız"], en: ["constellation"], def: {
    tr: "Gökyüzünde yan yana görünen yıldızların oluşturduğu desen ve sınırları belirli gök bölgesi (88 tane). Yıldızları aslında birbirinden çok farklı uzaklıklarda olabilir.",
    en: "A pattern of stars that look close together, and the sky region around it (there are 88). Its stars can be at very different distances." } },
  { id: "cas", tr: ["Kraliçe"], en: ["Cassiopeia"], def: {
    tr: "Kraliçe (Cassiopeia): kuzey gökyüzünde W harfine benzeyen bir takımyıldız.",
    en: "Cassiopeia: a W-shaped constellation in the northern sky." } },
  { id: "achird", tr: ["Achird"], en: ["Achird"], def: {
    tr: "Achird (η Cassiopeiae): Kraliçe takımyıldızında, Güneş'e benzeyen yakın bir yıldız.",
    en: "Achird (η Cassiopeiae): a nearby Sun-like star in Cassiopeia." } },
  { id: "pleiades", tr: ["Ülker"], en: ["Pleiades"], def: {
    tr: "Ülker (Pleiades): Boğa takımyıldızında çıplak gözle görülen genç bir yıldız kümesi.",
    en: "The Pleiades: a young star cluster in Taurus, visible to the naked eye." } },
  { id: "sn", tr: ["süpernova"], en: ["supernova"], def: {
    tr: "Bir yıldızın patlayarak kısa bir süre bütün bir galaksi kadar parlayabildiği olay.",
    en: "A stellar explosion that can briefly outshine an entire galaxy." } },
  { id: "wd", tr: ["beyaz cüce"], en: ["white dwarf"], def: {
    tr: "Güneş gibi yıldızların ömrünün sonunda geriye kalan, Dünya boyutunda ama çok yoğun çekirdek.",
    en: "The Earth-sized but extremely dense core left when a Sun-like star dies." } },
  { id: "ns", tr: ["nötron yıldız", "[Pp]ulsar"], en: ["neutron star", "[Pp]ulsar"], def: {
    tr: "Büyük kütleli bir yıldızın patlamasından kalan, şehir büyüklüğünde ama Güneş'ten ağır çekirdek. Pulsar, dönerken ışın demetleri bize doğru süpüren nötron yıldızıdır.",
    en: "The city-sized remnant of a massive star's explosion, heavier than the Sun. A pulsar is a neutron star whose beams sweep past us as it spins." } },
  { id: "bh", tr: ["kara delik"], en: ["black hole"], def: {
    tr: "Kütle çekiminin ışığın bile kaçamayacağı kadar güçlü olduğu bölge.",
    en: "A region where gravity is so strong that not even light can escape." } },
  { id: "horizon", tr: ["[Oo]lay ufk"], en: ["[Ee]vent horizon", "[Ee]vent-horizon"], def: {
    tr: "Kara deliğin geri dönüşü olmayan sınırı: içeri giren ışık bile çıkamaz.",
    en: "A black hole's point of no return: even light that crosses it cannot get out." } },
  { id: "rs", tr: ["Rs"], en: ["Rs"], exact: true, def: {
    tr: "Rs (Schwarzschild yarıçapı): olay ufkunun yarıçapı. Kütleyle orantılı büyür: Rs = 2GM/c².",
    en: "Rs (Schwarzschild radius): the radius of the event horizon. It grows in proportion to mass: Rs = 2GM/c²." } },
  { id: "sgra", tr: ["Sgr A\\*"], en: ["Sgr A\\*"], def: {
    tr: "Sagittarius A*: Samanyolu'nun merkezindeki dev kara delik; Yay takımyıldızı yönünde.",
    en: "Sagittarius A*: the giant black hole at the centre of the Milky Way, toward Sagittarius." } },
  { id: "s2", tr: ["S2"], en: ["S2"], exact: true, def: {
    tr: "S2: Sgr A*'nın çok yakınından geçen bir yıldız. Yörüngesi, kara deliğin kütlesini ölçmeyi sağladı.",
    en: "S2: a star that swings very close to Sgr A*. Its orbit made it possible to weigh the black hole." } },
  { id: "lg", tr: ["Yerel Grup"], en: ["Local Group"], def: {
    tr: "Samanyolu, Andromeda, Üçgen Gökadası ve onlarca küçük galaksiden oluşan galaksi grubumuz.",
    en: "Our group of galaxies: the Milky Way, Andromeda, Triangulum and dozens of small galaxies." } },
  { id: "mw", tr: ["Samanyolu"], en: ["Milky Way"], def: {
    tr: "İçinde yaşadığımız galaksi. Geceleri gökyüzünü kesen soluk ışık kuşağı, onun diskine içeriden bakışımızdır.",
    en: "The galaxy we live in. The faint band of light across the night sky is our inside view of its disc." } },
  { id: "m31", tr: ["Andromeda"], en: ["Andromeda"], def: {
    tr: "Bize en yakın büyük sarmal galaksi; karanlık bir gökte çıplak gözle soluk bir leke olarak görülür.",
    en: "The nearest large spiral galaxy; under a dark sky it is a faint smudge to the naked eye." } },
  { id: "galaxy", tr: ["galaksi", "gökada"], en: ["galaxy", "galaxies"], def: {
    tr: "Kütle çekimiyle bir arada duran milyarlarca yıldız, gaz ve tozdan oluşan sistem.",
    en: "A system of billions of stars, gas and dust held together by gravity." } },
  { id: "cluster", tr: ["Kümesi"], en: ["Cluster"], def: {
    tr: "Galaksi kümesi: yüzlerce ila binlerce galaksinin kütle çekimiyle bir arada durduğu yapı.",
    en: "Galaxy cluster: hundreds to thousands of galaxies bound together by gravity." } },
  { id: "web", tr: ["[Kk]ozmik ağ"], en: ["[Cc]osmic web"], def: {
    tr: "Galaksilerin evrende düzgün dağılmayıp ipliksi yapılar, duvarlar ve aralarındaki büyük boşluklar halinde dizilişi.",
    en: "The way galaxies are arranged in filaments and walls around huge empty voids, rather than spread evenly." } },
  { id: "cmb", tr: ["[Kk]ozmik mikrodalga", "CMB"], en: ["[Cc]osmic microwave", "CMB"], def: {
    tr: "Kozmik mikrodalga arka planı: evrenin ilk serbest ışığı. Evren yaklaşık 380.000 yaşındayken yola çıktı (ESA Planck).",
    en: "Cosmic microwave background: the universe's first free light, released when it was about 380,000 years old (ESA Planck)." } },
  { id: "comoving", tr: ["eşhareketli"], en: ["comoving"], def: {
    tr: "Eşhareketli uzaklık: evrenin genişlemesini hesaba katarak bugün ölçülen uzaklık. Işığın yolculuk süresiyle aynı değildir; bu yüzden uzakta ikisi ayrı yazılır.",
    en: "Comoving distance: today's distance, accounting for the expansion of the universe. It differs from the light-travel time, so far away both are shown." } },
  { id: "2mrs", tr: ["2MRS"], en: ["2MRS"], exact: true, def: {
    tr: "2MASS Redshift Survey: yakın evrendeki yaklaşık 44.600 galaksinin konumunu veren gökyüzü taraması (Huchra ve ark. 2012).",
    en: "2MASS Redshift Survey: a sky survey mapping about 44,600 nearby galaxies (Huchra et al. 2012)." } },
  { id: "planck", tr: ["Planck 2018"], en: ["Planck 2018"], def: {
    tr: "Planck uydusunun ölçümlerine dayanan standart evren modeli; uzak ışığın yolculuk süresi bununla hesaplanır.",
    en: "The standard model of the universe based on the Planck satellite; light-travel times far away are computed with it." } },
  { id: "au", tr: ["AB"], en: ["AU"], exact: true, def: {
    tr: "AB (astronomik birim): Dünya ile Güneş arasındaki ortalama uzaklık, 149,6 milyon km.",
    en: "AU (astronomical unit): the average Earth–Sun distance, 149.6 million km." } },
  { id: "ms", tr: ["anakol"], en: ["main sequence"], def: {
    tr: "Yıldızların ömürlerinin çoğunu, çekirdeklerinde hidrojen yakarak geçirdiği evre. Güneş de anakolda.",
    en: "The phase in which stars spend most of their lives, burning hydrogen in their cores. The Sun is on it." } },
  { id: "giant", tr: ["[Ss]üperdev", "[Aa]ltdev"], en: ["[Ss]upergiant", "[Ss]ubgiant"], def: {
    tr: "Çekirdeğindeki hidrojeni tüketip şişen yıldızlar: altdev bu yolun başında, dev ve süperdev (en büyük kütleliler) ilerisinde.",
    en: "Stars that swell after using up the hydrogen in their cores: subgiants are starting out, giants and supergiants (the most massive) are further along." } },
  { id: "voyager", tr: ["Voyager 1"], en: ["Voyager 1"], def: {
    tr: "1977'de fırlatılan NASA uzay aracı; insan yapımı en uzak cisim.",
    en: "NASA spacecraft launched in 1977; the most distant human-made object." } },
  { id: "exo", tr: ["ötegezegen"], en: ["exoplanet"], def: {
    tr: "Güneş dışındaki bir yıldızın çevresinde dolanan gezegen.",
    en: "A planet orbiting a star other than the Sun." } },
  { id: "belt", tr: ["[Aa]steroit kuşağı"], en: ["[Aa]steroid belt"], def: {
    tr: "Mars ile Jüpiter arasında, kayalık küçük cisimlerin dolandığı bölge.",
    en: "The region between Mars and Jupiter where small rocky bodies orbit." } },
  { id: "kuiper", tr: ["Kuiper kuşağı"], en: ["Kuiper belt"], def: {
    tr: "Neptün'ün ötesinde, Plüton gibi buzlu küçük cisimlerin dolandığı bölge.",
    en: "The region beyond Neptune where icy small bodies such as Pluto orbit." } },
  { id: "trojans", tr: ["Truvalı"], en: ["Trojans"], def: {
    tr: "Jüpiter'in yörüngesinde, onun önünde ve arkasında iki grup halinde toplanan asteroitler.",
    en: "Asteroids gathered in two groups ahead of and behind Jupiter along its orbit." } },
  { id: "exposure", tr: ["Pozlama artırıldı"], en: ["Exposure boosted"], def: {
    tr: "Uzaklaştıkça yıldızlar gerçekte çok sönükleşir. Görünsünler diye parlaklıkları yapay olarak artırıldı.",
    en: "Stars get very faint as you move away; their brightness is boosted artificially so you can still see them." } },
  { id: "gran", tr: ["granülasyon"], en: ["granulation"], def: {
    tr: "Güneş gibi yıldızların yüzeyindeki kaynayan hücreler: sıcak gaz ortadan yükselir, soğuyan gaz kenarlardan iner.",
    en: "Boiling cells on the surface of Sun-like stars: hot gas rises in the middle, cooler gas sinks at the edges." } },
  { id: "corona", tr: ["korona"], en: ["corona"], def: {
    tr: "Yıldızın en dış, çok seyrek ve sıcak katmanı. Güneş'te yalnızca tam tutulmada çıplak gözle görülür.",
    en: "A star's outermost, very thin and hot layer. On the Sun it is visible to the eye only during a total eclipse." } },
  { id: "observable", tr: ["Gözlemlenebilir evren"], en: ["[Oo]bservable universe"], def: {
    tr: "Evrenin yaşı boyunca ışığı bize ulaşabilmiş bölge. Kenarındaki ışık yola çıktığından beri uzay genişlediği için, sınırı ışık yolculuğu süresinden çok daha uzaktadır.",
    en: "The region whose light has had time to reach us over the age of the universe. Space has expanded since that light set out, so its edge is much farther than the light-travel time suggests." } },
];

/** Metindeki terimler: her terimin ilk geçtiği yer, çakışmasız, sıralı */
export function findTerms(text: string, lang: "tr" | "en") {
  const hits: { start: number; end: number; term: Term }[] = [];
  for (const term of TERMS) {
    const src = (lang === "tr" ? term.tr : term.en).join("|");
    const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${src})${term.exact ? "(?![\\p{L}\\p{N}])" : ""}`, "u");
    const m = re.exec(text);
    if (!m) continue;
    const start = m.index, end = start + m[0].length;
    if (hits.some(h => start < h.end && end > h.start)) continue;      // önce gelen (daha özgül) terim kazanır
    hits.push({ start, end, term });
  }
  return hits.sort((a, b) => a.start - b.start);
}
