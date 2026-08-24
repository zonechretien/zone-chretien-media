/**
 * Fixe (ou crée) le compte SUPER_ADMIN unique du CMS. À lancer uniquement à la
 * main, en accès direct — il n'existe volontairement AUCUN moyen de créer ou
 * promouvoir un SUPER_ADMIN depuis l'interface admin.
 *
 * Usage : npm run admin:super -- email@example.com ["Nom"] ["MotDePasse"]
 *
 * - Si le compte existe déjà : le passe en SUPER_ADMIN + actif (le mot de
 *   passe n'est changé que si fourni).
 * - Si le compte n'existe pas : le mot de passe devient obligatoire.
 * - Refuse si un AUTRE compte est déjà SUPER_ADMIN (garde-fou contre la
 *   création accidentelle d'un deuxième compte protégé) — utiliser
 *   --force pour rétrograder l'ancien SUPER_ADMIN en ADMIN au passage.
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--force");
  const force = process.argv.includes("--force");
  const [email, name, password] = args;

  if (!email) {
    console.error('Usage: npm run admin:super -- <email> ["Nom"] ["MotDePasse"] [--force]');
    process.exit(1);
  }

  const existingSuperAdmin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (existingSuperAdmin && existingSuperAdmin.email !== email) {
    if (!force) {
      console.error(
        `Un autre compte est déjà SUPER_ADMIN : ${existingSuperAdmin.email}.\n` +
          `Relancez avec --force pour le rétrograder en ADMIN et transférer le rôle à ${email}.`,
      );
      process.exit(1);
    }
    await prisma.user.update({ where: { id: existingSuperAdmin.id }, data: { role: "ADMIN" } });
    console.log(`Ancien SUPER_ADMIN rétrogradé en ADMIN : ${existingSuperAdmin.email}`);
  }

  const target = await prisma.user.findUnique({ where: { email } });

  if (!target && !password) {
    console.error("Ce compte n'existe pas encore : un mot de passe est requis pour le créer.");
    process.exit(1);
  }
  if (password && password.length < 8) {
    console.error("Le mot de passe doit contenir au moins 8 caractères.");
    process.exit(1);
  }

  const hashed = password ? await bcrypt.hash(password, 12) : undefined;

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "SUPER_ADMIN", active: true, ...(name ? { name } : {}), ...(hashed ? { password: hashed } : {}) },
    create: { email, name: name ?? "Super Admin", password: hashed, role: "SUPER_ADMIN", active: true },
  });

  console.log(`SUPER_ADMIN prêt : ${user.email} (id: ${user.id})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
