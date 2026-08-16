import Link from "next/link";
import type { Category } from "@prisma/client";
import { Music4, Newspaper, Sparkles, Video } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

const TYPE_CONFIG = {
  SONG: { icon: Music4, basePath: "/chansons" },
  ARTICLE: { icon: Newspaper, basePath: "/blog" },
  VIDEO: { icon: Video, basePath: "/videos" },
  INSPIRATION: { icon: Sparkles, basePath: "/inspirations" },
} as const;

export function CategoryGrid({ categories }: { categories: Category[] }) {
  const visible = categories.filter((c) => c.type in TYPE_CONFIG);
  if (visible.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Explorer" title="Catégories" className="mb-6" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((category) => {
          const config = TYPE_CONFIG[category.type as keyof typeof TYPE_CONFIG];
          const Icon = config.icon;
          return (
            <Link
              key={category.id}
              href={`${config.basePath}?categorie=${category.slug}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface-elevated p-4 transition hover:border-gold hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold">
                <Icon size={18} />
              </span>
              <span className="font-medium text-foreground">{category.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
