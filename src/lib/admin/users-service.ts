import bcrypt from "bcryptjs";
import { Prisma, type Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin/session";
import { assertNotProtectedSuperAdmin, ForbiddenError } from "@/lib/admin/permissions";
import { createTeamMemberSchema, type CreateTeamMemberInput } from "@/lib/validations/users";

/**
 * Cœur autorisé de la gestion d'équipe — chaque fonction revérifie elle-même
 * que l'appelant est SUPER_ADMIN (jamais confiance dans le contexte appelant,
 * qu'il s'agisse d'une Server Action ou d'une route API) et que la cible
 * n'est jamais le compte SUPER_ADMIN protégé. C'est la seule implémentation :
 * les Server Actions (UI) et les routes /api/admin/users/* appellent
 * exactement ce code, pour qu'il n'y ait aucune divergence possible entre
 * les deux surfaces.
 */

const TEAM_MEMBER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export async function listTeamMembers() {
  await requireSuperAdmin();
  return prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: TEAM_MEMBER_SELECT });
}

export async function createTeamMember(input: CreateTeamMemberInput) {
  await requireSuperAdmin();

  const parsed = createTeamMemberSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Formulaire invalide.");

  const hashed = await bcrypt.hash(parsed.data.password, 12);

  try {
    return await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase().trim(),
        password: hashed,
        role: parsed.data.role,
        active: true,
      },
      select: TEAM_MEMBER_SELECT,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("Cette adresse email est déjà utilisée par un autre compte.");
    }
    throw err;
  }
}

export async function setTeamMemberActive(id: string, active: boolean) {
  await requireSuperAdmin();

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new ForbiddenError("Compte introuvable.");
  assertNotProtectedSuperAdmin(target);

  return prisma.user.update({ where: { id }, data: { active }, select: TEAM_MEMBER_SELECT });
}

export async function setTeamMemberRole(id: string, role: Role) {
  await requireSuperAdmin();

  if (role === "SUPER_ADMIN") {
    throw new ForbiddenError("Le rôle SUPER_ADMIN ne peut pas être attribué depuis l'interface.");
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new ForbiddenError("Compte introuvable.");
  assertNotProtectedSuperAdmin(target);

  return prisma.user.update({ where: { id }, data: { role }, select: TEAM_MEMBER_SELECT });
}
