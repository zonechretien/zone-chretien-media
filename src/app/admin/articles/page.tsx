import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteArticle } from "@/lib/actions/articles";
import { formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "Articles" };

export default async function AdminArticlesPage() {
  await requireSession();
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, author: true },
  });

  return (
    <div>
      <AdminPageHeader title="Articles" newHref="/admin/articles/nouveau" />
      <AdminTable
        rows={articles}
        columns={[
          { header: "Titre", cell: (a) => <span className="font-medium text-foreground">{a.title}</span> },
          { header: "Auteur", cell: (a) => a.author.name ?? a.author.email },
          { header: "Catégorie", cell: (a) => a.category?.name ?? "—" },
          { header: "Statut", cell: (a) => (a.published ? "Publié" : "Brouillon") },
          { header: "Date", cell: (a) => formatDateShort(a.publishedAt ?? a.createdAt) },
        ]}
        actions={(a) => (
          <RowActions editHref={`/admin/articles/${a.id}`} onDelete={deleteArticle.bind(null, a.id)} itemLabel={a.title} />
        )}
        emptyMessage="Aucun article pour le moment."
      />
    </div>
  );
}
