import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import type { Artist } from "@prisma/client";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function SongArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link
      href={`/artistes/${artist.slug}`}
      className="flex items-start gap-4 rounded-2xl border-[1.5px] border-transparent bg-brand-white p-5 shadow-brand-sm transition hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-brand-md"
    >
      <div className="relative h-[70px] w-[70px] shrink-0 overflow-hidden rounded-full border-[3px] border-brand-gray-light bg-brand-navy">
        {artist.photoUrl ? (
          <Image src={artist.photoUrl} alt={artist.name} fill className="object-cover" sizes="70px" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-accent text-2xl text-brand-gold">
            {initials(artist.name)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="mb-1 font-body text-base font-bold text-brand-text">{artist.name}</div>
        {artist.role && (
          <div className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-brand-blue dark:text-brand-text">
            {artist.role}
          </div>
        )}
        {artist.bio && (
          <p className="mb-2.5 line-clamp-3 font-body text-[13px] leading-relaxed text-brand-gray-dark">{artist.bio}</p>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-off-white px-3.5 py-1.5 font-body text-xs font-semibold text-brand-text transition hover:bg-brand-navy hover:text-brand-gold">
          <User size={12} />
          Voir le profil
        </span>
      </div>
    </Link>
  );
}
