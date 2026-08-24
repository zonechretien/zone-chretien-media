import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { requireSuperAdmin } from "@/lib/admin/session";
import { listTeamMembers } from "@/lib/admin/users-service";
import { formatDateShort } from "@/lib/utils";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { TeamMemberActions } from "@/components/admin/team-member-actions";

export const metadata: Metadata = { title: "Utilisateurs" };

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Éditeur",
};

export default async function AdminUsersPage() {
  const session = await requireSuperAdmin();
  const members = await listTeamMembers();

  return (
    <div>
      <AdminPageHeader title="Utilisateurs" newHref="/admin/utilisateurs/nouveau" newLabel="Ajouter un éditeur" />
      <AdminTable
        rows={members}
        columns={[
          {
            header: "Nom",
            cell: (u) => (
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                {u.name ?? "—"}
                {u.role === "SUPER_ADMIN" && (
                  <span title="Compte protégé — ne peut pas être modifié">
                    <ShieldCheck size={14} className="text-gold" />
                  </span>
                )}
              </span>
            ),
          },
          { header: "Email", cell: (u) => u.email },
          { header: "Rôle", cell: (u) => ROLE_LABELS[u.role] ?? u.role },
          {
            header: "Statut",
            cell: (u) =>
              u.active ? (
                <span className="text-green-600">Actif</span>
              ) : (
                <span className="text-muted">Désactivé</span>
              ),
          },
          { header: "Depuis", cell: (u) => formatDateShort(u.createdAt) },
        ]}
        actions={(u) =>
          u.role === "SUPER_ADMIN" || u.id === session.user.id ? (
            <span className="text-xs text-muted">Protégé</span>
          ) : (
            <TeamMemberActions id={u.id} role={u.role} active={u.active} />
          )
        }
        emptyMessage="Aucun compte pour le moment."
      />
    </div>
  );
}
