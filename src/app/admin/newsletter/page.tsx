import type { Metadata } from "next";
import { requireAdminRole } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { formatDateShort } from "@/lib/utils";
import { AdminTable } from "@/components/admin/admin-table";
import { DeleteOnlyAction } from "@/components/admin/delete-only-action";
import { NewsletterExportButton } from "@/components/admin/newsletter-export-button";
import { deleteNewsletterSubscriber } from "@/lib/actions/newsletter";

export const metadata: Metadata = { title: "Newsletter" };

export default async function AdminNewsletterPage() {
  await requireAdminRole();
  const subscribers = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Newsletter <span className="text-base font-normal text-muted">({subscribers.length} abonné{subscribers.length > 1 ? "s" : ""})</span>
        </h1>
        <NewsletterExportButton subscribers={subscribers} />
      </div>
      <AdminTable
        rows={subscribers}
        columns={[
          { header: "Email", cell: (s) => <span className="font-medium text-foreground">{s.email}</span> },
          { header: "Prénom", cell: (s) => s.firstName ?? "—" },
          { header: "Inscrit le", cell: (s) => formatDateShort(s.createdAt) },
        ]}
        actions={(s) => (
          <DeleteOnlyAction onDelete={deleteNewsletterSubscriber.bind(null, s.id)} itemLabel={s.email} />
        )}
        emptyMessage="Aucun abonné pour le moment."
      />
    </div>
  );
}
