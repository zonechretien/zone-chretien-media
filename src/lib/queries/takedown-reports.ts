import { prisma } from "@/lib/db";

export function getTakedownReports() {
  return prisma.takedownReport.findMany({ orderBy: { createdAt: "desc" } });
}

export function getTakedownReportById(id: string) {
  return prisma.takedownReport.findUnique({ where: { id } });
}

export function countNewTakedownReports() {
  return prisma.takedownReport.count({ where: { status: "NEW" } });
}
