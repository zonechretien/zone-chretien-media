import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { PlaylistForm } from "@/components/admin/forms/playlist-form";

export const metadata: Metadata = { title: "Modifier la playlist" };

export default async function EditPlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;

  const [playlist, songsRaw] = await Promise.all([
    prisma.playlist.findUnique({
      where: { id },
      include: { songs: { orderBy: { position: "asc" }, select: { songId: true } } },
    }),
    prisma.song.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, imageUrl: true, artist: { select: { name: true } } },
    }),
  ]);
  if (!playlist) notFound();

  const songs = songsRaw.map((s) => ({ id: s.id, title: s.title, imageUrl: s.imageUrl, artistName: s.artist.name }));
  const songIds = playlist.songs.map((s) => s.songId);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {playlist.title} »</h1>
      <PlaylistForm playlist={playlist} songIds={songIds} songs={songs} />
    </div>
  );
}
