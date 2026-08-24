import { NextResponse } from "next/server";
import { getApiSessionUser } from "@/lib/admin/session";
import { createTeamMember } from "@/lib/admin/users-service";
import { ForbiddenError } from "@/lib/admin/permissions";

/**
 * Surface API directe (en plus des Server Actions utilisées par l'UI) pour
 * la gestion d'équipe — pratique pour vérifier l'autorisation indépendamment
 * de l'interface (ex: `curl` avec la session d'un compte non-SUPER_ADMIN doit
 * recevoir un vrai 403, pas juste un formulaire caché côté client).
 */
export async function POST(request: Request) {
  const actor = await getApiSessionUser();
  if (!actor) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (actor.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Réservé au SUPER_ADMIN." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });

  try {
    const user = await createTeamMember(body);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
