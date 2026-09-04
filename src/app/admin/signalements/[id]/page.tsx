import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, Pencil, User } from "lucide-react";
import { requireAdminRole } from "@/lib/admin/session";
import { getTakedownReportById } from "@/lib/queries/takedown-reports";
import { CONTENT_TYPE_ADMIN_ROUTE } from "@/lib/validations/takedown-reports";
import { formatDate } from "@/lib/utils";
import { TakedownReportActions } from "@/components/admin/takedown-report-actions";

export const metadata: Metadata = { title: "Signalement" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminSignalementDetailPage({ params }: Props) {
  await requireAdminRole();
  const { id } = await params;
  const report = await getTakedownReportById(id);
  if (!report) notFound();

  const adminRoute = report.contentType ? CONTENT_TYPE_ADMIN_ROUTE[report.contentType as keyof typeof CONTENT_TYPE_ADMIN_ROUTE] : undefined;
  const adminEditHref = adminRoute && report.contentId ? `${adminRoute}/${report.contentId}` : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/signalements" className="mb-6 flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground">
        <ArrowLeft size={14} /> Retour aux signalements
      </Link>

      <div className="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-7">
        <h1 className="mb-1 text-xl font-bold text-foreground">
          {report.contentTitle ?? "Contenu non spécifié"}
        </h1>
        <p className="mb-5 text-sm text-muted">Reçu le {formatDate(report.createdAt)}</p>

        <div className="mb-5 flex flex-col gap-2 text-sm">
          <span className="flex items-center gap-2 text-foreground">
            <User size={14} className="text-gold" /> {report.requesterName}
          </span>
          <a href={`mailto:${report.requesterEmail}`} className="flex items-center gap-2 text-foreground hover:text-gold">
            <Mail size={14} className="text-gold" /> {report.requesterEmail}
          </a>
        </div>

        <div className="mb-6 rounded-xl bg-surface p-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Description du problème</p>
          <p className="whitespace-pre-wrap text-sm text-foreground/90">{report.message}</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {report.contentUrl && (
            <a
              href={report.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-foreground/80 transition hover:border-gold hover:text-gold"
            >
              <ExternalLink size={14} /> Voir la page publique
            </a>
          )}
          {adminEditHref && (
            <Link
              href={adminEditHref}
              className="flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-sm font-medium text-white transition hover:bg-navy-light"
            >
              <Pencil size={14} /> Gérer ce contenu (dépublier si nécessaire)
            </Link>
          )}
        </div>

        <div className="border-t border-border pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Statut</p>
          <TakedownReportActions id={report.id} status={report.status} />
        </div>
      </div>
    </div>
  );
}
