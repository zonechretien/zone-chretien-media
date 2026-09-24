"use server";

import { requireSession } from "@/lib/admin/session";
import { lookupPassage, type PassageResult } from "@/lib/bible/lsg1910";

/**
 * Texte LSG 1910 d'une référence saisie dans l'éditeur de Reels
 * (« Ps 34.8 », « Jean 3:16-17 », « 1 Co 13:4 »…). Lu dans le fichier du dépôt,
 * sans service externe.
 */
export async function lookupBiblePassage(reference: string): Promise<PassageResult> {
  await requireSession();
  if (typeof reference !== "string" || reference.length > 100) return { ok: false, error: "Référence invalide." };
  return lookupPassage(reference);
}
