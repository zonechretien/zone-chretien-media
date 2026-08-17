import type { Metadata } from "next";
import Image from "next/image";
import { Dancing_Script } from "next/font/google";
import { notFound } from "next/navigation";
import { Music4, User } from "lucide-react";
import { getArtistBySlug } from "@/lib/queries/artists";
import { renderMarkdown, markdownToText } from "@/lib/markdown";
import { SongCard } from "@/components/cards/song-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { FacebookIcon, InstagramIcon, XIcon, YoutubeIcon } from "@/components/icons/social-icons";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl } from "@/lib/seo";

const dancingScript = Dancing_Script({ subsets: ["latin"], weight: ["600", "700"] });

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return {};

  const description = artist.bio
    ? markdownToText(artist.bio)
    : `Découvrez les chansons de ${artist.name} sur Zone-Chrétien Media.`;

  return {
    title: artist.name,
    description,
    alternates: { canonical: `/artistes/${artist.slug}` },
    openGraph: {
      title: artist.name,
      description,
      images: artist.photoUrl ? [artist.photoUrl] : undefined,
      url: `/artistes/${artist.slug}`,
    },
    twitter: { card: "summary_large_image", title: artist.name, description },
  };
}

export default async function ArtistPage({ params }: Props) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const socials = [
    { href: artist.facebookUrl, icon: FacebookIcon, label: "Facebook" },
    { href: artist.instagramUrl, icon: InstagramIcon, label: "Instagram" },
    { href: artist.youtubeUrl, icon: YoutubeIcon, label: "YouTube" },
    { href: artist.twitterUrl, icon: XIcon, label: "X" },
  ].filter((s) => s.href);

  const bioExcerpt = artist.bio ? markdownToText(artist.bio) : null;

  return (
    <div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "MusicGroup",
          name: artist.name,
          url: absoluteUrl(`/artistes/${artist.slug}`),
          image: artist.photoUrl ?? undefined,
          description: artist.bio ? markdownToText(artist.bio) : undefined,
          sameAs: [artist.facebookUrl, artist.instagramUrl, artist.youtubeUrl, artist.twitterUrl].filter(
            (v): v is string => Boolean(v),
          ),
        }}
      />

      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border shadow-lg">
          <div className="flex flex-col sm:flex-row">
            <div className="relative h-64 w-full shrink-0 bg-navy sm:h-auto sm:w-[42%]">
              {artist.photoUrl ? (
                <Image
                  src={artist.photoUrl}
                  alt={artist.name}
                  fill
                  className="object-cover"
                  sizes="(min-width: 640px) 42vw, 100vw"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gold">
                  <User size={56} />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col">
              <div className="flex-1 bg-surface-elevated px-6 py-6 sm:px-8 sm:py-8">
                <p className={`${dancingScript.className} text-4xl text-gold sm:text-5xl`}>Bienvenue</p>
                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                  Découvrez le parcours et la musique de {artist.name}, et laissez-vous porter par un
                  témoignage vivant à travers le chant.
                </p>
              </div>

              <div className="relative bg-navy px-6 py-6 text-white sm:px-8 sm:py-8">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{artist.name}</h1>
                <div className="my-3 h-px w-16 bg-gold" />
                {artist.role && (
                  <p className="text-sm font-semibold uppercase tracking-wide text-gold">{artist.role}</p>
                )}
                {bioExcerpt && (
                  <p className="mt-2 line-clamp-3 max-w-md text-sm leading-relaxed text-white/80">
                    {bioExcerpt}
                  </p>
                )}
                <svg
                  viewBox="0 0 60 40"
                  className="absolute bottom-3 right-4 h-8 w-12 text-gold/70 sm:bottom-4 sm:right-6"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 6C4 26 20 34 40 30"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M31 24L41 30.5L33.5 37"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {socials.length > 0 && (
          <div className="mt-6 flex justify-center gap-3">
            {socials.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/70 transition hover:border-gold hover:text-gold"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        )}

        {artist.bio && (
          <div className="mt-10">
            <SectionHeading title="Biographie" className="mb-4" />
            <div
              className="prose prose-neutral max-w-none text-muted dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(artist.bio) }}
            />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeading title={`Chansons de ${artist.name}`} className="mb-6" />
        {artist.songs.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {artist.songs.map((song) => (
              <SongCard key={song.id} song={{ ...song, artist }} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Music4} title="Aucune chanson publiée pour cet artiste" />
        )}
      </div>
    </div>
  );
}
