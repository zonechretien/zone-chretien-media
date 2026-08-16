import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { SongForm } from "@/components/admin/forms/song-form";

export const metadata: Metadata = { title: "Modifier la chanson" };

export default async function EditSongPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;

  const [song, artists, categories, tags] = await Promise.all([
    prisma.song.findUnique({ where: { id }, include: { tags: true } }),
    prisma.artist.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { type: "SONG" }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!song) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {song.title} »</h1>
      <SongForm song={song} artists={artists} categories={categories} tags={tags} />
    </div>
  );
}
