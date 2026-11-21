// SPEC §8 — Türkçe metin destesi (Perde 1 ve genel; diğer perdeler kendi milestone'larında eklenir)
export const tr = {
  "loading": "Yükleniyor %{n}",
  "intro.place": "{place} · {date} · {time}",
  "intro.title": "Başını kaldır.",
  "intro.start": "Başla",
  "intro.sound": "Sesli deneyim · kulaklık önerilir",
  "act1.now.tonight": "{place_ablative} bu gece görebileceğin gökyüzü bu.",
  "act1.now.date": "{place_ablative} {date} gecesi görebileceğin gökyüzü bu.",
  "act1.raise": "Telefonu gökyüzüne kaldır.",
  "act1.drag": "Etrafa bakmak için sürükle.",
  "act1.hold": "Işıkları söndürmek için basılı tut",
  "act1.count": "{n} yıldız",
  "act1.badge": "SİMÜLASYON · gerçek yıldız konumları, tahmini görünürlük",
  "act1.reveal1": "Hep oradaydılar.",
  "act1.reveal2": "{n} yıldız. Ve Samanyolu.",
  "act1.up": "Yukarı çık",
  "common.next": "Devam",
  "gyro.on": "Jiroskop açık",
  "gyro.off": "Jiroskop kapalı",
  "gyro.fixNorth": "Kuzeyi düzeltmek için yana sürükle",
  "fallback.webgl": "Bu deneyim WebGL gerektiriyor. Güncel bir tarayıcıda açmayı dene.",
  "dev.next": "Perde 2 (Yolculuk) M3'te eklenecek. Baştan başlamak için R.",
} as const;

export type Key = keyof typeof tr;
