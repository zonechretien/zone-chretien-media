import { z } from "zod";

/** SUPER_ADMIN volontairement exclu : ce rôle ne peut jamais être attribué
 * depuis un formulaire, seulement via le script scripts/set-super-admin.ts. */
export const assignableRoleSchema = z.enum(["ADMIN", "EDITOR"]);

export const createTeamMemberSchema = z.object({
  name: z.string().min(2, "Nom requis (2 caractères min.)"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "Mot de passe requis (8 caractères min.)"),
  role: assignableRoleSchema,
});

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
