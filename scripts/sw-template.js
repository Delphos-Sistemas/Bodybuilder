/* Service worker do BODYBUILDER — gerado por scripts/generate-sw.mjs. Não edite out/sw.js à mão. */
const VERSION = "__VERSION__";
const CACHE = `bb-app-${VERSION}`;
const MEDIA_CACHE = "bb-media-v1";
const PRECACHE = __PRECACHE__;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  // Não chama skipWaiting automaticamente: a nova versão espera o usuário tocar em "Atualizar".
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("bb-app-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function pageUrlFor(pathname) {
  const clean = pathname.replace(/\/$/, "").replace(/\.html$/, "").replace(/\/index$/, "");
  return clean || "/";
}

async function fromCache(request, opts) {
  const c = await caches.open(CACHE);
  return c.match(request, opts);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Páginas: usa a cópia da versão instalada (abre offline); se não houver, vai à rede.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cached = await fromCache(pageUrlFor(url.pathname));
        if (cached) return cached;
        try {
          return await fetch(req);
        } catch {
          return (await fromCache("/404")) || (await fromCache("/")) || Response.error();
        }
      })()
    );
    return;
  }

  // Vídeos das demonstrações: sob demanda. Depois de vistos, ficam guardados para uso offline.
  if (url.pathname.startsWith("/media/") && /\.(webm|mp4)$/.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const mc = await caches.open(MEDIA_CACHE);
        const hit = await mc.match(url.pathname);
        if (hit) return hit;
        const res = await fetch(req);
        event.waitUntil(
          fetch(url.pathname)
            .then((full) => (full.ok && full.status === 200 ? mc.put(url.pathname, full) : undefined))
            .catch(() => undefined)
        );
        return res;
      })()
    );
    return;
  }

  // Demais arquivos (JS, CSS, imagens, dados de navegação): cache primeiro, rede depois.
  event.respondWith(
    (async () => {
      const isRsc = url.pathname.endsWith(".txt");
      const cached = await fromCache(isRsc ? url.pathname : req, isRsc ? undefined : { ignoreSearch: false });
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok && res.status === 200 && !isRsc) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      } catch {
        return Response.error();
      }
    })()
  );
});
