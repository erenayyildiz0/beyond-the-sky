/**
 * Uyarlamalı çözünürlük: kareler bir süre yavaş kalırsa piksel oranını düşürür, rahatlayınca geri çıkarır.
 * Zayıf ekran kartında (ör. dahili GPU) kasmayı önler; yıldız/nokta boyutları piksel oranıyla ölçeklendiği için görünüm değişmez.
 * Taban 1: ekranın kendi pikselinin altına inilmez (1x ekranda 0,6'ya inince dokular ve yıldızlar bulanık, kenarlar basamaklı
 * oluyordu); düşürme yalnızca yüksek yoğunluklu ekranlarda (2x telefon, Retina) çalışır.
 */
export class AdaptiveRes {
  pr: number;
  private ms = 1000 / 60;
  private slow = 0;
  private fast = 0;
  private sinceRaise = Infinity;
  constructor(public max: number, public min = Math.min(max, 1)) { this.pr = max; }

  /** dt: kare süresi (sn). Oran değiştiyse yeni değeri, yoksa null döner. */
  step(dt: number): number | null {
    this.ms += (dt * 1000 - this.ms) * 0.1;
    this.sinceRaise += dt;
    if (this.ms > 24) { this.slow += dt; this.fast = 0; }            // < ~42 fps
    else if (this.ms < 18) { this.fast += dt; this.slow = 0; }       // 60 Hz ekranda tam hız
    else { this.slow = 0; this.fast = 0; }
    if (this.slow > 1 && this.pr > this.min) {
      // Yükselttikten hemen sonra yine yavaşladıysa tavan buradır: bir daha yükseltme (gidip gelme olmasın)
      if (this.sinceRaise < 3) this.max = this.pr * 0.85;
      return this.set(Math.max(this.min, this.pr * 0.85));
    }
    if (this.fast > 8 && this.pr < this.max - 1e-3) {
      this.sinceRaise = 0;
      return this.set(Math.min(this.max, this.pr / 0.85));
    }
    return null;
  }

  private set(v: number) {
    this.pr = Math.round(v * 100) / 100;
    this.slow = 0; this.fast = 0; this.ms = 1000 / 60;
    return this.pr;
  }
}
