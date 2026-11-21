/** Ekranın kararmasını engelle (SPEC §6.10); sayfa gizlenince düşer, görünür olunca yeniden istenir */
let wakeLock: { release(): Promise<void> } | null = null;
export async function requestWakeLock() {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request(t: "screen"): Promise<{ release(): Promise<void> }> } }).wakeLock;
    if (wl && !document.hidden) wakeLock = await wl.request("screen");
  } catch { /* desteklenmiyor ya da reddedildi */ }
  void wakeLock;
}
