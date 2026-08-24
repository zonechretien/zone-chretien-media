import Image from "next/image";
import Link from "next/link";
import { Calendar, Eye, Newspaper } from "lucide-react";
import type { Article, Category, User } from "@prisma/client";
import { formatDateShort } from "@/lib/utils";
import { HomeSectionHeader } from "@/components/home/section-header";

export function NewsSection({
  articles,
}: {
  articles: (Article & { category: Category | null; author: User })[];
}) {
  if (articles.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <HomeSectionHeader title="Dernières actualités" href="/blog" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/blog/${article.slug}`}
            className="group block overflow-hidden rounded-2xl bg-brand-white shadow-brand-sm transition hover:-translate-y-1 hover:shadow-brand-md"
          >
            <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-brand-navy-mid to-brand-blue">
              {article.coverImageUrl ? (
                <Image
                  src={article.coverImageUrl}
                  alt={article.title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/30">
                  <Newspaper size={32} />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-navy/70" />
              <span className="absolute left-3 top-3 rounded-lg bg-[#b83a2a] px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wide text-white">
                {article.category?.name ?? "Actualité"}
              </span>
            </div>
            <div className="p-4">
              <h3 className="mb-2 line-clamp-2 font-body text-sm font-bold leading-snug text-brand-text">
                {article.title}
              </h3>
              <div className="flex items-center gap-3 font-body text-[11.5px] text-brand-gray-dark">
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {formatDateShort(article.publishedAt ?? article.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={10} />
                  {article.views.toLocaleString("fr-FR")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
