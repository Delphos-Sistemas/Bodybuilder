/* Service worker do BODYBUILDER — gerado por scripts/generate-sw.mjs. Não edite out/sw.js à mão. */
const VERSION = "__VERSION__";
const CACHE = `bb-app-${VERSION}`;
const MEDIA_CACHE = "bb-media-v1";
// Modo academia offline: falas gravadas e GIFs baixados pelo botão nas Configurações. Sobrevive às atualizações.
const OFFLINE_CACHE = "bb-offline-v1";
const GIF_HOST = "static.exercisedb.dev";
// Os GIFs só passam pelo service worker depois que a pessoa baixou o modo offline (existe o cache bb-gifs-v1).
const GIF_CACHE = "bb-gifs-v1";
let gifsOffline = false;
caches.has(GIF_CACHE).then((v) => (gifsOffline = v));
const PRECACHE = __PRECACHE__;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  // Não chama skipWaiting automaticamente: a nova versão espera o usuário tocar em "Atualizar".
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data && event.data.type === "GIFS_OFFLINE") gifsOffline = true;
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
  const clean = pathname
    .replace(/\/$/, "")
    .replace(/\.html$/, "")
    .replace(/\/index$/, "");
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
  // GIFs dos exercícios (outro site): depois de carregados uma vez, ficam guardados para treinar sem internet.
  if (url.hostname === GIF_HOST && gifsOffline) {
    event.respondWith(
      (async () => {
        const hit = (await caches.match(req.url, { ignoreVary: true })) || null;
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok || res.type === "opaque") {
          const copy = res.clone();
          event.waitUntil(
            caches
              .open(MEDIA_CACHE)
              .then((c) => c.put(req.url, copy))
              .catch(() => undefined)
          );
        }
        return res;
      })()
    );
    return;
  }
  if (url.origin !== self.location.origin) return;
  // Falas gravadas: guardadas fora do cache da versão, para não baixar de novo a cada atualização.
  if (url.pathname.startsWith("/voz/")) {
    event.respondWith(
      (async () => {
        const hit = await caches.match(url.pathname, { ignoreVary: true });
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok && res.status === 200) {
          const copy = res.clone();
          event.waitUntil(
            caches
              .open(OFFLINE_CACHE)
              .then((c) => c.put(url.pathname, copy))
              .catch(() => undefined)
          );
        }
        return res;
      })()
    );
    return;
  }
  // API de sincronização: sempre na rede, nunca em cache.
  if (url.pathname.startsWith("/api/")) return;

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

// Lembretes (treino e água) enviados pelo servidor. O iPhone exige mostrar uma notificação a cada push.
self.addEventListener("push", (event) => {
  let msg = { title: "BODYBUILDER", body: "Hora de cuidar do treino.", url: "/", tag: "lembrete" };
  try {
    if (event.data) msg = { ...msg, ...event.data.json() };
  } catch {
    /* mensagem sem JSON: usa o texto padrão */
  }
  event.waitUntil(
    self.registration.showNotification(msg.title, {
      body: msg.body,
      tag: msg.tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      lang: "pt-BR",
      data: { url: msg.url }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of list) {
        if ("focus" in c) {
          await c.focus();
          if ("navigate" in c) await c.navigate(url).catch(() => undefined);
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
