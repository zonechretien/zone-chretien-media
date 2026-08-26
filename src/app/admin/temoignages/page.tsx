import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteTestimony } from "@/lib/actions/testimonies";
import { formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "Témoignages" };

export default async function AdminTestimoniesPage() {
  await requireSession();
  const testimonies = await prisma.testimony.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <AdminPageHeader title="Témoignages" newHref="/admin/temoignages/nouveau" />
      <AdminTable
        rows={testimonies}
        columns={[
          { header: "Titre", cell: (t) => <span className="font-medium text-foreground">{t.title}</span> },
          { header: "Auteur", cell: (t) => t.authorName },
          { header: "Statut", cell: (t) => (t.published ? "Publié" : "Brouillon") },
          { header: "Date", cell: (t) => formatDateShort(t.publishedAt ?? t.createdAt) },
        ]}
        actions={(t) => (
          <RowActions editHref={`/admin/temoignages/${t.id}`} onDelete={deleteTestimony.bind(null, t.id)} itemLabel={t.title} />
        )}
        emptyMessage="Aucun témoignage pour le moment."
      />
    </div>
  );
}
