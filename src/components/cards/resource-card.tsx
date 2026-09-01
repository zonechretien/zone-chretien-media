import Image from "next/image";
import Link from "next/link";
import { BookOpen, Headphones, PlayCircle } from "lucide-react";
import type { Category, Resource } from "@prisma/client";
import { RESOURCE_TYPE_LABELS } from "@/lib/validations/resources";
import { formatDateShort, getYoutubeId } from "@/lib/utils";

type ResourceWithCategory = Resource & { category: Category | null };

function ResourceTypeIcon({ type }: { type: Resource["type"] }) {
  if (type === "AUDIO_SERMON") return <Headphones size={28} />;
  if (type === "VIDEO_SERMON") return <PlayCircle size={28} />;
  return <BookOpen size={28} />;
}

export function ResourceCard({ resource }: { resource: ResourceWithCategory }) {
  const isVideo = resource.type === "VIDEO_SERMON" || (["CONFERENCE", "COURSE"].includes(resource.type) && !!getYoutubeId(resource.fileUrl));

  return (
    <Link
      href={`/bibliotheque/${resource.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated transition hover:border-gold hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-navy">
        {resource.coverImageUrl ? (
          <Image
            src={resource.coverImageUrl}
            alt={resource.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gold">
            <ResourceTypeIcon type={resource.type} />
          </div>
        )}
        {isVideo && (
          <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-navy/80 text-gold">
            <PlayCircle size={16} />
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-medium text-white">
          {RESOURCE_TYPE_LABELS[resource.type]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 font-semibold text-foreground">{resource.title}</h3>
        <p className="line-clamp-1 text-sm text-muted">{resource.author ?? "Zone-Chrétien"}</p>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>{resource.category?.name ?? "—"}</span>
          <span>{formatDateShort(resource.publishedAt ?? resource.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
