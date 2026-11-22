/**
 * Paylaş (SPEC §6.12): o anki görüntü + altında 48 px'lik şerit (kısa metin + "Beyond the Sky"). Görüntü, çizimin hemen
 * ardından aynı görevde alınır (preserveDrawingBuffer gerekmez). Web Share API destekleniyorsa dosyayla paylaşım menüsü,
 * değilse PNG indirme. Hiçbir şey kendiliğinden gönderilmez; yalnızca kullanıcı paylaşırsa cihazdan çıkar.
 */
export async function shareFrame(gl: HTMLCanvasElement, drawNow: () => void, text: string) {
  drawNow();
  const W = gl.width, H = gl.height, strip = Math.round(48 * (W / gl.clientWidth || 1));
  const c = document.createElement("canvas");
  c.width = W; c.height = H + strip;
  const g = c.getContext("2d")!;
  g.drawImage(gl, 0, 0);
  g.fillStyle = "#05070d"; g.fillRect(0, H, W, strip);
  g.fillStyle = "#e9edf5"; g.textBaseline = "middle";
  g.font = `${Math.round(strip * 0.36)}px Inter, system-ui, sans-serif`;
  const pad = Math.round(strip * 0.4);
  g.fillText(text, pad, H + strip / 2, W * 0.72);
  g.fillStyle = "#8f9bb3"; g.textAlign = "right";
  g.font = `${Math.round(strip * 0.3)}px Inter, system-ui, sans-serif`;
  g.fillText("BEYOND THE SKY", W - pad, H + strip / 2);
  const blob = await new Promise<Blob | null>(res => c.toBlob(res, "image/png"));
  if (!blob) return;
  const file = new File([blob], "beyond-the-sky.png", { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], text: `${text} · Beyond the Sky` }); return; } catch { /* vazgeçildi */ return; }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "beyond-the-sky.png";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
