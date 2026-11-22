# Beyond the Sky

[English](README.md) · **Türkçe**

*The universe is closer than you think.*

**Beyond the Sky**, şehir ışıklarının bizden neyi sakladığını gösteren etkileşimli bir web deneyimi. Ankara'nın gerçek gece
gökyüzünden başlıyor; ışıkları söndürünce görünmez olan yıldızlar, Samanyolu ve Andromeda beliriyor. Ardından çatıdan kalkıp
Güneş Sistemi'nin, yakın yıldızların ve galaksilerin arasından gözlemlenebilir evrenin sınırına kadar uçuluyor.

Gökyüzündeki her yıldızın konumu, uzaklığı ve parlaklığı gerçek katalog verisinden hesaplanıyor. Temsili olan her şey ekranda
öyle etiketleniyor.

🔭 **Canlı:** [erenayyildiz0.github.io/beyond-the-sky](https://erenayyildiz0.github.io/beyond-the-sky/) · Telefonda en iyi
deneyim için jiroskobu açıp telefonu gökyüzüne çevirin.

## Özellikler

### Üç perde

1. **Işıkları Söndür:** 29 Kasım 2026, 21:00, Kızılay. Şehirden görülen 111 yıldız. Basılı tutunca ışıklar söner ve karanlık
   bir gökyüzünde görülecek 3.189 yıldız, Samanyolu ve Andromeda belirir.
2. **Yolculuk:** Çatıdan kesintisiz kalkış; Dünya, Ay, Güneş Sistemi, Voyager 1, yakın yıldızlar, Samanyolu, Yerel Grup,
   galaksi kümeleri, kozmik ağ ve kozmik mikrodalga arka planı. Serbest uçuş, rehberli duraklar, uzaklık cetveli ve her
   cisme dokunup "Buraya uç". Işık sayacı, o uzaklıktan gelen ışık yola çıktığında Dünya'da ve uzayda ne olduğunu gösterir.
3. **Senin Işığın:** Doğum yılını girersen, ışığı tam o yıl yola çıkıp bu gece Dünya'ya varan yıldızı bulur ve seni eve, o
   yıldızın altına geri götürür.

### Keşif modu

Hikâye bittikten sonra süresiz serbest keşif: yıldız ve galaksi bilgi kartları, arama, hızlı gitme menüsü, 7 görev ve
paylaşım. **Boyutlar** ekranında pulsardan M87* kara deliğine kadar gök cisimleri gerçek boyutlarıyla yan yana durur.

### Kendi gökyüzün

- **Konumumu kullan:** Gökyüzü, cihazın konumu için tarayıcıda yeniden hesaplanır. Ay'ın batmış olduğu ilk karanlık gece
  seçilir; ışık kirliliği şehir merkezi, banliyö ya da kırsal olarak ayarlanır.
- **Fotoğrafla:** Uygulamanın içinden gökyüzüne bir fotoğraf çekersin. Basılı tutunca fotoğraftaki ışıklar söner ve o yönde
  o gece görünecek gerçek yıldızlar ve Samanyolu, fotoğraftaki gökyüzünün yerine belirir.

### Diğer

- Türkçe ve İngilizce arayüz.
- Kadir, ışık yılı, Sgr A* gibi terimler noktalı altı çizili; dokununca sade bir açıklama açılır.
- Azaltılmış hareket tercihi, uyarlamalı çözünürlük, sunum kumandası desteği.
- Çalışma anında hiçbir dış ağ isteği yapılmaz; internetsiz de çalışır.

## Nasıl çalışıyor?

Proje iki parçadan oluşur:

- **Veri hattı (`pipeline/`, Python):** HYG yıldız kataloğu, NASA görüntüleri ve galaksi katalogları Astropy ile işlenir.
  Gözlem gecesi seçilir, yıldızların ufuk koordinatları ve hangilerinin şehirden ya da karanlık bir yerden görülebileceği
  hesaplanır. Sonuçlar `web/public/data/` altına JSON, ikili dosya ve doku olarak yazılır ve repoya dahildir.
- **Web uygulaması (`web/`, TypeScript + three.js):** Bu verileri okuyup gökyüzünü, uçuşu ve evren ölçeğindeki katmanları
  tarayıcıda çizer. Konum değiştiğinde gökyüzü astronomy-engine ile yeniden hesaplanır.

Görünürlük modeli (çıplak göz limit kadiri ↔ gökyüzü parlaklığı, Schaefer 1990) Python, TypeScript ve GLSL tarafında aynı
formüllerle uygulanır ve testlerle birbirine karşı doğrulanır.

## Teknolojiler

| Katman | Kullanılanlar |
|---|---|
| Web | TypeScript, three.js, GLSL, Vite, Vitest, astronomy-engine |
| Veri hattı | Python 3.11+, Astropy, NumPy, pandas, Pillow, OpenEXR, pytest |
| Yayın | GitHub Actions → GitHub Pages |

## Proje yapısı

```
beyond-the-sky/
├── pipeline/            # Python veri hattı
│   ├── bts/             # katalog, gökyüzü, görünürlük, uçuş rotası, galaksiler, dokular
│   ├── tests/
│   ├── build.py         # tüm veriyi üretir
│   └── config.yaml      # konum, tarih, SQM ve katalog ayarları
├── web/                 # tarayıcı uygulaması
│   ├── src/
│   │   ├── app/         # yönetmen, girdi, jiroskop, kamera
│   │   ├── scenes/      # perdeler ve Keşif
│   │   ├── render/      # gökyüzü, yıldızlar, gezegenler, galaksiler, kozmik ağ
│   │   ├── science/     # koordinatlar, görünürlük, sabitler, konuma göre yeniden hesaplama
│   │   ├── content/     # bilgi kartları, sözlük, tarih çapaları, kaynakça
│   │   ├── ui/          # paneller ve kontroller
│   │   └── i18n/        # Türkçe ve İngilizce metinler
│   ├── public/data/     # veri hattının çıktıları
│   └── tests/
├── docs/                # tasarım belgesi, ekler, demo akışı
└── .github/workflows/   # GitHub Pages yayını
```

## Başlarken

### Web uygulaması

Veri hattının çıktıları repoda olduğu için uygulamayı çalıştırmak için Python gerekmez. Node.js 24 önerilir.

```bash
cd web
npm install
npm run dev          # http://localhost:5173
npm run dev:https    # telefonda jiroskop denemek için (aynı ağda, HTTPS)
npm test
npm run build        # çıktı: web/dist
npm run preview      # derlenmiş sürümü yerelde aç
```

### Veri hattı (isteğe bağlı)

Veriyi yeniden üretmek ya da ayarları (tarih, konum, katalog sınırı) değiştirmek için:

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python build.py --config config.yaml
pytest -q
```

Gerekli katalog ve görüntü dosyaları ilk çalıştırmada `pipeline/raw/` içine otomatik indirilir (bu klasör git'e girmez).
Black Marble gece görüntüsü indirilemezse `build.py` dosyanın elle nereden alınacağını yazar. Şehir gökyüzü parlaklığı (SQM)
`config.yaml` içindeki `sqm_city` değeridir.

### Yayın

`main` dalına yapılan her push'ta [`.github/workflows/pages.yml`](.github/workflows/pages.yml) testleri çalıştırır, uygulamayı
derler ve GitHub Pages'e yayınlar. Repo ayarlarında **Settings → Pages → Source: GitHub Actions** seçili olmalıdır.

## Kullanım

### Klavye

| Tuş | İşlev |
|---|---|
| `Space` (basılı tut) | Işıkları söndür |
| `Enter` / `PageDown` | Sonraki durak |
| `Backspace` / `PageUp` | Önceki durak |
| `B` | Arkana bak |
| `F` | Tam ekran |
| `M` | Sesi kapat/aç |
| `R` | Baştan başla |
| `D` | Bilim paneli |

### URL parametreleri

| Parametre | Etkisi |
|---|---|
| `?lang=en` | İngilizce arayüz |
| `?az=295` | Perde 1'in başlangıç yönü (derece) |
| `?debug=1` | Bilim paneli açık |
| `?z=15.3` | Perde 2'yi bu ölçekten başlat |
| `?goto=m31` | Bir durağa ya da cisme git (yıldız için `hip:27989`) |
| `?born=2007` | Perde 3'ü bu doğum yılıyla dene |
| `?explore=1` | Doğrudan Keşif moduna gir |
| `?compare=1` | Boyutlar ekranını aç |
| `?autoplay=1` | Baştan sona kendiliğinden oynat (ekran kaydı için) |
| `?presenter=1` | Otomatik geçişler kapalı, sunum kumandasıyla ilerle |

Canlı sunum için konuşma akışı ve yedek plan: [docs/DEMO.md](docs/DEMO.md).

## Gizlilik

Doğum yılı yalnızca bellekte tutulur, hiçbir yere yazılmaz ve gönderilmez; "Baştan başla" ile silinir. Telefonun yönelimi,
konumu ve çekilen fotoğraf cihazdan çıkmaz, kaydedilmez. Çalışma anında dış ağ isteği yoktur; fontlar, veriler ve görseller yereldir. Cihazda yalnızca hikâyenin
izlendiği, ipuçlarının görüldüğü ve tamamlanan görevler saklanır (kişisel veri değil). Paylaşım yalnızca kullanıcı isterse yapılır.

## Bilinen sınırlamalar

- Görünürlük bir **tahmindir**: Schaefer tabanlı limit kadir dönüşümü, sabit sönüm katsayısı, tek bir zenit SQM değeri ve sezgisel ufuk parlaması. Gerçek gözlem kişiye, havaya ve göz uyumuna göre değişir.
- Şehir SQM değeri 2015 ışık kirliliği atlasından alınmıştır; bugünkü gökyüzü daha parlak olabilir.
- Atmosferik kırılma yok sayıldı (ufka yakın en fazla ~0,6°). Özhareket uygulanmadı.
- Gökyüzü seçilen tek bir an için hesaplanır; canlı değildir. Ay'ın ufkun altında olduğu bir gece seçilir. Uçuş sırasında zaman donuktur.
- Yıldız uzaklıkları Hipparcos paralaksından gelir; uzak yıldızlarda belirsizdir. Uzaklığı ölçülemeyen yıldızlar uzak bir kabuğa konmuştur. Yıllar uzaklığa göre yuvarlanır.
- Uzaklaştıkça yıldızların parlaklığı yapay olarak artırılır ("Pozlama artırıldı").
- Gerçek yıldız verisi yalnızca çıplak gözle görülebilen yaklaşık 15.600 yıldızı kapsar (birkaç bin ışık yılı). Samanyolu'nun geri kalanı ve diğer galaksiler temsili çizimdir; yalnızca yönleri, uzaklıkları ve Güneş'in galaksideki yeri gerçektir.
- Güneş Sistemi'nde yörüngeler daire olarak çizilmiş, gezegenler büyütülmüştür. Voyager 1'in yönü yaklaşıktır.
- Samanyolu gökyüzü katmanı NASA SVS haritasından gelir; görünürlüğü SQM'ye bağlı sezgisel bir fonksiyonla ayarlanır. Andromeda lekesi de sezgiseldir.
- Dünya görüntüsü 2016 tarihli bileşik bir uydu görüntüsüdür.
- Doğum yılı yıldızı, uzaklığı ±1 ışık yılı içinde eşleşen çıplak göz yıldızıdır; uzaklık ölçüm hataları birkaç ay ile bir yıl arası kaydırabilir.
- Jiroskop yönü telefonun pusulasına bağlıdır (manyetik kuzey, kalibrasyon); birkaç derecelik sapma olabilir.
- Keşif kartlarındaki parlaklık karşılaştırması görünür ışıktadır (V bandı) ve Hipparcos uzaklığına dayanır; uzak yıldızlarda büyük belirsizlik taşır. Tayf türü HYG'den gelir; bileşik tayflarda gösterilmez.
- Keşif yalnızca çıplak gözle görülebilen ~15.600 yıldızı içerir; yolculukta aradaki sayısız sönük yıldız yoktur.
- Yıldız yüzeyleri (granülasyon, lekeler, korona, çıkıntılar) ve kara deliklerin toplanma diski temsilidir; boyut, renk, kenar kararması ve ışığın bükülmesi hesaptan gelir. Boyutlar ekranında tam jeodezik hesap 10 Rs içinde, dışında zayıf alan yaklaşımıyla yapılır.
- 2MRS'in ötesindeki kozmik ağ temsilidir; 2MRS'in eve yakın kalabalığı akı sınırından gelen bir seçim etkisidir ve uzaktan bakınca seyreltilir.
- Asteroit ve Kuiper kuşağında noktalar cisimlerden çok büyük çizilmiştir.
- Tarih çapalarında olayın tarihi kaynaklıdır; ışığın yola çıktığı an olayla tarihsel ölçekte ±%6, derin zamanda ±%15 içinde eşlenir. Yıldız kartında yalnızca 300 ışık yılından yakın yıldızlarda gösterilir.
- Başka bir konumda ışık kirliliği ölçülmez; kullanıcının seçtiği sınıftan (şehir merkezi, banliyö, kırsal) Bortle ölçeğiyle tahmin edilir. Asteroit konumları Ankara gecesine göredir.
- Fotoğrafta gökyüzü ve ışık tespiti hatalı olabilir; maske ve hiza elle düzeltilebilir. Fotoğraftaki ışıkların sönmesi temsilidir.

## Kaynaklar ve lisanslar

### Veri
- HYG Database v4.1 — David Nash / astronexus ([github.com/astronexus/HYG-Database](https://github.com/astronexus/HYG-Database)). Lisans: CC BY-SA 4.0; türetilen `sky.json` da CC BY-SA 4.0 ile paylaşılır.
- Deep Star Maps 2020 (Samanyolu) — NASA Goddard SVS, Ernie Wright; Gaia DR2: ESA/Gaia/DPAC ([svs.gsfc.nasa.gov/4851](https://svs.gsfc.nasa.gov/4851)).
- Black Marble 2016 (gece; Ankara için 500 m/piksel C1 karosu) — NASA Earth Observatory / Suomi NPP VIIRS. Blue Marble Next Generation, Kasım 2004 (gündüz). NASA SVS 4720 / LRO (Ay). NASA/JPL/Space Science Institute Cassini PIA07782 (Jüpiter). NASA görüntüleri kamu malıdır.
- Işık kirliliği: World Atlas 2015 (Falchi ve ark. 2016), [lightpollutionmap.info](https://www.lightpollutionmap.info).
- Merkür, Venüs, Mars, Satürn, Uranüs ve Neptün dokuları: Solar System Scope (CC BY 4.0), NASA görev görüntülerinden derlenmiş (Neptün 1989 Voyager 2).
- Dönme eksenleri: IAU WGCCRE 2015 (Archinal ve ark. 2018). Yarıçaplar ve Satürn halkaları: NASA Planetary / Saturnian Rings Fact Sheet.
- Asteroit kuşağı, Jüpiter Truvalıları ve Kuiper kuşağı: NASA/JPL Small-Body Database (SBDB Query API) yörünge elemanları, gözlem gecesine iki cisim Kepler çözümüyle taşınır.
- Voyager 1: JPL Horizons (id −31); 1 ışık-günü 18 Kasım 2026 ([svs.gsfc.nasa.gov/15120](https://svs.gsfc.nasa.gov/15120)).
- Andromeda (M31) ve Üçgen Gökadası (M33) uzaklıkları: NASA Hubble Messier kataloğu.
- 2MRS galaksi kataloğu (Huchra ve ark. 2012, ApJS 199, 26): uzaklık kırmızıya kaymadan, H0 = 70 km/s/Mpc. Küme üyeleri (izdüşümde < 2 Mpc, hız farkı < 2.000 km/s) kümenin yayımlanmış uzaklığına sıkıştırıldı ("Tanrı parmakları" düzeltmesi, temsili). Küme uzaklıkları: Başak — Mei ve ark. 2007; Fornaks — Blakeslee ve ark. 2009; diğerleri cz/H0 (Struble & Rood 1999).
- Kozmik mikrodalga arka planı: ESA and the Planck Collaboration, CC BY-SA 3.0 IGO.
- Yıldız yarıçapları: Sirius A — Liebert ve ark. 2005; Arcturus — Ramírez & Allende Prieto 2011; Aldebaran — Richichi & Roccatagliata 2005; Rigel — Moravveji ve ark. 2012; Betelgeuse — Joyce ve ark. 2020; Proxima — Boyajian ve ark. 2012; VY CMa — Wittkowski ve ark. 2012; diğerleri Stefan–Boltzmann ile hesaplanır (bolometrik düzeltme: Flower 1996 / Torres 2010).
- Sıkı cisimler: PSR J0030+0451 (Riley ve ark. 2019, ApJL 887, L21), Cygnus X-1 (Miller-Jones ve ark. 2021, Science 371, 1046), Sirius B (Bond ve ark. 2017, ApJ 840, 70), Sgr A* (GRAVITY Collaboration 2022, A&A 657, L12; konum Reid & Brunthaler 2004, ApJ 616, 872), S2'nin yörüngesi (GRAVITY Collaboration 2020, A&A 636, L5), M87* (EHT Collaboration 2019, ApJL 875, L6). Yıldızlar: TRAPPIST-1 (Agol ve ark. 2021), Alfa Erboğa A (Kervella ve ark. 2017), Deneb (Schiller & Przybilla 2008), Antares (Ohnaka ve ark. 2013 + van Leeuwen 2007).

### Modeller ve sabitler
- NELM–SQM dönüşümü: Schaefer, B. E. (1990), PASP 102, 212. Hava kütlesi: Kasten & Young (1989), Applied Optics 28, 4735.
- B−V → sıcaklık: Ballesteros (2012), EPL 97, 34008. Sıcaklık → renk: Tanner Helland (2012).
- Güneş'in galaksi merkezine uzaklığı: GRAVITY Collaboration (2019), ~8,18 kpc. Galaktik çerçeve: Astropy `Galactic` (IAU 1958).
- Samanyolu ölçüleri: Bland-Hawthorn & Gerhard 2016; çubuk açısı Wegg ve ark. 2015. Galaksi görünümleri temsilidir; konum, yön ve boyut gerçektir.
- Kozmoloji: Planck Collaboration 2020 (A&A 641, A6), düz ΛCDM, H0 = 67,66, Ωm = 0,3111; büyük ölçekte homojenlik Scrimgeour ve ark. 2012.
- Güneş'in mutlak V kadiri 4,83 (Binney & Merrifield 1998). Korona parlaklık profili Baumbach (1937). Kara delik görüntüleri: Schwarzschild boş jeodezikleri.

### Merak notları

[ESA: Sirius B](https://www.esa.int/Science_Exploration/Space_Science/Weighing_the_Dog_Star_s_companion) · [NASA: Sirius B](https://science.nasa.gov/missions/hubble/astronomers-use-hubble-to-weigh-dog-stars-companion/) · [NASA: Vega](https://science.nasa.gov/solar-system/summer-triangle-corner-vega/) · [NASA APOD: When Vega is North](https://apod.nasa.gov/rjn/apod/ap150508.html) · [NASA: Betelgeuse](https://science.nasa.gov/missions/hubble-space-telescope/hubble-finds-that-betelgeuses-mysterious-dimming-is-due-to-a-traumatic-outburst) · [NASA: Pioneer 10](https://science.nasa.gov/missions/pioneer/pioneer-10-sends-last-signal/) · [Britannica: Algol](https://www.britannica.com/place/Algol-star) · [Sky & Telescope: Algol](https://skyandtelescope.org/stargazing-and-observing/behold-algol-star-secret/) · [NASA SVS: Pleiades](https://svs.gsfc.nasa.gov/14928) · [NASA: Messier 45](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-45) · [ESA: Milky Way–Andromeda](https://www.esa.int/Science_Exploration/Space_Science/Hubble_and_Gaia_revisit_fate_of_our_galaxy) · [NASA: Voyager 1 ve Gliese 445](https://www.nasa.gov/image-article/reaching-stars)

### Tarih çapaları

Olayların kaynakları `web/src/content/history.ts` içinde (NASA, ESA, Britannica, UNESCO, hakemli makaleler).
Görseller: NASA (kamu malı; Apollo 8 ve 11, STS-31, Voyager, Webb fırlatışı, Soluk Mavi Nokta, Plüton, Uranüs, Neptün, Chicxulub,
Shoemaker-Levy 9, SN 1987A, Kepler süpernova kalıntısı, Hubble XDF; sanatçı çizimleri: gezegen oluşturan disk, Samanyolu), ESA ve
Planck (CMB, CC BY-SA 3.0 IGO), Wikimedia Commons (kamu malı: Bayeux duvar halısı, Fausto Zonaro, Rohan Ustası, Kopernik 1543,
Galileo 1610, Newton 1687; CC0: The Metropolitan Museum of Art; CC BY-SA 3.0: Teomancimit, Göbeklitepe).

### Yazılım

Astropy (BSD-3), NumPy (BSD-3), three.js (MIT), astronomy-engine (MIT), Vite (MIT), Vitest (MIT), OpenEXR (BSD-3). Fontlar (Fraunces, Inter): SIL Open Font License.

## Belgeler

- [docs/SPEC.md](docs/SPEC.md): tasarım belgesi (veri, bilim, sahneler, kabul ölçütleri)
- [docs/EXTRAS.md](docs/EXTRAS.md): sonradan eklenen özellikler ve tasarımdan sapmalar
- [docs/DEMO.md](docs/DEMO.md): canlı sunum akışı ve yedek plan
