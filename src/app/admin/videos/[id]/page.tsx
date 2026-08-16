import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { VideoForm } from "@/components/admin/forms/video-form";

export const metadata: Metadata = { title: "Modifier la vidéo" };

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const [video, artists, categories] = await Promise.all([
    prisma.video.findUnique({ where: { id } }),
    prisma.artist.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { type: "VIDEO" }, orderBy: { name: "asc" } }),
  ]);
  if (!video) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {video.title} »</h1>
      <VideoForm video={video} artists={artists} categories={categories} />
    </div>
  );
}
