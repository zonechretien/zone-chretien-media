import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminRole } from "@/lib/admin/session";
import { getTakedownReports } from "@/lib/queries/takedown-reports";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { TAKEDOWN_STATUS_LABELS } from "@/lib/validations/takedown-reports";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Signalements" };

const STATUS_BADGE_CLASS: Record<string, string> = {
  NEW: "bg-red-500/10 text-red-500",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  RESOLVED: "bg-green-500/10 text-green-600 dark:text-green-400",
};

export default async function AdminSignalementsPage() {
  await requireAdminRole();
  const reports = await getTakedownReports();

  return (
    <div>
      <AdminPageHeader title="Signalements" />
      <p className="mb-6 -mt-4 text-sm text-muted">
        Demandes de retrait ou signalements de problèmes de droits reçus depuis le site public.
      </p>
      <AdminTable
        rows={reports}
        columns={[
          {
            header: "Contenu",
            cell: (r) => (
              <div>
                <p className="font-medium text-foreground">{r.contentTitle ?? "Non spécifié"}</p>
                <p className="text-xs text-muted">{r.requesterName} — {r.requesterEmail}</p>
              </div>
            ),
          },
          { header: "Date", cell: (r) => formatDate(r.createdAt) },
          {
            header: "Statut",
            cell: (r) => (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[r.status]}`}>
                {TAKEDOWN_STATUS_LABELS[r.status]}
              </span>
            ),
          },
        ]}
        actions={(r) => (
          <Link
            href={`/admin/signalements/${r.id}`}
            className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:border-gold hover:text-gold"
          >
            Voir
          </Link>
        )}
        emptyMessage="Aucun signalement reçu pour le moment."
      />
    </div>
  );
}
