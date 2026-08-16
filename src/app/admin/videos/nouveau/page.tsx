import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { VideoForm } from "@/components/admin/forms/video-form";

export const metadata: Metadata = { title: "Nouvelle vidéo" };

export default async function NewVideoPage() {
  await requireSession();
  const [artists, categories] = await Promise.all([
    prisma.artist.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { type: "VIDEO" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouvelle vidéo</h1>
      <VideoForm artists={artists} categories={categories} />
    </div>
  );
}
