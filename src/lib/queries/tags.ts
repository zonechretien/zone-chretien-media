import { prisma } from "@/lib/db";

export function getTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}
