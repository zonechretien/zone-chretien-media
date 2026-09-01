import type { Metadata } from "next";
import { requireSession } from "@/lib/admin/session";
import { prisma } from "@/lib/db";
import { ResourceForm } from "@/components/admin/forms/resource-form";

export const metadata: Metadata = { title: "Nouvelle ressource" };

export default async function NewResourcePage() {
  await requireSession();
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ where: { type: "RESOURCE" }, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">Nouvelle ressource</h1>
      <ResourceForm categories={categories} tags={tags} />
    </div>
  );
}
