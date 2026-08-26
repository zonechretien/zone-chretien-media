import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteInspiration } from "@/lib/actions/inspirations";
import { formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "Inspirations" };

export default async function AdminInspirationsPage() {
  await requireSession();
  const inspirations = await prisma.inspiration.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return (
    <div>
      <AdminPageHeader title="Inspirations" newHref="/admin/inspirations/nouveau" />
      <AdminTable
        rows={inspirations}
        columns={[
          { header: "Titre", cell: (i) => <span className="font-medium text-foreground">{i.title}</span> },
          { header: "Catégorie", cell: (i) => i.category?.name ?? "—" },
          { header: "Statut", cell: (i) => (i.published ? "Publié" : "Brouillon") },
          { header: "Date", cell: (i) => formatDateShort(i.publishedAt ?? i.createdAt) },
        ]}
        actions={(i) => (
          <RowActions
            editHref={`/admin/inspirations/${i.id}`}
            onDelete={deleteInspiration.bind(null, i.id)}
            itemLabel={i.title}
          />
        )}
        emptyMessage="Aucune inspiration pour le moment."
      />
    </div>
  );
}
