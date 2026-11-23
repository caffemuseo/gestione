const C = "museo-pos-v2";
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(["./"]).catch(() => {}))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (!(u.origin === location.origin || /cdn\.tailwindcss\.com|cdnjs\.cloudflare\.com|gstatic\.com/.test(u.host))) return;
  if (r.mode === "navigate") {
    // pagina dell'app: prima la rete (sempre l'ultima versione), la copia salvata solo se sei offline
    e.respondWith(fetch(r).then(res => {
      const copy = res.clone();
      caches.open(C).then(c => c.put(r, copy));
      return res;
    }).catch(() => caches.match(r).then(h => h || caches.match("./"))));
    return;
  }
  e.respondWith(caches.open(C).then(async c => {
    const hit = await c.match(r);
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
