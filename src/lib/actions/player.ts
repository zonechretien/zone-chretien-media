"use server";

import { prisma } from "@/lib/db";
import { getSimilarSongs } from "@/lib/queries/songs";
import { songToTrack } from "@/lib/validations/songs";
import type { Track } from "@/components/shared/audio-player-provider";

/**
 * Chansons similaires pour étendre la file quand "Lecture automatique" est
 * activée et que la file explicite touche à sa fin — action publique (pas de
 * session admin requise, contrairement à lib/actions/songs.ts).
 */
export async function getAutoplayQueueAction(
  songId: string,
  excludeIds: string[],
  limit = 6,
): Promise<Track[]> {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: { categoryId: true, artistId: true },
  });
  if (!song) return [];

  const excludeSet = new Set(excludeIds);
  const similar = await getSimilarSongs(songId, song.categoryId, song.artistId, limit + excludeIds.length);

  return similar
    .filter((s) => !excludeSet.has(s.id))
    .slice(0, limit)
    .map(songToTrack);
}
