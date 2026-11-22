/**
 * PWA yükleme: Android ve masaüstü Chrome yükleme önerisini (beforeinstallprompt) sayfa açılır açılmaz verir;
 * bu modül main.ts'te erken yüklenir ki olay kaçmasın. iOS Safari'de böyle bir olay yok: yalnızca Paylaş → Ana Ekrana Ekle.
 */
type InstallPrompt = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: InstallPrompt | null = null;
const waiting: (() => void)[] = [];
addEventListener("beforeinstallprompt", e => {
  e.preventDefault();                          // tarayıcının kendi şeridi yerine giriş ekranındaki bağlantı
  deferred = e as InstallPrompt;
  for (const f of waiting.splice(0)) f();
});
addEventListener("appinstalled", () => { deferred = null; });

/** Ana ekrandan (uygulama olarak) açıldı mı */
export const isInstalled = () =>
  matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches || (navigator as { standalone?: boolean }).standalone === true;

export const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** Yükleme önerisi geldiğinde (ya da zaten geldiyse) f çağrılır */
export function onInstallable(f: () => void) { if (deferred) f(); else waiting.push(f); }

export async function promptInstall(): Promise<boolean> {
  const d = deferred;
  if (!d) return false;
  deferred = null;                             // bir öneri yalnızca bir kez gösterilebilir
  await d.prompt();
  return (await d.userChoice).outcome === "accepted";
}
