import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteReadingPlanAction } from "@/lib/actions/reading-plans";
import { formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "Plans de lecture" };

export default async function AdminReadingPlansPage() {
  await requireSession();
  const plans = await prisma.readingPlan.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { days: true } } },
  });

  return (
    <div>
      <AdminPageHeader title="Plans de lecture" newHref="/admin/plans-lecture/nouveau" />
      <AdminTable
        rows={plans}
        columns={[
          { header: "Titre", cell: (p) => <span className="font-medium text-foreground">{p.title}</span> },
          { header: "Durée", cell: (p) => `${p.durationDays} jours` },
          { header: "Jours configurés", cell: (p) => p._count.days },
          { header: "Statut", cell: (p) => (p.published ? "Publié" : "Brouillon") },
          { header: "Créé le", cell: (p) => formatDateShort(p.createdAt) },
        ]}
        actions={(p) => (
          <RowActions
            editHref={`/admin/plans-lecture/${p.id}`}
            onDelete={deleteReadingPlanAction.bind(null, p.id)}
            itemLabel={p.title}
          />
        )}
        emptyMessage="Aucun plan de lecture pour le moment. Cliquez sur « Ajouter » pour créer le premier."
      />
    </div>
  );
}
