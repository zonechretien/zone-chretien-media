import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/shared/search-bar";
import { HeroBackgroundSlideshow, type HeroPhoto } from "@/components/home/hero-background-slideshow";

/**
 * Le verset du jour remplace le titre principal du hero — sa longueur varie
 * beaucoup (39 à plus de 400 caractères selon le verset tiré). On réduit la
 * taille de police par paliers pour qu'un verset long reste lisible et ne
 * déborde jamais, tout en gardant un titre impactant pour les versets courts.
 */
function verseTextSizeClass(length: number) {
  if (length <= 50) return "text-4xl sm:text-6xl";
  if (length <= 90) return "text-3xl sm:text-5xl";
  if (length <= 150) return "text-2xl sm:text-4xl";
  if (length <= 250) return "text-xl sm:text-3xl";
  return "text-lg sm:text-2xl";
}

const FALLBACK_TITLE = "La musique, l'inspiration et la Parole pour édifier les nations.";

export function Hero({
  siteName,
  verse,
  artistPhotos = [],
}: {
  siteName: string;
  /** Verset du jour (getVerseOfDay) — `null` si aucun verset n'est disponible. */
  verse?: { reference: string; text: string } | null;
  artistPhotos?: HeroPhoto[];
}) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <HeroBackgroundSlideshow photos={artistPhotos} />

      {/* Voile sombre par-dessus les photos — garantit la lisibilité du texte,
          quel que soit le contraste de la photo affichée derrière. */}
      <div className="absolute inset-0 bg-navy/80" aria-hidden="true" />

      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, var(--gold) 0%, transparent 45%), radial-gradient(circle at 80% 60%, var(--gold) 0%, transparent 40%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          {siteName}
        </p>

        {verse ? (
          <>
            <h1
              className={cn(
                "mx-auto mt-4 max-w-3xl font-bold leading-tight tracking-tight",
                verseTextSizeClass(verse.text.length),
              )}
            >
              « {verse.text} »
            </h1>
            <p className="mt-3 text-lg font-semibold text-gold">{verse.reference}</p>
            <Link
              href="/versets"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gold/80 transition hover:text-gold hover:underline"
            >
              Voir tous les versets
              <ArrowRight size={12} />
            </Link>
          </>
        ) : (
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {FALLBACK_TITLE}
          </h1>
        )}

        <p className="mx-auto mt-4 max-w-xl text-white/70">
          Chansons, artistes, dévotions, prières et enseignements — un espace
          chrétien pour nourrir votre foi chaque jour.
        </p>
        <div className="mx-auto mt-8 max-w-xl">
          <SearchBar size="lg" className="bg-white/95 text-navy shadow-xl" />
        </div>
      </div>
    </section>
  );
}
