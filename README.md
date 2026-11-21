# Beyond the Sky — "Işıkları Söndür"

*The universe is closer than you think.*

Ankara'nın gerçek gece gökyüzünden başlayıp yıldızların arasından Andromeda galaksisine uçulan,
3 perdelik etkileşimli bir web deneyimi ve ardından süresiz bir Keşif modu. Ayrıntılar: [docs/SPEC.md](docs/SPEC.md).

## Kurulum

### Veri hattı (Python 3.11+)

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python build.py --config config.yaml
pytest -q
```

### Web

```bash
cd web
npm install
npm run dev          # telefonda jiroskop testi: npm run dev:https
npm test
npm run build
```

## Bilinen sınırlamalar

_(M8'de SPEC §14'e göre doldurulacak.)_

## Kaynaklar ve lisanslar

_(Tam liste M8'de SPEC §15'e göre tamamlanacak.)_

- HYG Database v4.1 — astronexus (CC BY-SA 4.0); türetilen `sky.json` da CC BY-SA 4.0.
- NASA SVS Deep Star Maps 2020 (Samanyolu), NASA Black Marble 2016 (gece; Ankara için 500 m/piksel C1 karosu),
  NASA Blue Marble Next Generation, Kasım 2004 (gündüz), NASA SVS 4720 / LRO (Ay), NASA/JPL/Space Science Institute
  Cassini PIA07782 (Jüpiter) — NASA görüntüleri kamu malıdır.
- Gök cisimlerinin dönme eksenleri: IAU WGCCRE 2015 (Archinal ve ark. 2018). Yarıçaplar ve Satürn halkaları:
  NASA Planetary / Saturnian Rings Fact Sheet.
- 2MRS galaksi kataloğu (Huchra ve ark. 2012, ApJS 199, 26): uzaklık kırmızıya kaymadan, H0 = 70 km/s/Mpc. Küme üyeleri
  (izdüşümde < 2 Mpc, hız farkı < 2.000 km/s) kümenin yayımlanmış uzaklığına sıkıştırıldı ("Tanrı parmakları" düzeltmesi, temsili).
  Küme uzaklıkları: Başak — Mei ve ark. 2007; Fornaks — Blakeslee ve ark. 2009; diğerleri cz/H0 (Struble & Rood 1999).
- Yıldız yarıçapları: yayımlanmış ölçümler (Sirius A — Liebert ve ark. 2005; Arcturus — Ramírez & Allende Prieto 2011;
  Aldebaran — Richichi & Roccatagliata 2005; Rigel — Moravveji ve ark. 2012; Betelgeuse — Joyce ve ark. 2020;
  Proxima — Boyajian ve ark. 2012; VY CMa — Wittkowski ve ark. 2012), diğerleri Stefan–Boltzmann ile hesaplanır
  (bolometrik düzeltme: Flower 1996 / Torres 2010; uzak devlerde yaklaşık).
- Galaksi görünümleri (Samanyolu, Andromeda, Üçgen, Macellan Bulutları, 2MRS) temsilidir; konum, yön ve boyut gerçektir.
  Samanyolu ölçüleri: Bland-Hawthorn & Gerhard 2016; çubuk açısı Wegg ve ark. 2015.
- Merkür, Venüs, Mars, Satürn, Uranüs ve Neptün yüzey dokuları temsilidir (boyut, eksen ve konum gerçek); ekranda belirtilir.
