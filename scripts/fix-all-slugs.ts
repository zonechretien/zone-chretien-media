/**
 * Corrige rétroactivement les slugs mal formés (espaces, majuscules, accents non
 * normalisés) sur tous les modèles à slug, créés avant la validation côté serveur.
 * Usage : npm run content:fix-slugs [-- --dry-run]
 */
import { prisma } from "../src/lib/db";
import { slugify } from "../src/lib/utils";

const MODELS = [
  { key: "artist", label: "name" },
  { key: "song", label: "title" },
  { key: "video", label: "title" },
  { key: "article", label: "title" },
  { key: "inspiration", label: "title" },
  { key: "devotion", label: "title" },
  { key: "prayer", label: "title" },
  { key: "testimony", label: "title" },
  { key: "category", label: "name" },
  { key: "tag", label: "name" },
] as const;

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  let totalFixed = 0;

  for (const { key, label } of MODELS) {
    const client = (prisma as unknown as Record<string, { findMany: Function; update: Function }>)[key];
    const rows: Array<{ id: string; slug: string; [k: string]: string }> = await client.findMany({
      select: { id: true, slug: true, [label]: true },
    });
    const takenSlugs = new Set(rows.map((r) => r.slug));

    let fixed = 0;
    for (const row of rows) {
      const clean = slugify(row.slug) || slugify(row[label]);
      if (clean === row.slug) continue;

      let candidate = clean;
      let n = 2;
      while (takenSlugs.has(candidate) && candidate !== row.slug) {
        candidate = `${clean}-${n++}`;
      }

      console.log(`${dryRun ? "[dry-run] " : ""}[${key}] ${row[label]}: "${row.slug}" -> "${candidate}"`);
      if (!dryRun) {
        await client.update({ where: { id: row.id }, data: { slug: candidate } });
      }
      takenSlugs.delete(row.slug);
      takenSlugs.add(candidate);
      fixed++;
    }
    totalFixed += fixed;
  }

  console.log(totalFixed === 0 ? "Aucun slug à corriger." : `${totalFixed} slug(s) corrigé(s) au total.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
