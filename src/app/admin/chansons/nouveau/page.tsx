import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { SongForm } from "@/components/admin/forms/song-form";

export const metadata: Metadata = { title: "Nouvelle chanson" };

export default async function NewSongPage() {
  await requireSession();
  const [artists, categories, tags] = await Promise.all([
    prisma.artist.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { type: "SONG" }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouvelle chanson</h1>
      <SongForm artists={artists} categories={categories} tags={tags} />
    </div>
  );
}
