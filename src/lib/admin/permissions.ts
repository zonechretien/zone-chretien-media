import type { Role } from "@prisma/client";

/**
 * Source unique de vérité pour les autorisations du CMS. Toute nouvelle route
 * ou action admin doit passer par ces helpers plutôt que de comparer `role`
 * directement, pour éviter que la logique se disperse et diverge.
 */

/** Le SUPER_ADMIN et l'ADMIN ont accès à tout, y compris les sections
 * réservées (Paramètres, Monétisation, taxonomie). Seule la gestion des
 * comptes (/admin/utilisateurs) est réservée au SUPER_ADMIN seul. */
export const FULL_ACCESS_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

/** Modules de contenu accessibles à un EDITOR (création/édition/publication/
 * suppression) — toute section absente de cette liste (Paramètres,
 * Monétisation, Catégories, Tags, Newsletter, Générateur IA, Utilisateurs)
 * lui est fermée par défaut, y compris en accès direct par URL. */
export const EDITOR_ALLOWED_PATH_PREFIXES = [
  "/admin/chansons",
  "/admin/artistes",
  "/admin/videos",
  "/admin/articles",
  "/admin/inspirations",
  "/admin/devotions",
  "/admin/prieres",
  "/admin/versets",
  "/admin/temoignages",
];

export function isFullAccessRole(role: Role): boolean {
  return FULL_ACCESS_ROLES.includes(role);
}

/** Le tableau de bord (/admin exactement) reste visible à tous les rôles connectés. */
export function canAccessAdminPath(role: Role, pathname: string): boolean {
  if (isFullAccessRole(role)) return true;
  if (pathname === "/admin") return true;
  return EDITOR_ALLOWED_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Verrou du compte SUPER_ADMIN : aucune route ni action ne doit jamais
 * changer son rôle, le désactiver ou le supprimer — même un autre SUPER_ADMIN
 * théorique, même via un appel API direct. C'est la seule fonction qui décide
 * ça ; tout code qui mute un compte utilisateur doit l'appeler en premier.
 */
export function assertNotProtectedSuperAdmin(target: { role: Role }): void {
  if (target.role === "SUPER_ADMIN") {
    throw new ForbiddenError("Le compte SUPER_ADMIN est protégé et ne peut pas être modifié.");
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}
