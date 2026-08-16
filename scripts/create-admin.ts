/**
 * Crée ou met à jour un compte administrateur du CMS.
 * Usage : npm run admin:create -- admin@example.com "MotDePasse123!" "Nom Admin"
 */
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

async function main() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password) {
    console.error(
      'Usage: npm run admin:create -- <email> <mot-de-passe> ["Nom"]',
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Le mot de passe doit contenir au moins 8 caractères.");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, name: name ?? undefined, role: "ADMIN" },
    create: { email, password: hashed, name: name ?? "Administrateur", role: "ADMIN" },
  });

  console.log(`Compte admin prêt : ${user.email} (id: ${user.id})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
