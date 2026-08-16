export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const SITE_NAME = "Zone-Chrétien Media";
export const SITE_TAGLINE = "La musique, l'inspiration et la Parole pour édifier les nations.";

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * Metadata standard pour une page (titre + description propres à la page,
 * pas hérités du layout racine) : canonical + Open Graph + Twitter Card.
 * `Metadata` n'est pas importé ici pour éviter une dépendance directe à
 * "next" dans ce module partagé ; le type de retour reste compatible.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  noIndex,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}) {
  return {
    title,
    description,
    alternates: { canonical: path },
    ...(noIndex ? { robots: { index: false } } : {}),
    openGraph: {
      title,
      description,
      url: path,
      type: "website" as const,
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
