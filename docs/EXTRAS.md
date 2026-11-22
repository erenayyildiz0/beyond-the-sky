# Ek milestone'lar (SPEC dışı, kullanıcı onaylı)

SPEC v3'ün üstüne eklenen özellikler. Amaç: **kullanıcı kendi konumunda, kendi gökyüzünde neyden mahrum
kaldığını görsün.** Ankara (Kızılay) varsayılan ve demo olarak kalır; SPEC'teki sayılar ve testler Ankara için geçerlidir.

## R — Gerçekçilik paketi (karar: 21.11.2026)

Kullanıcı geri bildirimi: galaksiye üstten bakılamıyor, kümelere gidilemiyor, Dünya/Ay/şehir gerçekçi değil.
- **R1 — Dünya, Ankara, Ay, Güneş, gezegenler:** NASA Blue Marble (gündüz), Black Marble + Ankara 500 m/piksel karo (gece),
  terminatör, okyanus yansıması, atmosfer; LRO Ay haritası ve gelgit kilidi; IAU dönme eksenleri (Güneş dahil);
  Cassini Jüpiter haritası; diğer gezegenler Solar System Scope dokuları (CC BY 4.0, NASA görev görüntülerinden);
  Satürn halkaları gerçek yarıçaplarla; atmosfersiz yüzeyde Lommel–Seeliger, dev gezegenlerde Minnaert kenar kararması.
- **R1b — Yıldız yüzeyleri (22.11.2026):** Güneş ve yaklaşılan yıldızlar düz küre değil: kaynayan granülasyon (Güneş'te
  ~1.000 km; granül boyutu yarıçapla büyür, süperdevlerde birkaç dev hücre), süpergranül ağı, fakülalar, lekeler,
  dalga boyuna bağlı kenar kararması; çevrede kromosfer, Baumbach profilli korona (akıntılar, kutup tüyleri) ve kıvrımlı
  çıkıntılar. Hepsi temsili ve etiketli; boyut, renk ve kenar kararması gerçek. Güneş'e yüzeyin ~14.000 km üstüne kadar inilir.
- **R1c — Asteroit ve Kuiper kuşağı (22.11.2026):** JPL SBDB'den ana kuşak (H < 15, ~64.000), Jüpiter Truvalıları
  (H < 14, ~4.500) ve Neptün ötesi cisimler (~8.400); yörünge elemanları pipeline'da Kepler ile gözlem gecesine taşınır
  (Horizons'la Ceres farkı ~0,001 AB). "Asteroit kuşağı" ve "Kuiper kuşağı" durakları ekliptiğin kuzeyinden bakar.
- **R2 — Samanyolu ve Yerel Grup:** üstten ve yandan bakılabilir, katmanlı disk + parçacıklar (temsili; konum ve yön gerçek).
- **R3 — Kozmik ölçek:** 2MRS (~44.600 gerçek galaksi), H0 = 70 ile uzaklık, kümeler, kaçınma bölgesi; ~1,5 milyar ışık yılına kadar.
- **R5 — Gözlemlenebilir evren:** Planck 2018 düz ΛCDM ile ışık yolculuğu süresi (100 milyon ışık yılının ötesinde),
  2MRS'in ötesi temsili kozmik ağ, sınırda Planck CMB haritası (ESA and the Planck Collaboration, CC BY-SA 3.0 IGO) küre
  olarak (yarıçap = son saçılma yüzeyinin eşhareketli uzaklığı, ~45 milyar ışık yılı). Sayılar milyar/sekstilyon/septilyon.
  Uzaktan (evden 1,2–2,2 milyar ışık yılının ötesinde) 2MRS galaksileri ve temsili ağ aynı yoğunlukta seyreltilir: 2MRS akı sınırlı
  olduğundan eve yakın yoğunluk ~15.000 kat fazla (seçim etkisi); evren ~300 milyon ışık yılının üstünde homojen (Scrimgeour ve ark.
  2012). Temsili ağ log-düzgün örneklenir, sis kameraya göredir (web/src/render/cosmicSampling.ts).
- **R4 — Yıldızların gerçek boyutu ve boyut karşılaştırması** (kullanıcının ilham kaynağı "Star Size Comparison 2"):
  yıldızın yanına gidince gerçek yarıçaplı küre (Stefan–Boltzmann ile L ve T'den, bilinen devler için yayımlanmış ölçümler);
  Ay → Dünya → Jüpiter → Güneş → Sirius → Arcturus → Betelgeuse … yan yana karşılaştırma modu. Kaynaklı.

- **R4b — Sıkı cisimler ve kara delikler (22.11.2026):** karşılaştırmaya pulsar PSR J0030+0451 (NICER, 12,7 km),
  Cygnus X-1, Sirius B, TRAPPIST-1, Alfa Erboğa A, Deneb, Antares, Sgr A* ve M87* eklendi (kaynaklar ekranda).
  Kara deliklerde olay ufku yarıçapı Rs = 2GM/c²; ışığın bükülmesi her piksel için Schwarzschild boş jeodeziğiyle
  izlenir (gölge, foton halkası, bükülen arka plan); toplanma diski temsili (Doppler ve kütle çekimsel kızıla kayma dahil).
  Uçuşta "Samanyolu'nun merkezi" durağı: Sgr A* (konum Reid & Brunthaler 2004, kütle ve uzaklık GRAVITY 2022),
  disk ekseni bakış doğrultusuna 40° (EHT 2022: neredeyse yüzden görüyoruz).

## P1 — Perde 1: ışık seviyesi ve gerçekçi Samanyolu (karar: 21.11.2026)

- Basılı tutunca ışıklar söner, **bırakınca olduğu yerde kalır** (SPEC'te 3,5 sn'de geri geliyordu). Altta bir dimmer:
  ışıkları istediğin seviyeye getirir, yeniden açar. p bir kez 1'e ulaşınca açılış metinleri gelir; sonra da ayarlanabilir.
- **Samanyolu kontrast eşiği** (SPEC §3.4'ün yerine, sezgisel): arka plan parlaklığı `skyLum = 10^(−0,4·(SQM − 22))`,
  eşik `T = 0,005 + 0,02·(skyLum − 1)`, her doku pikselinin görünür kesri `(L − T) / L`. Göz arka planı çıkarır: SQM ~19,7'de
  yalnızca en parlak çekirdekler soluk, 21'de çekirdekler belirgin, 22'de sönük kısımlar da. Yıldızların parlaktan sönüğe
  belirişiyle tutarlı.

## P2 — Perde 2: serbest uçuş (karar: 21.11.2026, M3b)

SPEC §2.3 ve §6.5'teki "ray" (Ankara → Andromeda tek çizgi, yalnızca ileri/geri) yerine:
- **Kesintisiz kalkış:** çatıdan (0,9 km) başlar; İleri basılı tutunca yükselirsin, km sayacı akar; siyah kesinti yok.
  100 km'nin altında İleri hep yukarı götürür. 20 km civarında Perde 1 gökyüzünden katmanlı görüntüye geçilir.
- **Serbest hareket:** İleri/Geri baktığın yöne; bakış serbest. Hız bulunduğun yerin ölçeğine göre (SPEC §6.12 `cruiseSpeed`, km cinsine genişletildi).
- **Dokun → Buraya uç:** yıldızlar ve Güneş Sistemi cisimleri (Ay, Güneş, gezegenler, Voyager 1, Dünya).
- **Rehberli duraklar:** "Sonraki durak ›" / PageDown–PageUp; duraklar gerçek ziyaret noktaları (Ay'ın yanı, Voyager'ın yanı…).
- **Mesafe:** ışık süresinin altında km ("372.193 km", "20,8 kentilyon km") ve uzakta ışık yılı.
- Katmanlı çizim (§6.5.1) aynen; kamera konumu raydan değil serbest konumdan gelir.

## T1 — Tarih çapaları (karar: 22.11.2026; SPEC §16'dan öne alındı)

Kullanıcı isteği: uzaklaştıkça, o uzaklıktan gelen ışık yola çıktığında Dünya tarihinde ve uzay tarihinde ne olduğu
görünsün; dokununca fotoğraflı bir kutu açılsın.
- **Uçuşta:** ışık sayacının altında "O sıralarda: Apollo 11 Ay'a indi (1969) ›". Işığın yola çıktığı an = evden uzaklık
  (100 milyon ışık yılının ötesinde Planck 2018 ile ışık yolculuğu süresi). Pencere: tarihsel ölçekte ±max(3 yıl, %6),
  derin zamanda ±%15; pencerede olay yoksa satır gizli. Kamera konumu kesin olduğundan belirsizlik yok.
- **Yıldız kartında:** "Bu ışık yola çıktığında: …" — yalnızca 300 ışık yılından yakın yıldızlarda (uzaklık belirsizliği küçük).
- **Kutu:** fotoğraf, tarih, metin, ışığın yola çıkışına göre önce/sonra farkı, emeği geçen ve lisans, kaynak bağlantıları
  (yalnızca çevrimiçiyken).
- **Olaylar** (web/src/content/history.ts): uzay tarihi (1054 süpernovası, Halley 1066, Tycho 1572, Kepler 1604 → SN 1987A,
  Shoemaker-Levy 9, Webb), Dünya tarihi (Göbeklitepe → Cumhuriyet), derin zaman (buzul çağı → Dünya'nın ve Ay'ın oluşumu) ve
  kozmik zaman (Güneş Sistemi'nin doğuşu, Gaia-Enceladus birleşmesi, Samanyolu'nun kalın diski, ilk galaksiler, kozmik mikrodalga
  arka planı). Sanatçı çizimleri ekranda "temsili" diye etiketli. Her olay kaynaklı (NASA, ESA, Britannica, UNESCO, hakemli makaleler; DOI'ler
  Crossref'te doğrulandı). Kaynağı olmayan olay eklenmez.
- **Görseller** (pipeline/bts/history.py → web/public/data/history/): yalnızca kamu malı ya da özgür lisanslı (NASA kamu malı;
  Wikimedia Commons'ta lisansı tek tek doğrulananlar: kamu malı, CC0, CC BY-SA 3.0). Belgesel kareleri telif nedeniyle yok.
  Çalışma anında ağ isteği yok.

Sıra: Faz 1 (M3–M6) bittikten sonra **E1 → E2**. Her ikisi de M2'nin gökyüzü çekirdeğini yeniden kullanır.

---

## E1 — Konumumu kullan (karar: 21.11.2026)

**Ne:** Kullanıcı izin verirse cihaz konumuyla gökyüzü tarayıcıda hesaplanır.

- Zaman: o konumda 21:00'de Ay'ın ufkun en az 10° altında olduğu ilk gece (SPEC §5.5 mantığı); ekranda tarih yazar.
- Veri: pipeline'ın yazdığı `stars_icrs.json` (RA/Dec, sky.json ile aynı sıra) ve `milkyway_icrs_{4k,2k}.webp`
  (göksel koordinatlarda, merkez 0h, RA sola artar).
- Web: ICRS → ufuk dönüşümü (yerel yıldız zamanı + presesyon), Ay/Güneş/gezegenler için çevrimdışı bir JS
  efemeris kütüphanesi. Kubbe shader'ı ICRS dokusunu dönme matrisiyle örnekler.
- Doğum yıldızı ve görünürlük sayımları o konum için yeniden hesaplanır.
- Işık kirliliği: konumdan SQM bilinmiyor → kullanıcı "şehir merkezi / banliyö / kırsal" seçer (Bortle'a karşılık
  gelen SQM değerleri, kaynaklı), ya da E2'de fotoğraftan kaba tahmin.
- Gizlilik: konum yalnızca bellekte; kaydedilmez, ağa gönderilmez.

**Kabul:** Ankara koordinatları girilince sayımlar sky.json ile ±2 içinde; başka bir şehirde Polaris yüksekliği enlemle < 1°.

---

## E2 — Kendi gökyüzün (fotoğraf)

**Ne:** Kullanıcı uygulamanın içinden gökyüzüne doğru fotoğraf çeker. Basılı tutunca **kendi fotoğrafındaki** ışıklar
söner ve o yönde o gece görünecek **gerçek** yıldızlar ve Samanyolu, fotoğraftaki gökyüzünün yerine belirir.
Mesaj: "Senin sokağından, bu ışıklar olmasa bunları görecektin."

**Akış:**
1. **Çekim:** `getUserMedia` (arka kamera) + aynı anda jiroskop/pusula yönelimi (SPEC §6.3) ve kameranın görüş açısı
   kaydedilir. Fotoğraf yönü = çekim anındaki cihaz quaternion'u.
2. **Hizalama:** Hesaplanan gökyüzü fotoğrafın perspektifine izdüşürülür. Pusula sapması için "Kuzeyi düzelt"
   benzeri elle ince ayar (sürükle) — fotoğrafta görünen parlak bir yıldız/Ay varsa ona oturtma.
3. **Gökyüzü maskesi:** Gök / bina-ağaç ayrımı. Önce basit yöntem (parlaklık + renk + ufuk çizgisinin üstü,
   yumuşak kenar); yetmezse cihazda çalışan küçük bir bölütleme modeli (çevrimdışı, ağ isteği yok).
4. **Işıklar:** Maske dışındaki parlak noktalar (pencere, lamba) bulunur; basılı tutma ilerlemesi `p` ile
   rastgele eşiklerle söner (M2'deki siluet mantığının aynısı). Gökyüzündeki şehir parlaması `q` ile azalır.
5. **Gerçek gökyüzü:** Maskenin içinde M2'nin kubbe + yıldız shader'ları, fotoğrafın yönü ve görüş açısıyla çizilir.
   Sayaç yine bütün gökyüzünü sayar.
6. **Paylaş (opsiyonel):** öncesi/sonrası görüntü; yalnızca kullanıcı paylaşırsa cihazdan çıkar.

**Kurallar:**
- Fotoğraf ve yönelim yalnızca bellekte; kaydedilmez, ağa gönderilmez.
- Ekranda etiket: "Kendi fotoğrafın · gerçek yıldız konumları, tahmini görünürlük · ışıkların sönmesi temsili".
- Gökyüzü/ışık tespiti hatalı olabilir; kullanıcı maskeyi ve hizayı elle düzeltebilmeli.

**Riskler:** pusula hatası (birkaç derece), gece fotoğrafında gürültü, lamba/pencere/far ayrımı, iOS'ta kamera +
sensör izinlerinin aynı dokunuşta istenmesi, düşük donanımlı telefonda bölütleme süresi.

**Kabul:** Bilinen bir yöne çekilen fotoğrafta (ör. Ay'ın ya da parlak bir gezegenin görüldüğü) hesaplanan konum
fotoğraftakiyle ± 3° içinde (ince ayardan önce); basılı tutunca ışıklar söner, gökyüzü maskesi içinde yıldızlar belirir;
ağ kapalıyken çalışır.

**Ara adım (ucuz):** Fotoğraf yalnızca arka plan olarak siluetin yerine konur (maske = ufuk çizgisinin altı), ışıklar
parlaklık eşiğiyle söner. Tam hizalama ve bölütleme sonra.
