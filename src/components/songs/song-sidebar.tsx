import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, Star, Trophy } from "lucide-react";
import type { Article, Artist, Category, Song } from "@prisma/client";
import { formatDateShort } from "@/lib/utils";
import { NewsletterForm } from "@/components/shared/newsletter-form";
import { TopSongRow } from "@/components/songs/top-song-row";

function WidgetCard({
  title,
  icon: Icon,
  dark,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={dark ? "rounded-2xl bg-brand-navy p-5" : "rounded-2xl bg-brand-white p-5 shadow-brand-sm"}>
      <div
        className={
          dark
            ? "mb-4 flex items-center gap-2 border-b border-white/10 pb-3 font-body text-[13px] font-bold uppercase tracking-wide text-white/50"
            : "mb-4 flex items-center gap-2 border-b-2 border-brand-gray-light pb-3 font-body text-[13px] font-bold uppercase tracking-wide text-brand-text"
        }
      >
        <Icon size={14} />
        {title}
      </div>
      {children}
    </div>
  );
}

export function SongSidebar({
  recentArticles,
  topSongs,
  popularArtists,
}: {
  recentArticles: (Article & { category: Category | null })[];
  topSongs: (Song & { artist: Artist; category: Category | null })[];
  popularArtists: (Artist & { _count: { songs: number } })[];
}) {
  return (
    <aside className="flex flex-col gap-6">
      {recentArticles.length > 0 && (
        <WidgetCard title="Articles récents" icon={Clock}>
          <div className="flex flex-col">
            {recentArticles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="flex gap-3 border-b border-brand-gray-light py-3 first:pt-0 last:border-0 last:pb-0"
              >
                <div className="relative h-[50px] w-[66px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-navy-mid to-brand-blue">
                  {article.coverImageUrl && (
                    <Image src={article.coverImageUrl} alt={article.title} fill className="object-cover" sizes="66px" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="mb-1 line-clamp-2 font-body text-[13px] font-semibold leading-snug text-brand-text">
                    {article.title}
                  </p>
                  <p className="font-body text-[11px] text-brand-gray-dark">
                    {formatDateShort(article.publishedAt ?? article.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </WidgetCard>
      )}

      {topSongs.length > 0 && (
        <WidgetCard title="Top musiques" icon={Trophy}>
          <div className="flex flex-col">
            {topSongs.map((song, i) => (
              <TopSongRow
                key={song.id}
                rank={i + 1}
                track={{
                  id: song.id,
                  slug: song.slug,
                  title: song.title,
                  artistName: song.artist.name,
                  artistSlug: song.artist.slug,
                  imageUrl: song.imageUrl,
                  audioUrl: song.audioUrl ?? "",
                  playable: song.sourceType === "FICHIER_DIRECT",
                }}
              />
            ))}
          </div>
        </WidgetCard>
      )}

      <WidgetCard title="Newsletter" icon={Mail} dark>
        <h3 className="mb-2 font-display text-xl font-bold text-white">Restez connecté(e)</h3>
        <p className="mb-4 font-body text-[13px] leading-relaxed text-white/60">
          Recevez les dernières sorties gospel et actualités dans votre boîte mail.
        </p>
        <NewsletterForm />
      </WidgetCard>

      {popularArtists.length > 0 && (
        <WidgetCard title="Artistes populaires" icon={Star}>
          <div className="flex flex-col gap-3">
            {popularArtists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artistes/${artist.slug}`}
                className="-m-2 flex items-center gap-3 rounded-xl p-2 transition hover:bg-brand-off-white"
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-brand-navy to-brand-blue">
                  {artist.photoUrl && (
                    <Image src={artist.photoUrl} alt={artist.name} fill className="object-cover" sizes="44px" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-body text-sm font-semibold text-brand-text">{artist.name}</p>
                  <p className="font-body text-[11px] text-brand-gray-dark">
                    {artist._count.songs} titre{artist._count.songs > 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </WidgetCard>
      )}
    </aside>
  );
}
