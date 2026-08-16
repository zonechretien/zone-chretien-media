import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteVerse } from "@/lib/actions/verses";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Versets" };

export default async function AdminVersesPage() {
  await requireSession();
  const verses = await prisma.verse.findMany({ orderBy: { date: "desc" } });

  return (
    <div>
      <AdminPageHeader title="Versets du jour" newHref="/admin/versets/nouveau" />
      <AdminTable
        rows={verses}
        columns={[
          { header: "Référence", cell: (v) => <span className="font-medium text-foreground">{v.reference}</span> },
          { header: "Date", cell: (v) => formatDate(v.date) },
          { header: "Statut", cell: (v) => (v.published ? "Publié" : "Brouillon") },
        ]}
        actions={(v) => (
          <RowActions editHref={`/admin/versets/${v.id}`} onDelete={deleteVerse.bind(null, v.id)} itemLabel={v.reference} />
        )}
        emptyMessage="Aucun verset pour le moment."
      />
    </div>
  );
}
