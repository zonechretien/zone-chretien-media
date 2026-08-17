import type { Metadata } from "next";
import Image from "next/image";
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
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-12 text-center sm:px-6 lg:px-8">
          <div className="relative h-32 w-32 overflow-hidden rounded-full bg-navy shadow-lg">
            {artist.photoUrl ? (
              <Image src={artist.photoUrl} alt={artist.name} fill className="object-cover" sizes="128px" priority />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gold">
                <User size={40} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {artist.name}
            </h1>
            {artist.isSponsored && (
              <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
                Sponsorisé
              </span>
            )}
          </div>
          {artist.bio && (
            <div
              className="prose prose-neutral max-w-2xl text-muted dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(artist.bio) }}
            />
          )}
          {socials.length > 0 && (
            <div className="mt-2 flex gap-3">
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
        </div>
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
