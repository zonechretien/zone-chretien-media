import { SongCard } from "@/components/cards/song-card";
import { PlaylistCard } from "@/components/cards/playlist-card";
import { ArticleCard } from "@/components/cards/article-card";
import { DevotionCard } from "@/components/cards/devotion-card";
import { TestimonyCard } from "@/components/cards/testimony-card";
import type { FavoriteType } from "@/lib/personalization";

/** Shape renvoyée par POST /api/content/resolve — un item par référence résolue. */
export type ResolvedContentItem = {
  type: FavoriteType;
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

/** Rend la carte adaptée au type d'un item résolu via /api/content/resolve. */
export function ResolvedContentCard({ item }: { item: ResolvedContentItem }) {
  switch (item.type) {
    case "song":
      return <SongCard song={item.data} />;
    case "playlist":
      return <PlaylistCard playlist={item.data} />;
    case "article":
      return <ArticleCard article={item.data} />;
    case "devotion":
      return <DevotionCard devotion={item.data} />;
    case "testimony":
      return <TestimonyCard testimony={item.data} />;
    default:
      return null;
  }
}
