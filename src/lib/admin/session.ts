import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return session;
}

export async function requireAdminRole() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/admin?erreur=acces-refuse");
  return session;
}
