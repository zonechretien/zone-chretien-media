import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { TagForm } from "@/components/admin/forms/tag-form";

export const metadata: Metadata = { title: "Modifier le tag" };

export default async function EditTagPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {tag.name} »</h1>
      <TagForm tag={tag} />
    </div>
  );
}
