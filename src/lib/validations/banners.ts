import { z } from "zod";

export const BANNER_TYPES = [
  "ADSENSE",
  "ARTIST_SPONSOR",
  "EVENT_SPONSOR",
  "PARTNER_BANNER",
] as const;

export const BANNER_TYPE_LABELS: Record<(typeof BANNER_TYPES)[number], string> = {
  ADSENSE: "Google AdSense",
  ARTIST_SPONSOR: "Artiste sponsorisé",
  EVENT_SPONSOR: "Événement sponsorisé",
  PARTNER_BANNER: "Bannière partenaire",
};

export const bannerSchema = z.object({
  type: z.enum(BANNER_TYPES, { message: "Type requis" }),
  title: z.string().min(2, "Titre requis"),
  imageUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  linkUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  adsenseSlotCode: z.string().optional().or(z.literal("")),
  position: z.string().optional().or(z.literal("")),
  active: z.boolean().optional(),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
});

export type BannerInput = z.infer<typeof bannerSchema>;
