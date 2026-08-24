import Link from "next/link";
import type { Testimony } from "@prisma/client";
import { truncate } from "@/lib/utils";
import { markdownToText } from "@/lib/markdown";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function TestimonialsSection({ testimonies }: { testimonies: Testimony[] }) {
  if (testimonies.length === 0) return null;

  return (
    <section className="bg-brand-navy py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-7 w-1 rounded-sm bg-brand-gold/50" />
          <h2 className="font-display text-[22px] font-black text-white">Témoignages</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonies.slice(0, 3).map((testimony) => (
            <Link
              key={testimony.id}
              href={`/temoignages/${testimony.slug}`}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur transition hover:bg-white/10"
            >
              <p className="mb-[18px] font-body text-sm italic leading-relaxed text-white/75">
                « {truncate(markdownToText(testimony.content), 160)} »
              </p>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gold font-accent text-base text-brand-navy">
                  {initials(testimony.authorName)}
                </span>
                <span className="font-body text-[13px] font-semibold text-white">{testimony.authorName}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
