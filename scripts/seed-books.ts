/**
 * Données de démonstration pour la section Bibliothèque (livres).
 * Idempotent (upsert par slug), base locale uniquement.
 * Usage : npm run seed:books
 */
import { prisma } from "../src/lib/db";

// PDF de démonstration stable et libre de droits (article académique publié
// par le projet pdf.js lui-même), utilisé le temps d'avoir de vrais livres.
const DEMO_PDF_URL =
  "https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf";

function cover(seed: string) {
  return `https://picsum.photos/seed/${seed}/600/800`;
}

const CATEGORIES = [
  { name: "Théologie", slug: "theologie" },
  { name: "Vie chrétienne", slug: "vie-chretienne" },
  { name: "Jeunesse", slug: "jeunesse-livres" },
];

const BOOKS = [
  {
    title: "Marcher dans la foi",
    slug: "marcher-dans-la-foi",
    author: "Jean Baptiste",
    category: "vie-chretienne",
    description:
      "Un guide pratique pour affermir sa marche chrétienne au quotidien, entre prière, discipline spirituelle et communauté.",
    pageCount: 214,
    language: "Français",
    publicationYear: 2022,
    fileSizeLabel: "1.0 Mo",
    freePreviewPages: 8,
  },
  {
    title: "Les fondations de la doctrine",
    slug: "les-fondations-de-la-doctrine",
    author: "Marie Joseph",
    category: "theologie",
    description:
      "Une introduction accessible aux grandes vérités doctrinales de la foi chrétienne, pensée pour les nouveaux croyants comme pour les enseignants.",
    pageCount: 320,
    language: "Français",
    publicationYear: 2021,
    fileSizeLabel: "1.0 Mo",
    freePreviewPages: 10,
  },
  {
    title: "Prier avec les enfants",
    slug: "prier-avec-les-enfants",
    author: "Ruth Anacius",
    category: "jeunesse-livres",
    description:
      "Des prières simples et des activités pour accompagner les enfants dans leur découverte de la foi, à la maison comme à l'église.",
    pageCount: 96,
    language: "Français",
    publicationYear: 2023,
    fileSizeLabel: "1.0 Mo",
    freePreviewPages: 6,
  },
  {
    title: "Haïti, terre d'espérance",
    slug: "haiti-terre-desperance",
    author: "Samuel Pierre",
    category: "vie-chretienne",
    description:
      "Témoignages et réflexions sur la foi et la résilience de la communauté chrétienne haïtienne, en Haïti comme dans la diaspora.",
    pageCount: 168,
    language: "Français",
    publicationYear: 2020,
    fileSizeLabel: "1.0 Mo",
    freePreviewPages: 8,
  },
  {
    title: "Comprendre les Psaumes",
    slug: "comprendre-les-psaumes",
    author: "Esther Lafontant",
    category: "theologie",
    description:
      "Une étude accessible des Psaumes, livre par livre, pour redécouvrir la richesse de la prière et de la louange bibliques.",
    pageCount: 256,
    language: "Français",
    publicationYear: 2019,
    fileSizeLabel: "1.0 Mo",
    freePreviewPages: 10,
  },
];

async function main() {
  const categoryBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, type: "RESOURCE" },
      create: { name: c.name, slug: c.slug, type: "RESOURCE" },
    });
    categoryBySlug.set(c.slug, created.id);
  }

  for (const [i, b] of BOOKS.entries()) {
    await prisma.resource.upsert({
      where: { slug: b.slug },
      update: {
        title: b.title,
        author: b.author,
        description: b.description,
        type: "BOOK",
        fileUrl: DEMO_PDF_URL,
        coverImageUrl: cover(`book-${i}`),
        pageCount: b.pageCount,
        language: b.language,
        publicationYear: b.publicationYear,
        fileSizeLabel: b.fileSizeLabel,
        freePreviewPages: b.freePreviewPages,
        categoryId: categoryBySlug.get(b.category) ?? null,
        published: true,
      },
      create: {
        title: b.title,
        slug: b.slug,
        author: b.author,
        description: b.description,
        type: "BOOK",
        fileUrl: DEMO_PDF_URL,
        coverImageUrl: cover(`book-${i}`),
        pageCount: b.pageCount,
        language: b.language,
        publicationYear: b.publicationYear,
        fileSizeLabel: b.fileSizeLabel,
        freePreviewPages: b.freePreviewPages,
        categoryId: categoryBySlug.get(b.category) ?? null,
        published: true,
      },
    });
  }

  console.log(`${BOOKS.length} livres de démonstration prêts.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
