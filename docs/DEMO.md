# Demo akışı ve yedek plan

Canlı sunum için yaklaşık 4 dakikalık akış. Sunum kumandası kullanılacaksa `?presenter=1` ile aç.

## Akış

| Zaman | Ekran | Söylenecek |
|---|---|---|
| 0:00 | Giriş | "Ankara'da en son ne zaman Samanyolu'nu gördünüz?" Kısa sessizlik. |
| 0:10 | Başla → Perde 1 | "Bu, Kızılay'ın 29 Kasım gecesi gökyüzü. Yıldız konumları Astropy ile hesaplandı. Şehirden görebildiğimiz yaklaşık 111 yıldız." |
| 0:25 | Basılı tut | Konuşma; müziğin yükselmesine izin ver. Bırakınca ışıklar olduğu yerde kalır. |
| 0:35 | Karanlık gökyüzü | "3.189 yıldız. Hiçbiri yeni değil; ışıklarımız onları saklıyor. Şu tepedeki soluk lekeyi aklınızda tutun." |
| 0:50 | Kalkış, Dünya, Ay | "Söndürdüğümüz ışıklar uzaydan böyle görünüyor. Ay'dan bakan biri bizi 1,2 saniye geç görürdü." |
| 1:10 | Güneş, Neptün, Voyager 1 | "Voyager 1, 49 yılda bir ışık-gününe ulaştı. Ve daha yolun başındayız." |
| 1:30 | Achird, Kraliçe | "Şimdi gerçek yıldızların arasındayız. Şu W şekli aslında yüzlerce ışık yılına dağılmış; yalnızca Dünya'dan bakınca var." |
| 1:55 | Gördüğün her şey, Samanyolu | "Işıkları söndürünce gördüğümüz her şey, şu küçük kürenin içindeydi. Bu da evimiz." |
| 2:25 | Andromeda | "Ve o soluk leke: Andromeda. Işığı 2,5 milyon yıl önce yola çıktı." Işık sayacının altındaki tarih satırına dokun. |
| 2:50 | Eve dönmeden önce | Salondan birine doğum yılını sor (ya da `?born=` ile önceden hazırla). |
| 3:05 | Dönüş, iniş | "Bu yıldızın ışığı sen doğduğun yıl yola çıktı ve bu gece Ankara'ya varıyor." |
| 3:30 | Işıklar yanar | "Onlar hâlâ orada." |
| 3:40 | Keşfet | Aldebaran'ı ara: "Oradan bakan biri Dünya'yı 1960'ta görür. Pioneer 10 oraya gidiyor; iki milyon yıldan fazla sürecek." |

## Kumanda

**Sunum kumandasıyla:** Perde 2'de `PageDown` bir sonraki durağa, `PageUp` bir öncekine uçar.

## Yedek plan

- Demodan bir gün önce `?autoplay=1&born=2007` ile dizüstünde ve telefonda baştan sona **ekran kaydı** al; internetsiz erişilebilir yerde tut.
- Jiroskop çalışmazsa sürükleme; pusula sapıyorsa "Kuzeyi düzelt".
- Projektörde en-boy oranı sorunluysa `F` ile tam ekran; 1080p'yi önceden dene.
- İnternet yoksa: `npm run build && npm run preview` ile localhost'tan aç.
- Ses: salondaki ses seviyesini ve iPhone'un sessiz anahtarını önceden kontrol et.

