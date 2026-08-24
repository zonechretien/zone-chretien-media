import { NextResponse } from "next/server";
import { getApiSessionUser } from "@/lib/admin/session";
import { setTeamMemberActive, setTeamMemberRole } from "@/lib/admin/users-service";
import { ForbiddenError } from "@/lib/admin/permissions";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH { active?: boolean, role?: Role } — met à jour un compte d'équipe.
 * Réservé au SUPER_ADMIN ; refuse systématiquement de toucher un compte
 * SUPER_ADMIN cible (voir users-service.ts). C'est l'endpoint à cibler pour
 * vérifier qu'on ne peut pas rétrograder/désactiver le SUPER_ADMIN via l'API.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const actor = await getApiSessionUser();
  if (!actor) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (actor.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Réservé au SUPER_ADMIN." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || (body.active === undefined && body.role === undefined)) {
    return NextResponse.json({ error: "Fournissez `active` et/ou `role`." }, { status: 400 });
  }

  try {
    let user;
    if (body.role !== undefined) user = await setTeamMemberRole(id, body.role);
    if (body.active !== undefined) user = await setTeamMemberActive(id, body.active);
    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    const message = err instanceof Error ? err.message : "Erreur inattendue.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
