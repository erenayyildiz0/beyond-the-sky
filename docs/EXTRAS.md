# Ek milestone'lar (SPEC dışı, kullanıcı onaylı)

SPEC v3'ün üstüne eklenen özellikler. Amaç: **kullanıcı kendi konumunda, kendi gökyüzünde neyden mahrum
kaldığını görsün.** Ankara (Kızılay) varsayılan ve demo olarak kalır; SPEC'teki sayılar ve testler Ankara için geçerlidir.

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
