"use server";

import { requireAdminRole } from "@/lib/admin/session";
import { AIProviderError } from "@/lib/ai/types";
import {
  generateDevotion,
  generateInspiration,
  generatePrayer,
  generateSocialPost,
  generateSongDescription,
  generateVerse,
} from "@/lib/ai/generate";
import type { DevotionDraft, InspirationDraft, PrayerDraft, VerseDraft } from "@/lib/ai/schemas";

type Result<T> = { data: T } | { error: string };

function toResult<T>(promise: Promise<T>): Promise<Result<T>> {
  return promise
    .then((data): Result<T> => ({ data }))
    .catch((err): Result<T> => {
      const message =
        err instanceof AIProviderError ? err.message : "Une erreur inattendue est survenue.";
      return { error: message };
    });
}

export async function generateDevotionAction(topic?: string): Promise<Result<DevotionDraft>> {
  await requireAdminRole();
  return toResult(generateDevotion(topic));
}

export async function generatePrayerAction(
  categoryLabel: string,
  topic?: string,
): Promise<Result<PrayerDraft>> {
  await requireAdminRole();
  return toResult(generatePrayer(categoryLabel, topic));
}

export async function generateVerseAction(theme?: string): Promise<Result<VerseDraft>> {
  await requireAdminRole();
  return toResult(generateVerse(theme));
}

export async function generateInspirationAction(topic?: string): Promise<Result<InspirationDraft>> {
  await requireAdminRole();
  return toResult(generateInspiration(topic));
}

export async function generateSongDescriptionAction(input: {
  title: string;
  artistName: string;
  theme?: string;
}): Promise<Result<string>> {
  await requireAdminRole();
  return toResult(generateSongDescription(input));
}

export async function generateSocialPostAction(input: {
  platform: "facebook" | "whatsapp";
  contentTitle: string;
  contentTypeLabel: string;
  url?: string;
}): Promise<Result<string>> {
  await requireAdminRole();
  return toResult(generateSocialPost(input));
}
