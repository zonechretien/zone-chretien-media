import { getTopSongs, getTopSongsThisWeek } from "@/lib/queries/songs";
import { PageHeader } from "@/components/shared/page-header";
import { RankingTabs, type RankedSong } from "@/components/songs/ranking-tabs";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Classement",
  description: "Le Top 10 des chansons les plus écoutées cette semaine et depuis toujours sur Zone-Chrétien Media.",
  path: "/classement",
});

export default async function ClassementPage() {
  const [weeklySongs, allTimeSongs] = await Promise.all([getTopSongsThisWeek(10), getTopSongs(10)]);

  const weekly: RankedSong[] = weeklySongs.map((song) => ({
    views: song.weeklyViews,
    track: {
      id: song.id,
      slug: song.slug,
      title: song.title,
      artistName: song.artist.name,
      artistSlug: song.artist.slug,
      imageUrl: song.imageUrl,
      audioUrl: song.audioUrl ?? "",
      playable: song.sourceType === "FICHIER_DIRECT",
    },
  }));

  const allTime: RankedSong[] = allTimeSongs.map((song) => ({
    views: song.views,
    track: {
      id: song.id,
      slug: song.slug,
      title: song.title,
      artistName: song.artist.name,
      artistSlug: song.artist.slug,
      imageUrl: song.imageUrl,
      audioUrl: song.audioUrl ?? "",
      playable: song.sourceType === "FICHIER_DIRECT",
    },
  }));

  return (
    <div>
      <PageHeader
        title="Classement"
        description="Les chansons les plus écoutées de Zone-Chrétien Media, à la semaine ou depuis toujours."
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <RankingTabs weekly={weekly} allTime={allTime} />
      </div>
    </div>
  );
}
