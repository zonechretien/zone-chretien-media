import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteSong } from "@/lib/actions/songs";
import { formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "Chansons" };

export default async function AdminSongsPage() {
  await requireSession();
  const songs = await prisma.song.findMany({
    orderBy: { createdAt: "desc" },
    include: { artist: true, category: true },
  });

  return (
    <div>
      <AdminPageHeader title="Chansons" newHref="/admin/chansons/nouveau" />
      <AdminTable
        rows={songs}
        columns={[
          { header: "Titre", cell: (s) => <span className="font-medium text-foreground">{s.title}</span> },
          { header: "Artiste", cell: (s) => s.artist.name },
          { header: "Catégorie", cell: (s) => s.category?.name ?? "—" },
          { header: "Vues", cell: (s) => s.views },
          { header: "Statut", cell: (s) => (s.published ? "Publié" : "Brouillon") },
          { header: "Date", cell: (s) => formatDateShort(s.publishedAt ?? s.createdAt) },
        ]}
        actions={(s) => (
          <RowActions
            editHref={`/admin/chansons/${s.id}`}
            onDelete={deleteSong.bind(null, s.id)}
            itemLabel={s.title}
          />
        )}
        emptyMessage="Aucune chanson pour le moment. Cliquez sur « Ajouter » pour créer la première."
      />
    </div>
  );
}
