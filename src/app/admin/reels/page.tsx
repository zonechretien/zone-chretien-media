import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteReel } from "@/lib/actions/reels";
import { REEL_STATUS_LABELS } from "@/lib/validations/reels";
import { SOURCE_INFO, isReelSourceType, parseSourceFilter } from "@/lib/reels/sources";
import { TEMPLATE_METAS, isTemplateId } from "@reels/template-meta";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Reels" };

export default async function AdminReelsPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  await requireSession();
  const filter = parseSourceFilter((await searchParams).source);
  const reels = await prisma.reelProject.findMany({
    where: filter ?? undefined,
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <AdminPageHeader title="Reels" newHref="/admin/reels/nouveau" newLabel="Nouveau Reel" />
      <p className="-mt-3 mb-6 text-sm text-muted">
        Les vidéos sont rendues sur votre PC par le studio local, puis enregistrées sur le disque Zone-Chrétien.
      </p>
      {filter && (
        <p className="mb-4 text-sm text-foreground/80">
          Reels créés depuis ce {SOURCE_INFO[filter.sourceType].label.toLowerCase()} —{" "}
          <Link href="/admin/reels" className="text-gold hover:underline">voir tous les Reels</Link>
        </p>
      )}
      <AdminTable
        rows={reels}
        columns={[
          { header: "Titre", cell: (r) => <span className="font-medium text-foreground">{r.title}</span> },
          { header: "Template", cell: (r) => (isTemplateId(r.templateId) ? TEMPLATE_METAS[r.templateId].label : r.templateId) },
          { header: "Format", cell: (r) => r.format },
          { header: "Statut", cell: (r) => REEL_STATUS_LABELS[r.status] },
          {
            header: "Source",
            cell: (r) =>
              r.sourceType && r.sourceId && isReelSourceType(r.sourceType) ? (
                <Link href={`${SOURCE_INFO[r.sourceType].adminPath}/${r.sourceId}`} className="text-gold hover:underline">
                  {SOURCE_INFO[r.sourceType].label}
                </Link>
              ) : (
                "—"
              ),
          },
          { header: "Modifié le", cell: (r) => formatDate(r.updatedAt) },
          {
            header: "Dernier export",
            cell: (r) => (r.lastExportPath ? <code className="text-xs" title={r.lastExportPath}>{r.lastExportPath.split("/").pop()}</code> : "—"),
          },
        ]}
        actions={(r) => <RowActions editHref={`/admin/reels/${r.id}`} onDelete={deleteReel.bind(null, r.id)} itemLabel={r.title} />}
        emptyMessage={
          filter ? "Aucun Reel créé depuis ce contenu." : "Aucun Reel pour le moment. Créez-en un à partir d'un template, ou avec « Transformer en Reel » sur un verset ou une dévotion."
        }
      />
    </div>
  );
}
