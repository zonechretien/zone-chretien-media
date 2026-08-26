import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { PlaylistForm } from "@/components/admin/forms/playlist-form";

export const metadata: Metadata = { title: "Nouvelle playlist" };

export default async function NewPlaylistPage() {
  await requireSession();
  const songsRaw = await prisma.song.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, imageUrl: true, artist: { select: { name: true } } },
  });
  const songs = songsRaw.map((s) => ({ id: s.id, title: s.title, imageUrl: s.imageUrl, artistName: s.artist.name }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouvelle playlist</h1>
      <PlaylistForm songs={songs} />
    </div>
  );
}
