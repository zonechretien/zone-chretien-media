import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // La page /admin/login gère elle-même son propre écran (pas de session requise).
  if (!session?.user) return <>{children}</>;

  // Le rôle du JWT peut être périmé (ex: rétrogradé par le SUPER_ADMIN pendant
  // qu'une session est encore active ailleurs) — le menu affiché doit
  // refléter le rôle réel, pas seulement bloquer l'accès aux pages qui, elles,
  // revérifient déjà la base via requireSession()/requireAdminRole().
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const role = dbUser?.role ?? session.user.role;

  return (
    <AdminShell name={session.user.name ?? session.user.email ?? "Administrateur"} role={role}>
      {children}
    </AdminShell>
  );
}
