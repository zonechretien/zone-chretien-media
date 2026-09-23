import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteReel } from "@/lib/actions/reels";
import { REEL_STATUS_LABELS } from "@/lib/validations/reels";
import { TEMPLATE_METAS, isTemplateId } from "@reels/template-meta";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Reels" };

export default async function AdminReelsPage() {
  await requireSession();
  const reels = await prisma.reelProject.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <div>
      <AdminPageHeader title="Reels" newHref="/admin/reels/nouveau" newLabel="Nouveau Reel" />
      <p className="-mt-3 mb-6 text-sm text-muted">
        Les vidéos sont rendues sur votre PC par le studio local, puis enregistrées sur le disque Zone-Chrétien.
      </p>
      <AdminTable
        rows={reels}
        columns={[
          { header: "Titre", cell: (r) => <span className="font-medium text-foreground">{r.title}</span> },
          { header: "Template", cell: (r) => (isTemplateId(r.templateId) ? TEMPLATE_METAS[r.templateId].label : r.templateId) },
          { header: "Format", cell: (r) => r.format },
          { header: "Statut", cell: (r) => REEL_STATUS_LABELS[r.status] },
          { header: "Modifié le", cell: (r) => formatDate(r.updatedAt) },
          {
            header: "Dernier export",
            cell: (r) => (r.lastExportPath ? <code className="text-xs" title={r.lastExportPath}>{r.lastExportPath.split("/").pop()}</code> : "—"),
          },
        ]}
        actions={(r) => <RowActions editHref={`/admin/reels/${r.id}`} onDelete={deleteReel.bind(null, r.id)} itemLabel={r.title} />}
        emptyMessage="Aucun Reel pour le moment. Créez-en un à partir d'un template."
      />
    </div>
  );
}
