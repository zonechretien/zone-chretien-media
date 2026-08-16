import type { Metadata } from "next";
import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // La page /admin/login gère elle-même son propre écran (pas de session requise).
  if (!session?.user) return <>{children}</>;

  return (
    <AdminShell name={session.user.name ?? session.user.email ?? "Administrateur"} role={session.user.role}>
      {children}
    </AdminShell>
  );
}
