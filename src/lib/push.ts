import webpush from "web-push";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import { getVerseOfDay } from "@/lib/queries/verses";
import { dateToUrlSlug, truncate } from "@/lib/utils";

let vapidConfigured = false;

// Le protocole Web Push exige un "subject" en https: ou mailto: — en local,
// NEXT_PUBLIC_SITE_URL vaut http://localhost:3000, invalide pour web-push.
// On retombe alors sur un mailto de contact générique, uniquement pour que
// l'envoi soit testable en dev ; en production SITE_URL est déjà en https.
const VAPID_SUBJECT = SITE_URL.startsWith("https:") ? SITE_URL : "mailto:contact@zone-chretien-media.com";

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Clés VAPID manquantes (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).");
  }
  webpush.setVapidDetails(VAPID_SUBJECT, publicKey, privateKey);
  vapidConfigured = true;
}

/**
 * Envoie la notification "verset du jour" à tous les abonnés enregistrés.
 * Nettoie automatiquement les abonnements devenus invalides (désinstallation,
 * permission révoquée : la réponse du service push est alors 404/410).
 */
export async function sendDailyVerseNotification() {
  ensureVapidConfigured();

  const verse = await getVerseOfDay();
  if (!verse) {
    return { sent: 0, failed: 0, cleaned: 0, reason: "no-verse" as const };
  }

  const subscriptions = await prisma.pushSubscription.findMany();
  const url = `/versets/${dateToUrlSlug(verse.date)}`;
  const payload = JSON.stringify({
    title: "Votre verset du jour est arrivé 🙏",
    body: `${verse.reference} — ${truncate(verse.text, 120)}`,
    url,
    icon: "/icons/icon-192",
    badge: "/icons/icon-192",
  });

  let sent = 0;
  let failed = 0;
  const invalidEndpoints: string[] = [];

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      ),
    ),
  );

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      sent += 1;
      return;
    }
    failed += 1;
    const statusCode = (result.reason as { statusCode?: number } | undefined)?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      invalidEndpoints.push(subscriptions[i].endpoint);
    }
  });

  if (invalidEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: invalidEndpoints } } });
  }

  return { sent, failed, cleaned: invalidEndpoints.length, verseReference: verse.reference, url };
}
