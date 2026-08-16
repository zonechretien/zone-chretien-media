import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteDevotion } from "@/lib/actions/devotions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dévotions" };

export default async function AdminDevotionsPage() {
  await requireSession();
  const devotions = await prisma.devotion.findMany({ orderBy: { date: "desc" } });

  return (
    <div>
      <AdminPageHeader title="Dévotions" newHref="/admin/devotions/nouveau" />
      <AdminTable
        rows={devotions}
        columns={[
          { header: "Titre", cell: (d) => <span className="font-medium text-foreground">{d.title}</span> },
          { header: "Verset", cell: (d) => d.mainVerseRef },
          { header: "Date", cell: (d) => formatDate(d.date) },
          { header: "Statut", cell: (d) => (d.published ? "Publié" : "Brouillon") },
        ]}
        actions={(d) => (
          <RowActions editHref={`/admin/devotions/${d.id}`} onDelete={deleteDevotion.bind(null, d.id)} itemLabel={d.title} />
        )}
        emptyMessage="Aucune dévotion pour le moment."
      />
    </div>
  );
}
