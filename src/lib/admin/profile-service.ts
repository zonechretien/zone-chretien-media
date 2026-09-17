import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/admin/session";
import { ForbiddenError } from "@/lib/admin/permissions";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/profile";

/**
 * Changement de son propre mot de passe — distinct de users-service.ts
 * (gestion d'équipe, réservée au SUPER_ADMIN) : ici n'importe quel rôle agit
 * sur son propre compte, y compris le SUPER_ADMIN protégé (la protection de
 * users-service.ts ne concerne que la modification d'un compte PAR un autre).
 */
export async function changeOwnPassword(input: ChangePasswordInput): Promise<void> {
  const session = await requireSession();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Formulaire invalide.");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) throw new ForbiddenError("Compte invalide.");

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) throw new ForbiddenError("Mot de passe actuel incorrect.");

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
}
