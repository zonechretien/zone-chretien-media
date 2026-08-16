import { z } from "zod";

const optionalUrl = z.string().url("URL invalide").optional().or(z.literal(""));

export const settingsSchema = z.object({
  siteName: z.string().min(2, "Nom du site requis"),
  siteDescription: z.string().min(2, "Description requise"),
  logoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  primaryColor: z.string().min(4, "Couleur invalide"),
  accentColor: z.string().min(4, "Couleur invalide"),
  facebookUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  instagramUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  whatsappNumber: z.string().optional().or(z.literal("")),
  contactEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  adsenseClientId: z.string().optional().or(z.literal("")),
  aiProvider: z.enum(["GEMINI", "OLLAMA"]),
  maintenanceMode: z.boolean().optional(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
