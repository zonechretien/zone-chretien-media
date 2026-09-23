import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

// Studio local des Reels (http://127.0.0.1:4317) : requêtes jamais interceptées.
// Relayées par le service worker, elles échouent depuis le site HTTPS : Chrome
// n'affiche la demande d'accès au réseau local que pour une requête faite par
// la page elle-même. Enregistré avant Serwist pour l'empêcher d'y répondre.
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin && LOCAL_HOSTS.has(url.hostname)) event.stopImmediatePropagation();
});

serwist.addEventListeners();

// --- Notifications push (verset du jour) -------------------------------------
// Indépendant de Serwist (qui ne gère pas le Web Push) : écouteurs natifs
// ajoutés en plus de `serwist.addEventListeners()`.

self.addEventListener("push", (event) => {
  let data: { title?: string; body?: string; url?: string; icon?: string; badge?: string } = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Zone-Chrétien Media", {
      body: data.body,
      icon: data.icon ?? "/icons/icon-192",
      badge: data.badge ?? "/icons/icon-192",
      data: { url: data.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
