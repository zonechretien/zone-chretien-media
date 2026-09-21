import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { Resource } from "@prisma/client";

export function BookCard({ book }: { book: Resource }) {
  return (
    <Link
      href={`/bibliotheque/${book.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition hover:border-gold hover:shadow-lg"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-navy">
        {book.coverImageUrl ? (
          <Image
            src={book.coverImageUrl}
            alt={book.title}
            fill
            unoptimized
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gold">
            <BookOpen size={32} />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-medium text-white">
          Livre
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 font-semibold text-foreground">{book.title}</h3>
        <p className="line-clamp-1 text-sm text-muted">{book.author ?? "Zone-Chrétien"}</p>
      </div>
    </Link>
  );
}
