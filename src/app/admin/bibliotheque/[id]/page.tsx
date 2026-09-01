import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { ResourceForm } from "@/components/admin/forms/resource-form";

export const metadata: Metadata = { title: "Modifier la ressource" };

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const [resource, categories, tags] = await Promise.all([
    prisma.resource.findUnique({ where: { id }, include: { tags: true } }),
    prisma.category.findMany({ where: { type: "RESOURCE" }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!resource) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Modifier « {resource.title} »</h1>
      <ResourceForm resource={resource} categories={categories} tags={tags} />
    </div>
  );
}
