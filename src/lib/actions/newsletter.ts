"use server";

import { prisma } from "@/lib/db";
import { requireAdminRole } from "@/lib/admin/session";
import { newsletterSchema, type NewsletterInput } from "@/lib/validations/newsletter";

export async function subscribeNewsletter(input: NewsletterInput): Promise<{ error?: string }> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) return { error: "Adresse email invalide." };

  const email = parsed.data.email.toLowerCase().trim();
  const firstName = parsed.data.firstName || null;

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: firstName ? { firstName } : {},
    create: { email, firstName },
  });

  return {};
}

export async function deleteNewsletterSubscriber(id: string): Promise<{ error?: string } | void> {
  await requireAdminRole();
  await prisma.newsletterSubscriber.delete({ where: { id } });
}
