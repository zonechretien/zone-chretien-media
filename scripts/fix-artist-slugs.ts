/**
 * Corrige rétroactivement les slugs d'artistes mal formés (espaces, majuscules,
 * accents non normalisés) créés avant la validation côté serveur.
 * Usage : npm run artists:fix-slugs [-- --dry-run]
 */
import { prisma } from "../src/lib/db";
import { slugify } from "../src/lib/utils";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const artists = await prisma.artist.findMany({ select: { id: true, name: true, slug: true } });
  const takenSlugs = new Set(artists.map((a) => a.slug));

  let fixed = 0;
  for (const artist of artists) {
    const clean = slugify(artist.slug) || slugify(artist.name);
    if (clean === artist.slug) continue;

    let candidate = clean;
    let n = 2;
    while (takenSlugs.has(candidate) && candidate !== artist.slug) {
      candidate = `${clean}-${n++}`;
    }

    console.log(`${dryRun ? "[dry-run] " : ""}${artist.name}: "${artist.slug}" -> "${candidate}"`);
    if (!dryRun) {
      await prisma.artist.update({ where: { id: artist.id }, data: { slug: candidate } });
    }
    takenSlugs.delete(artist.slug);
    takenSlugs.add(candidate);
    fixed++;
  }

  console.log(fixed === 0 ? "Aucun slug à corriger." : `${fixed} slug(s) corrigé(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
