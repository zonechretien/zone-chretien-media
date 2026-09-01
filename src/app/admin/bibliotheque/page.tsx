import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteResource } from "@/lib/actions/resources";
import { RESOURCE_TYPE_LABELS } from "@/lib/validations/resources";
import { formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "Bibliothèque" };

export default async function AdminResourcesPage() {
  await requireSession();
  const resources = await prisma.resource.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return (
    <div>
      <AdminPageHeader title="Bibliothèque" newHref="/admin/bibliotheque/nouveau" />
      <AdminTable
        rows={resources}
        columns={[
          { header: "Titre", cell: (r) => <span className="font-medium text-foreground">{r.title}</span> },
          { header: "Type", cell: (r) => RESOURCE_TYPE_LABELS[r.type] },
          { header: "Auteur", cell: (r) => r.author ?? "—" },
          { header: "Catégorie", cell: (r) => r.category?.name ?? "—" },
          { header: "Statut", cell: (r) => (r.published ? "Publié" : "Brouillon") },
          { header: "Date", cell: (r) => formatDateShort(r.publishedAt ?? r.createdAt) },
        ]}
        actions={(r) => (
          <RowActions
            editHref={`/admin/bibliotheque/${r.id}`}
            onDelete={deleteResource.bind(null, r.id)}
            itemLabel={r.title}
          />
        )}
        emptyMessage="Aucune ressource pour le moment."
      />
    </div>
  );
}
