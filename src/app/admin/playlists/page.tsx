import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { RowActions } from "@/components/admin/row-actions";
import { deletePlaylist } from "@/lib/actions/playlists";
import { formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "Playlists" };

const PLAYLIST_TYPE_LABELS: Record<string, string> = {
  EDITORIALE: "Éditoriale",
  TOP_SEMAINE: "🔥 Top semaine",
  TOP_TOUJOURS: "🔥 Top toujours",
};

export default async function AdminPlaylistsPage() {
  await requireSession();
  const playlists = await prisma.playlist.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { songs: true } } },
  });

  return (
    <div>
      <AdminPageHeader title="Playlists" newHref="/admin/playlists/nouveau" />
      <AdminTable
        rows={playlists}
        columns={[
          { header: "Titre", cell: (p) => <span className="font-medium text-foreground">{p.title}</span> },
          { header: "Type", cell: (p) => PLAYLIST_TYPE_LABELS[p.type] ?? p.type },
          { header: "Chansons", cell: (p) => (p.type === "EDITORIALE" ? p._count.songs : "auto") },
          { header: "Ordre", cell: (p) => p.order },
          { header: "Statut", cell: (p) => (p.published ? "Publiée" : "Brouillon") },
          { header: "Date", cell: (p) => formatDateShort(p.publishedAt ?? p.createdAt) },
        ]}
        actions={(p) => (
          <RowActions
            editHref={`/admin/playlists/${p.id}`}
            onDelete={deletePlaylist.bind(null, p.id)}
            itemLabel={p.title}
          />
        )}
        emptyMessage="Aucune playlist pour le moment. Cliquez sur « Ajouter » pour créer la première."
      />
    </div>
  );
}
