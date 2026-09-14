import { NextResponse } from "next/server";
import { sendDailyVerseNotification } from "@/lib/push";

/**
 * Déclenché par le Vercel Cron Job (voir vercel.json) chaque matin, et
 * appelable manuellement (même en-tête) pour tester un envoi sans attendre
 * l'horaire programmé. Vercel ajoute automatiquement l'en-tête Authorization
 * sur ses propres appels dès que CRON_SECRET est défini sur le projet.
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET non configuré." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const result = await sendDailyVerseNotification();
  return NextResponse.json(result);
}
