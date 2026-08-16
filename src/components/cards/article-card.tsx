import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { Article, Category, User } from "@prisma/client";
import { formatDateShort, truncate } from "@/lib/utils";

export function ArticleCard({
  article,
}: {
  article: Article & { category: Category | null; author: User };
}) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition hover:border-gold hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-navy">
        {article.coverImageUrl ? (
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gold">
            <BookOpen size={28} />
          </div>
        )}
        {article.category && (
          <span className="absolute left-2 top-2 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-medium text-white">
            {article.category.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="line-clamp-2 font-semibold text-foreground">{article.title}</h3>
        <p className="line-clamp-2 text-sm text-muted">
          {article.excerpt ?? truncate(article.content, 120)}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted">
          <span>{article.author.name ?? "Zone-Chrétien"}</span>
          <span>{formatDateShort(article.publishedAt ?? article.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
