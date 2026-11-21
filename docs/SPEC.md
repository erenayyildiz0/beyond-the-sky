# BEYOND THE SKY — "Işıkları Söndür"
## Uygulama belgesi · SPEC v3.0

> **Slogan:** *The universe is closer than you think.*
> **Ne inşa ediyoruz:** Ankara'nın gerçek gece gökyüzünden başlayıp yıldızların arasından Andromeda galaksisine uçulan, yaklaşık 4 dakikalık, 3 perdelik bir hikâye ve ardından süresiz bir Keşif modu: istediğin yıldıza uç, her şeye dokun, merak ettiğini öğren.
> **Geliştirme:** Süre sınırı olmadan, üç fazda (§11): Faz 1 hikâye, Faz 2 Keşif, Faz 3 yayın. Her milestone çalışan bir sürüm bırakır.
> **Doğrulama tarihi:** 21 Kasım 2026. Bu belgedeki formüller, kod parçaları ve "beklenen değerler" o gün Astropy 8 ve HYG v4.1 ile hesaplanıp çalıştırılarak kontrol edildi.

**v1'den farkı:** Kamera/ayna, atom parçacıkları ve hız sayaçları kalktı. Perde 1'e jiroskopla bakma eklendi. Perde 2, Ankara'dan Andromeda'ya ileri-geri uçulan bir yolculuk oldu. Perde 3, "doğduğun yılın ışığı" ve eve dönüş oldu.

**v3'te eklenen:** Süresiz Keşif modu (§2.6, §6.12): serbest uçuş, "Buraya uç", veriden hesaplanan bilgi kartları (§3.16), kaynaklı merak notları (§8.2), arama, görevler, paylaşım. 10 saat sınırı kalktı; plan fazlara bölündü (§11).

---

## İçindekiler

0. [Bu belge nasıl kullanılır](#0-bu-belge-nasıl-kullanılır)
1. [Ürün özeti](#1-ürün-özeti)
2. [Deneyim akışı](#2-deneyim-akışı)
3. [Bilimsel model — tek doğruluk kaynağı](#3-bilimsel-model--tek-doğruluk-kaynağı)
4. [Teknik mimari](#4-teknik-mimari)
5. [Veri hattı (pipeline/)](#5-veri-hattı-pipeline)
6. [Web uygulaması (web/)](#6-web-uygulaması-web)
7. [(Opsiyonel) AI kapanış cümlesi](#7-opsiyonel-ai-kapanış-cümlesi)
8. [Metin destesi (TR / EN)](#8-metin-destesi-tr--en)
9. [Test planı](#9-test-planı)
10. [Yayınlama](#10-yayınlama)
11. [Aşamalı plan](#11-aşamalı-plan)
12. [Demo senaryosu ve yedek plan](#12-demo-senaryosu-ve-yedek-plan)
13. [Sık yapılan hatalar](#13-sık-yapılan-hatalar)
14. [Bilinen sınırlamalar](#14-bilinen-sınırlamalar)
15. [Kaynaklar ve lisanslar](#15-kaynaklar-ve-lisanslar)
16. [Sonraki sürümler](#16-sonraki-sürümler)

---

## 0. Bu belge nasıl kullanılır

Bu belge repoda `docs/SPEC.md` olarak durur ve ürünün, bilimsel modelin, mimarinin ve kabul ölçütlerinin tek kaynağıdır.
Her milestone'a (§11) başlamadan önce o milestone'da belirtilen bölümler okunur.

### 0.1 Değişmez kurallar

- Bilimsel sayı uydurulmaz. Gök konumları, uzaklıklar ve sayımlar pipeline'dan (Astropy + HYG),
  sabitler web/src/science/constants.ts'den gelir; her sabitin yanında kaynak yorumu olur.
- Görünürlük formülleri Python (pipeline/bts/visibility.py), TypeScript
  (web/src/science/visibility.ts) ve GLSL tarafında birebir aynı kalır. Biri değişirse
  diğerleri ve testler de güncellenir.
- Bütün yön vektörleri pipeline'da ENU (x=Doğu, y=Kuzey, z=Yukarı) yazılır; web'de
  tek bir fonksiyonla (enuToThree) three.js dünyasına çevrilir (§3.1).
- Simülasyon, temsili görsel ve gerçek veri ekranda etiketlenir (§6.11).
- Çalışma anında dış ağ isteği yok (opsiyonel AI uç noktası hariç). Fontlar ve
  veriler yerel.
- Doğum yılı ve telefon yönelim verisi cihazdan çıkmaz, saklanmaz.
- Türkçe büyük harf için toLocaleUpperCase("tr-TR") kullanılır; <html lang> doğru olur.
- Her milestone sonunda `pytest -q` ve `npm test` geçer, `npm run build` hatasızdır, sonra commit atılır.
- Merak notları (web/src/content/cards.ts) yalnızca kaynaklı eklenir; kaynağı olmayan bilgi yazılmaz.
- Bu belgeyle çelişen bir değişiklik gerekiyorsa önce belge güncellenir.

**Komutlar:**
- Pipeline: `cd pipeline && python build.py --config config.yaml`
- Python testleri: `cd pipeline && pytest -q`
- Web: `cd web && npm run dev` (telefonda jiroskop testi: `npm run dev:https`)
- Web testleri: `cd web && npm test`
- Build: `cd web && npm run build`

### 0.2 Çalışma biçimi

- Her milestone (§11) ayrı bir adım olarak yapılır ve çalışan bir sürüm bırakır. Büyük adımlardan önce plan yazılır.
- Görsel ince ayarı (parlaklık, yıldız boyutu, renk, uçuş hızı) tahminle değil, bilim panelindeki canlı kaydırıcılarla yap (§6.9). Beğendiğin değerleri sonra koda yaz.
- Bir şey bozulursa son commit'e dön.
- **Sıra önemli:** Perde 2'nin uçuş çekirdeği (M4) projenin en riskli parçası. Perde 1'in görsel cilasını M4 çalışmadan yapma.

### 0.3 Önceden verilmiş kararlar

| Konu | Karar | Nereden değişir |
|---|---|---|
| Platform | Tek sayfalık web (telefon + projektör) | — |
| Ön yüz | Vite + TypeScript + three.js, UI framework yok | §6.1 |
| Veri | Python + Astropy ile önceden hesap → JSON / WebP | §5 |
| Konum | Ankara, Kızılay (39,9208° K, 32,8541° D, 890 m) | `pipeline/config.yaml` |
| Zaman | `auto`: bugünden itibaren 21:00'te Ay'ın ufkun en az 10° altında olduğu ilk gece | `config.yaml → observation.time` |
| Uçuş rotası | Ankara → Dünya → Ay → Güneş → Neptün → Voyager 1 → Kraliçe (Cassiopeia) yıldızlarının arası → galaksiden çıkış → Andromeda | §3.9, `config.yaml → flight` |
| Bakış | Telefonda jiroskop (izin verilirse), her yerde sürükleme | §6.3 |
| Dil | Türkçe (varsayılan) + İngilizce (`?lang=en`) | §8 |
| Yayın | GitHub Pages (AI açılırsa Vercel) | §10 |
| AI | Opsiyonel; yalnızca kapanış cümlesi, hiçbir sayı AI'dan gelmez | §7 |
| Hedef ekran | Projektör 1920×1080 (yatay) ve telefon (dikey) | §6.3 |
| Keşif | Hikâyeden sonra süresiz serbest uçuş; bilgiler veriden hesaplanır, notlar kaynaklı | §2.6, §3.16, §6.12 |

> **Ay uyarısı:** 21–27 Kasım 2026 akşamları Ay dolunaya yakın ve gökyüzünde (dolunay 24 Kasım). "Karanlık gökyüzü" anı fiziksel olarak dürüst olsun diye `auto` modu aysız bir gece seçer. 21:00'te Ay'ın ufkun 10°'den fazla altında olduğu ilk gece **29 Kasım 2026**. Yeni ay 8–9 Aralık. Uygulama, gösterdiği tarihi her zaman ekrana yazar.

> **Andromeda bonusu:** 29 Kasım 21:00'de Andromeda galaksisi (M31) Ankara'da **88,5° yükseklikte**, neredeyse tam tepede. Perde 1'de ışıklar sönünce başının üstünde beliren soluk leke, Perde 2'nin sonunda vardığın yer olur. Başka bir tarih seçilirse bu cümle sky.json'daki gerçek yüksekliğe göre değişir (§8).

---

## 1. Ürün özeti

**Tek cümle:** Kullanıcı Ankara'nın gerçek gece gökyüzünde şehrin ışıklarını parmağıyla söndürür, sonra o gökyüzünün içine uçar: yıldızların arasından geçer, galaksiden çıkar, başının üstündeki soluk lekenin Andromeda olduğunu görür; eve dönerken ışığı tam doğduğu yıl yola çıkmış yıldızı bulur. Sonra Keşif açılır: aynı evrende istediği yıldıza uçar, dokunduğu her şey hakkında veriden hesaplanmış bir şey öğrenir.

| Perde | Ne olur | Duygu | Etkileşim |
|---|---|---|---|
| 1 · Işıkları Söndür | Şehir gökyüzü → 3.189 yıldız ve Samanyolu | Kayıp → keşif | Telefonu gökyüzüne kaldırma, basılı tutma |
| 2 · Yolculuk | Ankara'dan Andromeda'ya, yıldızların arasından | Ölçek, ihtişam | İleri/geri uçma, etrafa bakma, yıldıza dokunma |
| 3 · Senin Işığın | Doğum yılının yıldızı, eve dönüş, ışıklar yanar | Bağ, yakınlık | Doğum yılı girme, yıldızı gökyüzünde arama |
| Keşif (süresiz) | Serbest uçuş, bilgi kartları, merak notları, görevler | Merak | Buraya uç, dokun, ara, görev |

**Konumlandırma:** Star Walk, Stellarium ve SkySafari "Bu yıldız ne?" sorusunu cevaplar; SpaceEngine gibi programlar uzayda serbest uçuş sunar. Bu ise bir hikâye: "Bunu hisset." Tek tek fikirlerin benzerleri başka yerlerde var. Özgünlük, uçuşun kullanıcının kendi şehrinde, kendi söndürdüğü gökyüzünden başlaması, gerçek veriyle o gece başının üstündeki galaksiye varması ve kişisel bir yıldızla bitmesinde.

**Demo başarı ölçütleri:**
1. Akış takılmadan uçtan uca çalışır (sunucu modunda ~4 dk).
2. Ekrandaki her sayı izlenebilir: pipeline çıktısından ya da kaynaklı bir sabitten gelir.
3. Projektörde (dizüstü + 1080p) 60 fps, orta seviye telefonda en az 30 fps.
4. Varlıklar yüklendikten sonra internetsiz çalışır.
5. Jiroskop izni reddedilse ya da sensör yoksa akış sürükleyerek tamamlanır.

**Kapsam dışı (v3):** canlı AR (kamera görüntüsü), fotoğraf tanıma, kullanıcı hesabı, sohbet ekranı, canlı saatle güncellenen gökyüzü, çıplak gözün ötesindeki yıldızlar (Gaia), galaksi ötesi kozmik ağ.

**Ürün notu:** Böyle bir deneyim bir kez izlenir ve paylaşılır. Demo ve yayılma için güçlü, günlük kullanım için zayıf. Ürün yönü §16'da.

---

## 2. Deneyim akışı

### 2.1 Durum makinesi

```
LOADING → INTRO → A1_CITY ⇄ A1_HOLDING → A1_REVEALED
        → A2_TAKEOFF → A2_FLIGHT (serbest ileri-geri; duraklar §3.10)
        → A3_BIRTH → A3_RETURN → A3_LAND → A3_LIGHTS
        → OUTRO → EXPLORE (süresiz; §2.6) ⇄ CREDITS
INTRO ──(hikâyeyi daha önce bitirdiyse "Keşfe geç")──► EXPLORE
```

- Kontroller tablosu §6.2'de. Kısaca: sahne ilerletme `Enter` / `PageDown` (sunum kumandaları bunu gönderir), geri `PageUp`, `R` baştan, `M` ses, `D` bilim paneli, `F` tam ekran. Perde 1'de `Space` basılı tutma, Perde 2'de `↑`/`↓` ileri/geri uçuş, ok tuşları ve sürükleme etrafa bakma.
- Sunucu modu (`?presenter=1`): otomatik geçişler kapanır; Perde 2'de `PageDown` bir sonraki durağa uçar.
- Otomatik mod (`?autoplay=1`): bütün deneyim kendiliğinden oynar. Yedek ekran kaydı bununla alınır (§12).
- URL ile hızlı deneme: `?lang=en`, `?az=295` (Perde 1 başlangıç yönü), `?debug=1` (bilim paneli açık), `?z=15.3` (Perde 2'yi bu ölçekten başlat), `?born=2007` (Perde 3'ü bu yılla dene), `?explore=1` (doğrudan Keşif).

### 2.2 Perde 1 — Işıkları Söndür (~50 sn)

| Zaman | Görüntü | Metin | Ses |
|---|---|---|---|
| Giriş | — | "Başla"ya basınca telefonda jiroskop izni istenir (§6.3) | — |
| 0–4 sn | Şehir gökyüzü: turuncu-gri ufuk parlaması, yalnızca en parlak yıldızlar, ufukta 3D şehir silueti (her yönde) | Sol üst: `Ankara · 29 Kasım 2026 · 21:00`. Orta: "Ankara'dan 29 Kasım gecesi görebileceğin gökyüzü bu." (tarih bugünse "bu gece"). Jiroskop açıksa: "Telefonu gökyüzüne kaldır." | Alçak drone başlar |
| 4 sn → | Sayaç belirir ("111 yıldız"), altta basılı tutma düğmesi | "Işıkları söndürmek için basılı tut" | — |
| Basılı tutarken (7 sn) | Pencereler rastgele söner, ufuk parlaması azalır, yıldızlar **parlaktan sönüğe doğru** belirir, en sonda Samanyolu ve tepede Andromeda'nın soluk lekesi | Sayaç canlı artar | Filtre açılır, üst harmonikler girer |
| Bırakırsa | Işıklar 3,5 sn'de geri gelir | — | Geri iner |
| Kilit (p = 1) | Tam karanlık gökyüzü | 0,8 sn sonra "Hep oradaydılar." 2,5 sn sonra "3.189 yıldız. Ve Samanyolu." | Yumuşak kabarma |
| +3 sn | Kullanıcı etrafa bakmaya devam edebilir | "Yukarı çık ›" | — |

Perde boyunca sağ üstte rozet: **SİMÜLASYON · gerçek yıldız konumları, tahmini görünürlük**. Sayaç bütün gökyüzünü sayar (yalnızca ekrandakini değil).

### 2.3 Perde 2 — Yolculuk (~90–150 sn, kullanıcı hızında)

**A2_TAKEOFF (5 sn, otomatik):** Kamera tepeye (zenite) döner, yükselir; şehir silueti ve atmosfer kaybolur; yıldızlar titremeyi bırakır. Beyaza değil siyaha kısa bir geçişle 3.000 km yükseklikte, aşağıda Ankara'nın ışıklarına bakan görüntüye kesilir.

**A2_FLIGHT:** Kullanıcı rota üzerinde ileri ve geri uçar (kontroller §6.5). Sol üstte hep: **"Işığın Ankara'dan buraya ulaşması: {süre}"**. Sağ kenarda logaritmik ölçek cetveli ve durak işaretleri; işarete dokununca oraya uçulur. Durağa yaklaşınca hız yavaşlar ve kart belirir:

| # | Durak | Işık süresi | Görüntü | Kart metni (özet; tam metin §8) |
|---|---|---|---|---|
| 1 | Dünya | 0,08 sn | Gece Dünyası, Ankara'da halka | "Az önce söndürdüğün ışıklar, uzaydan böyle görünüyor." |
| 2 | Ay | 1,24 sn | Ay'ın yörüngesi, Ay | "Ay'dan bakan biri seni 1,24 saniye geç görürdü." |
| 3 | Güneş | 8 dk 12 sn | Gezegen yörüngeleri, Güneş | "Güneş'in ışığı Dünya'ya 8 dakika 12 saniyede ulaşır." |
| 4 | Neptün | 4 sa 5 dk | Bütün yörüngeler küçülür | "Güneş Sistemi'nin en dış gezegeni." |
| 5 | Voyager 1 | 1 gün | Voyager işareti | "18 Kasım 2026: Voyager 1 bir ışık-günü uzaklığa ulaşan ilk insan yapımı nesne oldu. 49 yıl sürdü." |
| 6 | 4,2 ışık yılı | 4,2 yıl | Güneş artık bir yıldız | "En yakın yıldız bu kadar uzakta. Voyager'ın hızıyla ~75.000 yıl." |
| 7 | η Cas (Achird) | 19 yıl | Bir yıldız 1 ışık yılı yakından geçer | "İlk yıldızın yanından geçiyorsun. Işığı 2007'de yola çıktı." |
| 8 | Kraliçe'nin içi | 228 yıl | W şeklinin çizgileri uzayıp kopar | "Bu beş yıldız aslında 55 ile 550 ışık yılı arasına dağılmış. W şekli yalnızca Dünya'dan bakınca var." |
| 9 | Gördüğün her şey | 1.700 yıl | **Otomatik geri dönüp bakış.** Yarıçapı 390 ışık yılı olan saydam küre | "Işıkları söndürünce gördüğün yıldızların yaklaşık yarısı bu kürenin içinde." |
| 10 | Samanyolu | 150.000 yıl | **Otomatik geri bakış.** Galaksinin tamamı, "Buradasın" işareti | "Samanyolu. Yüz milyarlarca yıldız. Işık bir ucundan öbürüne ~100.000 yılda gider." (+ opsiyonel "Güneş nerede?" oyunu) |
| 11 | Andromeda | 2,2 milyon yıl | Andromeda önünde; "Geriye bak" ile Samanyolu küçücük | "Işıkları söndürdüğünde başının tam üstündeki o soluk leke buydu. Işığı 2,5 milyon yıl önce yola çıktı." |

- Durak 7–9 arasında gerçek yıldızlar yanından akar; 6–9 arasında adı bilinen birkaç yıldızın yanında "ışığı {yıl}'de yola çıktı" etiketi belirir (§3.11). Herhangi bir yıldıza dokununca aynı bilgi çıkar.
- Uzaklaştıkça yıldızlar görünür kalsın diye parlaklık yapay olarak artırılır; ekranda "Pozlama artırıldı" yazar (§3.8).
- 11. durakta 3 sn sonra "Eve dönmeden önce ›" düğmesi.

### 2.4 Perde 3 — Senin Işığın (~45 sn)

| Sahne | Görüntü | Metin |
|---|---|---|
| A3_BIRTH | Andromeda önünde, yarı saydam panel | "Hangi yıl doğdun?" sayı alanı, "Göster", "Atla". Alt not: "Bu bilgi cihazında kalır." |
| A3_RETURN (14 sn) | Otomatik dönüş uçuşu: Andromeda → Samanyolu → yıldızlar → Güneş → Dünya. Yıldız ölçeğinde "senin yıldızın" halkayla işaretlenir, ondan Güneş'e bir ışık çizgisi akar | "Senin yıldızın: {ad}" |
| A3_LAND | Ankara'nın karanlık gökyüzü (Perde 1, kilitli durum). Yıldız halkalı. Ekran dışındaysa kenarda yön oku | "{ad}. Işığı sen doğduğun yıl, {yıl}'de yola çıktı. Bu gece Ankara'ya varıyor." Jiroskop açıksa: "Telefonu ona çevir." |
| A3_LIGHTS (6 sn) | Işıklar yavaşça geri yanar; yıldızlar kaybolur, halka kalır | "Işıklar yandı. Onlar hâlâ orada." |

Özel durumlar (§3.12): yıldız ufkun altındaysa yönüyle birlikte söylenir; 8 yaşından küçükler için "senin ışığın henüz görünen hiçbir yıldızdan gelmedi" metni; "Atla" seçilirse A3_RETURN yıldızsız oynar.

### 2.5 Kapanış (~10 sn)

"Onlar hâlâ orada." → "The universe is closer than you think." → logo → "Baştan başla" · "Kaynaklar ve notlar".

### 2.6 Keşif modu (süresiz)

Hikâye bir kez izlenir; Keşif, insanların geri dönmesini sağlayan kısımdır. Aynı evrende, rota olmadan, istediğin kadar kalırsın.

**Giriş yolları:**
- Kapanışta büyük düğme: **"Keşfet ›"** (ana yol).
- Hikâyeyi bir kez bitiren kullanıcı (`localStorage["bts.storySeen"] = "1"`) girişte iki düğme görür: "Hikâyeyi izle" ve "Keşfe geç".
- `?explore=1` doğrudan Keşif'i açar (test ve paylaşım için).

**Başlangıç:** Kamera Güneş'ten 4,2 ışık yılı uzakta, Güneş'e bakar. Üç kısa ipucu sırayla belirir (her biri dokununca kaybolur): "Sürükleyerek bak" · "İleri'ye basılı tutarak uç" · "Bir yıldıza dokun".

**Ekran düzeni (dikey telefon):**

| Yer | Öğe |
|---|---|
| Sol üst | Evden uzaklık ("Işığın {place_ablative} buraya ulaşması: …") |
| Sağ üst | 🔍 Ara · ☰ Git · ★ Görevler (3/7) |
| Ortada, gerekirse | "Güneş" işareti: ekrandaysa küçük halka, değilse kenarda ok |
| Alt bant (canlı) | "Buradan bakan biri Dünya'yı {yıl_de} olduğu haliyle görür." · "Güneş buradan: {durum}" |
| En alt | Geri · İleri · Eve bak |
| Alttan açılan | Bilgi kartı (yıldıza dokununca) |

**Etkileşimler:**
- **Bakma:** sürükleme ya da jiroskop (göreli, §6.3).
- **Uçma:** İleri/Geri düğmeleri, iki parmak, tekerlek, ↑/↓. Hız bulunduğun yere göre kendiliğinden ölçeklenir: yıldızların arasında yavaş, boşlukta hızlı (§6.12).
- **Yıldıza dokun → bilgi kartı** (§3.16): ad, takımyıldız, uzaklık, ışığın yola çıktığı yıl, "oradan Güneş görünür mü?", Güneş'e göre parlaklık, sıcaklık ve tür, Voyager'ın hızıyla yolculuk süresi, Ankara'dan bu gece görünüp görünmediği. Ünlü nesnelerde ayrıca elle yazılmış, kaynaklı bir **merak notu** (§8.2). Kartta: **"Buraya uç"** · "Işığını izle" · "Kapat".
- **Buraya uç:** kamera önce yıldıza döner, sonra logaritmik hızla 0,05 ışık yılı yakınına uçar (2–7 sn). Varınca alt bant güncellenir; örneğin Aldebaran'da "Buradan bakan biri Dünya'yı 1960'ta olduğu haliyle görür" ve "Güneş buradan: 6,4 kadir, yalnızca çok karanlık gökte görünür".
- **Eve bak:** kamerayı Güneş'e çevirir. Uzun basınca eve uçar.
- **Git menüsü:** Ev (Ankara gökyüzü) · Güneş Sistemi · Achird · Kraliçe · Avcı'nın kemeri · Büyükayı · Ülker · Deneb · Samanyolu'nun dışı · Andromeda · Senin yıldızın (doğum yılı girildiyse).
- **Ara:** `names` listesinde (~3.100 ad) Türkçe karakterlere duyarsız arama ("sirius" → Sirius, "ulker" → Ülker, "alnilam" → Alnilam). Sonuca dokununca kart açılır.
- **Takımyıldız çizgileri** anahtarı: Kraliçe, Avcı, Kuğu, Büyükayı 3D çizgileri. Dünya'dan uzaklaştıkça şekillerin bozulduğunu kendi gözünle görürsün.
- **Ankara'ya dön:** Git → Ev; Perde 1 gökyüzüne iner (ışıklar kapalı), sonra serbestçe bakılır, "Yukarı çık" ile tekrar uzaya.

**Görevler (★):** Merakı yönlendiren küçük hedefler. Tamamlanınca zil ve kısa bir not. İlerleme `localStorage`'da (kişisel veri değil).

| # | Görev | Ne zaman tamamlanır | Tamamlanınca not |
|---|---|---|---|
| 1 | Güneş'in çıplak gözle görünmez olduğu yere git | Kamera Güneş'ten 70,4 ışık yılından uzak | "Buradan Güneş artık 6,5 kadirden sönük. Evimiz gözden kayboldu." |
| 2 | Güneş'ten daha sönük bir yıldız bul | Kartı açılan yıldızın mutlak kadiri > 4,83 | "Karanlıkta gördüğün yıldızların %99,3'ü Güneş'ten parlak. Sönük olanlar ancak çok yakınsa görünüyor." |
| 3 | Işığı Malazgirt'ten (1071) önce yola çıkmış bir yıldız bul | Kartı açılan yıldızda `dly > obs − 1071` | "Bu ışık yola çıktığında Anadolu'da Malazgirt Savaşı henüz olmamıştı." |
| 4 | Avcı'nın kemerindeki en uzak yıldıza uç | Alnilam'a "Buraya uç" | "Kemerin üç yıldızı yan yana görünür ama bu veriye göre Alnilam diğer ikisinin neredeyse üç katı uzakta. (Bu kadar uzak yıldızlarda ölçüm belirsizliği büyük.)" |
| 5 | Sirius'a git ve Güneş'e bak | Sirius'ta "Eve bak" | "Buradan Güneş, 1,9 kadirlik sıradan bir yıldız." |
| 6 | Andromeda'ya git ve geri bak | Andromeda'da "Eve bak" | "Samanyolu buradan böyle görünür. Işığı 2,5 milyon yılda geldi." |
| 7 | Doğduğun yılın yıldızına uç | Doğum yıldızına "Buraya uç" (yıl girildiyse) | "Bu yıldızdan bakan biri Dünya'yı sen doğduğun yıl görüyor." |

**Paylaş (opsiyonel):** Kartta ve görev notunda "Paylaş" düğmesi: o anki görüntü + kısa metin ("Işığı 2007'de yola çıkan yıldızım: Achird · Beyond the Sky"). Web Share API, yoksa görüntüyü indir. Doğum yıldızı yalnızca kullanıcı kendisi paylaşırsa metne girer.

---

## 3. Bilimsel model — tek doğruluk kaynağı

Bu bölümdeki formüller Python, TypeScript ve GLSL'de **aynen** uygulanır. Ekrandaki her sayının nereden geldiği buradan izlenebilmeli.

### 3.1 Koordinat ve yön kuralları

**Ufuk koordinatları:** yükseklik `alt` (derece; ufuk 0, zenit 90), azimut `az` (derece; Kuzey 0 → Doğu 90 → Güney 180 → Batı 270).

**Python (ENU):** x = Doğu, y = Kuzey, z = Yukarı. Pipeline'ın yazdığı **bütün** vektörler bu çerçevededir ve gözlemciye (Kızılay) göredir.

```python
import numpy as np

def enu_from_altaz(alt_deg, az_deg):
    alt, az = np.radians(alt_deg), np.radians(az_deg)
    return np.stack([np.cos(alt) * np.sin(az),   # x: Doğu
                     np.cos(alt) * np.cos(az),   # y: Kuzey
                     np.sin(alt)])               # z: Yukarı
```

**three.js dünyası:** x = Doğu, y = Yukarı, z = Güney (yani −z Kuzey). Varsayılan kamera −z'ye, yani kuzeye bakar; doğu sağda kalır.

```ts
import * as THREE from "three";
export const DEG = Math.PI / 180;

/** Pipeline'dan gelen her ENU vektörü yalnızca bu fonksiyonla çevrilir. */
export const enuToThree = (e: number, n: number, u: number, out = new THREE.Vector3()) => out.set(e, u, -n);

export function dirFromAltAz(altDeg: number, azDeg: number, out = new THREE.Vector3()) {
  const alt = altDeg * DEG, az = azDeg * DEG;
  return out.set(Math.cos(alt) * Math.sin(az), Math.sin(alt), -Math.cos(alt) * Math.cos(az));
}

export function altAzFromDir(d: THREE.Vector3) {
  const alt = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1));
  let az = Math.atan2(d.x, -d.z);
  if (az < 0) az += 2 * Math.PI;
  return { altDeg: alt / DEG, azDeg: az / DEG };
}
```

GLSL'de aynı formül: `float az = atan(d.x, -d.z);`. GLSL'nin iki argümanlı `atan(y, x)`'i `atan2` ile aynıdır.

**Dünya küresi (Perde 2):** three.js `SphereGeometry`'nin varsayılan UV eşlemesi standart eşdikdörtgen (equirectangular) Dünya dokularıyla uyumludur. Bir enlem/boylamın küre üstündeki yeri ve Ankara'yı tepeye, kuzeyi −z'ye getiren yönelim:

```ts
export function latLonToVec3(latDeg: number, lonDeg: number, r = 1, out = new THREE.Vector3()) {
  const lat = latDeg * DEG, lon = lonDeg * DEG;
  return out.set(r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), -r * Math.cos(lat) * Math.sin(lon));
}

/** Dünya modelini döndürür: (lat, lon) noktası +y'ye (yukarı), oranın kuzeyi −z'ye düşer. */
export function earthQuaternionFor(latDeg: number, lonDeg: number, out = new THREE.Quaternion()) {
  const a = latDeg * DEG, o = lonDeg * DEG;
  const up = latLonToVec3(latDeg, lonDeg);
  const north = new THREE.Vector3(-Math.sin(a) * Math.cos(o), Math.cos(a), Math.sin(a) * Math.sin(o));
  const east = new THREE.Vector3().crossVectors(north, up);
  const south = north.clone().negate();
  const m = new THREE.Matrix4().makeBasis(east, up, south).transpose();
  return out.setFromRotationMatrix(m);
}
```

Doğrulandı: Ankara noktası (0, 1, 0)'a, Kuzey Kutbu (0; 0,6417; −0,7669)'a (kuzeyde, enlem kadar yüksekte) düşer; Ankara'nın 1° doğusu +x tarafına düşer.

**Zaman donuktur.** Bütün deneyim seçilen tek bir an için hesaplanır (29 Kasım 2026, 21:00). Uçuş sırasında Dünya dönmez, gezegenler ve galaksi hareket etmez. Bu bir sınırlama değil tercih: uçuş süresince gerçek zamanda hiçbir şey gözle görülür kadar hareket etmezdi. §14'te yazılı.

### 3.2 Gök konumları

- Yıldız konumları HYG v4.1'den gelir (J2000, ICRS kabul edilir) ve Astropy `AltAz(obstime, location)` ile hesaplanır.
- **Atmosferik kırılma kapalıdır** (`pressure=0`, Astropy varsayılanı). Ufka yakın en fazla ~0,6° fark yaratır; görsel olarak önemsiz ve her katmanda aynı olduğu için tutarlı.
- Özhareket (proper motion) uygulanmaz. 2000–2026 arasında en hızlı yıldızda bile birkaç yay dakikası eder; ekranda görünmez.
- Samanyolu dokusunu ufuk koordinatlarına taşımak ve galaktik çerçeveyi kurmak için ICRS → ENU dönüşümü bir 3×3 dönme matrisine indirgenir (§5.6). **Üç birim vektörü dönüştürüp matris kurmak yanlış sonuç verir** (doğrulamada 0,24° hata). Procrustes yöntemiyle hata en fazla 0,006°.

### 3.3 Görünürlük modeli (Perde 1 ve 3)

Model dört parçadan oluşur. Hepsi tahmindir ve ekranda "tahmini görünürlük" diye etiketlenir.

**(a) Gökyüzü parlaklığından çıplak göz limit kadiri.** Schaefer (1990) tabanlı, Globe at Night ve Unihedron'un kullandığı dönüşüm:

`NELM(SQM) = 7,93 − 5·log10(10^(4,316 − SQM/5) + 1)`  (SQM birimi mag/arcsec²)

Kontrol değerleri: NELM(18,0) = 3,97 · NELM(22,0) = 6,62.

**(b) Atmosferik sönüm.** Kasten & Young (1989) hava kütlesi:

`X(h) = 1 / (sin h + 0,50572·(h + 6,07995)^(−1,6364))`  (h derece; h < 0 ise 0 al)

Etkin kadir: `m_eff = m + k·(X − 1)`, k = 0,25 mag/hava kütlesi (şehir için makul; config'te). Kontrol: X(90°) = 1,000 · X(30°) ≈ 1,994 · X(0°) ≈ 37,9.

**(c) Ufka doğru şehir parlaması (sezgisel).** Şehir ışığı ufka yakın daha parlaktır:

`SQM_yerel(h) = SQM_zenit − g·(1 − sin h)²`

g şehirde 1,5 mag, karanlık gökte 0,5 mag (doğal hava ışıması); ilerlemeyle ikisinin arasında doğrusal değişir.

**(d) Görünürlük ve sayım.**

```
m_lim(h)   = NELM(SQM_yerel(h))
görünürlük = 1 − smoothstep(m_lim − 0,25, m_lim + 0,25, m_eff)   // 0..1, yumuşak geçiş (çizim için)
sayılır mı = (h > 0) VE (m_eff < m_lim)                           // sert eşik (sayaç için)
```

**Perde 1 ilerlemesi:** `p ∈ [0, 1]` basılı tutma ilerlemesi, `q = easeInOutSine(p) = −(cos(π·p) − 1)/2`.
`SQM_zenit = lerp(sqm_city, sqm_dark, q)` ve `g = lerp(glow_city_mag, glow_dark_mag, q)`.

**TypeScript** (`web/src/science/visibility.ts`):

```ts
import { DEG } from "./coords";

export const nelm = (sqm: number) => 7.93 - 5 * Math.log10(10 ** (4.316 - sqm / 5) + 1);

export function airmass(altDeg: number) {
  const a = Math.max(altDeg, 0);
  return 1 / (Math.sin(a * DEG) + 0.50572 * Math.pow(a + 6.07995, -1.6364));
}

export const effectiveMag = (mag: number, altDeg: number, k: number) => mag + k * (airmass(altDeg) - 1);

export function localSqm(sqmZenith: number, altDeg: number, glowMag: number) {
  const s = 1 - Math.sin(Math.max(altDeg, 0) * DEG);
  return sqmZenith - glowMag * s * s;
}

export const limitMag = (sqmZenith: number, altDeg: number, glowMag: number) =>
  nelm(localSqm(sqmZenith, altDeg, glowMag));

export function visibility(mEff: number, mLim: number, soft = 0.25) {
  const t = Math.min(1, Math.max(0, (mEff - (mLim - soft)) / (2 * soft)));
  return 1 - t * t * (3 - 2 * t);
}

// CPU sayımı Float64Array ile yapılır (Python ile birebir eşleşsin diye; GPU'daki float32 yalnızca çizim içindir)
export function countVisible(alt: Float64Array, mag: Float64Array, sqmZenith: number, glowMag: number, k: number) {
  let n = 0;
  for (let i = 0; i < alt.length; i++) {
    if (alt[i] > 0 && effectiveMag(mag[i], alt[i], k) < limitMag(sqmZenith, alt[i], glowMag)) n++;
  }
  return n;
}
```

**Python** (`pipeline/bts/visibility.py`, birebir aynı):

```python
import numpy as np

def nelm(sqm):
    return 7.93 - 5 * np.log10(10 ** (4.316 - sqm / 5) + 1)

def airmass(alt_deg):
    a = np.maximum(alt_deg, 0.0)
    return 1 / (np.sin(np.radians(a)) + 0.50572 * (a + 6.07995) ** -1.6364)

def local_sqm(sqm_zenith, alt_deg, glow_mag):
    s = 1 - np.sin(np.radians(np.maximum(alt_deg, 0.0)))
    return sqm_zenith - glow_mag * s * s

def count_visible(alt, mag, sqm_zenith, glow_mag, k):
    meff = mag + k * (airmass(alt) - 1)
    return int(((alt > 0) & (meff < nelm(local_sqm(sqm_zenith, alt, glow_mag)))).sum())
```

**Eşlik kuralı:** Python sayımları, JSON'a yazılan **yuvarlanmış** alt/mag değerlerinden yapılır. TS testi aynı JSON'dan aynı sayıyı bulmalıdır (§9). Kayan nokta farkından 1 fark çıkarsa sınırdaki yıldızı yazdır ve nedenini açıkla; 1'den büyük fark hatadır. sky.json artık ufkun altındaki yıldızları da içerir (Perde 2 için); sayım `alt > 0` koşulu yüzünden değişmez.

**SQM değerleri:**
- `sqm_dark = 22,0`: doğal gökyüzü (ışık kirliliği atlasının doğal arka planı ~22,0).
- `sqm_city`: Kızılay için [lightpollutionmap.info](https://www.lightpollutionmap.info) üzerinde "World Atlas 2015" katmanına tıklayıp nokta değerini oku ve config'e yaz. Varsayılan yer tutucu 18,0. Atlas 2015 verisidir; LED dönüşümleri yüzünden bugünkü gökyüzü daha parlak olabilir. README'de belirt.

### 3.4 Samanyolu ve Andromeda görünürlüğü (sezgisel)

`mwOpacity = smoothstep(20,3; 21,7; SQM_zenit)^1,2` ve her piksel `10^(−0,4·k·(X(h) − 1))` sönüm çarpanıyla çarpılır. Samanyolu kabaca Bortle 4–5 civarında belirmeye, 21,5 üstünde belirginleşmeye başlar; eşikler buna göre seçildi. Bilimsel ölçüm iddiası yoktur.

**Andromeda lekesi (Perde 1):** gökyüzü kubbesinde M31 yönünde (§3.13) eliptik, yumuşak bir leke: 3,2° × 1,0°, büyük eksen kuzeyden doğuya 38°. Opaklık `0,35 · smoothstep(19,8; 21,0; SQM_zenit)`, sönüm çarpanı Samanyolu ile aynı. Renk `#E8DCC8`. SVS Samanyolu haritasında M31 zaten görünüyorsa (önizlemede kontrol et) leke opaklığını yarıya indir.

### 3.5 Gökyüzü arka plan rengi (sezgisel)

| Durum | Zenit | Ufuk |
|---|---|---|
| Şehir (q = 0) | `#161B26` | `#4A3427` (sodyum + LED karışımı sıcak parlama) |
| Karanlık (q = 1) | `#020409` | `#0B1220` |
| Uzay (Perde 2, kalkıştan sonra) | `#000000` | `#000000` |

Dikey karışım: `h = (1 − alt/90)^2,5`, renk = `mix(zenit, ufuk, h)`. Şehirden karanlığa geçiş `q` ile.

### 3.6 Yıldız renkleri

B−V renk indisinden sıcaklık (Ballesteros 2012), sıcaklıktan sRGB (Tanner Helland yaklaşımı), sonra %40 beyaza karıştır; göz yıldız renklerini soluk görür. B−V yoksa 0,6 kullan.

```python
import numpy as np

def bv_to_kelvin(bv):
    return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62))

def kelvin_to_rgb(T):            # skaler; vektör için np.where ile yaz
    t = T / 100
    r = 255 if t <= 66 else 329.698727446 * (t - 60) ** -0.1332047592
    g = 99.4708025861 * np.log(t) - 161.1195681661 if t <= 66 else 288.1221695283 * (t - 60) ** -0.0755148492
    b = 255 if t >= 66 else (0 if t <= 19 else 138.5177312231 * np.log(t - 10) - 305.0447927307)
    return np.clip([r, g, b], 0, 255)

def star_rgb(bv, desat=0.4):
    rgb = kelvin_to_rgb(bv_to_kelvin(bv))
    return np.round(rgb * (1 - desat) + 255 * desat).astype(int)
```

Kontrol: Rigel (B−V −0,03) ≈ 10.500 K, mavimsi beyaz · Aldebaran (1,54) ≈ 3.740 K, turuncu.

### 3.7 Üç boyutlu yıldız konumları ve uzaklıklar

- HYG'deki `dist` parsektir. Işık yılı: `dly = dist × 3,261563777`.
- Bir yıldızın gözlemciye göre 3D konumu (ENU, ışık yılı): `P = dly · enu(alt, az)`. Doğrulandı: HYG'nin kendi x, y, z sütunlarının Procrustes matrisiyle döndürülmüş hali bu konumla en fazla 0,014° farklı. Web tarafı konumu sky.json'daki alt/az ve dly'den kurar; ayrıca x, y, z yazılmaz.
- Gözlemci ile Güneş arasındaki fark (8 ışık-dakikası) yıldız ölçeğinde yok sayılır: yıldız katmanında gözlemci = Güneş = orijin.
- **Uzaklığı bilinmeyen yıldızlar:** HYG'de `dist ≥ 100000` paralaksın ölçülemediği anlamına gelir. mag ≤ 7,0'da 431 yıldız böyle; karanlık gökte görünen 3.189'un 73'ü. Bunlar 3.500 ışık yılı uzaklıkta bir kabuğa konur (`aNoDist = 1`), etiketlenmez; dokunulursa "uzaklığı ölçülemedi" yazar.
- **Belirsizlik:** Uzaklıklar Hipparcos paralaksından gelir. Yakın yıldızlarda (< 100 ışık yılı) hata küçüktür; uzak parlak yıldızlarda büyüktür. Örnek: HYG Deneb'i 1.412 ışık yılı verir; başka yöntemler belirgin şekilde daha büyük değerler verir. Bu yüzden yıllar uzaklığa göre yuvarlanır (§3.11).
- **Kontrol:** HYG'de `absmag + 5·log10(dist/10) = mag` en fazla 0,0005 farkla sağlanır; uçuştaki parlaklık formülü (§3.8) bu tutarlılığa dayanır.

**Karanlık gökte görünen 3.189 yıldızın uzaklık dağılımı** (uzaklığı bilinen 3.116 yıldız, ışık yılı): %10 → 119 · %25 → 214 · **%50 → 390** · %75 → 634 · %90 → 1.042 · %95 → 1.426 · %99 → 2.276 · en büyük 3.167. Karşılaştırma: mag ≤ 7 kataloğun tamamında ortanca 456.

### 3.8 Uçuşta parlaklık

Kamera `C` (ışık yılı) konumundayken yıldızın görünür kadiri:

`m_app = m + 5·log10(|P − C| / |P|)`   (uzaklığı bilinmeyenlerde |P| = 3.500)

- `C = 0` iken `m_app = m` olur; yani Dünya'dan görülen gökyüzü kendiliğinden çıkar.
- Uzayda atmosfer yoktur: sönüm ve ufuk parlaması yok. Temel limit `NELM(22,0) = 6,62`.
- **Pozlama:** Uzaklaştıkça yıldızlar görünür kalsın diye limit yapay olarak artırılır:
  `m_lim(z) = 6,62 + 5·max(0, z − 15,3)` (z §3.9). `m_lim > 6,7` olduğu sürece ekranda **"Pozlama artırıldı"** etiketi durur.
- Çok yakından geçişte (Achird 0,97 ışık yılı) `m_app` ≈ −3 olur; nokta boyutu `uFlyByMax` (varsayılan 28 px) ile sınırlanır, çevresine yumuşak parıltı eklenir.

### 3.9 Ölçek değişkeni ve uçuş rotası

**Ölçek:** `z = log10(D)`, D kameranın Ankara'ya uzaklığı (km). Uçuş aralığı `z ∈ [3,6; 19,318]`. Işık süresi `t = D / c`.

**Rota:** `C(z) = 10^z · û(z)` (ENU, km). Yön `û(z)` ana noktalar arasında küresel ara değerlemeyle (slerp, parametre `smoothstep`) değişir:

| z aralığı | û | Anlamı |
|---|---|---|
| ≤ 11,0 | U = (0, 0, 1) | Ankara'nın tepesine doğru yükseliş |
| 11,0 → 13,0 | U → û_cas | Kraliçe'ye dönüş (hâlâ 1 ışık yılından yakın) |
| 13,0 – 15,75 | û_cas | Düz çizgi: Kraliçe yıldızlarının arasından |
| 15,75 → 16,6 | û_cas → û_m31 | Andromeda'ya dönüş |
| ≥ 16,6 | û_m31 | Galaksiden çıkış ve Andromeda |

- `û_cas`: Kraliçe'nin W'sini oluşturan 5 yıldızın (HIP 746, 3179, 4427, 6686, 8886) birim yön vektörlerinin ortalaması, normalize. 29 Kasım 21:00: **alt 69,27°, az 5,25°**.
- `û_m31`: M31 yönü. 29 Kasım 21:00: **alt 88,5°, az 347,7°**. û_cas ile arası 19,3°.
- **Yakın geçişler (doğrulandı, 0–800 ışık yılı arası düz çizgi):** Achird (η Cas) 19,4 ışık yılında 0,97 ışık yılı · HIP 4151 61 ışık yılında 1,16 · Cih 549'da 4,6 · Ruchbah 99'da 5,7 · Caph 54'te 6,1 · Schedar 228'de 18,1 · Segin 51,8. Hiçbir yıldız 0,5 ışık yılından yakın geçmez.
- M31 yönünün galaktik enlemi −21,6°: bu yönde giderken galaktik düzlemin altına inilir (yükseklik ≈ 0,368·D). Yani rota diskten güneye doğru çıkar; galaksi oradan eğik görünür. Bu, Andromeda yolundan görülecek gerçek görünümdür.

**Kameranın bakış yönü (`baseLook`):**

| z aralığı | Bakış | Neden |
|---|---|---|
| < 12,3 | Geri (eve, −û) | Dünya, Ay, Güneş Sistemi küçülür |
| 12,3 – 15,9 | İleri (û) | Yıldızlar üstüne gelir ve yanından geçer |
| 15,9 – 16,5 | Geri | Durak 9: "gördüğün her şey" küresi |
| 16,5 – 17,8 | İleri | — |
| 17,8 – 18,5 | Geri | Durak 10: Samanyolu |
| ≥ 18,5 | İleri | Andromeda |

- Geçişler 1,5 sn'lik yumuşak dönüşle olur (quaternion slerp). "Geriye bak" düğmesi bakışı 180° çevirir; seçim bir sonraki pencere değişimine kadar geçerlidir.
- Kullanıcının bakış ofseti (sürükleme ya da jiroskop) bu temel yönün üstüne eklenir (§6.3).
- **Yukarı vektörü:** z < 11'de ENU Kuzey (aşağı bakarken kuzey ekranın üstünde), 11 → 14 arasında galaktik kuzey kutbuna (NGP) doğru slerp. Her karede ileri yöne Gram-Schmidt ile dik yapılır. NGP ile û_cas arası 92,5°, û_m31 arası 111,6°; yani hiçbir yerde paralel olmazlar.

### 3.10 Duraklar

| # | Anahtar | D | z | Işık süresi |
|---|---|---|---|---|
| 1 | `earth` | 25.000 km | 4,398 | 0,08 sn |
| 2 | `moon` | 372.193 km (29 Kasım'daki gerçek uzaklık) | 5,571 | 1,24 sn |
| 3 | `sun` | 0,98641 AB | 8,169 | 8 dk 12 sn |
| 4 | `neptune` | 29,46 AB (29 Kasım'da Dünya'ya uzaklık) | 9,644 | 4 sa 5 dk |
| 5 | `voyager` | 1 ışık-günü | 10,413 | 1 gün |
| 6 | `nearest` | 4,2465 ışık yılı (Proxima) | 13,604 | 4,2 yıl |
| 7 | `achird` | 19,4 ışık yılı | 14,264 | 19,4 yıl |
| 8 | `cas` | 228 ışık yılı | 15,334 | 228 yıl |
| 9 | `bubble` | 1.700 ışık yılı | 16,206 | 1.700 yıl |
| 10 | `galaxy` | 150.000 ışık yılı | 18,152 | 150.000 yıl |
| 11 | `m31` | 2,2 milyon ışık yılı | 19,318 | 2,2 milyon yıl |

Ay, Güneş ve Neptün uzaklıkları sky.json'dan okunur (tarih değişirse değişir); diğerleri sabittir. Kamera durakta Ay'ın, Güneş'in "yanında" değil, Ankara'dan onlar kadar uzaktadır; kart metni bu yüzden uzaklığı anlatır.

**Işık süresi biçimi (`fmtLightTime`, doğrulandı):**

```ts
export function fmtLightTime(s: number, lang: "tr" | "en" = "tr") {
  const nf = (n: number, d = 0) =>
    new Intl.NumberFormat(lang === "tr" ? "tr-TR" : "en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
  const T = lang === "tr"
    ? { s: ["saniye", "saniye"], m: ["dakika", "dakika"], h: ["saat", "saat"], d: ["gün", "gün"], y: ["yıl", "yıl"] }
    : { s: ["second", "seconds"], m: ["minute", "minutes"], h: ["hour", "hours"], d: ["day", "days"], y: ["year", "years"] };
  const w = (u: keyof typeof T, n: number) => T[u][n === 1 ? 0 : 1];
  const Y = 365.25 * 86400;
  if (s < 60) { const d = s < 10 ? 2 : 0; const n = +s.toFixed(d); return `${nf(n, d)} ${w("s", n)}`; }
  if (s < 3600) { const m = Math.floor(s / 60), r = Math.round(s - 60 * m); return r ? `${nf(m)} ${w("m", m)} ${nf(r)} ${w("s", r)}` : `${nf(m)} ${w("m", m)}`; }
  if (s < 86400 * 0.95) { const h = Math.floor(s / 3600), m = Math.round((s - 3600 * h) / 60); return m ? `${nf(h)} ${w("h", h)} ${nf(m)} ${w("m", m)}` : `${nf(h)} ${w("h", h)}`; }
  if (s < Y * 0.95) { const d = Math.round(s / 86400); return `${nf(d)} ${w("d", d)}`; }
  const y = s / Y;
  if (y < 100) { const n = +y.toFixed(1); return `${nf(n, 1)} ${w("y", n)}`; }
  if (y < 10000) { const n = Math.round(y); return `${nf(n)} ${w("y", n)}`; }
  if (y < 1e6) { const n = Math.round(y / 1000) * 1000; return `${nf(n)} ${w("y", n)}`; }
  const n = +(y / 1e6).toFixed(1);
  return lang === "tr" ? `${nf(n, 1)} milyon yıl` : `${nf(n, 1)} million years`;
}
```

Beklenen: Ay "1,24 saniye" · Güneş "8 dakika 12 saniye" · Neptün "4 saat 5 dakika" · Voyager "1 gün" · 1.200 ışık yılı "1.200 yıl" · 26.700 "27.000 yıl" · Andromeda "2,5 milyon yıl"; İngilizcede "8 minutes 12 seconds", "1,200 years".

### 3.11 Işığın yola çıktığı yıl

`obs = meta.obs_year_frac` (29 Kasım 2026 21:00 → **2026,912**). Ham yıl `y = obs − dly`.

| Uzaklık | Gösterim | Örnek |
|---|---|---|
| < 100 ışık yılı | `floor(y)`, kesin | Vega 25,0 → 2001 |
| 100–1.000 | 10'a yuvarla, "~" | Polaris 433 → ~1590 |
| ≥ 1.000 | 100'e yuvarla, "~" | Deneb 1.412 → ~600 |
| sonuç ≤ 0 | "MÖ {1 − y}" | 3.167 → MÖ ~1100 |

```ts
export function lightLeft(dly: number, obsYear: number) {
  const y = obsYear - dly;
  const step = dly < 100 ? 1 : dly < 1000 ? 10 : 100;
  const year = step === 1 ? Math.floor(y) : Math.round(y / step) * step;
  return { year, approx: step > 1, bc: year <= 0 ? 1 - year : null };
}
```

**Türkçe ek:** "2007'de", "2010'da", "1984'te", "1960'ta". Ek, sayının okunuşundaki son kelimeye göre seçilir:

```ts
export function trLocative(n: number) {             // "-de/-da/-te/-ta"
  const a = Math.abs(n), u = a % 10, t = Math.floor(a / 10) % 10;
  const U = ["", "de", "de", "te", "te", "te", "da", "de", "de", "da"];      // bir iki üç dört beş altı yedi sekiz dokuz
  const T = ["", "da", "de", "da", "ta", "de", "ta", "te", "de", "da"];      // on yirmi otuz kırk elli altmış yetmiş seksen doksan
  return `${n}'${u ? U[u] : t ? T[t] : "de"}`;                               // yüz, bin → de
}
```

Doğrulandı: 2007'de, 2010'da, 2001'de, 1984'te, 1960'ta, 1590'da, 1530'da, 1160'ta, 600'de, 2000'de, 1940'ta, 1970'te, 1983'te, 1966'da.

**Etiketlenen yıldızlar** (29 Kasım 21:00'de hepsi ufkun 10°'den yukarısında):

| Yıldız | HIP | Uzaklık (ışık yılı) | Yükseklik | Işığın yola çıktığı yıl |
|---|---|---|---|---|
| Altair | 97649 | 16,7 | 18,4° | 2010 |
| Vega | 91262 | 25,0 | 22,4° | 2001 |
| Capella | 24608 | 42,8 | 41,3° | 1984 |
| Aldebaran | 21421 | 66,6 | 35,0° | 1960 |
| Polaris | 11767 | 433 | 40,4° | ~1590 |
| Betelgeuse | 27989 | 498 | 14,2° | ~1530 |
| Rigel | 24436 | 863 | 11,5° | ~1160 |
| Deneb | 102098 | 1.412 | 45,9° | ~600 |

### 3.12 Doğum yılının yıldızı

- Yaş (ışık yılı): `a = obs − (Y + 0,5)` (doğum yılının ortası).
- **Adaylar:** uzaklığı bilinen, `mag ≤ 6,0` (çıplak gözle karanlık gökte rahat görünür), `dly < 160`, `dec > −45,08°` (Ankara'da en az 5° yükselebilen).
- **Seçim:** O anda ufkun 5° üstündeki adaylardan `|dly − a|` en küçük olan, fark ≤ 1,0 ışık yılı ise o; değilse bütün adaylardan en yakını (ufkun altında olabilir).
- **Özel durumlar:** `a < 7,6` (Sirius 8,6 − 1) ise "henüz" metni; seçilen farkı > 2,5 ise "en yakın" metni. Y aralığı 1900 ile `floor(obs)` arası.
- **Metin:** |Δ| ≤ 1: "Işığı sen doğduğun yıl, {yıl}'de yola çıktı." · 1 < |Δ| ≤ 2,5: "Işığı {yıl}'de yola çıktı; doğduğun yıla en yakın yıldız bu." `{yıl} = floor(obs − dly)`.
- Pipeline bu tabloyu her yıl için önceden hesaplar (§5.10); web yalnızca bakar.

**Doğrulama (29 Kasım 21:00):** 1946–2018 arası 73 doğum yılının 71'inde fark ≤ 1 ışık yılı, en büyük fark 1,85; 69'unda yıldız ufkun üstünde.

| Doğum yılı | Yıldız | Uzaklık | Fark | Yükseklik |
|---|---|---|---|---|
| 2007 | Achird (η Cas) | 19,42 | 0,00 | 71,9° |
| 2008 | Alsafi (σ Dra) | 18,77 | +0,36 | 40,9° |
| 2006 | HIP 114622 | 21,35 | +0,94 | 67,2° |
| 2000 | Tabit (π³ Ori) | 26,32 | −0,10 | 26,3° |
| 1990 | θ Per | 36,29 | −0,12 | 66,8° |
| 1975 | φ² Cet | 51,38 | −0,03 | 39,6° |
| 1960 | σ² UMa | 66,47 | +0,06 | 24,3° |
| 2019 | — ("henüz" metni) | — | — | — |

2007 doğumlu biri için yıldız, Perde 2'de 1 ışık yılı yakınından geçilen Achird'dir. Bu tesadüf demoda iyi bir an olur.

### 3.13 Galaksiler ve galaktik çerçeve

**Galaktik çerçeve:** `gal_to_enu = R · G`. G'nin sütunları, galaktik x (Güneş → merkez, l = 0°), y (l = 90°, dönüş yönü), z (kuzey galaktik kutup, NGP) eksenlerinin ICRS birim vektörleridir (Astropy ile doğrulandı):

```
G = [[-0.054876,  0.494109, -0.867666],
     [-0.873437, -0.444830, -0.198076],
     [-0.483835,  0.746982,  0.455984]]
```

29 Kasım 21:00'de galaktik merkez alt −28,7° / az 254,9°, NGP alt −23,1° / az 358,4° (ikisi de ufkun altında; uçuşta ufuk yoktur).

**Samanyolu modeli (temsili):** merkez `C_gal = 26.700 · x̂_gal` ışık yılı (GRAVITY 2019: 8,18 kpc). Parçacıklar galaksinin kendi düzleminde (x̂, ŷ), 1 birim = 1.000 ışık yılı:

```
kollar (%82):    r = 50 · rand^0,6 ; kol = i % 2
                 θ = φ0 + kol·π + ln(max(r, 4)/4) / tan(12°) + gauss·0,35·(1 − r/60)
                 konum = (r·cos θ, r·sin θ, gauss·(0,6 + 2,5·exp(−r/6)))     // merkeze göre
çubuk (%8):      x ∈ [−9, 9], y = gauss·2,5, z = gauss·0,8 ; 25° döndürülmüş
şişkinlik (%10): üç eksende gauss, σ = 3
renk: merkezde #FFD8A8 → kollarda #CFE0FF ; boyut 1–2,5 px ; AdditiveBlending
```

- Güneş merkeze göre (−26,7; 0; 0)'dadır. Bir kolun Güneş'ten geçmesi için `φ0 = π − ln(26,7/4)/tan(12°)`.
- Kollar "geride kalan" (trailing) sarmaldır: NGP'den bakınca dönüş saat yönünde, kollar dışa doğru saat yönünün tersine açılır. Yukarıdaki θ formülü bunu sağlar. Galaksi döndürülmez (zaman donuk).
- Güneş çevresinde 3.000 ışık yılı içindeki parçacıklar silinir (`alpha *= smoothstep(2500, 6000, |P − Güneş|)`); oradaki yıldızları gerçek veri çizer.

**Yerel Grup (temsili çizim; yön ve uzaklık gerçek):**

| Anahtar | Ad | RA / Dec (J2000, °) | Uzaklık (ışık yılı) | Çizim yarıçapı | Yönelim |
|---|---|---|---|---|---|
| `m31` | Andromeda | 10,6846 / +41,2692 | 2.500.000 (NASA) | 110.000 | i ≈ 77°, PA ≈ 38° (yaklaşık) |
| `m33` | Üçgen Gökadası | 23,4621 / +30,6602 | 2.730.000 (NASA/Hubble) | 30.000 | i ≈ 55°, PA ≈ 23° (yaklaşık) |
| `lmc` | Büyük Macellan Bulutu | 80,894 / −69,756 | 160.000 | 7.000 | düzensiz bulut |
| `smc` | Küçük Macellan Bulutu | 13,187 / −72,829 | 200.000 | 3.500 | düzensiz bulut |

- 29 Kasım 21:00'de M31 alt 88,5° / az 347,7°; M33 alt 76,4° / az 128,4°.
- **Disk normali:** gökteki yön n̂, o noktada kuzey ê_N ve doğu ê_E (ICRS'te `ê_E = normalize(ẑ × n̂)`, `ê_N = n̂ × ê_E`). Büyük eksen `â = cos PA·ê_N + sin PA·ê_E`, küçük eksen `m̂ = n̂ × â`, normal `N = cos i·n̂ + sin i·m̂`. Pipeline ICRS'te hesaplar, R ile ENU'ya çevirir.
- Yönelim değerleri yalnızca görünüş içindir; ekranda iddia edilmez.

### 3.14 Sabitler

`web/src/science/constants.ts`, yorumlarıyla birlikte:

```ts
export const C_KM_S = 299_792.458;               // ışık hızı (tanım gereği tam)
export const AU_KM = 149_597_870.7;              // IAU 2012
export const LY_KM = 9.4607304725808e12;         // Jülyen yılı × c
export const LIGHT_DAY_KM = C_KM_S * 86_400;     // 25.902.068.371 km ≈ 173,14 AB
export const EARTH_RADIUS_KM = 6371.0;           // ortalama yarıçap
export const PROXIMA_LY = 4.2465;
export const VOYAGER1_KM_S = 17.0;               // ~16,9–17,0 km/s (Güneş'e göre)
export const VOYAGER1_LAUNCH_UTC = "1977-09-05T12:56:00Z";
export const VOYAGER1_LIGHT_DAY_UTC = "2026-11-18T10:16:07Z"; // NASA / JPL
export const SUN_GALACTOCENTRIC_LY = 26_700;     // ~8,18 kpc (GRAVITY 2019)
export const MW_DIAMETER_LY = 100_000;           // yaklaşık; ekranda "~100.000"
```

**Hesaplar (doğrulanmış):**
- Voyager hızıyla Proxima'ya: `PROXIMA_LY · LY_KM / (VOYAGER1_KM_S · 365,25 · 86400)` ≈ **74.900 yıl** → ekranda "~75.000".
- Voyager 1'in 1 ışık-gününe ulaşması: fırlatmadan 18 Kasım 2026'ya **49 yıl**.
- Güneş'in ışığı 29 Kasım'da: 0,98641 AB → **492,2 sn** (8 dk 12 sn). Ay: 372.193 km → **1,242 sn**. Neptün: 29,46 AB → **4,08 sa**.

### 3.15 Beklenen değerler (sağlama tablosu)

Ankara Kızılay, 21:00 TSİ, HYG ≤ 7,0 kadir, k = 0,25, kırılma yok:

| Gece | Ay | Şehir sayımı (SQM 18, g 1,5) | Karanlık sayım (SQM 22, g 0,5) | Ay ışık süresi |
|---|---|---|---|---|
| 29 Kas 2026 | ufkun 18° altında | 111 | 3.189 | 1,242 sn |
| 8 Ara 2026 (yeni ay) | ufkun 47° altında | 114 | 3.188 | 1,364 sn |

Diğer kontroller (29 Kasım):
- Kutup Yıldızı'nın yüksekliği enlemden en fazla 1° farklı (40,4°).
- Şehir SQM'si değişirse (8 Aralık): 17,5 → 66 · 18,5 → 189 · 19,0 → 311 yıldız.
- `obs_year_frac` 2026,912 · û_cas alt 69,27° / az 5,25° · M31 alt 88,5° · uzaklığı bilinmeyen 431 (tüm katalog), 73 (karanlık görünür).
- Görünür yıldızların ortanca uzaklığı 390, %95'i 1.426 ışık yılı.
- Gezegen yükseklikleri: Satürn 50,8°, Uranüs 43,5°, Neptün 48,6° (ufkun üstünde); Merkür, Venüs, Mars, Jüpiter ufkun altında.

**Gökyüzü (kadraj seçimi için):** Samanyolu batı-kuzeybatıdan (Kuğu; Deneb 46° yükseklikte, az 298°) kuzeyde tepeye yakın Kraliçe'den (~70°) geçip doğuya (Arabacı, İkizler) iner. Doğuda Avcı doğmaktadır (Betelgeuse 14°, Rigel 11,5°); Aldebaran 35°/98°, Capella 41°/59°, Satürn güneyde ~51°. Andromeda ve Kraliçe tepede. Aday başlangıç kadrajları:
- **Doğu (az ≈ 80°):** Avcı, Boğa, Ülker, Arabacı ve kış Samanyolu.
- **Batı-kuzeybatı (az ≈ 295°):** Kuğu'daki parlak Samanyolu bölgesi ve batmakta olan Yaz Üçgeni.

Seçimi pipeline önizlemelerine bakarak yap (§5.12). Jiroskopla bakan kullanıcı zaten her yöne bakabilir; kadraj yalnızca başlangıç ve projektör içindir.

### 3.16 Bilgi kartı formülleri (Keşif)

Kartlardaki her satır veriden hesaplanır; AI kullanılmaz. Kartın altında küçük not: "Hipparcos uzaklığına göre · parlaklık görünür ışıkta".

| Satır | Formül | Örnek (doğrulandı) |
|---|---|---|
| Uzaklık ve yıl | `dly`, `lightLeft` (§3.11) | Aldebaran 66,6 ışık yılı · 1960 |
| Oradan Güneş | `m☉ = 4,83 + 5·log10(dly / 3,2616 / 10)` | Sirius'tan 1,9 · Vega'dan 4,3 · Aldebaran'dan 6,4 · Deneb'den 13,0 |
| Güneş'e göre parlaklık | `L = 10^(−0,4·(M − 4,83))`, `M = mag − 5·log10(dist_pc / 10)` | Sirius 22 kat · Vega 49 · Achird 1,3 · Deneb ~50.700 |
| Sıcaklık | B−V'den Ballesteros (§3.6) | Güneş (B−V 0,65) → 5.778 K |
| Tür | `spect` içinden ışıtma sınıfı (aşağıda) | Achird "G0V" → Güneş gibi bir yıldız |
| Takımyıldız | `con` → Türkçe ad, yoksa Latince | `Cas` → Kraliçe |
| Voyager'la | `dly · 17.635` yıl (17 km/s'de 1 ışık yılı 17.635 yıl) | Sirius ~152.000 yıl |
| Bu gece Ankara'dan | `alt ≤ 0` → "ufkun altında"; değilse §3.3 modeliyle şehirde/karanlıkta görünür mü | Vega: şehirde görünür |
| Oradan Dünya (yalnızca kamera oradayken, alt bant) | `obs − |C|` ışık yılı → `lightLeft` | Aldebaran'da "1960'ta olduğu haliyle" |

**"Oradan Güneş" metni:** `m☉ ≤ 4` → "kolayca görünür" · `4 < m☉ ≤ 6,5` → "yalnızca karanlık gökte görünür" · `m☉ > 6,5` → "çıplak gözle görünmez". Sınır uzaklığı: m☉ = 6,5 → **70,4 ışık yılı**; 6,0 → 55,9. NASA da Sirius'tan bakınca Güneş'in ikinci kadirden bir yıldız olacağını yazar; formül 1,94 veriyor.

**Güneş'e göre parlaklık:** `L ≥ 10` tam sayı ("22 kat"), `1 ≤ L < 10` bir ondalık ("1,3 kat"), `L < 1` ise "Güneş'ten {1/L} kat sönük". Karanlık gökte görünen ve uzaklığı bilinen 3.116 yıldızın **3.094'ü (%99,3)** görünür ışıkta Güneş'ten parlak; yalnızca 22'si sönük (en sönüğü 61 Cyg B, 11,4 ışık yılı). Kartlarda "görünür ışıkta" ibaresi şart: bu bolometrik ışıtma değildir.

**Tür (ışıtma sınıfı):** `spect` metninde ilk tayf harfi `[OBAFGKM]`, ışıtma sınıfı `Ia|Ib|III|II|IV|V` (bu sırayla ara):

| Sınıf | Metin |
|---|---|
| V | Güneş gibi, çekirdeğinde hidrojen yakan bir yıldız (anakol) |
| IV | Altdev: anakoldan ayrılmaya başlamış |
| III | Dev |
| II | Parlak dev |
| I, Ia, Ib | Süperdev |

- Tayf harfi → renk sözcüğü: O/B mavi-beyaz · A beyaz · F sarı-beyaz · G sarı (Güneş gibi) · K turuncu · M kırmızı.
- `spect` içinde `comp` ya da `+` geçiyorsa (birden çok yıldızın birleşik tayfı) **tür satırını gösterme**. Örnek: HYG Capella için "M1: comp" verir; bu yanıltıcıdır.
- Kapsam (mag ≤ 7): tayf harfi %99,6, ışıtma sınıfı %75. Yoksa satır gösterilmez.

**Takımyıldız adları:** HYG `con` sütunu her yıldızda dolu (88 IAU kısaltması). Türkçe karşılığı olanlar:

```ts
export const CON_TR: Record<string, string> = {
  And: "Andromeda", Aql: "Kartal", Aqr: "Kova", Ari: "Koç", Aur: "Arabacı", Boo: "Çoban", CMa: "Büyük Köpek",
  CMi: "Küçük Köpek", CVn: "Av Köpekleri", Cam: "Zürafa", Cap: "Oğlak", Cas: "Kraliçe", Cen: "Erboğa", Cep: "Kral",
  Cet: "Balina", Cnc: "Yengeç", Col: "Güvercin", Com: "Berenis'in Saçı", CrA: "Güney Tacı", CrB: "Kuzey Tacı",
  Crt: "Kupa", Crv: "Karga", Cru: "Güney Haçı", Cyg: "Kuğu", Del: "Yunus", Dra: "Ejderha", Equ: "Tay", Eri: "Irmak",
  Gem: "İkizler", Her: "Herkül", Hya: "Suyılanı", Lac: "Kertenkele", Leo: "Aslan", LMi: "Küçük Aslan", Lep: "Tavşan",
  Lib: "Terazi", Lup: "Kurt", Lyn: "Vaşak", Lyr: "Çalgı", Mon: "Tekboynuz", Oph: "Yılancı", Ori: "Avcı",
  Peg: "Kanatlı At", Per: "Kahraman", Psc: "Balıklar", PsA: "Güney Balığı", Sge: "Ok", Sgr: "Yay", Sco: "Akrep",
  Sct: "Kalkan", Ser: "Yılan", Sex: "Sekstant", Tau: "Boğa", Tri: "Üçgen", UMa: "Büyükayı", UMi: "Küçükayı",
  Vir: "Başak", Vul: "Tilki",
};
// Diğerleri (çoğu güney gökyüzü) için IAU'nun Latince tam adı kullanılır (ör. Car → Carina).
```

**Kartlarda dikkat edilecekler:**
- Uzaklığı bilinmeyen yıldızda yalnızca ad, takımyıldız, tür, "bu gece Ankara'dan" satırları; diğerlerinin yerine "uzaklığı ölçülemedi".
- 1.000 ışık yılından uzak yıldızlarda uzaklık ve uzaklığa bağlı satırlar "~" ile ve 2 anlamlı basamakla ("~50.000 kat").
- Hiçbir kart "bu yıldız artık yok olmuş olabilir" gibi doğrulanmamış bir iddia içermez.

---

## 4. Teknik mimari

### 4.1 Yığın

| Katman | Seçim | Neden |
|---|---|---|
| Ön hesap | Python 3.11+, Astropy, NumPy, pandas, Pillow, OpenEXR, Matplotlib | Doğru gökbilim, tek seferlik hesap |
| Ön yüz | Vite + TypeScript + three.js | Hızlı geliştirme; WebGL'de on binlerce nokta |
| Arayüz | Saf DOM + CSS | Az bağımlılık, kolay ince ayar |
| Ses | Web Audio API ile sentez (ses dosyası yok) | Lisans derdi yok |
| Test | pytest, Vitest | — |
| Yayın | GitHub Pages | HTTPS (jiroskop için şart), ücretsiz |

### 4.2 Klasör yapısı

```
beyond-the-sky/
├── README.md
├── .gitignore                    # pipeline/raw/, pipeline/.venv/, pipeline/previews/, web/node_modules/, web/dist/
├── .github/workflows/pages.yml
├── docs/
│   └── SPEC.md
├── pipeline/
│   ├── requirements.txt
│   ├── config.yaml
│   ├── build.py                  # CLI: indir → hesapla → yaz → önizle
│   ├── bts/
│   │   ├── __init__.py
│   │   ├── config.py             # YAML → dataclass + doğrulama
│   │   ├── fetch.py              # indirme + SHA256
│   │   ├── catalog.py            # HYG okuma, filtre, renk, uzaklık, adlar
│   │   ├── sky.py                # zaman seçimi, alt/az, dönme matrisi, Ay, Güneş, gezegenler
│   │   ├── flight.py             # û_cas, û_m31, galaktik çerçeve, Yerel Grup, takımyıldız çizgileri
│   │   ├── birth.py              # doğum yılı tablosu (§3.12)
│   │   ├── milkyway.py           # EXR okuma, reprojeksiyon, ton eşleme
│   │   ├── earth.py              # Black Marble yeniden boyutlandırma
│   │   ├── visibility.py         # §3.3 (TS ile birebir)
│   │   └── preview.py            # PNG önizlemeler
│   ├── raw/                      # indirilenler (git'e girmez)
│   ├── previews/                 # önizlemeler (git'e girmez)
│   └── tests/
│       ├── test_visibility.py
│       ├── test_sky.py
│       ├── test_catalog.py
│       ├── test_flight.py
│       ├── test_birth.py
│       └── test_milkyway.py
└── web/
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── public/
    │   ├── data/                 # pipeline çıktıları (git'e girer)
    │   │   ├── sky.json
    │   │   ├── catalog_detail.json   # Keşif kartları (§5.14)
    │   │   ├── milkyway_altaz_4k.webp
    │   │   ├── milkyway_altaz_2k.webp
    │   │   ├── earth_night_8k.jpg
    │   │   └── earth_night_4k.jpg
    │   └── fonts/
    ├── src/
    │   ├── main.ts
    │   ├── styles.css
    │   ├── app/
    │   │   ├── director.ts       # durum makinesi, geçişler
    │   │   ├── timeline.ts       # bütün süreler tek yerde
    │   │   ├── input.ts          # pointer + klavye + pinch → Action / sürekli değerler
    │   │   ├── look.ts           # sürükleme + jiroskop → bakış quaternion'u
    │   │   ├── assets.ts         # ön yükleme, doku varyantı seçimi
    │   │   └── renderer.ts       # WebGLRenderer, boyutlandırma, DPR, katmanlı çizim
    │   ├── scenes/
    │   │   ├── intro.ts
    │   │   ├── act1Lights.ts
    │   │   ├── act2Flight.ts
    │   │   ├── act3Birth.ts
    │   │   ├── outro.ts
    │   │   └── explore.ts        # Keşif modu
    │   ├── render/
    │   │   ├── skyDome.ts        # Samanyolu + gökyüzü rengi + Andromeda lekesi
    │   │   ├── stars.ts          # tek geometri, iki malzeme (gökyüzü / uçuş)
    │   │   ├── skyline.ts        # 3D şehir silueti (silindir + shader)
    │   │   ├── layers.ts         # ölçek katmanları (§6.5)
    │   │   ├── earth.ts          # Dünya, atmosfer, Ankara halkası, Ay
    │   │   ├── solar.ts          # Güneş, yörüngeler, gezegenler, Voyager
    │   │   ├── constellations.ts # 3D takımyıldız çizgileri
    │   │   ├── galaxy.ts         # Samanyolu parçacıkları
    │   │   ├── localGroup.ts     # Andromeda, M33, Macellan Bulutları
    │   │   ├── lightRay.ts       # yıldızdan Dünya'ya akan ışık çizgisi
    │   │   └── shaders/          # *.glsl, Vite "?raw" ile içe aktarılır
    │   ├── science/
    │   │   ├── constants.ts
    │   │   ├── coords.ts
    │   │   ├── visibility.ts
    │   │   ├── flight.ts         # z, rota, bakış, duraklar, parlaklık
    │   │   ├── years.ts          # lightLeft, trLocative, doğum yılı arama
    │   │   ├── orientation.ts    # jiroskop quaternion'u
    │   │   ├── freeFlight.ts     # Keşif kamerası, flyPlan
    │   │   └── facts.ts          # §3.16 kart satırları, CON_TR
    │   ├── content/cards.ts     # kaynaklı merak notları (§8.2)
    │   ├── audio/drone.ts
    │   ├── ui/
    │   │   ├── hud.ts
    │   │   ├── ruler.ts          # ölçek cetveli
    │   │   ├── stopCard.ts
    │   │   ├── labels.ts         # yıldız etiketleri + dokunma kartı
    │   │   ├── sciencePanel.ts
    │   │   ├── format.ts         # Intl sayı/tarih biçimleri, fmtLightTime
    │   │   ├── card.ts           # bilgi kartı
    │   │   ├── search.ts
    │   │   ├── jumpMenu.ts
    │   │   ├── missions.ts
    │   │   ├── share.ts
    │   │   └── i18n.ts
    │   └── i18n/
    │       ├── tr.ts
    │       └── en.ts
    └── tests/
        ├── coords.test.ts
        ├── visibility.test.ts
        ├── flight.test.ts
        ├── years.test.ts
        ├── orientation.test.ts
        ├── format.test.ts
        ├── parity.test.ts        # sky.json sayımları = Python sayımları
        ├── facts.test.ts
        ├── freeFlight.test.ts
        └── missions.test.ts
```

### 4.3 Veri akışı

```
pipeline/raw/hygdata_v41.csv            ┐
pipeline/raw/milkyway_2020_4k.exr       │   python build.py
pipeline/raw/BlackMarble_2016_3km.jpg   ├─► (Astropy: zaman, alt/az, dönme matrisi, reprojeksiyon,
pipeline/raw/starmap_2020_4k_print.jpg  ┘    sayımlar, Güneş Sistemi, rota, galaktik çerçeve, doğum tablosu)
                                              │
                    ┌─────────────────────────┴──────────────────────────┐
                    ▼                                                    ▼
web/public/data/ sky.json, milkyway_altaz_{4k,2k}.webp,     pipeline/previews/*.png
                 earth_night_{8k,4k}.jpg                     (yalnızca senin için)
                    │
                    ▼
web (Vite) ── npm run build ──► web/dist/ ──► GitHub Pages (HTTPS)
```

### 4.4 Modül sorumlulukları

- **pipeline**: Zamana bağlı bütün gökbilim burada. Web tarafı zaman hesabı yapmaz; yalnızca sky.json'daki değerleri kullanır.
- **science/** (web): Formüller, sabitler, rota. DOM'a ve three.js sahnesine dokunmaz (yalnızca three.js'in matematik sınıflarını kullanır); saf fonksiyonlardır, test edilir.
- **render/**: Görsel nesneler. Formülleri science/'dan alır, kendi formülünü yazmaz (GLSL'deki kopyalar hariç; onlar §3.3 ve §3.8 ile aynı olmalı).
- **scenes/**: Perde mantığı ve zamanlama. `timeline.ts` dışındaki süreleri sabit kodlamaz.
- **ui/**: Metin, biçimlendirme, cetvel, kartlar, bilim paneli.

---

## 5. Veri hattı (pipeline/)

### 5.1 Kurulum

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

`requirements.txt`:

```
astropy>=6.0
numpy>=1.26
pandas>=2.1
pillow>=10.0
matplotlib>=3.8
OpenEXR>=3.2
pyyaml>=6.0
requests>=2.31
pytest>=8.0
astroquery>=0.4.7      # opsiyonel: gezegen parlaklıkları ve Voyager 1 konumu (JPL Horizons)
```

> OpenEXR'ı resmî `OpenEXR` paketiyle oku (§5.8). OpenCV'nin pip sürümleri EXR'ı okumayabilir; doğrulamada `opencv-python-headless` 5.0 EXR dosyasını okuyamadı.

### 5.2 `config.yaml`

```yaml
location:
  name: "Ankara"
  name_ablative: "Ankara'dan"      # Türkçe metinler için
  lat_deg: 39.9208
  lon_deg: 32.8541
  height_m: 890
  tz: "Europe/Istanbul"

observation:
  time: "auto"                     # ya da "2026-12-08T21:00:00+03:00"
  auto_local_hour: 21
  auto_search_days: 30
  max_moon_alt_deg: -10            # Ay bundan yüksekse o gece reddedilir
  max_sun_alt_deg: -18             # astronomik karanlık

catalog:
  mag_limit: 7.0
  nodist_shell_ly: 3500            # uzaklığı bilinmeyenlerin konduğu kabuk

visibility:
  sqm_city: 18.0                   # TODO: lightpollutionmap.info → World Atlas 2015 → Kızılay
  sqm_dark: 22.0
  glow_city_mag: 1.5
  glow_dark_mag: 0.5
  extinction_k: 0.25

milkyway:
  source: "raw/milkyway_2020_4k.exr"
  orientation_check_image: "raw/starmap_2020_4k_print.jpg"
  out_sizes: [[4096, 2048], [2048, 1024]]
  webp_quality: 88

earth:
  source: "raw/BlackMarble_2016_3km.jpg"   # indirdiğin dosyanın adıyla eşleştir
  out_sizes: [[8192, 4096], [4096, 2048]]
  jpeg_quality: 85

view:                              # Perde 1 başlangıç kadrajı (sky.json'a yazılır)
  az_deg: 80                       # adaylar: 80 (doğu), 295 (batı-kuzeybatı)
  horizon_screen_y: 0.80           # ufuk çizgisi ekranın üstünden %80'de
  vfov_landscape_deg: 60
  vfov_portrait_deg: 90

flight:
  path_constellation_hips: [746, 3179, 4427, 6686, 8886]   # Kraliçe'nin W'si → û_cas
  path_target: "m31"
  label_hips: [97649, 91262, 24608, 21421, 11767, 27989, 24436, 102098]
  constellations:                  # 3D çizgiler (HIP çiftleri)
    cas: [[746, 3179], [3179, 4427], [4427, 6686], [6686, 8886]]
    ori: [[27989, 25336], [27989, 26727], [25336, 25930], [26727, 26311], [26311, 25930], [26727, 27366], [25930, 24436]]
    cyg: [[102098, 100453], [100453, 95947], [102488, 100453], [100453, 97165]]
    uma: [[54061, 53910], [53910, 58001], [58001, 59774], [59774, 54061], [59774, 62956], [62956, 65378], [65378, 67301]]
  voyager1:                        # J2000; Horizons'a erişilirse (id -31) oradan güncelle
    ra_deg: 258.658                # 17h 14m 38s (TheSkyLive, 2026)
    dec_deg: 12.398                # +12° 23′ 54″
    dist_au: 173.1
  galaxies:                        # yön ve uzaklık gerçek; çizim temsili (§3.13)
    - { key: m31, ra_deg: 10.6846, dec_deg: 41.2692, dist_ly: 2500000, draw_radius_ly: 110000, incl_deg: 77, pa_deg: 38 }
    - { key: m33, ra_deg: 23.4621, dec_deg: 30.6602, dist_ly: 2730000, draw_radius_ly: 30000, incl_deg: 55, pa_deg: 23 }
    - { key: lmc, ra_deg: 80.894, dec_deg: -69.756, dist_ly: 160000, draw_radius_ly: 7000 }
    - { key: smc, ra_deg: 13.187, dec_deg: -72.829, dist_ly: 200000, draw_radius_ly: 3500 }

birth:
  mag_limit: 6.0
  max_ly: 160
  min_peak_alt_deg: 5              # dec > lat − 90 + 5
  up_alt_deg: 5
  prefer_up_tolerance_ly: 1.0
  first_year: 1900

output_dir: "../web/public/data"
preview_dir: "previews"
```

### 5.3 İndirmeler (`bts/fetch.py`)

| Dosya | Adres | Not |
|---|---|---|
| `hygdata_v41.csv` | `https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv` | 21.11.2026'da çalıştığı doğrulandı (~34 MB). CC BY-SA 4.0. Güncel sürüm v4.2 Codeberg'de (yalnızca 34 yeni yıldız adı ekliyor); bu proje için v4.1 yeterli. |
| `milkyway_2020_4k.exr` | `https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/milkyway_2020_4k.exr` | Dosya adı NASA SVS 4851 listesinden; dizin aynı sayfadaki dosyalarla aynı desende. 404 alırsan [svs.gsfc.nasa.gov/4851](https://svs.gsfc.nasa.gov/4851) sayfasında "Milky Way background in celestial coordinates" grubundaki 4k EXR linkini kopyala. |
| `starmap_2020_4k_print.jpg` | `https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/starmap_2020_4k_print.jpg` | 1024×512, parlak yıldızları içerir; yalnızca yön testi için. |
| Black Marble 2016, renkli, 13500×6750 JPEG | [science.nasa.gov/earth/earth-observatory/earth-at-night/maps](https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps) → "2016 Color → Global → 13500x6750 (3km) JPEG" | Doğrudan linki sayfadan al, elle indirip `pipeline/raw/` içine koy. Dosya yoksa `fetch.py` ne yapılacağını yazdırıp dursun. |

`fetch.py` kuralları: Dosya varsa yeniden indirme. İndirince boyutu ve SHA256'yı yazdır. Akış (streaming) ile indir, yarım kalan dosyayı sil. Ağ hatasında anlaşılır bir mesaj ver.

### 5.4 Katalog (`bts/catalog.py`)

- HYG'yi pandas ile oku (`low_memory=False`). Sütunlar: `id, hip, hd, hr, gl, bf, proper, ra, dec, dist, pmra, pmdec, rv, mag, absmag, spect, ci, x, y, z, ..., con, ...`
- `id == 0` satırını at: bu Güneş'tir (`proper == "Sol"`, mag −26,7).
- `mag ≤ catalog.mag_limit` filtrele. Beklenen satır sayısı (Güneş hariç): ≤ 7,0 → 15.598; ≤ 6,5 → 8.920.
- `ra` saat cinsindendir → derece için ×15. `dec` derece. `dist` parsek; `dist ≥ 100000` → uzaklık bilinmiyor (431 satır).
- `dly = dist × 3,261563777` (1 ondalık). Bilinmiyorsa `null`.
- `ci` (B−V) yoksa 0,6 kullan (mag ≤ 7'de 55 yıldızda eksik).
- **Görünen ad** (`display_name`, doğrulandı: 3.092 `bf` değerinin hepsi çözümlendi):

```python
import re

GREEK = dict(Alp="α", Bet="β", Gam="γ", Del="δ", Eps="ε", Zet="ζ", Eta="η", The="θ", Iot="ι", Kap="κ",
             Lam="λ", Mu="μ", Nu="ν", Xi="ξ", Omi="ο", Pi="π", Rho="ρ", Sig="σ", Tau="τ", Ups="υ",
             Phi="φ", Chi="χ", Psi="ψ", Ome="ω")
SUP = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")
BF = re.compile(r"^(?P<fl>\d{1,3})?\s*(?P<bay>[A-Z][a-z]{1,2})?\s*(?P<sup>\d)?\s*(?P<con>[A-Z][A-Za-z]{2})$")

def display_name(proper, bf, hip, hd=None):
    if isinstance(proper, str) and proper.strip():
        return proper.strip()                                   # "Achird"
    if isinstance(bf, str):
        m = BF.match(bf.strip())
        if m:
            if m["bay"] in GREEK:
                return f'{GREEK[m["bay"]]}{(m["sup"] or "").translate(SUP)} {m["con"]}'   # "π³ Ori"
            if m["fl"]:
                return f'{int(m["fl"])} {m["con"]}'             # "29 Psc"
    if hip == hip and hip:                                      # NaN değil
        return f"HIP {int(hip)}"
    if hd == hd and hd:
        return f"HD {int(hd)}"
    return None
```

  Örnekler: `"24Eta Cas"` → η Cas · `"1Pi 3Ori"` → π³ Ori · `"19Phi2Cet"` → φ² Cet · `"Alp CMa"` → α CMa · `"29    Psc"` → 29 Psc. mag ≤ 7'de 43 yıldızın ne `proper`'ı ne `bf`'si vardır; onlar HIP/HD numarasıyla gösterilir. 29 yıldızda hiçbiri yoktur (`None`); web bunları "adsız yıldız" diye gösterir.

### 5.5 Zaman seçimi (`bts/sky.py`)

```python
from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo
import astropy.units as u
from astropy.time import Time
from astropy.coordinates import EarthLocation, AltAz, get_body, get_sun
from astropy.utils import iers

iers.conf.auto_download = False              # çevrimdışı çalış; UT1 belirsizliği < 1 sn, önemsiz
iers.conf.iers_degraded_accuracy = "warn"

def moon_sun_alt(t, loc):
    fr = AltAz(obstime=t, location=loc)
    moon = get_body("moon", t, loc).transform_to(fr).alt.deg
    sun = get_sun(t).transform_to(fr).alt.deg
    return moon, sun

def choose_time(cfg, loc, today_local, force=False):
    tz = ZoneInfo(cfg.location.tz)
    obs = cfg.observation
    if obs.time != "auto":
        t = Time(datetime.fromisoformat(obs.time))          # ofsetli ISO → UTC
        moon, sun = moon_sun_alt(t, loc)
        if (moon >= obs.max_moon_alt_deg or sun >= obs.max_sun_alt_deg) and not force:
            raise ValueError(f"Ay {moon:.1f}°, Güneş {sun:.1f}°: karanlık değil. --force ile zorla.")
        return t
    for d in range(obs.auto_search_days):
        local = datetime.combine(today_local + timedelta(days=d), time(obs.auto_local_hour), tzinfo=tz)
        t = Time(local)
        moon, sun = moon_sun_alt(t, loc)
        if moon < obs.max_moon_alt_deg and sun < obs.max_sun_alt_deg:
            return t
    raise RuntimeError("Arama aralığında aysız gece bulunamadı.")
```

Beklenen: 21 Kasım 2026'da çalıştırılırsa `auto` → **29 Kasım 2026 21:00 TSİ** (Ay −18,0°, Güneş −40,7°). `obs_year_frac = round(t.decimalyear, 3)` → 2026,912.

### 5.6 ICRS → ufuk dönme matrisi (Procrustes)

```python
import numpy as np
from astropy.coordinates import SkyCoord

def icrs_to_enu_matrix(t, loc, n=2000, seed=1):
    """B ≈ R @ A olacak şekilde en iyi dönme matrisi. A: ICRS birim vektörleri, B: ENU birim vektörleri."""
    rng = np.random.default_rng(seed)
    ra = rng.uniform(0, 360, n)
    dec = np.degrees(np.arcsin(rng.uniform(-1, 1, n)))
    c = SkyCoord(ra=ra * u.deg, dec=dec * u.deg, frame="icrs")    # mesafesiz (birim küre)
    h = c.transform_to(AltAz(obstime=t, location=loc))            # pressure=0 → kırılma yok
    A = c.cartesian.xyz.value                                     # 3×n
    B = enu_from_altaz(h.alt.deg, h.az.deg)                       # 3×n (§3.1)
    U, _, Vt = np.linalg.svd(B @ A.T)
    D = np.diag([1.0, 1.0, np.sign(np.linalg.det(U @ Vt))])
    return U @ D @ Vt
```

Doğrulama sonucu: 5.000 rastgele yönde Astropy'ye göre en büyük hata 0,0059° (sapınç/aberrasyon düzeyi), `det(R) = 1`. R sky.json'a yazılır (`frames.icrs_to_enu`); galaktik çerçeve ve Yerel Grup yönleri bununla hesaplanır.

### 5.7 Yıldızlar, Güneş Sistemi ve Voyager

- Yıldız alt/az: `SkyCoord(ra, dec, frame="icrs").transform_to(AltAz(obstime=t, location=loc))`.
- **Bütün yıldızlar yazılır** (ufkun altındakiler de; Perde 2 bütün küreyi kullanır). Parlaktan sönüğe sırala.
- Sayımları (§3.3) **yuvarlanmış** değerlerden hesapla: alt/az 3 ondalık, mag 2 ondalık.
- **Gezegenler** (Merkür–Neptün): `get_body(name, t, loc)` ile topo-merkezli konum (alt, az, uzaklık AB). Hepsi yazılır (Perde 2 yörüngeleri için); Perde 1 yalnızca `alt > 0` olanları çizer. Görünür kadir için `astroquery.jplhorizons` ile V değeri al (gözlem yeri Ankara). Bağlantı yoksa yaklaşık tabloyu kullan (Venüs −4,2 · Jüpiter −2,3 · Mars +1,0 · Satürn +0,8 · Merkür 0,0 · Uranüs 5,7 · Neptün 7,8) ve `meta.warnings` listesine not düş. Renkler: Satürn (255,236,200) · Jüpiter (255,245,230) · Mars (255,170,120) · Venüs (255,250,240) · Merkür (235,230,220) · Uranüs (200,235,240) · Neptün (170,190,255). Gezegenler titreşmez ve **sayıma girmez**.
- **Güneş:** `get_body("sun", t, loc)` → alt, az, uzaklık (AB). 29 Kasım: 0,98641 AB.
- **Ay:** alt, az, aydınlanma `(1 − cos(elongasyon))/2`, uzaklık (km), ışık süresi (s). 29 Kasım: 372.193 km, 1,242 sn.
- **Ekliptik kutbu (ENU):** `R @ (0, −sin ε, cos ε)`, ε = 23,4392911°. Yörünge halkaları bu düzlemde çizilir.
- **Voyager 1:** config'teki RA/Dec'ten ENU yön × `dist_au`. `astroquery` ile Horizons'a erişilirse (`Horizons(id="-31", location="500", epochs=jd)`) oradan güncel RA/Dec/uzaklık al; erişilemezse config değerini kullan ve uyarı yaz. Güneş'e göre 173 AB'deki bir cismin Dünya'dan görünen yönü en fazla ~0,3° değişir; önemsiz.

### 5.8 Samanyolu reprojeksiyonu (`bts/milkyway.py`)

**Kaynak harita hakkında doğrulanmış bilgiler (NASA SVS 4851):** Gökyüzü haritası göksel koordinatlarda (J2000 RA/Dec) plate carrée projeksiyonundadır. Harita **0h sağ açıklıkta ortalanmıştır ve sağ açıklık sola doğru artar**. "Milky Way background" sürümü parlak Hipparcos/Tycho yıldızlarını içermez; bizim kataloğumuz o yıldızları zaten çizdiği için çift yıldız oluşmaz. EXR dosyaları yarım-float ve doğrusal (linear) renk uzayındadır.

**1) EXR oku (OpenEXR 3.x; doğrulandı):**

```python
import OpenEXR

def read_exr_rgb(path):
    with OpenEXR.File(str(path)) as f:
        ch = f.channels()
        rgb = ch["RGB"].pixels if "RGB" in ch else np.dstack([ch[c].pixels for c in ("R", "G", "B")])
    return rgb.astype(np.float32)        # doğrusal renk
```

**2) Çıktı projeksiyonu:** ufuk koordinatlarında eşdikdörtgen görüntü. Sütun `u` → `az = (u + 0,5)/W · 360°` (sol kenar = Kuzey, sağa doğru Doğu); satır `v` → `alt = 90° − (v + 0,5)/H · 180°` (üst satır = zenit). **Ufkun altı da yazılır** (Perde 2'de uzayda bütün küre görünür).

**3) Reprojeksiyon (satır blokları halinde; 4096×2048 tek seferde yaklaşık 200 MB bellek ister):**

```python
def bilinear(img, x, y):
    """x'te sarmalı (wrap), y'de kenara kıstırılmış çift doğrusal örnekleme."""
    H, W, _ = img.shape
    x0 = np.floor(x).astype(np.int64); y0 = np.floor(y).astype(np.int64)
    fx = (x - x0)[:, None]; fy = (y - y0)[:, None]
    x0 %= W; x1 = (x0 + 1) % W
    y0c = np.clip(y0, 0, H - 1); y1c = np.clip(y0 + 1, 0, H - 1)
    a, b = img[y0c, x0], img[y0c, x1]
    c, d = img[y1c, x0], img[y1c, x1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy

def radec_to_svs_pixel(ra_deg, dec_deg, Ws, Hs):
    xs = (Ws / 2.0 - ra_deg / 360.0 * Ws) % Ws       # merkez 0h, RA sola artar
    ys = (90.0 - dec_deg) / 180.0 * Hs               # üst = +90°
    return xs, ys

def reproject_to_altaz(src, R, out_w, out_h, chunk_rows=256):
    Hs, Ws, _ = src.shape
    az = (np.arange(out_w) + 0.5) / out_w * 360.0
    out = np.zeros((out_h, out_w, 3), np.float32)
    for r0 in range(0, out_h, chunk_rows):
        rows = np.arange(r0, min(out_h, r0 + chunk_rows))
        alt = 90.0 - (rows + 0.5) / out_h * 180.0
        AZ, ALT = np.meshgrid(az, alt)
        h = enu_from_altaz(ALT.ravel(), AZ.ravel())             # 3×N ENU
        e = R.T @ h                                             # 3×N ICRS
        ra = np.degrees(np.arctan2(e[1], e[0])) % 360.0
        dec = np.degrees(np.arcsin(np.clip(e[2], -1.0, 1.0)))
        xs, ys = radec_to_svs_pixel(ra, dec, Ws, Hs)
        out[rows] = bilinear(src, xs - 0.5, ys - 0.5).reshape(len(rows), out_w, 3)
    return out
```

Perde 1'de ufkun altını kubbe shader'ı siyaha boyar (§6.4); dokunun kendisi tam küredir.

**4) Ton eşleme ve kayıt:**

```python
from PIL import Image

def tonemap_to_srgb8(lin, valid_mask, exposure=1.5):
    L = 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]
    scale = 1.0 / max(np.percentile(L[valid_mask], 99.5), 1e-12)
    m = 1.0 - np.exp(-exposure * lin * scale)                    # yumuşak omuz
    s = np.where(m <= 0.0031308, 12.92 * m, 1.055 * np.power(m, 1 / 2.4) - 0.055)
    return (np.clip(s, 0, 1) * 255 + 0.5).astype(np.uint8)

# Image.fromarray(srgb8).save(path, "WEBP", quality=88, method=6)
```

Çıktılar: `milkyway_altaz_4k.webp` (4096×2048) ve `milkyway_altaz_2k.webp` (2048×1024).

**5) Yön testleri (otomatik, `tests/test_milkyway.py`):**
- (a) **Yıldız hizası:** En parlak 30 HYG yıldızının RA/Dec'ini `radec_to_svs_pixel` ile `starmap_2020_4k_print.jpg` üzerine düşür. 5×5 pencerenin en parlak değeri, görüntü parlaklığının %99'luk yüzdeliğinin üstünde olmalı. En az 24/30 isabet. Ayna görüntüsü (RA sağa artıyor varsayımı) belirgin şekilde daha kötü sonuç vermeli.
- (b) **Galaktik düzlem:** Kaynak Samanyolu haritasında |b| < 5° noktalarının ortalama parlaklığı, |b| > 40° noktalarınınkinin en az 3 katı olmalı.
- (c) **Matris:** Procrustes matrisi, 1.000 rastgele yönde Astropy'ye göre en fazla 0,02° hata vermeli.

**Uzayda Samanyolu dokusu:** Perde 2'de, yıldız ölçeğinde (z < 15) aynı doku gökyüzü küresi olarak kalır (kamera Güneş'e yakınken gerçek görünüm). z 15 → 16,4 arasında söner; yerini galaksi parçacıkları alır. Bu geçiş "temsili" etiketiyle birlikte olur.

### 5.9 Dünya gece dokusu (`bts/earth.py`)

- Pillow ile aç. 13500×6750 = 91,1 milyon piksel; Pillow'un varsayılan "decompression bomb" sınırını (~89,5 milyon) aşar ve uyarı verir. Güvenilir dosya olduğu için `Image.MAX_IMAGE_PIXELS = None` kullan.
- `LANCZOS` ile 8192×4096 ve 4096×2048 boyutlarına küçült, JPEG kalite 85 ile `earth_night_8k.jpg` ve `earth_night_4k.jpg` olarak kaydet.

### 5.10 Rota, galaksiler ve doğum tablosu (`bts/flight.py`, `bts/birth.py`)

**Rota:**

```python
def path_direction(df, alt, az, hips):
    idx = [df.index[df.hip == h][0] for h in hips]
    u = enu_from_altaz(alt[idx], az[idx]).mean(axis=1)
    return u / np.linalg.norm(u)                                  # 29 Kasım: alt 69,27°, az 5,25°

def closest_approaches(P_ly, u, s_max=800, n=12):
    """P_ly: 3×N ENU konumlar (uzaklığı bilinenler). Düz çizgi boyunca en yakın geçişler."""
    s = u @ P_ly
    perp = np.linalg.norm(P_ly - np.outer(u, s), axis=0)
    ok = (s > 0) & (s < s_max)
    order = np.argsort(perp[ok])[:n]
    return np.where(ok)[0][order], s[ok][order], perp[ok][order]
```

- Konsol özetinde en yakın 5 geçişi yazdır. **0,5 ışık yılından yakın geçiş varsa hata ver** (kamera bir yıldızın içinden geçer).

**Galaktik çerçeve ve Yerel Grup:**

```python
from astropy.coordinates import Galactic

def galactic_axes_icrs():
    g = SkyCoord(l=[0, 90, 0] * u.deg, b=[0, 0, 90] * u.deg, frame=Galactic).icrs
    return g.cartesian.xyz.value                                  # 3×3, sütunlar = x̂, ŷ, ẑ (§3.13)

def disk_normal_icrs(ra_deg, dec_deg, incl_deg, pa_deg):
    n = SkyCoord(ra=ra_deg * u.deg, dec=dec_deg * u.deg).cartesian.xyz.value
    e = np.cross([0.0, 0.0, 1.0], n); e /= np.linalg.norm(e)     # doğu
    nn = np.cross(n, e)                                           # kuzey
    pa, i = np.radians(pa_deg), np.radians(incl_deg)
    a = np.cos(pa) * nn + np.sin(pa) * e                          # büyük eksen
    m = np.cross(n, a)
    return np.cos(i) * n + np.sin(i) * m
```

`gal_to_enu = R @ galactic_axes_icrs()`; galaksilerin yönleri ve normalleri de `R @ ...` ile ENU'ya çevrilir.

**Doğum tablosu (§3.12):**

```python
def birth_table(df, dly, alt, obs_year, cfg, lat_deg):
    ok = np.isfinite(dly) & (df.mag.values <= cfg.mag_limit) & (dly < cfg.max_ly) \
         & (df.dec.values > lat_deg - 90 + cfg.min_peak_alt_deg)
    ia = np.where(ok)[0]
    iu = np.where(ok & (alt > cfg.up_alt_deg))[0]
    rows = []
    for Y in range(cfg.first_year, int(obs_year) + 1):
        a = obs_year - (Y + 0.5)
        ju = iu[np.argmin(np.abs(dly[iu] - a))]
        j = ju if abs(dly[ju] - a) <= cfg.prefer_up_tolerance_ly else ia[np.argmin(np.abs(dly[ia] - a))]
        rows.append([Y, int(j), round(float(dly[j] - a), 2)])
    return rows                                                    # [yıl, yıldız indeksi, fark]
```

Web, `a < 7,6` ve `|fark| > 2,5` durumlarını kendisi yorumlar (§3.12). Yıldızın yükseklik/azimutu zaten yıldız satırında var.

**Uzaklık istatistikleri:** karanlık gökte görünen yıldızların uzaklık yüzdelikleri (`p50`, `p95`) ve uzaklığı bilinmeyen sayısı `meta.stats`'a yazılır. Durak 9'daki küre yarıçapı `p50`'dir.

### 5.11 Çıktılar ve şema

`web/public/data/sky.json` (değerler örnektir; vektörler ENU):

```json
{
  "version": 2,
  "meta": {
    "location": { "name": "Ankara", "name_ablative": "Ankara'dan", "lat": 39.9208, "lon": 32.8541, "height_m": 890 },
    "time_utc": "2026-11-29T18:00:00Z",
    "time_local": "2026-11-29T21:00:00+03:00",
    "obs_year_frac": 2026.912,
    "tz": "Europe/Istanbul",
    "sun": { "alt": -40.7, "az": 275.1, "dist_au": 0.98641 },
    "moon": { "alt": -18.0, "az": 51.1, "illum": 0.66, "distance_km": 372193, "light_time_s": 1.242 },
    "visibility": { "sqm_city": 18.0, "sqm_dark": 22.0, "glow_city_mag": 1.5, "glow_dark_mag": 0.5, "extinction_k": 0.25 },
    "counts": { "city": 111, "dark": 3189 },
    "stats": { "dark_dist_ly_p50": 390, "dark_dist_ly_p95": 1426, "dark_nodist": 73, "nodist_shell_ly": 3500 },
    "view": { "az_deg": 80, "horizon_screen_y": 0.8, "vfov_landscape_deg": 60, "vfov_portrait_deg": 90 },
    "milkyway": { "projection": "altaz-equirect", "left_edge_az": 0, "top_alt": 90, "full_sphere": true },
    "warnings": [],
    "sources": ["HYG v4.1 (CC BY-SA 4.0)", "NASA SVS Deep Star Maps 2020", "NASA Black Marble 2016"],
    "generated_at": "2026-11-21T22:00:00Z",
    "pipeline_version": "2.0.0"
  },
  "stars": {
    "fields": ["alt", "az", "mag", "r", "g", "b", "dly", "hip"],
    "data": [[41.312, 59.104, 0.08, 255, 236, 210, 42.8, 24608]]
  },
  "names": [{ "i": 0, "name": "Capella" }],
  "labels": [0],
  "constellations": { "cas": [[12, 40]] },
  "frames": {
    "icrs_to_enu": [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
    "gal_to_enu": [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
    "ecliptic_pole_enu": [0, 0, 1]
  },
  "path": { "u_cas": [0.0324, 0.3524, 0.9353], "u_target": [-0.0057, 0.0261, 0.9996], "closest": [{ "i": 210, "along_ly": 19.4, "miss_ly": 0.97 }] },
  "bodies": [{ "key": "saturn", "name_tr": "Satürn", "name_en": "Saturn", "alt": 50.8, "az": 184.9, "dist_au": 8.877, "mag": 0.8, "rgb": [255, 236, 200] }],
  "voyager1": { "enu_dir": [0, 0, 0], "dist_au": 173.1, "source": "config" },
  "galaxies": [{ "key": "m31", "enu_dir": [0, 0, 0], "dist_ly": 2500000, "alt": 88.5, "az": 347.7, "normal_enu": [0, 0, 0], "draw_radius_ly": 110000 }],
  "birth": { "first_year": 1900, "rows": [[2007, 210, 0.0]] }
}
```

- `names`: yalnızca `display_name`'i `proper` ya da `bf`'den gelen yıldızlar için (~3.100 kayıt); geri kalanlar web'de `HIP {hip}` olarak gösterilir.
- `dly`: uzaklık bilinmiyorsa `null`.
- Boyut bütçesi: sky.json < 1 MB (GitHub Pages gzip ile sunar; ~300 KB'a iner) · Samanyolu 4k WebP < 4 MB · Dünya 8k < 8 MB.

### 5.12 Önizlemeler (`bts/preview.py`)

- `previews/orientation_check.png`: SVS yıldız haritası + en parlak 30 yıldızın tahmini konumlarında halkalar.
- `previews/altaz_dark.png`: ufuk koordinatlarındaki Samanyolu görüntüsü (alt 0–90°), karanlık durumdaki yıldızlar, 45°'de bir azimut işaretleri, mag < 1,5 yıldızların adları, M31 ve û_cas işareti.
- `previews/view_{landscape,portrait}_az{080,295}_{city,dark}.png`: web kamerasını (§6.3) taklit eden perspektif (gnomonik) çizim. Kamera tabanı ENU'da: ileri `f = enu(alt0, az0)`, sağ `r = normalize(f × (0,0,1))`, yukarı `u = r × f`. Bir yön `v` için `x = (v·r)/(v·f)/tan(hfov/2)`, `y = (v·u)/(v·f)/tan(vfov/2)`, `v·f > 0` olanlar çizilir.
- `previews/path_side.png`: rota düzlemine dik bakan 2D çizim; Güneş, Kraliçe yıldızları, en yakın geçişler, 0–800 ışık yılı.

### 5.13 Kabul ölçütleri (M1)

- `python build.py --config config.yaml` indirmeler hariç 3 dakikadan kısa sürer.
- Bütün çıktılar var ve boyut bütçesinin içinde.
- §9.1'deki testlerin hepsi geçer.
- Konsol özeti: seçilen tarih, Ay/Güneş yüksekliği, şehir/karanlık sayımları, Ay ışık süresi, û_cas, en yakın 5 geçiş, M31 yüksekliği, doğum tablosu kapsamı (1946–2018 için ≤ 1 ışık yılı kaç yıl), uyarılar.
- `orientation_check.png`'de halkalar parlak yıldızların üstünde.

### 5.14 Keşif verileri (`web/public/data/catalog_detail.json`)

Kartlar için gereken ek alanlar ayrı bir dosyada durur ve Perde 1 başladıktan sonra arka planda yüklenir; açılış süresini uzatmaz.

```json
{
  "version": 1,
  "fields": ["ci", "con", "spect"],
  "data": [[0.80, "Aur", "M1: comp"]]
}
```

- Satır sırası sky.json'daki `stars.data` ile **aynıdır** (indeks eşleşmesi; testle doğrula).
- `ci`: B−V (2 ondalık; yoksa `null` → web 0,6 kullanır ve sıcaklık satırını "~" ile gösterir).
- `con`: IAU kısaltması (her satırda dolu). `spect`: HYG'deki metin, kırpılmış (yoksa `null`).
- Mutlak kadir ayrıca yazılmaz; `M = mag − 5·log10(dly / 3,2616 / 10)` ile web'de hesaplanır.
- Boyut bütçesi: < 500 KB (gzip ile ~100 KB).

`config.yaml → flight.constellations`'ta Büyükayı'nın Kepçesi de var (§5.2; HIP'ler HYG'de doğrulandı: Dubhe 54061, Merak 53910, Phecda 58001, Megrez 59774, Alioth 62956, Mizar 65378, Alkaid 67301):

```yaml
    uma: [[54061, 53910], [53910, 58001], [58001, 59774], [59774, 54061], [59774, 62956], [62956, 65378], [65378, 67301]]
```

Konsol özetine eklenecek Keşif kontrolleri: karanlık görünürlerde Güneş'ten parlak olanların oranı (beklenen %99,3), Malazgirt görevi için `dly > 955,9` olan karanlık görünür yıldız sayısı (beklenen 380), Avcı kemeri uzaklıkları (Alnitak 736, Alnilam 1.977, Mintaka 693 ışık yılı).

---

## 6. Web uygulaması (web/)

### 6.1 Kurulum

```bash
npm create vite@latest web -- --template vanilla-ts
cd web
npm install three
npm install -D @types/three vitest @vitejs/plugin-basic-ssl
```

`package.json` betikleri:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:https": "vite --mode https",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => ({
  base: "./",                                   // GitHub Pages alt yolunda da çalışsın
  plugins: mode === "https" ? [basicSsl()] : [],
  server: { host: true },                       // telefondan erişim için
  build: { target: "es2020", assetsInlineLimit: 0 },
}));
```

`index.html`: `<html lang="tr">`, viewport `width=device-width, initial-scale=1, viewport-fit=cover`, `theme-color #02040A`. Katmanlar: `<canvas id="gl">` (WebGL), `<div id="hud">` (metin, düğmeler, cetvel, etiketler), `<div id="fade">` (geçiş karartması).

Temel CSS: `html, body { margin:0; height:100dvh; background:#02040A; overflow:hidden; overscroll-behavior:none; }`. Bütün katmanlar `position:fixed; inset:0`. `#gl` üzerinde `touch-action:none`.

### 6.2 Uygulama çekirdeği

**Sahne arayüzü:**

```ts
export type Action =
  | "next" | "back" | "restart" | "toggleMute" | "toggleDebug" | "toggleFullscreen"
  | "holdStart" | "holdEnd"            // Perde 1 basılı tutma
  | "lookBack"                         // Perde 2 "Geriye bak"
  | "nextStop" | "prevStop";           // sunum kumandası (Perde 2)

export interface Scene {
  enter(ctx: AppContext): Promise<void> | void;
  update(dt: number, nowMs: number): void;      // dt saniye
  render(renderer: THREE.WebGLRenderer): void;
  onResize(w: number, h: number): void;
  onAction?(a: Action): void;
  exit(): void;                                 // dinleyicileri kaldır; Perde 1 ve uçuş varlıklarını dispose etme (Perde 3 kullanır)
}
```

- **renderer.ts:** Tek `WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" })`, `setPixelRatio(Math.min(devicePixelRatio, 2))`, `outputColorSpace = SRGBColorSpace`, `autoClear = false` (Perde 2 katmanları için; §6.5). Pencere boyutu değişince etkin sahnenin `onResize`'ı çağrılır.
- **director.ts:** Durum makinesi (§2.1). Varsayılan geçiş: `#fade` öğesinin opaklığı 0 → 1 (500 ms), sahne değişimi, 1 → 0. Perde 1 sahnesini ve uçuş katmanlarını **dispose etmez**; Perde 3 ikisini de yeniden kullanır.
- **timeline.ts:** Bütün süreler ve ayar sabitleri burada:

```ts
export const T = {
  act1: { introText: 4, hold: 7.0, release: 3.5, reveal: [0.8, 2.5, 3.0] },
  act2: {
    takeoff: { turn: 1.5, fadeOut: 0.8, fadeIn: 1.0 },
    vMax: 0.8,                 // onluk/sn (z birimi)
    accelTau: 0.4, decelTau: 0.6,
    detentZ: 0.15, detentFactor: 0.35,
    cardWindowZ: 0.18,
    flyToS: 3.0, idleHintS: 6, autoplayDwellS: 5,
    lookTurnS: 1.5,
  },
  act3: { returnS: 14, landHold: 4, lightsOnS: 6 },
  outro: { lineGap: 2.5, total: 10 },
  fadeMs: 500,
};
```

- **input.ts:** Pointer, klavye, tekerlek ve iki parmak hareketini `Action`'lara ve sürekli değerlere (sürükleme dx/dy, pinch Δz, throttle) çevirir. Bir basılı tutmayı bitiren `pointerup` **"next" sayılmaz**. 8 px'ten az hareket eden ve 300 ms'den kısa süren dokunuş "tap" sayılır (yıldız seçimi).
- **assets.ts:** sky.json, Samanyolu dokusu, Dünya dokusu ve fontları önceden yükler; ilerleme çubuğu gösterir. Doku seçimi: `renderer.capabilities.maxTextureSize ≥ 4096` ve dokunmatik olmayan cihazda 4k Samanyolu, aksi halde 2k. `maxTextureSize ≥ 8192` ve dokunmatik olmayan cihazda 8k Dünya, aksi halde 4k (`matchMedia("(pointer: coarse)")`). URL parametreleri (§2.1) burada okunur.

**Kontroller:**

| Eylem | Dokunmatik | Fare / klavye | Sunum kumandası |
|---|---|---|---|
| Sahne ileri / geri | "Devam ›" düğmeleri | `Enter` / `Backspace` | `PageDown` / `PageUp` |
| Işıkları söndür (Perde 1) | Alttaki düğmeyi basılı tut | `Space` basılı | `PageDown` → 7 sn otomatik basılı tutma |
| Etrafa bak (Perde 1–3) | Jiroskop, ya da tek parmakla sürükle | Fareyle sürükle; Perde 1'de ok tuşları | — |
| İleri / geri uç (Perde 2) | "İleri" / "Geri" düğmeleri basılı; iki parmakla içe sıkıştır = ileri, dışa aç = geri | `↑`/`↓` ya da `W`/`S`, tekerlek | `PageDown` / `PageUp` → sonraki / önceki durağa uç |
| Geriye bak (Perde 2) | Düğme | `B` | — |
| Yıldız bilgisi (Perde 2) | Yıldıza dokun | Tıkla | — |
| Cetveldeki durağa git | İşarete dokun | Tıkla | — |
| Baştan / ses / bilim paneli / tam ekran | — | `R` / `M` / `D` / `F` | — |

İki parmak yönü harita uygulamalarındaki gibidir: içe sıkıştırmak uzaklaştırır (yani ileri, evden uzağa). Basılı tutma düğmesi ve İleri/Geri düğmeleri dokunuşu kendisi yakalar (`setPointerCapture`); ekranın geri kalanında sürükleme bakış içindir.

### 6.3 Bakış: kadraj, sürükleme, jiroskop (`app/look.ts`, `science/orientation.ts`)

**Başlangıç kadrajı (Perde 1, projektör):** Perspektif (gnomonik) projeksiyonda ufuk her zaman düz bir çizgidir. Ufuk ekranın üstünden `horizon_screen_y` (0,80) oranında dursun diye kamera şu açıyla yukarı bakar:

`tan(alt0) = (2·horizon_screen_y − 1)·tan(vFOV/2)`

```ts
export function frameSkyCamera(cam: THREE.PerspectiveCamera, w: number, h: number, view: View) {
  const aspect = w / h;
  cam.fov = aspect >= 1 ? view.vfov_landscape_deg : view.vfov_portrait_deg;
  cam.aspect = aspect;
  cam.near = 0.1;
  cam.far = 5000;
  const alt0 = Math.atan((2 * view.horizon_screen_y - 1) * Math.tan((cam.fov / 2) * DEG)) / DEG;
  cam.position.set(0, 0, 0);
  cam.up.set(0, 1, 0);
  cam.lookAt(dirFromAltAz(alt0, view.az_deg));
  cam.updateProjectionMatrix();
  return alt0;   // yatayda (vFOV 60°) ≈ 19,1°, dikeyde (vFOV 90°) ≈ 31,0°
}
```

**Sürükleme:** Perde 1 ve 3'te bakış `(alt, az)` çiftiyle tutulur. Yatay sürükleme `az −= dx · hFOV / genişlik` (parmak sağa giderse gökyüzü sağa kayar), dikey `alt += dy · vFOV / yükseklik`; `alt ∈ [−5°, 88°]` aralığına kıstırılır (lookAt'in tepe noktasında dönmesini önler). Bırakınca küçük bir atalet (τ = 0,25 sn). Boşta hafif "nefes": yaw ±0,4°, periyot 40 sn; kullanıcı bakarken ve `prefers-reduced-motion` açıkken kapalı.

**Jiroskop.** three.js'in eski `DeviceOrientationControls` örneği kütüphaneden kaldırıldı; aynı matematiği kendimiz yazıyoruz (doğrulandı):

```ts
import * as THREE from "three";
const DEG = Math.PI / 180;
const zee = new THREE.Vector3(0, 0, 1);
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion();
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));   // X etrafında −90°

/** alpha: kuzeye göre mutlak (0 = cihazın üstü kuzeyi gösterir, saat yönünün tersine artar). */
export function orientationToQuaternion(alphaDeg: number, betaDeg: number, gammaDeg: number, screenDeg: number,
                                        out = new THREE.Quaternion()) {
  euler.set(betaDeg * DEG, alphaDeg * DEG, -gammaDeg * DEG, "YXZ");
  out.setFromEuler(euler);
  out.multiply(q1);
  out.multiply(q0.setFromAxisAngle(zee, -screenDeg * DEG));
  return out;
}

/** Pusula yönü (saat yönünde, kuzeyden) → mutlak alpha */
export const headingToAlpha = (h: number) => ((360 - h) % 360 + 360) % 360;
```

Doğrulanan durumlar (kameranın baktığı yön = `(0,0,−1).applyQuaternion(q)`):
- Dik tutulan telefon, alpha 0, beta 90 → Kuzey, ufukta; kameranın yukarısı +y.
- alpha 90 → Batı (az 270) · alpha 270 → Doğu (az 90).
- beta 135 → Kuzey, 45° yükseklik · beta 0 (masada yatan telefon) → tam aşağı.
- Pusula yönü 0/45/90/180/295 → `headingToAlpha` ile az 0/45/90/180/295.
- Yatay (landscape) tutuş, ekran açısı 90°: arka kamera kuzeye bakarken yine Kuzey, ufukta, yukarısı +y.

**İzin ve olaylar:**

```ts
export async function enableGyro(onSample: (q: THREE.Quaternion) => void): Promise<"absolute" | "relative" | "off"> {
  const DOE = (window as any).DeviceOrientationEvent;
  if (!DOE || !window.isSecureContext) return "off";
  if (typeof DOE.requestPermission === "function") {          // iOS 13+: MUTLAKA kullanıcı dokunuşunun içinde çağır
    try { if ((await DOE.requestPermission()) !== "granted") return "off"; } catch { return "off"; }
  }
  const useAbs = "ondeviceorientationabsolute" in window;     // Android Chrome
  let mode: "absolute" | "relative" = useAbs ? "absolute" : "relative";
  let iosOffset: number | null = null;
  const handler = (e: DeviceOrientationEvent) => {
    if (e.alpha == null || e.beta == null || e.gamma == null) return;
    let alpha = e.alpha;
    const heading = (e as any).webkitCompassHeading as number | undefined;   // iOS
    if (typeof heading === "number" && heading >= 0) {
      mode = "absolute";
      const off = e.alpha - headingToAlpha(heading);           // alphaAbs = alpha − off
      iosOffset = iosOffset == null ? off : iosOffset + 0.05 * wrap180(off - iosOffset);   // gürültüyü yumuşat
      alpha = e.alpha - iosOffset;
    }
    const screenDeg = (screen.orientation?.angle ?? (window as any).orientation ?? 0) as number;
    onSample(orientationToQuaternion(alpha + userYawOffsetDeg, e.beta, e.gamma, screenDeg));
  };
  window.addEventListener(useAbs ? "deviceorientationabsolute" : "deviceorientation", handler as EventListener, true);
  return mode;
}
const wrap180 = (a: number) => ((a + 540) % 360) - 180;
```

- **"Başla" düğmesi** `enableGyro`'yu çağırır (iOS izni yalnızca kullanıcı dokunuşunun içinde istenebilir). Sonuç `"off"` ise sessizce sürükleme moduna geçilir.
- Kamera her karede hedefe yumuşakça yaklaşır: `cam.quaternion.slerp(target, 1 − exp(−dt/0.08))`.
- `"relative"` modda (kuzey bilinmiyor) ve pusula hatalarına karşı: jiroskop açıkken **yatay sürükleme `userYawOffsetDeg`'i değiştirir** ("Kuzeyi düzelt"). Ankara'da pusula manyetik kuzeyi gösterir; gerçek kuzeyle arasında birkaç derecelik fark normaldir.
- Sağ altta küçük anahtar: "Jiroskop açık / kapalı". Kapalıyken sürükleme moduna dönülür.
- **Perde 2'de** jiroskop göreli kullanılır: uçuş başladığı andaki yönelim `qStart` saklanır, `qRel = qStart⁻¹ · qNow`, kameranın son yönelimi `qBase · qRel` (§6.5). Sürüklemede `qRel` yaw/pitch'ten kurulur (pitch ±80° ile sınırlı) ve bakış dışarı bırakılınca 2 sn'de yavaşça sıfıra döner.
- **Doğrulanmadı (telefonda kontrol et):** iOS'un `webkitCompassHeading` değerinin telefon dik tutulurken arka kameranın yönünü vermesi. Kontrol: telefonun pusula uygulamasıyla bilinen bir yöne dön; Perde 1'de o yöndeki yıldızlar görünmeli (bilim panelinde az değeri). Tutmuyorsa "Kuzeyi düzelt" ile kapatılır; demoyu etkilemez.

### 6.4 Perde 1 uygulaması

**Gökyüzü kubbesi (`render/skyDome.ts`):** `SphereGeometry(1000, 64, 32)` + `ShaderMaterial({ side: BackSide, depthWrite: false })`. Vertex shader dünya yönünü aktarır: `vDir = (modelMatrix * vec4(position, 1.0)).xyz;` (kamera orijinde). Aynı shader Perde 2'de "uzay modunda" kullanılır (`uSpace = 1`: zemin, sönüm ve gökyüzü rengi yok; küre her karede kameranın konumuna taşınır).

```glsl
uniform sampler2D uMW;
uniform float uMWOpacity, uMWGain, uExtK, uSpace;
uniform vec3 uZenith, uHorizon;
uniform vec3 uM31Dir, uM31Major;       // M31 yönü ve büyük ekseni (three.js birim vektörleri)
uniform float uM31Opacity;
varying vec3 vDir;

void main() {
  vec3 d = normalize(vDir);
  float alt = asin(clamp(d.y, -1.0, 1.0));
  if (alt < 0.0 && uSpace < 0.5) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  float az = atan(d.x, -d.z);
  if (az < 0.0) az += 6.28318530718;
  vec2 uv = vec2(az / 6.28318530718, 0.5 + alt / 3.14159265359);   // flipY=true: v=1 görüntünün üstü
  float altDeg = alt * 57.29577951308232;
  float ext = 1.0;
  if (uSpace < 0.5) {
    float X = 1.0 / (sin(alt) + 0.50572 * pow(max(altDeg, 0.0) + 6.07995, -1.6364));
    ext = pow(10.0, -0.4 * uExtK * (X - 1.0));
  }
  vec3 mw = texture2D(uMW, uv).rgb * uMWGain * uMWOpacity * ext;
  // Andromeda lekesi (§3.4): 3,2° × 1,0° elips
  vec3 minor = normalize(cross(uM31Dir, uM31Major));
  float a = dot(d, uM31Major) / 0.0279, b = dot(d, minor) / 0.0087;     // yarı eksenler (rad)
  float m31 = (dot(d, uM31Dir) > 0.0) ? exp(-(a * a + b * b) * 2.0) * uM31Opacity * ext : 0.0;
  float h = pow(1.0 - clamp(altDeg, 0.0, 90.0) / 90.0, 2.5);
  vec3 sky = mix(uZenith, uHorizon, h) * (1.0 - uSpace);
  gl_FragColor = vec4(sky + mw + m31 * vec3(0.91, 0.86, 0.78), 1.0);
  #include <colorspace_fragment>
}
```

- Samanyolu dokusu: `colorSpace = SRGBColorSpace`, `wrapS = RepeatWrapping`, **`generateMipmaps = false`, `minFilter = LinearFilter`**. Mipmap açık olursa az = 0/360° dikişinde ince bir çizgi görünür.
- M31 büyük ekseni: M31 yönünde, kuzeyden doğuya 38° (§3.13'teki `â` vektörü; pipeline `galaxies[m31].major_enu` olarak da yazar).
- Renk yönetimi: `uZenith`/`uHorizon` için `THREE.Color` kullan (hex'ten doğru dönüşür). Kendi shader'larında sonuna `#include <colorspace_fragment>` ekle. Kullandığın three.js sürümünün renk yönetimi notlarını kontrol et.

**Yıldızlar (`render/stars.ts`):** Bütün yıldızlar için **tek** `BufferGeometry`, iki malzeme:
- `position` = gerçek 3D konum, ışık yılı (`dirFromAltAz(alt, az) · dly`; uzaklığı bilinmeyenlerde `· nodist_shell_ly`).
- Öznitelikler: `aMag` (float, Dünya'dan), `aColor` (0–1 vec3), `aPhase` (tohumlu rastgele 0–1), `aPlanet` (0/1), `aNoDist` (0/1).
- Gezegenler aynı geometriye eklenmez; Perde 1'de ayrı küçük bir `Points` ile çizilir (`aPlanet = 1` mantığı onların malzemesinde).

**Gökyüzü malzemesi (Perde 1 ve 3):** yön `normalize(position)`, sabit 900 birim yarıçapa konur.

```glsl
// vertex
uniform float uSqm, uGlowMag, uExtK, uSoft, uBaseSize, uMaxSize, uRefMag, uPixelRatio, uTime, uTwinkle, uIntensity;
attribute float aMag;
attribute vec3 aColor;
attribute float aPhase;
attribute float aPlanet;
varying vec3 vColor;
varying float vAlpha;
const float DEG = 0.017453292519943295;

float nelm(float s) { return 7.93 - 5.0 * log(pow(10.0, 4.316 - s / 5.0) + 1.0) / log(10.0); }
float airmass(float altDeg) { float a = max(altDeg, 0.0); return 1.0 / (sin(a * DEG) + 0.50572 * pow(a + 6.07995, -1.6364)); }

void main() {
  vec3 d = normalize(position);
  float altDeg = asin(clamp(d.y, -1.0, 1.0)) / DEG;
  float X = airmass(altDeg);
  float mEff = aMag + uExtK * (X - 1.0);
  float s = 1.0 - sin(max(altDeg, 0.0) * DEG);
  float mLim = nelm(uSqm - uGlowMag * s * s);
  // DİKKAT: smoothstep'te edge0 < edge1 olmalı; ters sırada sonuç tanımsız
  float vis = altDeg > 0.0 ? 1.0 - smoothstep(mLim - uSoft, mLim + uSoft, mEff) : 0.0;
  float tw = (1.0 - aPlanet) * uTwinkle * clamp(X - 1.0, 0.0, 3.0) * 0.05
           * sin(uTime * (3.0 + aPhase * 4.0) + aPhase * 6.2831853);
  float intensity = clamp(0.35 + 0.65 * (uRefMag - mEff) / (uRefMag + 1.5), 0.25, 1.0);
  vAlpha = vis * intensity * uIntensity * (1.0 + tw);
  vColor = aColor;
  gl_PointSize = clamp(uBaseSize * pow(10.0, -0.2 * (mEff - uRefMag)), 1.0, uMaxSize) * uPixelRatio;
  gl_Position = projectionMatrix * viewMatrix * vec4(d * 900.0, 1.0);
}
```

```glsl
// fragment (iki malzemede ortak)
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c) * 2.0;
  float core = exp(-r * r * 8.0);
  float halo = exp(-r * 3.0) * 0.25;
  float a = vAlpha * (core + halo);
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor * a, a);
  #include <colorspace_fragment>
}
```

Başlangıç değerleri (bilim panelinden ayarlanır): `uBaseSize 1,6 · uMaxSize 9 · uRefMag 6,0 · uSoft 0,25 · uTwinkle 1 · uIntensity 1`. GLSL ES'te `log10` olmadığı için `log(x)/log(10.0)` kullanılır.

**3D şehir silueti (`render/skyline.ts`):** Jiroskopla her yöne bakılabildiği için siluet 2D değil, kamerayı çevreleyen bir silindirdir.
- `CylinderGeometry(800, 800, yüksek − alçak, 512, 1, true)`, `side: BackSide`, kamera ekseninde. Bant yüksekliği −3° ile +14° arası: `y = 800·tan(alt)`.
- **Veri dokusu** (tohum 42, 4096×256, az = u·360°, sarmalı): R = bina maskesi, G = pencere (0 yok · 128 soğuk LED `#DDE8FF` · 255 sıcak `#FFD9A0`), B = pencerenin sönme eşiği θ ∈ U(0,02; 0,98)·255. **Alfa her yerde 255 kalsın** (canvas alfa ile çarpılmış renk sakladığı için veri bozulur). Binalar: yükseklik 1,5°–7°, birkaç kule 11°'ye kadar; genişlik 0,6°–2,0° az. Pencereler 4×6 px ızgara, başlangıçta %55'i yanık. Doku `NearestFilter`, mipmap yok, `colorSpace = NoColorSpace` (veri).
- Fragment: `R < 0,5` ise `discard` (gökyüzü görünür); bina rengi `#05060A`; pencere yanıklığı `on = 1 − smoothstep(θ − 0,015, θ, uP)` (`uP` = basılı tutma ilerlemesi p).
- Sokak parlaması kubbenin ufuk rengiyle verilir (§3.5). Siluet kubbeden ve yıldızlardan sonra çizilir (`renderOrder` büyük, `depthTest: false`).

**Basılı tutma (`input.ts` + `scenes/act1Lights.ts`):**

```ts
export class HoldControl {
  p = 0; holding = false; locked = false;
  constructor(private holdS = 7, private releaseS = 3.5) {}
  update(dt: number) {
    if (this.locked) return;
    this.p += this.holding ? dt / this.holdS : -dt / this.releaseS;
    this.p = Math.min(1, Math.max(0, this.p));
    if (this.p >= 1) { this.locked = true; this.holding = false; }
  }
}
// Alttaki düğmede pointerdown: e.preventDefault(); btn.setPointerCapture(e.pointerId); hold.holding = true
// pointerup / pointercancel / lostpointercapture → hold.holding = false
// Space keydown (e.repeat yok sayılır) → true, keyup → false
```

CSS (iOS'ta uzun basınca açılan menüyü ve büyüteci engeller): `touch-action:none; user-select:none; -webkit-user-select:none; -webkit-touch-callout:none;`. Ayrıca `document.addEventListener("contextmenu", e => e.preventDefault())`.

**Görsel ipucu:** altta 88 px dairesel düğme ve SVG halkasında ilerleme (`stroke-dashoffset`).

**Sayaç:** Her karede CPU sayımı (`countVisible`, §3.3) ve yumuşatılmış gösterim: `shown += (target − shown)·min(1, dt·12)`. Biçim `Intl.NumberFormat("tr-TR")`.

**Kilit sonrası:** `T.act1.reveal` gecikmeleriyle iki satır ve "Yukarı çık ›". Kullanıcı bu sırada etrafa bakmaya devam edebilir. Sunucu modunda otomatik geçiş yok.

**Rozet:** sağ üstte, perde boyunca sürekli.

### 6.5 Perde 2 uygulaması — Yolculuk

#### 6.5.1 Ölçek katmanları (`render/layers.ts`)

Kamera 1 km'den 2,2 milyon ışık yılına (10^19 km) kadar uzaklaşır. Tek bir sahnede bu aralık float32 hassasiyetini ve derinlik tamponunu bozar. Çözüm: her biri kendi birimiyle çalışan üç sahne. Ana kamera konumu JS'te (float64) km cinsinden tutulur; her katmanın kamerası bu konumdan türetilir. three.js `modelViewMatrix`'i JS'te float64 hesaplayıp yüklediği için her katman kendi ölçeğinde hassas kalır.

| Katman | Birim | Orijin (Ankara'ya göre) | İçerik | Ağırlık w(z) |
|---|---|---|---|---|
| `earth` | 6.371 km (Dünya yarıçapı) | Dünya'nın merkezi: (0, −6.371,89, 0) km | Dünya, atmosfer, Ankara halkası, Ay, Ay yörüngesi | 1 (z ≤ 6,2) → 0 (z 7,0) |
| `solar` | 1 AB | Ankara | Güneş, yörüngeler, gezegenler, Voyager 1 | 0 (5,9) → 1 (6,6) … 1 (10,9) → 0 (11,8) |
| `deep` | 1 ışık yılı | Ankara | Samanyolu gökyüzü küresi, yıldızlar, takımyıldız çizgileri, küre, galaksi, Yerel Grup | her zaman 1 (içindekiler kendi aralıklarında söner) |

```ts
export interface ScaleLayer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  unitKm: number;
  originKm: THREE.Vector3;               // three.js çerçevesinde, Ankara'ya göre
  weight(z: number): number;
  applyWeight(w: number): void;          // malzeme opaklıkları
  nearFar(distUnits: number): [number, number];
}

export function renderLayers(r: THREE.WebGLRenderer, layers: ScaleLayer[], camPosKm: THREE.Vector3, q: THREE.Quaternion, z: number) {
  r.clear();
  for (const L of layers) {                                // sıra: deep → solar → earth (uzaktan yakına)
    const w = L.weight(z);
    if (w <= 0.001) continue;
    L.applyWeight(w);
    L.camera.quaternion.copy(q);
    L.camera.position.copy(camPosKm).sub(L.originKm).divideScalar(L.unitKm);
    const [n, f] = L.nearFar(L.camera.position.length());
    L.camera.near = n; L.camera.far = f; L.camera.updateProjectionMatrix();
    r.clearDepth();
    r.render(L.scene, L.camera);
  }
}
```

- `earth`: `near = max(0,0005, d·0,01)`, `far = d·10 + 200` (Dünya yarıçapı birimi). Dünya ve Ay katı cisimdir, derinlik testi açık.
- `solar` ve `deep`: noktalar ve çizgiler `depthTest: false`, additive; `near = max(1e-6, d·1e-4)`, `far = d·10 + katman boyutu` (deep için 5e6).
- Bütün katman kameraları aynı FOV'u kullanır (yatay 60°, dikey 75°).

#### 6.5.2 Rota ve bakış (`science/flight.ts`)

```ts
export const Z_MIN = 3.6, Z_MAX = 19.318;

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function slerpDir(a: THREE.Vector3, b: THREE.Vector3, t: number, out = new THREE.Vector3()) {
  const ang = a.angleTo(b);
  if (ang < 1e-9) return out.copy(a);
  const s = Math.sin(ang);
  return out.copy(a).multiplyScalar(Math.sin((1 - t) * ang) / s).addScaledVector(b, Math.sin(t * ang) / s);
}

/** û(z): §3.9 tablosu. U, uCas, uTarget three.js çerçevesinde birim vektörler. */
export function pathDir(z: number, U: THREE.Vector3, uCas: THREE.Vector3, uTarget: THREE.Vector3, out = new THREE.Vector3()) {
  if (z <= 11.0) return out.copy(U);
  if (z < 13.0) return slerpDir(U, uCas, smooth(11.0, 13.0, z), out);
  if (z <= 15.75) return out.copy(uCas);
  if (z < 16.6) return slerpDir(uCas, uTarget, smooth(15.75, 16.6, z), out);
  return out.copy(uTarget);
}

export const cameraPosKm = (z: number, dir: THREE.Vector3, out = new THREE.Vector3()) => out.copy(dir).multiplyScalar(10 ** z);

export type Look = "back" | "forward";
export function baseLook(z: number): Look {
  if (z < 12.3) return "back";
  if (z < 15.9) return "forward";
  if (z < 16.5) return "back";
  if (z < 17.8) return "forward";
  if (z < 18.5) return "back";
  return "forward";
}

/** Uçuşta yıldızın görünür kadiri (§3.8) — GLSL ile birebir */
export const apparentMag = (mag: number, distHomeLy: number, distCamLy: number) =>
  mag + 5 * Math.log10(Math.max(distCamLy, 1e-3) / distHomeLy);

export const exposureLimit = (z: number) => 6.62 + 5 * Math.max(0, z - 15.3);
```

- **Rota sürekliliği:** `pathDir` sürekli olduğu için kamera konumu da süreklidir; testte z'yi 0,001 adımlarla tarayıp ardışık konumlar arasındaki açının 0,5°'yi geçmediğini kontrol et.
- **Bakış quaternion'u:** ileri yön `f` = `pathDir` (ileri) ya da `−pathDir` (geri). Yukarı referansı `upRef(z)`: z < 11'de ENU Kuzey → three.js (0, 0, −1); 11 → 14 arasında galaktik kuzey kutbuna slerp. Her karede `up = normalize(upRef − (upRef·f)·f)`, sonra `Matrix4.lookAt(0, f, up)` ile quaternion. Bakış değişimleri (geri ↔ ileri) `T.act2.lookTurnS` sürede slerp ile yapılır.
- **Son yönelim:** `q = qBase · qUser`. `qUser` sürüklemeden (yaw/pitch) ya da jiroskoptan (`qStart⁻¹ · qNow`) gelir (§6.3).
- **"Geriye bak":** `qBase`'i 180° çevirir (yukarı eksen etrafında); bir sonraki `baseLook` değişimine kadar geçerli.

#### 6.5.3 Uçuş kontrolü

```ts
export class FlightControl {
  z = Z_MIN; v = 0;              // v: onluk/sn
  throttle = 0;                  // −1 geri … +1 ileri (düğme, ↑/↓, W/S)
  private flyTo: { from: number; to: number; t: number; dur: number } | null = null;

  update(dt: number, stops: number[], extraDz = 0) {     // extraDz: pinch + tekerlek
    if (this.flyTo) {
      const f = this.flyTo; f.t = Math.min(f.dur, f.t + dt);
      const k = f.t / f.dur, e = k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;   // easeInOutCubic
      this.z = f.from + (f.to - f.from) * e;
      if (f.t >= f.dur) this.flyTo = null;
      return;
    }
    const near = stops.some(s => Math.abs(this.z - s) < T.act2.detentZ);
    const vTarget = T.act2.vMax * this.throttle * (near ? T.act2.detentFactor : 1);
    const tau = this.throttle !== 0 ? T.act2.accelTau : T.act2.decelTau;
    this.v += (vTarget - this.v) * (1 - Math.exp(-dt / tau));
    this.z = Math.min(Z_MAX, Math.max(Z_MIN, this.z + this.v * dt + extraDz));
  }
  goTo(z: number, dur = T.act2.flyToS) { this.flyTo = { from: this.z, to: z, t: 0, dur }; this.v = 0; }
}
```

- Pinch: her `pointermove`'da `extraDz += 2 · log10(dÖnceki / dŞimdiki)` (içe sıkıştırma pozitif = ileri).
- Tekerlek: `extraDz += deltaY · 0,0015` (`deltaMode` piksel; satır modunda ×16).
- Tam yolculuk (3,6 → 19,32, 15,7 onluk) tam hızda ~20 sn sürer; duraklarla birlikte 90–150 sn.
- Kullanıcı 6 sn hiçbir şey yapmazsa "İleri'ye basılı tut" ipucu yanıp söner.

#### 6.5.4 Kalkış (A2_TAKEOFF)

| sn | Olay |
|---|---|
| 0–1,5 | Perde 1 kamerası tepeye (alt 88°) döner. `uExtK → 0`, `uTwinkle → 0`, siluet ve ufuk rengi söner, Samanyolu tam opaklığa çıkar (atmosferin üstüne çıkma hissi) |
| 1,5–2,3 | Siyaha geçiş |
| 2,3 | Uçuş başlar: `z = 3,6` (~4.000 km), bakış "geri" (aşağıda Ankara), jiroskop `qStart` kaydedilir |
| 2,3–3,3 | Siyahtan açılış; kontroller etkin |

#### 6.5.5 Katman içerikleri

**earth (`render/earth.ts`):**
- Dünya: `SphereGeometry(1, 128, 64)`, `quaternion = earthQuaternionFor(lat, lon)` (§3.1). `ShaderMaterial`: gece ışıkları `texture · smoothstep(0,15; −0,1; dot(N, S))`, gündüz tarafı `#0A1A33 · 0,6 · smoothstep(−0,1; 0,3; dot(N, S))`. `S` = Güneş yönü (`meta.sun` alt/az → three.js). Doku `colorSpace = SRGBColorSpace`.
- Atmosfer: `SphereGeometry(1.02)` + Fresnel shader `pow(1 − dot(N, V), 3)·0,6`, renk `#4A7BD8`, additive.
- Ankara halkası: Ankara noktasında (0; 1,00014; 0) nabız gibi atan sprite; z > 6'da söner.
- Ay: `SphereGeometry(0.2727)` (1.737,4 km), konum `Ankara + moonTopo/6371` (`meta.moon` alt/az/uzaklık). Basit Lambert gölgeleme Güneş yönüyle. Ay yörüngesi: Dünya merkezli, yarıçap = Ay'ın merkezden uzaklığı, ekliptik düzleminde `LineLoop` (opaklık 0,25). Etiket: "Ay".

**solar (`render/solar.ts`):**
- Güneş: `meta.sun` alt/az × `dist_au` konumunda parıltı sprite'ı (en az 6 px, canvas'ta üretilmiş radyal gradyan, `#FFD27A`).
- Dünya: orijinde mavi nokta (4 px). Gezegenler: `bodies[]` konumlarında renkli noktalar (4 px).
- Yörüngeler: Güneş merkezli, yarıçap = gezegenin Güneş'e o anki uzaklığı, normal = `ecliptic_pole_enu`. Dünya'nın yörüngesi orijinden geçer. Opaklık 0,2.
- Voyager 1: `voyager1.enu_dir · dist_au` konumunda küçük nokta ve "Voyager 1" etiketi; 5. durakta Güneş'ten Voyager'a ince kesikli çizgi.
- Etiket (katman görünürken): "Yörüngeler daire olarak çizildi · gezegenler büyütüldü".

**deep:**
- **Samanyolu gökyüzü küresi:** §6.4 kubbe shader'ı `uSpace = 1` ile; her karede kameranın konumuna taşınır (sonsuz uzaklıktaki arka plan). Opaklık `1 − smooth(15,0; 16,4; z)`.
- **Yıldızlar:** §6.4'teki geometri, uçuş malzemesiyle:

```glsl
// vertex — uçuş malzemesi (fragment §6.4 ile ortak)
uniform float uMLim, uSoft, uBaseSize, uMaxSize, uFlyByMax, uRefMag, uPixelRatio, uIntensity, uNoDistShell, uFade;
attribute float aMag;
attribute vec3 aColor;
attribute float aNoDist;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 P = position;                                        // ışık yılı
  float dHome = aNoDist > 0.5 ? uNoDistShell : length(P);
  float dCam = max(length(P - cameraPosition), 1e-3);       // cameraPosition: three.js'in hazır uniform'u
  float mApp = aMag + 5.0 * log(dCam / dHome) / log(10.0);  // §3.8
  float vis = 1.0 - smoothstep(uMLim - uSoft, uMLim + uSoft, mApp);
  float closeUp = 1.0 - smoothstep(0.2, 2.0, dCam);         // 2 ışık yılından yakın: büyüt
  float size = clamp(uBaseSize * pow(10.0, -0.2 * (mApp - uRefMag)), 1.0, mix(uMaxSize, uFlyByMax, closeUp));
  vAlpha = vis * clamp(0.35 + 0.65 * (uRefMag - mApp) / (uRefMag + 1.5), 0.25, 1.0) * uIntensity * uFade;
  vColor = aColor;
  gl_PointSize = size * uPixelRatio;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(P, 1.0);
}
```

  `uMLim = exposureLimit(z)` (§3.8); `uFlyByMax` varsayılan 28. `cameraPosition` yalnızca `ShaderMaterial`'da otomatik gelir (`RawShaderMaterial`'da gelmez).
- **"Pozlama artırıldı"** etiketi `uMLim > 6,7` iken görünür.
- **Takımyıldız çizgileri (`render/constellations.ts`):** `constellations` çiftlerinden `LineSegments` (gerçek 3D konumlar), `#8FB8FF`, opaklık 0,35; `smooth(11,5; 12,5; z)` ile belirir, `1 − smooth(15,6; 16,2; z)` ile söner. Kraliçe çizgileri 8. durakta 0,6 opaklığa çıkar. Çizgiler gerçek konumlar arasında olduğu için kamera yaklaştıkça uzar ve şekil bozulur; ayrıca animasyon gerekmez.
- **Küre (durak 9):** yarıçap `meta.stats.dark_dist_ly_p50` (390), orijinde, çok saydam (`#8FB8FF`, opaklık 0,06, kenarda Fresnel ile 0,25). `z ∈ [15,9; 16,6]` aralığında görünür.
- **"Buradasın" işareti:** orijinde küçük halka ve etiket; z ≥ 16,8'de görünür.
- **Samanyolu parçacıkları (`render/galaxy.ts`):** §3.13 modeli; konum = `C_gal + gal_to_enu · (yerel · 1000)` → three.js. Masaüstünde 60.000, telefonda 25.000. Opaklık `smooth(16,6; 17,4; z)`. Güneş çevresi deliği §3.13'te. Etiket: "Temsili çizim · Güneş'in konumu ve galaksinin yönü gerçek".
- **Yerel Grup (`render/localGroup.ts`):** her galaksi kendi `enu_dir · dist_ly` konumunda. Sarmallar (M31: masaüstü 25.000 / telefon 10.000 parçacık; M33: 8.000 / 3.000) aynı kol üretecini kendi diskinde (`normal_enu`'ya dik iki eksen) kullanır; Macellan Bulutları (5.000 / 2.000 ve 2.000 / 800) Gauss bulutlarıdır. Opaklık `smooth(17,6; 18,4; z)`. Etiket: "Temsili çizim · yön ve uzaklık gerçek".
- Parçacıklar kameraya çok yaklaşınca solar: `alpha *= smoothstep(R·0,001, R·0,01, dCam)` (R: o galaksinin çizim yarıçapı). Rota galaksilerin içinden geçmez; bu yalnızca sürükleyerek bakarken ekranın patlamaması için.

#### 6.5.6 Duraklar, kartlar, cetvel, etiketler

- **Duraklar:** `STOPS = [{ key, z }]` (§3.10). `moon`, `sun`, `neptune` için z, sky.json'daki gerçek uzaklıktan hesaplanır.
- **Kart (`ui/stopCard.ts`):** `|z − z_durak| < T.act2.cardWindowZ` olunca alt-ortada belirir (başlık + 1–2 satır, §8); pencereden çıkınca söner. Kart belirirken `drone.chime()`.
- **Işık sayacı (sol üst, sürekli):** "Işığın Ankara'dan buraya ulaşması" + `fmtLightTime(10^z / C_KM_S)`.
- **Cetvel (`ui/ruler.ts`):** sağ kenarda, ekran yüksekliğinin %70'i; z doğrusal olarak y'ye (alt = ev, üst = Andromeda). Durak işaretleri ve kısa adlar; geçerli konum işaretçisi. İşarete dokununca `goTo(z_durak)`.
- **Etiketler (`ui/labels.ts`):** `labels` listesindeki yıldızlar her karede deep kamerasıyla ekrana izdüşürülür. Gösterim koşulu: `z ∈ [12,3; 16,5]`, kameranın önünde, ekranda, `m_app < uMLim − 0,5`. Aynı anda en fazla 4 (ekran merkezine en yakınlar). Metin: "Vega · 25 ışık yılı · ışığı 2001'de yola çıktı" (§3.11, §8).
- **Yıldıza dokunma:** "tap" gelince bütün yıldızları CPU'da izdüşür (15.598 nokta, tek seferlik), `m_app < uMLim` olanlar arasından 28 px içindeki en yakını seç. Kart: ad (`names` ya da `HIP {hip}`), uzaklık, ışığın yola çıktığı yıl; uzaklığı bilinmiyorsa "uzaklığı ölçülemedi". Aynı anda `lightRay.ts` yıldızdan orijine bir ışık çizgisi akıtır: süre `1,2 + 0,9·log10(1 + dly)` sn, üstünde yıl sayacı yola çıkış yılından 2026'ya sayar. Etiket: "Süre ölçekli değil".
- **Opsiyonel "Güneş nerede?" (durak 10):** "Güneş nerede? Tahminine dokun." → dokunulan ekran noktasından ışın, galaktik düzlemle (nokta `C_gal`, normal `ẑ_gal`) kesiştirilir; kesişimin Güneş'e (orijin) uzaklığı: "Tahminin Güneş'e {n} ışık yılı uzaktaydı." Sonra "Buradasın" işareti parlar. Öncelik listesinde sonlarda (§11).
- **Otomatik mod (`?autoplay=1`) ve sunucu modu:** `goTo` ile durak durak ilerler; otomatikte her durakta `T.act2.autoplayDwellS` bekler, 9 ve 10'da bakış dönüşü bitene kadar ek 2 sn.

#### 6.5.7 Son durak

11. durakta kart belirdikten 3 sn sonra "Geriye bak" düğmesi parlar (Samanyolu küçücük görünür) ve "Eve dönmeden önce ›" düğmesi çıkar → A3_BIRTH.

### 6.6 Perde 3 uygulaması — Senin Işığın

**A3_BIRTH:** Andromeda görüntüsünün üstünde yarı saydam panel: `<input type="number" inputmode="numeric" min="1900" max="{obsYear}">`, "Göster", "Atla". Değer yalnızca bellekte tutulur; `localStorage`'a yazılmaz, ağa gönderilmez; "Baştan başla" ile silinir. `?born=` parametresi alanı doldurur.

**Arama (`science/years.ts`):**

```ts
export type BirthResult =
  | { kind: "match" | "nearest"; star: number; year: number; deltaLy: number; up: boolean }
  | { kind: "tooYoung" }
  | { kind: "none" };

export function findBirthStar(sky: Sky, Y: number): BirthResult {
  const obs = sky.meta.obs_year_frac;
  const age = obs - (Y + 0.5);
  if (age < 7.6) return { kind: "tooYoung" };
  const row = sky.birth.rows.find(r => r[0] === Y);
  if (!row) return { kind: "none" };
  const [, i, delta] = row;
  if (Math.abs(delta) > 2.5) return { kind: "none" };
  const dly = sky.starDly[i]!;
  return { kind: Math.abs(delta) <= 1 ? "match" : "nearest",
           star: i, year: Math.floor(obs - dly), deltaLy: delta, up: sky.starAlt[i] > 5 };
}
```

**A3_RETURN (14 sn):** `flight.goTo(Z_MIN, T.act3.returnS)`, bakış zorla "geri" (eve doğru). Doğum yıldızı deep katmanında halka sprite'ıyla işaretlenir; `z`, `log10(dly · LY_KM) + 0,3`'ün altına inince yıldızdan orijine ışık çizgisi akar (§6.5.6). Kart: "Senin yıldızın: {ad}".

**A3_LAND:** z ≤ 4,0'da siyaha kısa geçiş, Perde 1 sahnesine dönüş (kilitli, karanlık durum: p = 1). Bakış:
- Jiroskop açıksa kullanıcının gerçek yönelimi; yıldız ekran dışındaysa kenarda **yön oku** (yıldızın ekran izdüşümünün merkeze göre açısı; kameranın arkasındaysa ok ters çevrilir). Metin: "Telefonu ona çevir."
- Jiroskop yoksa kamera 2 sn'de yıldıza döner (yıldız `alt > 5` ise), değilse başlangıç kadrajı.
- Yıldızın etrafında halka (ekran uzayında 18 px yarıçap, nefes alır).

**A3_LIGHTS (6 sn):** `hold.locked = false`, p 1 → 0 doğrusal; pencereler yanar, yıldızlar kaybolur. Halka kalır. Metin: "Işıklar yandı. Onlar hâlâ orada."

**Özel durumlar:**
- `tooYoung`: A3_RETURN yıldızsız; A3_LAND'de Sirius halkayla gösterilir (ufkun altındaysa yön oku ve "şu an ufkun altında"). Metin §8 `act3.tooYoung`.
- `up = false`: "Senin yıldızın şu an ufkun altında, {yön} tarafında. Işığı yine de bu gece Dünya'ya varıyor." Yön, azimuttan 8 yönlü Türkçe adla (kuzey, kuzeydoğu, doğu, …).
- "Atla" ya da `none`: yıldızsız dönüş, A3_LAND'de halka yok.

### 6.7 Giriş, kapanış ve kaynaklar ekranı

- **LOADING:** ince ilerleme çizgisi ve "Yükleniyor %{n}". Fontlar yüklenene kadar metin gösterme (`document.fonts.ready`).
- **INTRO:** siyah ekran; yer/tarih satırı, "Başını kaldır.", "Başla" düğmesi, "Sesli deneyim · kulaklık önerilir", küçük TR/EN değiştirici. "Başla"ya basınca (hepsi aynı dokunuşun içinde): AudioContext başlat, **jiroskop iznini iste** (§6.3), Wake Lock iste, destekleniyorsa tam ekran (iPhone'da yok), A1_CITY'ye geç. `bts.storySeen` varsa "Başla" yerine iki düğme: "Hikâyeyi izle" ve "Keşfe geç" (ikisi de aynı izinleri ister).
- **OUTRO:** arkada Perde 1'in şehir gökyüzü (ışıklar yanık); iki satır sırayla; "BEYOND THE SKY" logosu (aralıklı harfler, CSS `text-transform: uppercase`, `lang` doğru). Ardından büyük **"Keşfet ›"** düğmesi ve küçük "Baştan başla", "Kaynaklar ve notlar". Kapanışa ulaşınca `localStorage["bts.storySeen"] = "1"`.
- **CREDITS:** kaydırılabilir panel: veri kaynakları ve lisanslar (§15), kısa model notları (§14), gizlilik notu ("Doğum yılın ve telefonunun yönü cihazından çıkmadı."), "Baştan başla".

### 6.8 Ses (`audio/drone.ts`)

```ts
export class Drone {
  ctx = new AudioContext();
  master = this.ctx.createGain();
  filter = this.ctx.createBiquadFilter();
  shimmer = this.ctx.createGain();
  sub = this.ctx.createGain();
  wet = this.ctx.createGain();
  whoosh = this.ctx.createGain();
  reverb = this.ctx.createConvolver();

  constructor() {
    this.master.gain.value = 0;
    this.filter.type = "lowpass"; this.filter.frequency.value = 320; this.filter.Q.value = 0.7;
    this.reverb.buffer = makeImpulse(this.ctx, 4.0, 2.5);
    this.wet.gain.value = 0.35;
    this.filter.connect(this.master);
    this.filter.connect(this.reverb); this.reverb.connect(this.wet); this.wet.connect(this.master);
    this.master.connect(this.ctx.destination);
    const voices: [number, OscillatorType, number][] = [[55, "triangle", 0.10], [82.41, "sine", 0.08], [110, "sine", 0.04]];
    for (const [f, type, g] of voices) for (const det of [-4, 4]) {
      const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det;
      const og = this.ctx.createGain(); og.gain.value = g;
      o.connect(og).connect(this.filter); o.start();
    }
    for (const f of [880, 1318.51, 1760]) {
      const o = this.ctx.createOscillator(); o.frequency.value = f; o.connect(this.shimmer); o.start();
    }
    this.shimmer.gain.value = 0; this.shimmer.connect(this.reverb);
    const s = this.ctx.createOscillator(); s.frequency.value = 41.2; s.connect(this.sub); s.start();   // alt ses (E1)
    this.sub.gain.value = 0; this.sub.connect(this.master);
    const noise = this.ctx.createBufferSource(); noise.buffer = makeNoise(this.ctx, 2); noise.loop = true;
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 350; bp.Q.value = 0.8;
    noise.connect(bp).connect(this.whoosh); noise.start();
    this.whoosh.gain.value = 0; this.whoosh.connect(this.master);
  }

  async start() { await this.ctx.resume(); this.master.gain.setTargetAtTime(0.5, this.ctx.currentTime, 1.5); }

  setProgress(q: number) {                                   // Perde 1 ve 3
    const t = this.ctx.currentTime;
    this.filter.frequency.setTargetAtTime(320 + 1800 * q * q, t, 0.15);
    this.shimmer.gain.setTargetAtTime(q > 0.6 ? 0.025 * (q - 0.6) / 0.4 : 0, t, 0.3);
  }

  setFlight(z: number, speed: number) {                      // Perde 2
    const t = this.ctx.currentTime, k = Math.min(1, Math.max(0, (z - 4) / 15));
    this.filter.frequency.setTargetAtTime(900 - 400 * k, t, 0.3);
    const s = Math.min(1, Math.max(0, (z - 13) / 6));
    this.sub.gain.setTargetAtTime(0.08 * s * s * (3 - 2 * s), t, 0.5);
    this.wet.gain.setTargetAtTime(0.35 + 0.25 * k, t, 0.5);
    this.whoosh.gain.setTargetAtTime(0.06 * Math.min(1, Math.abs(speed) / 0.8), t, 0.1);
  }

  chime() {                                                   // durak kartı
    const t = this.ctx.currentTime;
    for (const f of [523.25, 783.99]) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.value = f; g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.035, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
      o.connect(g).connect(this.reverb); o.start(t); o.stop(t + 2.6);
    }
  }

  swell() {
    const g = this.master.gain, t = this.ctx.currentTime;
    g.setTargetAtTime(0.8, t, 0.7);
    g.setTargetAtTime(0.55, t + 2, 2.0);
  }
}

function makeImpulse(ctx: AudioContext, seconds: number, decay: number) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

function makeNoise(ctx: AudioContext, seconds: number) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}
```

| Olay | Ses |
|---|---|
| Başla | master 0 → 0,5 (1,5 sn) |
| Perde 1 ilerlemesi q | filtre 320 → 2.120 Hz; q > 0,6'da parıltı |
| Kilit | `swell()` |
| Kalkış | filtre 2.120 → 900 Hz (1,5 sn) |
| Perde 2 | `setFlight(z, v)` her karede; durakta `chime()` |
| A3_LAND | `swell()` |
| A3_LIGHTS | `setProgress(q)` q 1 → 0; sonda master 6 sn'de 0,3'e |
| `M` | master hedefi 0 ↔ önceki değer |

AudioContext yalnızca kullanıcı etkileşiminden sonra başlar ("Başla" düğmesi). iPhone'da sessiz anahtarı açıksa ses gelmeyebilir; demodan önce kontrol et.

### 6.9 Arayüz, i18n, tipografi, bilim paneli

**Fontlar (kendi sunucunda, OFL lisanslı):** şiirsel satırlar için "Fraunces", arayüz ve sayılar için "Inter" (`font-variant-numeric: tabular-nums`). Türkçe karakterleri test et: `ğĞüÜşŞıİöÖçÇ`. Eksik glif varsa "Cormorant Garamond" / "Source Sans 3" dene. Yunan harfleri (α, η, π³) yıldız adlarında geçer; Inter bunları içerir, yedek fontu da kontrol et.

**Tasarım belirteçleri:**

```css
:root {
  --bg: #02040A;
  --text: rgba(232, 236, 245, .92);
  --muted: rgba(154, 166, 191, .85);
  --accent: #8FB8FF;
  --badge-bg: rgba(255, 255, 255, .06);
  --badge-border: rgba(255, 255, 255, .18);
  --font-display: "Fraunces", Georgia, serif;
  --font-ui: "Inter", system-ui, sans-serif;
  --size-hero: clamp(28px, 5vw, 56px);
  --size-body: clamp(15px, 2.2vw, 20px);
  --size-count: clamp(44px, 9vw, 104px);
  --size-small: clamp(11px, 1.4vw, 13px);
  --fade: 700ms;
  --ease: cubic-bezier(.22, .61, .36, 1);
}
```

- Gökyüzü üstündeki metne `text-shadow: 0 1px 12px rgba(0,0,0,.6)`.
- Neon yok, animasyon ölçülü, her yıldızın üstünde isim yok.
- Perde 2 düzeni (dikey telefon): sol üst ışık sayacı · sağ kenar cetvel · alt orta kart · en altta "Geri" / "İleri" (64 px, başparmak erişimi) ve ortada "Geriye bak". Yatayda düğmeler sağ alt köşede toplanır.
- **Türkçe büyük harf:** `<html lang="tr">` + CSS `text-transform: uppercase` doğru çalışır; JS'te `toLocaleUpperCase("tr-TR")`. Yanlış örnek: "SIMÜLASYON".
- **i18n:** `t(key, vars)`; `?lang=en` gelince `document.documentElement.lang = "en"`.
- **format.ts:** `fmtInt` → `Intl.NumberFormat("tr-TR")` ("3.189") veya `"en-US"` ("3,189"); `fmtDec(n, d)` → "1,24" / "1.24"; tarih `Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: meta.tz })` → "29 Kasım 2026"; `fmtLightTime` (§3.10); `trLocative` (§3.11).
- **"Bu gece" mi?** `meta.time_local` tarihi, Europe/Istanbul saatine göre bugünün tarihiyle aynıysa `act1.now.tonight`, değilse `act1.now.date` metni.

**Bilim paneli (`D` tuşu, sol üstteki tarih satırına üç kez dokunma ya da `?debug=1`):**
- Göstergeler: fps, DPR, `maxTextureSize`, durum, p/q, SQM, zenit m_lim, CPU sayımı, meta zaman/konum/Ay; jiroskop modu ve alpha/beta/gamma, bakılan alt/az; Perde 2'de z, D (km ve ışık yılı), ışık süresi, katman ağırlıkları, `uMLim`, en yakın yıldız ve uzaklığı.
- Canlı kaydırıcılar: `uBaseSize`, `uMaxSize`, `uFlyByMax`, `uRefMag`, `uIntensity`, `uMWGain`, `sqm_city` (yalnızca soru-cevap için geçici), `extinction_k`, `vMax`, galaksi parçacık boyutu.
- "İsimleri göster" anahtarı (mag < 2 yıldızlar ve gezegenler).
- "Değerleri kopyala": ayarları JSON olarak panoya kopyalar; sonra koda yazılır.

### 6.10 Performans ve yedek yollar

- DPR en fazla 2. Perde 1'in ilk 2 saniyesinde ortalama fps 40'ın altındaysa: DPR 1, galaksi ve Yerel Grup telefon sayılarına iner.
- Telefonda 2k Samanyolu ve 4k Dünya dokusu.
- Bütün geometri ve malzemeler yükleme sırasında bir kez kurulur; **hiçbir karede yeni geometri veya malzeme oluşturma**. Galaksi ve Yerel Grup parçacıkları `requestIdleCallback` ile Perde 1 sırasında üretilebilir.
- `catalog_detail.json` Perde 1 başladıktan sonra arka planda yüklenir; Keşif'e girildiğinde hâlâ gelmediyse kart yalnızca sky.json'daki satırlarla açılır.
- Keşif'te en yakın yıldız döngüsü her karede (15.598 nokta, ~0,1 ms); alt bant ve görev kontrolleri 250 ms'de bir.
- Etiket izdüşümü yalnızca 8 yıldız için her karede; dokunma seçimi yalnızca dokununca.
- `visibilitychange` ile döngüyü ve sesi duraklat/sürdür.
- Wake Lock: "Başla"da iste, sayfa yeniden görünür olunca tekrar iste.
- WebGL yoksa: statik yedek görüntü (`preview_landscape` PNG'si public'e kopyalanır) + kısa açıklama.
- `prefers-reduced-motion`: boşta nefes yok, kalkış ve dönüş kısa, `goTo` süreleri yarıya iner; yalnızca yumuşak geçişler.

### 6.11 Etiketleme, gizlilik, güvenlik

**Ekran etiketleri (zorunlu):**
- Perde 1 ve 3 (gökyüzü): "SİMÜLASYON · gerçek yıldız konumları, tahmini görünürlük" (sürekli).
- Perde 2: Dünya "Uydu verisinden bileşik görüntü · NASA Black Marble 2016"; Güneş Sistemi "Yörüngeler daire olarak çizildi · gezegenler büyütüldü"; yıldızlar "Gerçek konumlar · Hipparcos uzaklıkları" ve gerektiğinde "Pozlama artırıldı"; Samanyolu "Temsili çizim · Güneş'in konumu ve galaksinin yönü gerçek"; Yerel Grup "Temsili çizim · yön ve uzaklık gerçek"; ışık çizgisi "Süre ölçekli değil".
- Uzak yıldız yılları "~" ile (§3.11).

**Gizlilik:**
- Doğum yılı ve cihaz yönelimi yalnızca bellekte işlenir; kaydedilmez, ağdan gönderilmez.
- Analitik yok, çerez yok, çalışma anında dış istek yok (opsiyonel AI hariç; o da doğum yılı ya da ondan türeyen hiçbir bilgiyi göndermez, §7).

**Güvenlik:** Saniyede 3'ten fazla yanıp sönme yok. Yakın yıldız geçişinde parlaklık ani değil, en az 0,5 sn'de artar. Güneş'e bakmayı öneren hiçbir metin yok.

### 6.12 Keşif uygulaması (`scenes/explore.ts`)

**Yeniden kullanılanlar:** ölçek katmanları, yıldız uçuş malzemesi, galaksi ve Yerel Grup, kartlar için §6.5.6'daki dokunma seçimi, Perde 1 sahnesi (Ev).

**Serbest kamera (`science/freeFlight.ts`):** konum `C` (ışık yılı, three.js çerçevesi, JS float64), yönelim `q`. Katmanlara verilen ana konum `C · LY_KM` km; `z = log10(|C| · LY_KM)` katman ağırlıkları ve pozlama için (§6.5.1, §3.8) aynen kullanılır.

```ts
/** Bulunduğun yerin "yerel ölçeği": en yakın yıldız, ev ve galaksilere uzaklığın en küçüğü (ışık yılı). */
export function localScaleLy(C: THREE.Vector3, starPos: Float64Array, homeLy = 0): number {
  let best = Math.max(C.length(), 1e-9);                       // eve (Güneş'e) uzaklık
  for (let i = 0; i < starPos.length; i += 3) {
    const dx = starPos[i] - C.x, dy = starPos[i + 1] - C.y, dz = starPos[i + 2] - C.z;
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 < best * best) best = Math.sqrt(d2);
  }
  return best;                                                  // galaksiler için çağıran taraf min alır
}

/** İleri hız (ışık yılı/sn): yerel ölçekle orantılı, sınırlı. */
export const cruiseSpeed = (scaleLy: number, throttle: number) =>
  throttle * Math.min(5e5, Math.max(1e-7, 0.6 * Math.max(scaleLy, 1e-6)));
```

- 15.598 yıldızın döngüsü her karede ~0,1 ms; ızgara gerekmez. Galaksiler için `min(scale, |C − galaksi| − çizim yarıçapı)`.
- Hızın ani değişmemesi için hedefe `τ = 0,4 sn` ile yaklaş (§6.5.3'teki gibi). Bir yıldızın 0,02 ışık yılından yakınına girilmez (itme: hız bileşeni o yıldıza doğruysa sıfırlanır).

**Buraya uç (`flyToStar`):**

```ts
export function flyPlan(C0: THREE.Vector3, target: THREE.Vector3, endLy = 0.05) {
  const dir = C0.clone().sub(target);                          // hedeften kameraya
  const d0 = Math.max(dir.length(), endLy * 1.01);
  dir.normalize();
  const dur = Math.min(7, Math.max(2, 1.5 + 0.6 * Math.log10(d0 / endLy)));
  /** s ∈ [0,1] için konum: uzaklık logaritmik olarak azalır */
  const at = (s: number, out = new THREE.Vector3()) => {
    const e = s < 0.5 ? 4 * s ** 3 : 1 - (-2 * s + 2) ** 3 / 2;
    const d = d0 * Math.pow(endLy / d0, e);
    return out.copy(target).addScaledVector(dir, d);
  };
  return { dur, at };
}
```

- İlk 0,8 sn kamera hedefe döner (slerp), sonra `at(s)` ile uçar. Uçuş sırasında kart kapanır, sayaç akar; dokunuş uçuşu durdurur.
- Galaksilere "Buraya uç" için `endLy = çizim yarıçapı × 2,5`.
- **Eve bak:** `q`'yu `C`'den orijine bakacak şekilde 1,2 sn'de çevirir. **Eve uç:** `flyPlan(C, 0, 1e-4)` ve z < 6'da Perde 1 sahnesine geçiş.

**Güneş işareti:** orijinin ekran izdüşümü; ekrandaysa 14 px halka + "Güneş", değilse ekran kenarında ok (A3_LAND'deki yön oku kodu, §6.6). `m☉ > 6,5` olduğunda halka kesikli çizgiye döner ("görünmez").

**Alt bant:** her 250 ms'de güncellenir (her karede değil): `|C|` → "Buradan bakan biri Dünya'yı {yıl_de} olduğu haliyle görür" (`lightLeft(|C|)`, §3.11; `|C| < 0,01` ışık yılıysa gösterme) ve "Güneş buradan: {m☉} kadir, {durum}".

**Bilgi kartı (`ui/card.ts`):** alttan açılan panel (dikeyde ekranın %45'i, yatayda sağda 380 px). Başlık (ad + takımyıldız), §3.16 satırları, varsa merak notu (§8.2) ve kaynak bağlantısı (`target="_blank" rel="noopener"`, yalnızca çevrimiçiyken). Düğmeler: Buraya uç · Işığını izle (§6.5.6 ışık çizgisi) · Paylaş · Kapat. Kart, seçilen yıldızın etrafında halka gösterir.

**Ara (`ui/search.ts`):** `names` + "Andromeda", "Üçgen Gökadası", "Ülker", "Güneş", "Voyager 1". Eşleştirme: küçük harf + Türkçe/aksan katlama (`ı→i, İ→i, ğ→g, ü→u, ş→s, ö→o, ç→c`, Yunan harfleri Latin adlarıyla da aranır: "eta cas" → η Cas). En fazla 8 sonuç, parlaklığa göre sıralı.

**Git menüsü (`ui/jumpMenu.ts`):** sabit liste (§2.6). Her öğe `{ label, target: hip | "home" | "solar" | "galaxyOut" | galaxyKey | "birth" }`. "Ülker" Alcyone'a (HIP 17702) uçar. "Samanyolu'nun dışı" §3.10'daki 10. durak konumuna.

**Görevler (`ui/missions.ts`):** §2.6 tablosu. Her görev `{ id, check(state): boolean }`; kontrol her 250 ms'de. Tamamlanınca: `drone.chime()`, 4 sn'lik not, ★ sayacı. `localStorage["bts.missions"]` (JSON dizi). "Görevleri sıfırla" bilim panelinde.

**Takımyıldız çizgileri:** §6.5.5'teki `LineSegments`; Keşif'te anahtarla açılır/kapanır, z sınırı yok. Büyükayı eklendi (§5.2).

**Paylaş (`ui/share.ts`):** `renderer.render(...)` çağrısının hemen ardından aynı karede `canvas.toBlob` (ya da `preserveDrawingBuffer: true` kullanmadan çalışsın diye çizimi bir kez daha yapıp hemen al). Altına 48 px'lik bir şerit: kısa metin + "Beyond the Sky". `navigator.share({ files, text })` destekleniyorsa onu, değilse indirme bağlantısını kullan.

**Kenar durumları:**
- Uzaklığı bilinmeyen yıldızda "Buraya uç" yok.
- Gezegenlere dokunma Keşif'te yalnızca Güneş Sistemi ölçeğinde (z < 11); kart: ad, Ankara'dan uzaklık, ışık süresi.
- Kullanıcı 60 sn hiçbir şey yapmazsa (Keşif'te) yalnızca bir kez "Bir yıldıza dokun" ipucu; otomatik hareket yok.

---

## 7. (Opsiyonel) AI kapanış cümlesi

**Ne zaman:** En sonda, istersen (M9). Deneyim AI olmadan eksiksizdir.

**Amaç:** O oturumun sayılarıyla en fazla 2 cümlelik bir kapanış. **Hiçbir sayı AI'dan gelmez**; AI yalnızca verilen sayılarla cümle kurar. **Doğum yılı ve doğum yıldızı gönderilmez** (yıldızın yılı doğum yılını ele verir).

**Mimari:** GitHub Pages sunucu kodu çalıştırmaz. AI açılırsa Vercel'e geç: proje kökü `web/`, fonksiyon `web/api/closing.ts`, ortam değişkeni `AI_API_KEY`. **Anahtar asla istemciye gitmez.**

**İstek (istemciden):** `POST /api/closing` gövdesi:

```json
{ "lang": "tr", "place": "Ankara", "place_ablative": "Ankara'dan", "date": "29 Kasım 2026",
  "stars_city": "111", "stars_dark": "3.189", "andromeda_light": "2,5 milyon yıl" }
```

Sayılar istemcide biçimlendirilip metin olarak gönderilir; doğrulama da bu metinlerle yapılır.

**Fonksiyon:** İstek sunucudan, seçilen dil modeli sağlayıcısının API'sine aşağıdaki sistem metniyle gönderilir (en fazla ~120 token, 3,5 sn zaman aşımı). Yanıt, doğrulamadan geçmeden gösterilmez.

```ts
const SYSTEM = `Sen "Beyond the Sky" deneyiminin kapanış anlatıcısısın. Sana JSON olarak verilen yer adını,
tarihi ve sayıları kullanarak en fazla 2 cümlelik, sakin ve şiirsel bir kapanış yaz.
Kurallar: JSON'da olmayan hiçbir sayı, isim, tarih veya bilimsel iddia ekleme. Sayıları JSON'daki
yazımıyla aynen kullan. Ünlem kullanma, abartma. Dil: JSON'daki "lang".`;
```

**Doğrulama (sunucuda):**
- Metindeki bütün sayılar (`/\d[\d.,]*/g`) istekteki sayı metinlerinden birinin içinde geçmeli; değilse şablona dön.
- En fazla 280 karakter, en fazla 2 cümle.
- 3,5 sn içinde yanıt yoksa ya da hata varsa şablona dön.

**Şablon (her zaman hazır):**
- TR: "Bu gece {place_ablative} {stars_city} yıldız görünüyordu; aslında {stars_dark} tanesi oradaydı. Başının üstündeki galaksinin ışığı {andromeda_light} yol aldı ve yine de geldi."
- EN: "Tonight, {stars_city} stars were visible from {place}; {stars_dark} were really there. The light of the galaxy above your head traveled {andromeda_light} and still arrived."

**İstemci:** İsteği A3_RETURN başlarken gönder; kapanışta hazır olsun. 3,5 sn içinde gelmezse şablonu göster. Ekranda küçük not: "Bu cümleyi AI yazdı; sayılar hesaplamadan geldi."

---

## 8. Metin destesi (TR / EN)

`{...}` alanları çalışma anında doldurulur. Yıl ekleri `trLocative` ile üretilir (§3.11): `{yıl_de}` = "2007'de".

**Genel ve Perde 1**

| Anahtar | Türkçe | English |
|---|---|---|
| `loading` | Yükleniyor %{n} | Loading {n}% |
| `intro.place` | {place} · {date} · {time} | {place} · {date} · {time} |
| `intro.title` | Başını kaldır. | Look up. |
| `intro.start` | Başla | Begin |
| `intro.sound` | Sesli deneyim · kulaklık önerilir | Best with sound · headphones recommended |
| `act1.now.tonight` | {place_ablative} bu gece görebileceğin gökyüzü bu. | This is tonight's sky as seen from {place}. |
| `act1.now.date` | {place_ablative} {date} gecesi görebileceğin gökyüzü bu. | This is the sky you could see from {place} on {date}. |
| `act1.raise` | Telefonu gökyüzüne kaldır. | Raise your phone to the sky. |
| `act1.drag` | Etrafa bakmak için sürükle. | Drag to look around. |
| `act1.hold` | Işıkları söndürmek için basılı tut | Press and hold to turn off the lights |
| `act1.count` | {n} yıldız | {n} stars |
| `act1.badge` | SİMÜLASYON · gerçek yıldız konumları, tahmini görünürlük | SIMULATION · real star positions, estimated visibility |
| `act1.reveal1` | Hep oradaydılar. | They were always there. |
| `act1.reveal2` | {n} yıldız. Ve Samanyolu. | {n} stars. And the Milky Way. |
| `act1.up` | Yukarı çık | Go up |
| `common.next` | Devam | Continue |
| `gyro.on` | Jiroskop açık | Motion on |
| `gyro.off` | Jiroskop kapalı | Motion off |
| `gyro.fixNorth` | Kuzeyi düzeltmek için yana sürükle | Drag sideways to fix north |

**Perde 2**

| Anahtar | Türkçe | English |
|---|---|---|
| `act2.light` | Işığın {place_ablative} buraya ulaşması | Light from {place} to here |
| `act2.forward` | İleri | Forward |
| `act2.backward` | Geri | Back |
| `act2.lookBack` | Geriye bak | Look back |
| `act2.hint` | İleri'ye basılı tut | Hold Forward |
| `act2.exposure` | Pozlama artırıldı | Exposure boosted |
| `act2.label` | {name} · {dist} ışık yılı · ışığı {yıl_de} yola çıktı | {name} · {dist} light-years · its light left in {year} |
| `act2.label.approx` | {name} · ~{dist} ışık yılı · ışığı ~{yıl_de} yola çıktı | {name} · ~{dist} light-years · its light left around {year} |
| `act2.label.bc` | {name} · ~{dist} ışık yılı · ışığı MÖ ~{bc} civarında yola çıktı | {name} · ~{dist} light-years · its light left around {bc} BC |
| `act2.label.nodist` | {name} · uzaklığı ölçülemedi | {name} · distance not measured |
| `act2.ray` | Süre ölçekli değil | Not to scale in time |
| `stop.earth` | Az önce söndürdüğün ışıklar, uzaydan böyle görünüyor. | The lights you just turned off, seen from space. |
| `stop.earth.cap` | Uydu verisinden bileşik görüntü · NASA Black Marble 2016 | Composite of satellite data · NASA Black Marble 2016 |
| `stop.moon` | Ay. Oradan bakan biri seni {d} saniye geç görürdü. | The Moon. Someone there would see you {d} seconds late. |
| `stop.sun` | Güneş. Işığı Dünya'ya {t_de} ulaşır. | The Sun. Its light reaches Earth in {t}. |
| `stop.neptune` | Neptün, Güneş Sistemi'nin en dış gezegeni. Işık buraya {t_de} geliyor. | Neptune, the outermost planet. Light gets here in {t}. |
| `stop.voyager` | 18 Kasım 2026: Voyager 1, bir ışık-günü uzaklığa ulaşan ilk insan yapımı nesne oldu. {years} yıl sürdü. | November 18, 2026: Voyager 1 became the first human-made object one light-day away. It took {years} years. |
| `stop.nearest` | En yakın yıldız bu kadar uzakta. Voyager'ın hızıyla ~{n} yıl. | The nearest star is this far. At Voyager's speed: ~{n} years. |
| `stop.achird` | İlk yıldızın yanından geçiyorsun: {name}. Işığı {yıl_de} yola çıktı. | You are passing your first star: {name}. Its light left in {year}. |
| `stop.cas` | Kraliçe'nin içindesin. W şeklini oluşturan beş yıldız aslında 55 ile 550 ışık yılı arasına dağılmış. Bu şekil yalnızca Dünya'dan bakınca var. | You are inside Cassiopeia. Its five W stars are spread between 55 and 550 light-years. The shape only exists from Earth. |
| `stop.bubble` | Işıkları söndürünce gördüğün yıldızların yaklaşık yarısı bu kürenin içinde. Yarıçapı {r} ışık yılı. | About half of the stars you saw with the lights off are inside this sphere. Its radius is {r} light-years. |
| `stop.galaxy` | Samanyolu. Yüz milyarlarca yıldız. Işık bir ucundan öbürüne ~100.000 yılda gider. | The Milky Way. Hundreds of billions of stars. Light crosses it in ~100,000 years. |
| `stop.galaxy.here` | Buradasın | You are here |
| `stop.galaxy.guess` | Güneş nerede? Tahminine dokun. | Where is the Sun? Tap your guess. |
| `stop.galaxy.guessResult` | Tahminin Güneş'e {n} ışık yılı uzaktaydı. | Your guess was {n} light-years from the Sun. |
| `stop.m31` | Andromeda. Işıkları söndürdüğünde {where} o soluk leke buydu. Işığı 2,5 milyon yıl önce yola çıktı. | Andromeda. The faint smudge {where} when you turned off the lights. Its light left 2.5 million years ago. |
| `stop.m31.where.zenith` | başının tam üstündeki | right above your head |
| `stop.m31.where.high` | gökyüzündeki | in your sky |
| `stop.m31.where.low` | ufka yakın | near the horizon |
| `act2.toBirth` | Eve dönmeden önce | Before going home |
| `label.earth` | Uydu verisinden bileşik görüntü · NASA Black Marble 2016 | Composite of satellite data · NASA Black Marble 2016 |
| `label.solar` | Yörüngeler daire olarak çizildi · gezegenler büyütüldü | Orbits drawn as circles · planets enlarged |
| `label.stars` | Gerçek konumlar · Hipparcos uzaklıkları | Real positions · Hipparcos distances |
| `label.galaxy` | Temsili çizim · Güneş'in konumu ve galaksinin yönü gerçek | Illustration · the Sun's position and the galaxy's orientation are real |
| `label.localGroup` | Temsili çizim · yön ve uzaklık gerçek | Illustration · direction and distance are real |

`stop.m31.where.*` seçimi M31'in yüksekliğine göre: > 80° `zenith`, 30–80° `high`, 0–30° `low`. M31 ufkun altındaysa cümlenin ilk kısmı yerine "Bu gece ufkun altındaydı." kullanılır.

**Perde 3 ve kapanış**

| Anahtar | Türkçe | English |
|---|---|---|
| `act3.ask` | Hangi yıl doğdun? | What year were you born? |
| `act3.show` | Göster | Show me |
| `act3.skip` | Atla | Skip |
| `act3.private` | Bu bilgi cihazında kalır. | This stays on your device. |
| `act3.yourStar` | Senin yıldızın: {name} | Your star: {name} |
| `act3.match` | {name}. Işığı sen doğduğun yıl, {yıl_de} yola çıktı. Bu gece {place}'ya varıyor. | {name}. Its light left the year you were born, {year}. It arrives in {place} tonight. |
| `act3.nearest` | {name}. Işığı {yıl_de} yola çıktı; doğduğun yıla en yakın yıldız bu. Bu gece {place}'ya varıyor. | {name}. Its light left in {year}, the closest to your birth year. It arrives in {place} tonight. |
| `act3.below` | Senin yıldızın şu an ufkun altında, {dir} tarafında. Işığı yine de bu gece Dünya'ya varıyor. | Your star is below the horizon right now, toward the {dir}. Its light still reaches Earth tonight. |
| `act3.tooYoung` | Senin doğduğun yıl yola çıkan ışık henüz görünen hiçbir yıldızdan gelmedi. En yakını Sirius: ışığı 8,6 yılda geliyor. | Light that left the year you were born hasn't arrived from any visible star yet. The closest is Sirius: its light takes 8.6 years. |
| `act3.turn` | Telefonu ona çevir. | Turn your phone toward it. |
| `act3.lights` | Işıklar yandı. Onlar hâlâ orada. | The lights are back on. They are still there. |
| `dir.n` … `dir.nw` | kuzey, kuzeydoğu, doğu, güneydoğu, güney, güneybatı, batı, kuzeybatı | north, northeast, east, southeast, south, southwest, west, northwest |
| `outro.line1` | Onlar hâlâ orada. | They are still there. |
| `outro.line2` | The universe is closer than you think. | The universe is closer than you think. |
| `outro.restart` | Baştan başla | Start over |
| `outro.sources` | Kaynaklar ve notlar | Sources & notes |
| `credits.privacy` | Doğum yılın ve telefonunun yönü cihazından çıkmadı. | Your birth year and phone orientation never left your device. |
| `fallback.webgl` | Bu deneyim WebGL gerektiriyor. Güncel bir tarayıcıda açmayı dene. | This experience needs WebGL. Try a current browser. |

Notlar:
- `{place}'ya` yönelme eki "Ankara" için doğru ("Ankara'ya"). Konum değişirse `config.location.name_dative` ekle (ör. "İzmir'e").
- `{t_de}`: `fmtLightTime` sonucu + bulunma eki, son kelimeye göre: saniye → "saniyede", dakika → "dakikada", saat → "saatte", gün → "günde", yıl → "yılda". Örnek: "8 dakika 12 saniyede", "4 saat 5 dakikada". Küçük bir yardımcıyla yap ve test et.

**Keşif**

| Anahtar | Türkçe | English |
|---|---|---|
| `explore.enter` | Keşfet | Explore |
| `explore.watchStory` | Hikâyeyi izle | Watch the story |
| `explore.skipToExplore` | Keşfe geç | Go to Explore |
| `explore.tip.look` | Sürükleyerek bak | Drag to look around |
| `explore.tip.fly` | İleri'ye basılı tutarak uç | Hold Forward to fly |
| `explore.tip.tap` | Bir yıldıza dokun | Tap a star |
| `explore.homeView` | Buradan bakan biri Dünya'yı {yıl_de} olduğu haliyle görür. | Someone here would see Earth as it was in {year}. |
| `explore.sunHere` | Güneş buradan: {m} kadir, {state} | The Sun from here: magnitude {m}, {state} |
| `explore.sun.easy` | kolayca görünür | easy to see |
| `explore.sun.dark` | yalnızca karanlık gökte görünür | visible only under dark skies |
| `explore.sun.none` | çıplak gözle görünmez | invisible to the naked eye |
| `explore.lookHome` | Eve bak | Look home |
| `explore.flyHome` | Eve uç | Fly home |
| `explore.search` | Yıldız ara | Search stars |
| `explore.jump` | Git | Go to |
| `explore.missions` | Görevler | Missions |
| `explore.lines` | Takımyıldız çizgileri | Constellation lines |
| `card.flyHere` | Buraya uç | Fly here |
| `card.traceLight` | Işığını izle | Trace its light |
| `card.share` | Paylaş | Share |
| `card.close` | Kapat | Close |
| `card.dist` | {dist} ışık yılı · ışığı {yıl_de} yola çıktı | {dist} light-years · its light left in {year} |
| `card.sunFromThere` | Oradan Güneş: {m} kadir, {state} | The Sun from there: magnitude {m}, {state} |
| `card.lum.brighter` | Görünür ışıkta Güneş'ten {n} kat parlak | {n} times brighter than the Sun in visible light |
| `card.lum.fainter` | Görünür ışıkta Güneş'ten {n} kat sönük | {n} times fainter than the Sun in visible light |
| `card.temp` | Yüzey sıcaklığı ~{t} K ({color}) · Güneş ~5.800 K | Surface ~{t} K ({color}) · Sun ~5,800 K |
| `card.voyager` | Voyager 1'in hızıyla ~{n} yıl | ~{n} years at Voyager 1's speed |
| `card.tonight.city` | Bu gece Ankara'dan: şehirde bile görünür | Tonight from Ankara: visible even in the city |
| `card.tonight.dark` | Bu gece Ankara'dan: yalnızca ışıklar sönünce görünür | Tonight from Ankara: visible only with the lights off |
| `card.tonight.below` | Bu gece 21:00'de ufkun altında | Below the horizon tonight at 9 pm |
| `card.nodist` | Uzaklığı ölçülemedi | Distance not measured |
| `card.footer` | Hipparcos uzaklığına göre · parlaklık görünür ışıkta | Based on Hipparcos distance · brightness in visible light |
| `mission.done` | Görev tamamlandı | Mission complete |

Görev metinleri ve tamamlanma notları §2.6'daki tablodadır (EN çevirileri aynı anlamla).

### 8.2 Merak notları (elle yazılmış, kaynaklı)

Her not en fazla 3 cümle, kartın en altında, kaynak bağlantısıyla. **Yeni not eklerken kural:** yalnızca NASA, ESA ya da hakemli yayına dayanan bir kaynakla; kaynağı olmayan not eklenmez.

| Nesne (anahtar) | Not (TR) | Kaynak |
|---|---|---|
| Sirius (HIP 32349) | Sirius'un yanında, Dünya'dan küçük ama kütlesi Güneş'inkinin %98'i kadar olan bir beyaz cüce dolaşır: Sirius B. Sirius'tan bakan biri Güneş'i ikinci kadirden sıradan bir yıldız olarak görürdü. | [ESA: Weighing the Dog Star's companion](https://www.esa.int/Science_Exploration/Space_Science/Weighing_the_Dog_Star_s_companion) · [NASA: Hubble weighs Dog Star's companion](https://science.nasa.gov/missions/hubble/astronomers-use-hubble-to-weigh-dog-stars-companion/) |
| Vega (91262) | Yaklaşık 14.000 yıl önce kuzey kutup yıldızı Vega'ydı. Dünya'nın ekseni yavaşça yalpaladığı için yaklaşık 12.000 yıl sonra yeniden kutup yıldızı olacak. | [NASA: Summer Triangle Corner: Vega](https://science.nasa.gov/solar-system/summer-triangle-corner-vega/) |
| Polaris (11767) | Kutup yıldızı her zaman Polaris değildi ve olmayacak. Dünya'nın ekseni yaklaşık 26.000 yılda bir tur atarak gökyüzünde daire çizer. | [NASA APOD: When Vega is North](https://apod.nasa.gov/rjn/apod/ap150508.html) |
| Betelgeuse (27989) | Güneş'in yerinde olsaydı yüzeyi Jüpiter'in yörüngesini geçerdi. 2019–2020'de parlaklığının üçte ikisinden fazlasını kaybetti; Hubble, yıldızın yüzeyinden fırlattığı maddenin oluşturduğu toz bulutunun ışığı kapattığını buldu. | [NASA: Hubble finds Betelgeuse's dimming is due to a traumatic outburst](https://science.nasa.gov/missions/hubble-space-telescope/hubble-finds-that-betelgeuses-mysterious-dimming-is-due-to-a-traumatic-outburst) |
| Aldebaran (21421) | 1972'de fırlatılan Pioneer 10 kabaca Aldebaran yönünde ilerliyor. Oraya varması iki milyon yıldan fazla sürecek. | [NASA: Pioneer 10 Sends Last Signal](https://science.nasa.gov/missions/pioneer/pioneer-10-sends-last-signal/) |
| Algol (14576) | Adı Arapça "gulyabani" anlamına gelen bir sözcükten gelir. Aslında iki yıldızdır: her 2 gün 20 saat 49 dakikada bir sönük olan parlak olanın önünden geçer ve Algol gözle görülür şekilde söner. | [Britannica: Algol](https://www.britannica.com/place/Algol-star) · [Sky & Telescope: Algol](https://skyandtelescope.org/stargazing-and-observing/behold-algol-star-secret/) |
| Ülker / Alcyone (17702) | Ülker, yaklaşık 100 milyon yıl önce aynı gaz bulutundan doğmuş, bin kadar yıldızlık bir küme. Yani dinozorlar varken bu yıldızlar yeni doğmuştu. | [NASA: TESS triples size of Pleiades](https://svs.gsfc.nasa.gov/14928) · [NASA: Messier 45](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-45) |
| Andromeda (`m31`) | Uzun süre Samanyolu ile 4–5 milyar yıl içinde kesin çarpışacağı düşünüldü. 2025'te Hubble ve Gaia verisiyle yapılan bir çalışma, önümüzdeki 10 milyar yılda çarpışma olasılığını yaklaşık %50 buldu. | [ESA: Hubble and Gaia revisit fate of our galaxy](https://www.esa.int/Science_Exploration/Space_Science/Hubble_and_Gaia_revisit_fate_of_our_galaxy) |
| Voyager 1 (işaret) | Voyager 1 yaklaşık 40.000 yıl sonra, çıplak gözle görünmeyen kırmızı cüce Gliese 445'e Güneş'ten daha yakın olacak. | [NASA: Reaching for the stars](https://www.nasa.gov/image-article/reaching-stars) |

- "Ülker" notundaki "dinozorlar" ifadesi yaş aralığına dayanır (yaklaşık 100 milyon yıl; dinozorlar 66 milyon yıl öncesine kadar yaşadı). Bu cümleyi değiştirirsen yaşı koru.
- Notlar sürüm kontrollü bir dosyada durur: `web/src/content/cards.ts` (`{ key, tr, en, sources: [{ title, url }] }`).
- İngilizce çevirileri aynı anlamla yaz; yeni sayı ekleme.

---

## 9. Test planı

### 9.1 Python (`pytest -q`)

| Test | Beklenen |
|---|---|
| `nelm` değerleri | NELM(18,0) = 3,97 ± 0,01 · NELM(22,0) = 6,62 ± 0,01 · artan fonksiyon |
| `airmass` | X(90) = 1,000 ± 0,001 · X(30) = 1,994 ± 0,01 · X(0) = 37,9 ± 0,2 |
| Katalog | mag ≤ 7,0 → 15.598 satır (Güneş hariç); Güneş satırı yok; uzaklığı bilinmeyen 431 |
| Adlar | `display_name` örnekleri (§5.4); `bf` olan bütün satırlar çözümlenir; `None` dönen en fazla 29 |
| Zaman seçimi | `auto` sonucu: Ay < −10°, Güneş < −18°. 21.11.2026'dan başlarsa 29.11.2026 21:00 TSİ; `obs_year_frac` 2026,912 |
| Polaris | \|alt − enlem\| < 1° |
| Dönme matrisi | 1.000 rastgele yönde Astropy'ye göre en fazla 0,02° hata; det = 1 |
| 3D konum | uzaklığı bilinen bütün yıldızlarda `R @ (x, y, z)` ile `dly·enu(alt, az)` arası açı < 0,02°; \|xyz\| − dist < 0,01 pc |
| SVS yönü | En parlak 30 yıldızdan en az 24'ü parlak piksele düşer (§5.8) |
| Galaktik düzlem | \|b\| < 5° ortalaması, \|b\| > 40° ortalamasının en az 3 katı |
| Galaktik çerçeve | `gal_to_enu` ortonormal (hata < 1e-9); x ekseni galaktik merkezin Astropy alt/az'ıyla < 0,02° |
| Sayımlar | city < dark; SQM arttıkça sayım artar; 29.11.2026 için city = 111 ± 2, dark = 3.189 ± 10 |
| Uzaklık istatistiği | karanlık görünürlerde p50 = 390 ± 5, p95 = 1.426 ± 15 ışık yılı; uzaklıksız 73 ± 2 |
| Güneş Sistemi | Güneş 0,986 ± 0,002 AB; Ay ışık süresi 1,242 ± 0,002 sn; Neptün 29,46 ± 0,05 AB |
| Rota | û_cas alt 69,27 ± 0,1°, az 5,25 ± 0,2°; en yakın geçiş Achird 0,97 ± 0,05 ışık yılı; 0–800 ışık yılında 0,5'ten yakın geçiş yok |
| M31 | 29.11.2026 21:00'de alt 88,5 ± 0,2° |
| Disk normali | birim vektör; n̂ ile açısı = inclination ± 0,01° |
| Doğum tablosu | 1900–2026 her yıl için bir satır; 1946–2018 arası en az 70/73 yılda \|fark\| ≤ 1; 2007 → HIP 3821 (Achird); bütün seçilen yıldızların dec > −45,08° |
| Etiket yıldızları | 8 yıldızın hepsi alt > 10° |
| Yıldız rengi | Rigel mavimsi (b ≥ r), Aldebaran turuncu (r > b) |
| JSON | Şema alanları var, sayımlar yuvarlanmış değerlerden, boyut < 1 MB |
| Ayrıntı dosyası | `catalog_detail.json` satır sayısı = `stars.data` satır sayısı; Capella (HIP 24608) satırı `con = "Aur"`; boyut < 500 KB |
| Keşif sayıları | karanlık görünür ve uzaklığı bilinenlerin %99,3 ± 0,1'i M < 4,83; `dly > 955,9` olan karanlık görünür 380 ± 5; Alnilam 1.977 ± 5 ışık yılı; Büyükayı HIP'leri katalogda |

### 9.2 TypeScript (`npm test`)

| Test | Beklenen |
|---|---|
| `coords` | `dirFromAltAz(0,0) = (0,0,−1)` kuzey · `(0,90) = (1,0,0)` doğu · `(0,180) = (0,0,1)` · `(0,270) = (−1,0,0)` · `(90,·) = (0,1,0)` · ileri-geri dönüşüm hatası < 1e-9 · `enuToThree(1,0,0) = (1,0,0)`, `(0,1,0) = (0,0,−1)`, `(0,0,1) = (0,1,0)` |
| Dünya yönelimi | `earthQuaternionFor(Ankara)` → Ankara (0,1,0); Kuzey Kutbu (0; 0,6417; −0,7669); 1° doğusu x > 0 |
| Kadraj | vFOV 60 → alt0 ≈ 19,1° · vFOV 90 → alt0 ≈ 31,0° |
| `visibility` | Python ile aynı değerler (NELM, X) |
| **Eşlik** | `sky.json` → `countVisible(sqm_city, glow_city)` = `meta.counts.city`, `countVisible(sqm_dark, glow_dark)` = `meta.counts.dark` (en fazla 1 fark, açıklamalı) |
| `orientation` | §6.3'teki altı durum (Kuzey/Batı/Doğu/45°/aşağı/yatay tutuş) ve `headingToAlpha` |
| `flight` | `pathDir` sürekli (0,001 adımda ardışık açı < 0,5°); z ≤ 11'de tepe, 13–15,75'te û_cas, ≥ 16,6'da hedef · `baseLook` tablo değerleri · `apparentMag(m, d, d) = m`, `apparentMag(m, d, 10d) = m + 5` · `exposureLimit(15) = 6,62`, `exposureLimit(16,3) = 11,62` · `FlightControl`: throttle 1 ile 1 sn sonra z artmış, Z_MAX'ı geçmiyor, durak yakınında hız düşük, `goTo` süresinde hedefe varıyor |
| `format` | tr-TR "3.189", "1,24"; en-US "3,189", "1.24" · `toLocaleUpperCase("tr-TR")` "SİMÜLASYON" · `fmtLightTime`: 1,242 → "1,24 saniye", 492,2 → "8 dakika 12 saniye", 4,08 sa → "4 saat 5 dakika", 1 ışık-günü → "1 gün", 2,5e6 yıl → "2,5 milyon yıl"; İngilizce karşılıkları |
| `years` | `lightLeft`: Vega 25,04 → 2001 kesin; Polaris 432,6 → ~1590; Deneb 1.411,9 → ~600; 3.166,6 → MÖ 1101 · `trLocative`: §3.11'deki 14 örnek · `findBirthStar`: 2007 → Achird "match"; 2019 → "tooYoung"; olmayan yıl → "none" |
| `facts` | Sirius'tan m☉ = 1,94 ± 0,01; Vega'dan 4,26; 70,4 ışık yılında 6,50 · L: Sirius 22, Vega 49, Achird 1,3 · Güneş B−V 0,65 → 5.778 K · Voyager: 8,6 ışık yılı → ~152.000 yıl · tür: "G0V" → V, "K5III" → III, "M1: comp" → gösterme · `CON_TR.Cas = "Kraliçe"` |
| `freeFlight` | `cruiseSpeed` sınırları (1e-7 … 5e5) · `flyPlan`: s = 0'da başlangıç, s = 1'de hedefe `endLy` uzaklık, uzaklık monoton azalır, süre 2–7 sn · `localScaleLy` tek yıldızlı yapay veride doğru |
| `missions` | 7 görevin her biri için tamamlanma koşulu (sınırın iki yanında) |
| `search` | "ulker" → Ülker, "SIRIUS" → Sirius, "eta cas" → η Cas |

### 9.3 Elle kontrol listesi

**Cihazlar:** iPhone (Safari), Android (Chrome), masaüstü (Chrome, Firefox, Safari), projektör 1920×1080.

- [ ] Yükleme çubuğu ilerliyor, fontlar Türkçe karakterleri ve Yunan harflerini doğru gösteriyor.
- [ ] iPhone'da "Başla" jiroskop iznini soruyor; izin verilince telefonu çevirmek gökyüzünü çeviriyor; reddedince sürükleme çalışıyor.
- [ ] Telefonun pusulasıyla bilinen bir yöne dönünce Perde 1'de az değeri tutuyor (± 10°); tutmuyorsa "Kuzeyi düzelt" çalışıyor.
- [ ] Basılı tutunca yıldızlar parlaktan sönüğe doğru beliriyor; bırakınca geri gidiyor; iPhone'da uzun basınca menü/büyüteç çıkmıyor.
- [ ] Karanlıkta tepede Andromeda lekesi soluk ama seçilebiliyor.
- [ ] Kilitlenince sayaç `meta.counts.dark` ile aynı.
- [ ] Kalkış takılmadan Dünya'ya geçiyor; Ankara aşağıda, kuzey ekranın üstünde.
- [ ] İleri/geri, pinch, tekerlek ve klavye çalışıyor; durakta yavaşlıyor; kart ve zil geliyor.
- [ ] Achird yakından geçerken parlaklık yumuşakça artıyor, ekran patlamıyor.
- [ ] Kraliçe çizgileri uzayıp şekil bozuluyor; 9 ve 10. duraklarda kamera kendiliğinden geri dönüyor.
- [ ] Galaksi ve Andromeda görünüyor; "Temsili" etiketleri ve "Pozlama artırıldı" var.
- [ ] Yıldıza dokununca kart ve ışık çizgisi geliyor.
- [ ] `?born=2007` ile Achird; `?born=2020` ile "henüz" metni; ufkun altındaki yıldızda yön metni.
- [ ] A3_LAND'de jiroskopla yıldızı bulma ve yön oku çalışıyor; ışıklar yanınca halka kalıyor.
- [ ] Dikey ↔ yatay döndürme deneyimin ortasında bozmuyor.
- [ ] Ağ kapalıyken (yükledikten sonra) baştan sona çalışıyor.
- [ ] Kısayollar ve sunum kumandası (`PageDown`/`PageUp`) çalışıyor; `?presenter=1` otomatik geçişi kapatıyor; `?autoplay=1` baştan sona oynuyor.
- [ ] Projektörde 60 fps, telefonda en az 30 fps (bilim paneli), Perde 2'nin en kalabalık anında (durak 10–11) dahil.
- [ ] Sessiz modda iPhone: ses durumu biliniyor.
- [ ] `prefers-reduced-motion` açıkken hareketler sakin.
- [ ] Telefonda dev sunucuyla jiroskop testi `npm run dev:https` ile (HTTP'de sensör izni çalışmaz).
- [ ] Keşif: kapanıştaki "Keşfet" ve girişteki "Keşfe geç" çalışıyor; ipuçları bir kez çıkıyor.
- [ ] Herhangi bir yıldıza dokunma → kart; "Buraya uç" yumuşak; Aldebaran'da alt bant "1960'ta olduğu haliyle".
- [ ] Arama, Git menüsü, Eve bak/uç, takımyıldız anahtarı çalışıyor; Ev seçeneği Perde 1 gökyüzüne iniyor.
- [ ] 7 görev tamamlanabiliyor; sayfa yenilenince ilerleme duruyor.
- [ ] Paylaş telefonda paylaşım menüsünü açıyor, masaüstünde görüntüyü indiriyor; görüntü siyah değil.
- [ ] Merak notlarındaki kaynak bağlantıları açılıyor.

---

## 10. Yayınlama

**GitHub Pages:**
1. Pipeline çıktıları (`web/public/data/`) git'e girer; CI Python çalıştırmaz.
2. Repo Settings → Pages → Source: GitHub Actions.
3. `.github/workflows/pages.yml`:

```yaml
name: Deploy
on:
  push: { branches: [main] }
  workflow_dispatch: {}
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: web } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: web/package-lock.json }
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: web/dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.d.outputs.page_url }}" }
    steps:
      - id: d
        uses: actions/deploy-pages@v4
```

Action sürümlerini kurarken güncel olanlarla değiştir. `base: "./"` sayesinde alt yolda çalışır. Pages HTTPS olduğu için jiroskop izni çalışır.

**Yerelde demo yedeği:** `npm run build && npm run preview` → `localhost` güvenli bağlam sayılır. Telefonla yerel ağdan bağlanacaksan `npm run dev:https` kullan.

**AI açıksa (Vercel):** Proje kökü `web/`, ortam değişkeni `AI_API_KEY` (yalnızca Production/Preview, istemciye açılmaz), fonksiyon `web/api/closing.ts`.

---

## 11. Aşamalı plan

Süre sınırı yok; iş üç faza bölündü. Her milestone kendi başına çalışan bir sürüm bırakır, yani istediğin yerde durup gösterebilirsin. Süreler tahmindir; günde 2–3 saat çalışırsan Faz 1 yaklaşık 4–5 gün sürer.

| Faz | Milestone | Tahmini süre | Çıktı |
|---|---|---|---|
| 1 Hikâye | M0 İskelet | 0,5 sa | Repo, araçlar, boş testler |
| | M1 Veri hattı | 1,5–2 sa | sky.json v2, ayrıntı dosyası, dokular, önizlemeler, Python testleri |
| | M2 Perde 1 çekirdeği | 1,5–2 sa | Çekirdek, kubbe, yıldızlar, 3D siluet, basılı tutma, sayaç, sürükleyerek bakma, bilim paneli |
| | M3 Uçuş çekirdeği | 2–3 sa | Katmanlar, rota, kontroller, kalkış, Dünya/Güneş Sistemi/yıldız katmanları, ışık sayacı, cetvel |
| | M4 Uçuş içeriği | 1,5–2 sa | Duraklar, takımyıldız çizgileri, küre, galaksi, Yerel Grup, etiketler, yıldıza dokunma |
| | M5 Perde 3 | 1 sa | Doğum yılı, dönüş, iniş, yön oku, ışıkların yanması |
| | M6 Jiroskop + ses + metinler | 1–1,5 sa | Jiroskop, drone ve uçuş sesleri, giriş/kapanış, TR/EN |
| 2 Keşif | K1 Serbest uçuş | 1,5–2 sa | Serbest kamera, Buraya uç, Eve bak/uç, Git menüsü, Güneş işareti, alt bant |
| | K2 Bilgi kartları | 1,5 sa | §3.16 otomatik satırlar, merak notları, arama, takımyıldız anahtarı |
| | K3 Görevler ve paylaşım | 1 sa | 7 görev, paylaşım, giriş ekranında "Keşfe geç" |
| 3 Yayın | M7 Mobil ve yayın | 1 sa | Performans, yedek yollar, autoplay, Pages |
| | M8 Prova | 0,5–1 sa | README, yedek video, prova |
| | M9 AI (opsiyonel) | 1 sa | /api/closing |

**Bugün 2–3 saatin varsa:** M0 + M1. M1'in sonunda sayılar, önizlemeler ve testler hazır olur; sonraki her şey bunun üstüne kurulur.

**Elle yapılacaklar:**
- Black Marble JPEG'ini indirip `pipeline/raw/` içine koymak (§5.3).
- Kızılay'ın SQM değerini lightpollutionmap.info'dan okuyup config'e yazmak (§3.3).
- Telefonda jiroskobu ve pusula yönünü test etmek, projektörde denemek.
- `?autoplay=1` ile yedek ekran kaydı almak (§12).
- Yeni merak notu eklersen kaynağını kendin açıp okumak (§8.2).

**Öncelik sırası** (bir şey ertelenecekse sondan başla): Perde 1 çekirdeği → Kraliçe'nin içinden geçen uçuş, galaksi ve Andromeda → ışık sayacı ve etiketler → doğum yıldızı ve eve dönüş → Keşif'te serbest uçuş ve bilgi kartları → jiroskop → ses → görevler → merak notları → İngilizce → M33 ve Macellan Bulutları → "Güneş nerede?" oyunu → paylaşım → AI.

**Risk notu:** M3 en zor kısım (katmanlı çizim + rota + kontroller) ve Keşif de onun üstüne kurulu. M3 sorunsuz çalışmadan Perde 1 cilasına ya da Keşif'e geçme.

### 11.1 M0 — İskelet

**Görev:**

SPEC §0.1, §4.2, §5.1 ve §6.1'i oku. Repo iskeletini kur:
- web/: Vite + TypeScript + three.js + Vitest + @vitejs/plugin-basic-ssl; §6.1'deki betikler ve vite.config.ts.
- pipeline/: §4.2'deki paket yapısı, requirements.txt (§5.1), config.yaml (§5.2'deki içerik), pytest.
- .gitignore ve README.md iskeleti.
Özellik yazma. `npm run dev` siyah bir sayfada "Beyond the Sky" göstermeli; `npm test` ve `pytest -q` çalışmalı.
Bitince commit at.

Kabul: Geliştirme sunucusu açılıyor, iki test komutu çalışıyor, ilk commit atıldı.

### 11.2 M1 — Veri hattı

**Görev:**

SPEC §3 (tamamı) ve §5'in tamamını oku. pipeline/ altında veri hattını yaz:
fetch (HYG ve NASA SVS dosyaları; Black Marble yoksa nereden indireceğimi yazdırıp dur), catalog
(uzaklık, adlar), zaman seçimi (auto, Ay/Güneş korumaları), Procrustes dönme matrisi, yıldız/gezegen/
Güneş/Ay konumları, Voyager 1, rota (û_cas, en yakın geçişler), galaktik çerçeve, Yerel Grup ve disk
normalleri, doğum tablosu, Samanyolu reprojeksiyonu (tam küre) ve ton eşleme, Dünya dokusu, sky.json v2
ve önizlemeler. §9.1'deki bütün testleri yaz ve geçir. Sonunda §5.13'teki konsol özetini yazdır,
previews/ altındaki görüntüleri bana göster ve doğu (80°) ile batı-kuzeybatı (295°) başlangıç
kadrajlarından hangisinin daha etkileyici olduğunu gerekçesiyle öner.

Kabul: §5.13.

### 11.3 M2 — Perde 1 çekirdeği

**Görev:**

SPEC §2.1, §2.2, §3.1, §3.3–§3.5, §6.2, §6.3 (jiroskop hariç), §6.4, §6.9 ve §6.11'i oku.
Uygulama çekirdeğini (renderer, director, timeline, input, look, assets) ve Perde 1'i yaz:
gökyüzü kubbesi shader'ı (Andromeda lekesi dahil), tek geometrili yıldızlar ve gökyüzü malzemesi,
3D şehir silueti, basılı tutma düğmesi, canlı sayaç, sürükleyerek bakma, açılış metinleri, rozet ve
bilim paneli. Ses ve jiroskop henüz yok. coords, visibility ve eşlik testlerini yaz.
Kabul: her yöne sürükleyince siluet ve gökyüzü tutarlı; basılı tutunca yıldızlar parlaktan sönüğe
doğru beliriyor; kilitlenince sayaç 3.189; masaüstünde 60 fps.

### 11.4 M3 — Uçuş çekirdeği

**Görev:**

SPEC §2.3, §3.7–§3.10, §3.14 ve §6.5.1–§6.5.5'i oku (§6.5.5'te yalnızca earth, solar ve deep
katmanındaki yıldızlar ile Samanyolu küresi). Önce plan modunda katmanlı çizimin (§6.5.1) planını
göster. Sonra: renderLayers, science/flight.ts (pathDir, baseLook, apparentMag, exposureLimit),
FlightControl (düğmeler, ↑/↓, pinch, tekerlek, goTo), kalkış geçişi, Dünya katmanı (yönelim,
gece/gündüz, Ay), Güneş Sistemi katmanı, yıldız uçuş malzemesi, sol üstte ışık sayacı ve sağda
cetvel. flight ve format testlerini yaz.
Kabul: Ankara'dan kalkıp ileri tuşuyla Andromeda'ya kadar takılmadan uçuluyor ve geri gelinebiliyor;
z 14,26 civarında Achird yakından geçiyor; titreme (jitter) yok; ışık sayacı Ay'da "1,24 saniye".

### 11.5 M4 — Uçuş içeriği

**Görev:**

SPEC §2.3, §3.11, §3.13 ve §6.5.5–§6.5.7'yi oku. Durakları ve kartları, takımyıldız çizgilerini,
"gördüğün her şey" küresini, "Buradasın" işaretini, Samanyolu parçacıklarını (galaktik çerçevede),
Yerel Grup galaksilerini, yıldız etiketlerini, yıldıza dokunma kartını ve ışık çizgisini, "Geriye bak"
düğmesini, 9 ve 10. duraklardaki otomatik geri bakışı ve bütün etiketleri (§6.11) ekle.
years testlerini (lightLeft, trLocative) yaz. Zaman kalırsa "Güneş nerede?" oyunu.

### 11.6 M5 — Perde 3

**Görev:**

SPEC §2.4, §3.12, §6.6 ve §8'in Perde 3 tablosunu oku. Doğum yılı panelini, findBirthStar'ı,
dönüş uçuşunu, doğum yıldızının işaretlenmesini ve ışık çizgisini, Perde 1 gökyüzüne inişi,
ekran dışı yön okunu, ışıkların yavaşça yanmasını ve bütün özel durumları yaz. ?born= parametresini
bağla. findBirthStar testlerini yaz. Doğum yılının hiçbir yere yazılmadığını kodda göster.

### 11.7 M6 — Jiroskop, ses, metinler

**Görev:**

SPEC §6.3 (jiroskop), §6.7, §6.8 ve §8'i oku. Jiroskop iznini "Başla" dokunuşunun içinde iste;
Perde 1 ve 3'te mutlak, Perde 2'de göreli bakışı, "Kuzeyi düzelt" sürüklemesini ve aç/kapa anahtarını
ekle. orientation testlerini yaz. Web Audio drone'unu, uçuş seslerini ve zili, giriş/kapanış/kaynaklar
ekranlarını, TR/EN metin destesini, font yüklemeyi ve sahne geçişlerini tamamla. Sunucu modunu,
?autoplay=1'i ve klavye/kumanda kısayollarını bağla.

### 11.8 M7 — Mobil, performans, yayın

**Görev:**

SPEC §6.10, §9.3, §10 ve §13'ü oku. Otomatik kalite düşürmeyi, Wake Lock'u, reduced-motion'ı ve
WebGL yedek ekranını ekle. GitHub Pages iş akışını kur. §9.3'teki elle kontrol listesini bana adım
adım uygulat; bulduğum sorunları düzelt.

### 11.9 M8 — Prova ve yedek

**Görev:**

README.md'yi SPEC §14 ve §15'e göre tamamla (sınırlamalar ve kaynaklar dahil), ekran görüntüleri
için klasör hazırla. Sonra §12'deki demo akışını birlikte prova edelim: her sahnede neyi kontrol
etmem gerektiğini sırayla söyle.

### 11.10 M9 — (Opsiyonel) AI kapanış cümlesi

**Görev:**

SPEC §7'yi oku. Önce kullanılan API'nin dokümanından güncel başlıkları ve yanıt biçimini doğrula.
Vercel fonksiyonu olarak /api/closing'i yaz: anahtar yalnızca sunucuda, sayı doğrulaması,
3,5 sn zaman aşımı ve şablona dönüş. İstemci isteği A3_RETURN başında göndersin; doğum yılı ya da
doğum yıldızı asla gönderilmesin.

### 11.11 K1 — Serbest uçuş

**Görev:**

SPEC §2.6 ve §6.12'yi (serbest kamera, Buraya uç, Eve bak/uç, Git menüsü, Güneş işareti, alt bant)
oku. Önce plan modunda scenes/explore.ts ve science/freeFlight.ts için planı göster. Katmanları,
yıldız malzemesini ve dokunma seçimini Perde 2'den yeniden kullan; kopyalama. Kapanışa "Keşfet"
düğmesini, ?explore=1 parametresini ve "Ev" seçeneğiyle Perde 1 gökyüzüne inişi bağla.
freeFlight testlerini yaz (localScaleLy, cruiseSpeed sınırları, flyPlan: s=0'da başlangıç, s=1'de
hedeften endLy uzaklık, uzaklık monoton azalan).
Kabul: Achird'e, Deneb'e ve Andromeda'ya "Git" ile takılmadan uçuluyor; yıldızların arasında yavaş,
boşlukta hızlı; alt bant Aldebaran'da "1960'ta olduğu haliyle" ve "6,4 kadir" gösteriyor.

### 11.12 K2 — Bilgi kartları ve arama

**Görev:**

SPEC §3.16, §5.14, §6.12 (kart, arama, takımyıldız anahtarı) ve §8.2'yi oku. catalog_detail.json'u
Perde 1 sırasında arka planda yükle. Kartı §3.16 satırlarıyla, tür satırının "comp" kuralıyla ve
merak notlarıyla (web/src/content/cards.ts) yaz. Aramayı Türkçe karakter katlamasıyla yaz.
facts testlerini yaz (§9.2: Sirius'tan Güneş 1,94; Vega 49 kat; Achird 1,3 kat; Güneş B−V 0,65 → 5.778 K;
Voyager Sirius ~152.000 yıl; Capella'da tür satırı yok; arama "ulker" → Ülker).

### 11.13 K3 — Görevler ve paylaşım

**Görev:**

SPEC §2.6'daki görev tablosunu ve §6.12'deki görev ve paylaşım kısımlarını oku. 7 görevi, ★ sayacını,
tamamlanma notlarını ve localStorage kaydını yaz; girişte bts.storySeen'e göre "Hikâyeyi izle /
Keşfe geç" seçeneğini ekle. Paylaşımı Web Share API ile, desteklenmezse indirme ile yap.
Her görevin tamamlanma koşulu için birer test yaz.

---

## 12. Demo senaryosu ve yedek plan

| Zaman | Ekran | Sen |
|---|---|---|
| 0:00 | Giriş | "Ankara'da en son ne zaman Samanyolu'nu gördünüz?" Kısa sessizlik. |
| 0:10 | Başla → Perde 1 | "Bu, Kızılay'ın {tarih} gecesi gökyüzü. Yıldız konumları Astropy ile hesaplandı. Şehirden görebildiğimiz yaklaşık 111 yıldız." |
| 0:25 | Basılı tut | Konuşma. 7 saniye boyunca müziğin yükselmesine izin ver. |
| 0:35 | "Hep oradaydılar." | "3.189 yıldız. Hiçbiri yeni değil; ışıklarımız onları saklıyor. Şu tepedeki soluk lekeyi aklınızda tutun." |
| 0:50 | Kalkış, Dünya, Ay | "Söndürdüğümüz ışıklar uzaydan böyle görünüyor. Ay'dan bakan biri bizi 1,2 saniye geç görürdü." |
| 1:10 | Güneş, Neptün, Voyager | "Voyager 1, 49 yılda bir ışık-gününe ulaştı. Ve daha yolun başındayız." |
| 1:30 | Achird, Kraliçe | "Şimdi gerçek yıldızların arasındayız. Şu W şekli aslında yüzlerce ışık yılına dağılmış; yalnızca Dünya'dan bakınca var." |
| 1:55 | Küre, Samanyolu | Kamera dönüyor: "Işıkları söndürünce gördüğümüz her şey, şu küçük kürenin içindeydi. Bu da evimiz." |
| 2:25 | Andromeda | "Ve o soluk leke: Andromeda. Işığı 2,5 milyon yıl önce yola çıktı." "Geriye bak"a bas. Sessizlik. |
| 2:50 | Doğum yılı | Salondan birine yılını sor (ya da `?born=` ile önceden hazırla). |
| 3:05 | Dönüş, iniş | "Bu yıldızın ışığı sen doğduğun yıl yola çıktı ve bu gece Ankara'ya varıyor." |
| 3:30 | Işıklar yanar | "Onlar hâlâ orada." |
| 3:40 | Keşfet | Bir yıldıza dokun (ör. Aldebaran): "Oradan bakan biri Dünya'yı 1960'ta görür. Pioneer 10 oraya gidiyor; iki milyon yıldan fazla sürecek." Sonra 10 sn ürün vizyonu: "Hikâye bir kez izlenir; Keşif'e geri dönülür." |

**Sunum kumandasıyla:** Perde 2'de `PageDown` bir sonraki durağa uçar; konuşmana göre ilerlersin.

**İsteğe bağlı açılış hikâyesi:** 1994 Los Angeles depreminden sonraki elektrik kesintisinde insanların Samanyolu'nu görüp Griffith Gözlemevi'ni aradığı anlatılır. Kaynağı zayıf; mutlaka "anlatılır" diye söyle.

**Yedek plan:**
- Demodan bir gün önce `?autoplay=1&born=2007` ile dizüstünde ve telefonda baştan sona **ekran kaydı** al; internetsiz erişilebilir yerde tut.
- Jiroskop çalışmazsa sürükleme; sensör kalibrasyonu bozuksa "Kuzeyi düzelt".
- Projektörde en-boy oranı sorunluysa `F` ile tam ekran; 1080p'yi önceden dene.
- İnternet yoksa: `npm run build && npm run preview` ile localhost'tan aç.
- Ses: salondaki ses seviyesini ve iPhone'un sessiz anahtarını önceden kontrol et.

---

## 13. Sık yapılan hatalar

1. **GLSL `smoothstep` sırası:** `edge0 < edge1` olmalı. "Tersine" geçiş için `1.0 − smoothstep(a, b, x)` kullan.
2. **Samanyolu dikişi:** az = 0/360°'de mipmap türev kırılması ince bir çizgi yapar. Mipmap kapalı, `LinearFilter`.
3. **Dönme matrisi:** Üç birim vektörü dönüştürerek kurulan matris 0,24° hatalı çıkıyor. Procrustes kullan (§5.6).
4. **Python–TS eşliği:** Sayımları yuvarlanmış JSON değerlerinden yap; CPU'da Float64 kullan.
5. **Tek sahnede 10^19 km:** float32 titremesi ve derinlik tamponu bozulur. Ölçek katmanları (§6.5.1); kamera konumunu JS'te float64 tut.
6. **ENU ↔ three.js:** ENU (Doğu, Kuzey, Yukarı) → three.js (x, y, z) = (Doğu, Yukarı, −Kuzey). Her vektörü yalnızca `enuToThree` ile çevir; elle yazılan eksen takası en sık hata kaynağı.
7. **`cameraPosition` uniform'u** yalnızca `ShaderMaterial`'da otomatik gelir; `RawShaderMaterial`'da kendin tanımla.
8. **Jiroskop izni (iOS):** `DeviceOrientationEvent.requestPermission()` yalnızca bir dokunuş olayının içinde çağrılabilir ve yalnızca HTTPS'te çalışır. Sayfa yüklenirken çağırma.
9. **Pusula:** iOS'ta `alpha` keyfi bir yönden başlar; kuzey için `webkitCompassHeading` kullan. Android'de `deviceorientationabsolute` olayını dinle. Pusula manyetik kuzeyi gösterir.
10. **lookAt tepe noktasında döner:** bakış yönü yukarı vektörüne paralel olunca. Perde 1'de alt ≤ 88°; uçuşta yukarı vektörünü her karede Gram-Schmidt ile düzelt.
11. **iOS uzun basma:** `-webkit-touch-callout:none`, `user-select:none`, `touch-action:none` ve `contextmenu` engeli olmazsa basılı tutma çalışmaz.
12. **Basılı tutmayı bitiren dokunuş** "ileri" sayılmamalı; sürükleme sonu "tap" sayılmamalı (8 px / 300 ms kuralı).
13. **Canvas veri dokusu:** alfa 255'ten küçükse tarayıcı renkleri alfa ile çarpar ve veri bozulur. Siluet dokusunda alfa hep 255.
14. **Uzak yıldız yılları:** Hipparcos uzaklıkları uzak yıldızlarda belirsiz. Yuvarlama kuralını (§3.11) atlama; "Deneb'in ışığı 615'te yola çıktı" gibi kesin yazma.
15. **AudioContext** yalnızca kullanıcı etkileşiminden sonra başlar.
16. **Türkçe büyük harf:** `"simülasyon".toUpperCase()` → "SIMÜLASYON" (yanlış). `toLocaleUpperCase("tr-TR")` ya da `lang="tr"` + CSS.
17. **Türkçe ekler:** "2010'de" değil "2010'da". `trLocative` kullan.
18. **Fontlar** Türkçe glifleri ve Yunan harflerini içermeli; yedek font da öyle.
19. **Sayı biçimi:** "3.189" (tr) / "3,189" (en); ondalıklarda "1,24" / "1.24".
20. **Pillow** 13500×6750 görüntüde decompression bomb uyarısı verir; `MAX_IMAGE_PIXELS = None`.
21. **Astropy çevrimdışı:** IERS indirmeyi kapat (§5.5); yoksa ağ beklerken takılabilir.
22. **OpenCV ile EXR** okunamayabilir; `OpenEXR` paketini kullan.
23. **`100vh`** iOS'ta adres çubuğuyla kayar; `100dvh` kullan.
24. **Wake Lock** sayfa gizlenince düşer; görünür olunca yeniden iste.
25. **Her karede** yeni geometri/malzeme oluşturma.
26. **Additive blending + sRGB:** Parlaklık beklenenden farklı görünürse bilim panelinden `uIntensity`/`uMWGain` ayarla; formülleri değiştirme.
27. **Ayrıntı dosyası indeksi:** `catalog_detail.json` satırları sky.json ile aynı sırada olmalı; pipeline'da tek bir sıralanmış DataFrame'den ikisini birden yaz.
28. **Paylaşılan görüntü siyah:** WebGL tamponu çizimden sonra temizlenir. `toBlob`'u çizimle aynı karede çağır ya da yalnızca paylaşım anında bir kez daha çiz.
29. **Türkçe arama:** `"İ".toLowerCase()` noktalı "i̇" verir; aramadan önce §6.12'deki katlamayı uygula.
30. **Parlaklık iddiası:** "Güneş'ten X kat parlak" yalnızca görünür ışıkta (V bandı) ve Hipparcos uzaklığıyla geçerli; kartta bu not hep dursun.

---

## 14. Bilinen sınırlamalar

README'ye aynen girecek:

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

---

## 15. Kaynaklar ve lisanslar

**Veri**
- HYG Database v4.1 — David Nash / astronexus. [github.com/astronexus/HYG-Database](https://github.com/astronexus/HYG-Database) · [astronexus.com/hyg](https://www.astronexus.com/hyg). Lisans: CC BY-SA 4.0. Türetilen `sky.json` da CC BY-SA 4.0 ile paylaşılır.
- Deep Star Maps 2020 (Milky Way background) — NASA Goddard Scientific Visualization Studio, Ernie Wright; Gaia DR2 verisi: ESA/Gaia/DPAC. [svs.gsfc.nasa.gov/4851](https://svs.gsfc.nasa.gov/4851)
- Black Marble 2016 — NASA Earth Observatory / NASA Goddard Space Flight Center (Suomi NPP VIIRS). [science.nasa.gov/earth/earth-observatory/earth-at-night/maps](https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps) · [svs.gsfc.nasa.gov/30876](https://svs.gsfc.nasa.gov/30876)
- Işık kirliliği atlası (SQM okuması için): [lightpollutionmap.info](https://www.lightpollutionmap.info) — World Atlas 2015 katmanı (Falchi ve ark. 2016).
- Andromeda (M31) uzaklığı ~2,5 milyon ışık yılı: [NASA — Messier 31](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/).
- Üçgen Gökadası (M33) 2,73 milyon ışık yılı: [NASA Hubble — M33](https://science.nasa.gov/asset/hubble/triangulum-galaxy-messier-33-m33).
- Macellan Bulutları uzaklıkları (160.000 ve 200.000 ışık yılı) ile M31/M33 yönelim açıları yaygın literatür değerleridir; yalnızca görselde kullanılır, ekranda iddia edilmez. Kurulumda NASA sayfalarından kontrol et.
- Voyager 1 konumu (J2000 17h 14m 38s, +12° 23′ 54″): [TheSkyLive](https://theskylive.com/voyager1-info); asıl kaynak JPL Horizons (id −31).

**Modeller ve sabitler**
- NELM–SQM dönüşümü: Schaefer, B. E. (1990), PASP 102, 212; dönüşüm formülü [Unihedron hesaplayıcısı](https://unihedron.com/projects/darksky/NELM2BCalc.html) ve [JAAVSO makalesi](https://app.aavso.org/media/jaavso/2976.pdf).
- Hava kütlesi: Kasten, F. & Young, A. T. (1989), Applied Optics 28, 4735.
- B−V → sıcaklık: Ballesteros, F. J. (2012), EPL 97, 34008. Sıcaklık → RGB: Tanner Helland (2012) yaklaşımı.
- Voyager 1'in 1 ışık-günü: 18 Kasım 2026, 10:16:07 UTC. [svs.gsfc.nasa.gov/15120](https://svs.gsfc.nasa.gov/15120) · [EarthSky](https://earthsky.org/space/voyager-1-1-light-day-from-earth-november-17-18-2026/)
- Güneş'in galaksi merkezine uzaklığı: GRAVITY Collaboration (2019), ~8,18 kpc.
- Galaktik çerçeve: Astropy `Galactic` (IAU 1958 tanımı, ICRS'e bağlı).

**Merak notları (§8.2):** [ESA: Sirius B](https://www.esa.int/Science_Exploration/Space_Science/Weighing_the_Dog_Star_s_companion) · [NASA: Sirius B](https://science.nasa.gov/missions/hubble/astronomers-use-hubble-to-weigh-dog-stars-companion/) · [NASA: Vega](https://science.nasa.gov/solar-system/summer-triangle-corner-vega/) · [NASA APOD: When Vega is North](https://apod.nasa.gov/rjn/apod/ap150508.html) · [NASA: Betelgeuse](https://science.nasa.gov/missions/hubble-space-telescope/hubble-finds-that-betelgeuses-mysterious-dimming-is-due-to-a-traumatic-outburst) · [NASA: Pioneer 10](https://science.nasa.gov/missions/pioneer/pioneer-10-sends-last-signal/) · [Britannica: Algol](https://www.britannica.com/place/Algol-star) · [Sky & Telescope: Algol](https://skyandtelescope.org/stargazing-and-observing/behold-algol-star-secret/) · [NASA SVS: Pleiades](https://svs.gsfc.nasa.gov/14928) · [NASA: Messier 45](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-45) · [ESA: Milky Way–Andromeda](https://www.esa.int/Science_Exploration/Space_Science/Hubble_and_Gaia_revisit_fate_of_our_galaxy) · [NASA: Voyager 1 ve Gliese 445](https://www.nasa.gov/image-article/reaching-stars)

**Yazılım:** Astropy (BSD-3), NumPy (BSD-3), three.js (MIT), Vite (MIT), Vitest (MIT), OpenEXR (BSD-3). Fontlar: SIL Open Font License.


---

## 16. Sonraki sürümler

- **Gecelik ritüel:** Her gece o gecenin gerçek gökyüzüyle değişen yolculuk (Ay'ın evresi, görünen gezegenler, o gecenin hedef galaksisi). Ürünün asıl yönü bu.
- **Daha çok merak notu:** 9'dan 50'ye; her biri kaynaklı. İçerik dosyası formatı hazır (§8.2).
- **Keşif rotaları:** "Ülker turu", "Ölmekte olan yıldızlar" gibi küratörlü kısa uçuşlar.
- **Gaia verisi:** Çıplak gözün ötesindeki milyonlarca yıldızla galaksi içinde gerçek veriyle uçuş (veri boyutu ve akış sorunu çözülmeli).
- **Kozmik ağ:** Yerel Grup'un ötesinde gerçek galaksi kataloğuyla (ör. 2MASS Redshift Survey) büyük ölçekli yapı.
- **Canlı mod:** Sidereal zaman JS'te ilerlesin; "şu an" gökyüzü.
- **Tarih çapaları:** Işığın yola çıktığı yılın yanında o dönemden bir olay (yalnızca belirsizliği küçük yakın yıldızlarda).
- **Konumdan otomatik SQM:** Işık kirliliği atlasından kullanıcının konumu için SQM.
- **Türkçe gökyüzü kültürü:** Demirkazık, Ülker gibi geleneksel adlar.
