// Service worker (PWA): uygulama internetsiz açılır. Derlemede vite.config.ts'teki pwa() eklentisi
// kabuk listesi ve iki önbellek sürümü yer tutucularını doldurup dist/sw.js olarak yazar.
// ignoreVary: sunucular Vary: Origin / Accept-Encoding gönderiyor; modül istekleri Origin taşıdığı için önbellekteki
// (Origin'siz alınmış) yanıt eşleşmiyor, internetsiz açılış boş kalıyordu. Dosya adları içerik özetli; Vary'ye gerek yok.
const SHELL = __SHELL__;                       // index.html, JS/CSS, fontlar, simgeler: kurulumda önbelleğe
const SHELL_CACHE = "bts-shell-__SHELL_VER__";
const DATA_CACHE = "bts-data-__DATA_VER__";    // data/: ilk kullanımda önbelleğe; yalnızca veri değişince yenilenir

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("bts-") && k !== SHELL_CACHE && k !== DATA_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const scope = new URL(self.registration.scope);
  const path = url.pathname.slice(scope.pathname.length);

  // Sayfa: önce ağ (yeni sürüm gelsin), ağ yoksa önbellekteki index.html
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("./index.html", { ignoreSearch: true, ignoreVary: true })));
    return;
  }
  // Veri: önce önbellek; yoksa indir ve sakla (tam yanıtlar; kısmi/opak yanıt saklanmaz)
  if (path.startsWith("data/")) {
    e.respondWith(caches.open(DATA_CACHE).then(async c => {
      const hit = await c.match(req, { ignoreSearch: true, ignoreVary: true });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.status === 200) c.put(req, res.clone());
      return res;
    }));
    return;
  }
  // Kabuk: önce önbellek (dosya adları içerik özetli), yoksa ağ
  e.respondWith(caches.match(req, { ignoreSearch: true, ignoreVary: true }).then(hit => hit || fetch(req)));
});
