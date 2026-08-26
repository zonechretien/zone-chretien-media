import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deletePrayer } from "@/lib/actions/prayers";
import { PRAYER_CATEGORY_LABELS } from "@/lib/validations/prayers";
import { formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "Prières" };

export default async function AdminPrayersPage() {
  await requireSession();
  const prayers = await prisma.prayer.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <AdminPageHeader title="Prières" newHref="/admin/prieres/nouveau" />
      <AdminTable
        rows={prayers}
        columns={[
          { header: "Titre", cell: (p) => <span className="font-medium text-foreground">{p.title}</span> },
          { header: "Catégorie", cell: (p) => PRAYER_CATEGORY_LABELS[p.category] },
          { header: "Statut", cell: (p) => (p.published ? "Publié" : "Brouillon") },
          { header: "Date", cell: (p) => formatDateShort(p.publishedAt ?? p.createdAt) },
        ]}
        actions={(p) => (
          <RowActions editHref={`/admin/prieres/${p.id}`} onDelete={deletePrayer.bind(null, p.id)} itemLabel={p.title} />
        )}
        emptyMessage="Aucune prière pour le moment."
      />
    </div>
  );
}
