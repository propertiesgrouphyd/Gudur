/* =========================================
   VIDHWAAN VILLAGE MARKETPLACE
   SERVICE WORKER
========================================= */

const CACHE_NAME = "vidhwaan-village-v22";

/* =========================================
   STATIC ASSETS
========================================= */

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/main.css",
  "/app.js",
  "/manifest.json",
  "/favicon.ico",
  "/icons/logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

/* =========================================
   INSTALL
========================================= */

self.addEventListener("install", event => {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );

});

/* =========================================
   ACTIVATE
========================================= */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys().then(keys =>

      Promise.all(

        keys.map(key => {

          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }

        })

      )

    ).then(() => self.clients.claim())

  );

});

/* =========================================
   FETCH
========================================= */

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  /* Ignore browser extensions and unsupported schemes */

  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ) {
    return;
  }

  /* Never cache external requests */

  if (url.origin !== self.location.origin) {
    return;
  }

  /* Network First for HTML */

  if (
    event.request.mode === "navigate" ||
    event.request.destination === "document"
  ) {

    event.respondWith(

      fetch(event.request)

        .then(response => {

          if (
            response &&
            response.ok &&
            !response.redirected
          ) {

            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {

              cache.put(event.request, copy);

            });

          }

          return response;

        })

        .catch(() => caches.match(event.request))

    );

    return;

  }

  /* Cache First for static files */

  event.respondWith(

    caches.match(event.request)

      .then(cache => {

        if (cache) {
          return cache;
        }

        return fetch(event.request)

          .then(response => {

            if (
              !response ||
              !response.ok ||
              response.redirected ||
              response.type !== "basic"
            ) {

              return response;

            }

            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {

              cache.put(event.request, copy);

            });

            return response;

          });

      })

      .catch(() => {

        if (event.request.destination === "image") {

          return caches.match("/icons/icon-192.png");

        }

      })

  );

});

/* =========================================
   MESSAGE
========================================= */

self.addEventListener("message", event => {

  if (
    event.data &&
    event.data.type === "SKIP_WAITING"
  ) {

    self.skipWaiting();

  }

});

/* =========================================
   PUSH
========================================= */

self.addEventListener("push", event => {

  if (!event.data) {
    return;
  }

  const data = event.data.json();

  event.waitUntil(

    self.registration.showNotification(

      data.title || "Village Marketplace",

      {
        body: data.body || "",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png"
      }

    )

  );

});

/* =========================================
   NOTIFICATION CLICK
========================================= */

self.addEventListener("notificationclick", event => {

  event.notification.close();

  event.waitUntil(

    clients.openWindow("/")

  );

});
