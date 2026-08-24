import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isFullAccessRole } from "@/lib/admin/permissions";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  // La session JWT reste valide même si le compte a été supprimé ou désactivé
  // entre-temps (ex : éditeur révoqué pendant qu'une session est encore active
  // ailleurs) — on vérifie donc l'état réel en base avant de faire confiance à
  // la session (id utilisé comme clé étrangère, ex. Article.authorId ; rôle
  // utilisé pour les autorisations). On redirige vers une route dédiée qui
  // appelle signOut() : impossible de le faire ici (cookies non modifiables
  // pendant le rendu d'un Server Component), et un simple
  // redirect("/admin/login") créerait une boucle infinie avec le middleware
  // Edge, qui fait confiance au JWT sans pouvoir vérifier la base.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, active: true, role: true },
  });
  if (!dbUser || !dbUser.active) redirect("/api/auth/force-signout");

  // Le rôle a pu changer depuis l'émission du JWT (ex: promu/rétrogradé) —
  // on retourne toujours la valeur fraîche de la base, jamais celle du token.
  session.user.role = dbUser.role;

  return session;
}

/** Accès réservé à SUPER_ADMIN + ADMIN (Paramètres, Monétisation, taxonomie…). */
export async function requireAdminRole() {
  const session = await requireSession();
  if (!isFullAccessRole(session.user.role)) redirect("/admin?erreur=acces-refuse");
  return session;
}

/** Accès réservé au SUPER_ADMIN seul (gestion des comptes). */
export async function requireSuperAdmin() {
  const session = await requireSession();
  if (session.user.role !== "SUPER_ADMIN") redirect("/admin?erreur=acces-refuse");
  return session;
}

/**
 * Variante sans redirection, pour les routes API (/api/admin/**) : un
 * handler HTTP doit répondre 401/403 en JSON, pas rediriger comme une page.
 * Revérifie l'état frais en base (comme requireSession) sans jamais faire
 * confiance au seul JWT.
 */
export async function getApiSessionUser() {
  const session = await auth();
  if (!session?.user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, active: true, role: true },
  });
  if (!dbUser || !dbUser.active) return null;

  return dbUser;
}
