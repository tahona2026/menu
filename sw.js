/* خدمة بسيطة: الصفحة بتتجاب من النت الأول (عشان التحديثات تظهر فوراً) ولو مفيش نت بتفتح آخر نسخة محفوظة.
   طلبات السيرفر (الأسعار والطلبات) بتروح للنت دايماً ومش بتتخزّن هنا. */
const CACHE = "tahona-shell-v1";
const SHELL = ["./", "manifest.json", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;     // السيرفر والخطوط والصور الخارجية: من غير تدخل
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("./") : undefined)))
  );
});
