import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  // La session JWT reste valide même si le compte a été supprimé entre-temps
  // (ex : admin révoqué pendant qu'une session est encore active ailleurs) —
  // on vérifie donc que l'utilisateur existe toujours avant de faire confiance
  // à son id (utilisé comme clé étrangère, ex. Article.authorId). On redirige
  // vers une route dédiée qui appelle signOut() : impossible de le faire ici
  // (cookies non modifiables pendant le rendu d'un Server Component), et un
  // simple redirect("/admin/login") créerait une boucle infinie avec le
  // middleware Edge, qui fait confiance au JWT sans pouvoir vérifier la base.
  const exists = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
  if (!exists) redirect("/api/auth/force-signout");

  return session;
}

export async function requireAdminRole() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/admin?erreur=acces-refuse");
  return session;
}
