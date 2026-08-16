import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteBanner } from "@/lib/actions/banners";
import { BANNER_TYPE_LABELS } from "@/lib/validations/banners";

export const metadata: Metadata = { title: "Monétisation" };

export default async function AdminBannersPage() {
  await requireAdminRole();
  const banners = await prisma.banner.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <AdminPageHeader title="Monétisation" newHref="/admin/banners/nouveau" />
      <p className="mb-6 -mt-4 text-sm text-muted">
        Google AdSense, artistes sponsorisés, événements sponsorisés et bannières partenaires.
      </p>
      <AdminTable
        rows={banners}
        columns={[
          { header: "Titre", cell: (b) => <span className="font-medium text-foreground">{b.title}</span> },
          { header: "Type", cell: (b) => BANNER_TYPE_LABELS[b.type] },
          { header: "Emplacement", cell: (b) => b.position ?? "—" },
          { header: "Statut", cell: (b) => (b.active ? "Actif" : "Inactif") },
        ]}
        actions={(b) => (
          <RowActions editHref={`/admin/banners/${b.id}`} onDelete={deleteBanner.bind(null, b.id)} itemLabel={b.title} />
        )}
        emptyMessage="Aucune zone de monétisation configurée."
      />
    </div>
  );
}
