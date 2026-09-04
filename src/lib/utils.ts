import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convertit une valeur d'input HTML `type="date"` ("AAAA-MM-JJ") en Date à
 * minuit HEURE LOCALE (pas UTC). `new Date("AAAA-MM-JJ")` ancre à minuit UTC,
 * ce qui décale le jour affiché d'un cran dès que le serveur n'est pas en UTC
 * (ex. environnement de dev local) — ce helper évite ce piège classique.
 */
export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k`;
  return String(views);
}

export function truncate(text: string, maxLength: number): string {
  const plain = text.replace(/<[^>]*>/g, "");
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}…`;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function dateToUrlSlug(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const YOUTUBE_ID_PATTERN =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/;

export function getYoutubeId(url: string): string | null {
  const match = url.match(YOUTUBE_ID_PATTERN);
  return match?.[1] ?? null;
}

export function getYoutubeThumbnail(url: string): string | null {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function getYoutubeEmbedUrl(url: string): string | null {
  const id = getYoutubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/** Construit le lien wa.me à partir d'un numéro saisi dans n'importe quel format
 * (espaces, tirets, +) — wa.me n'accepte que des chiffres, indicatif pays inclus. */
export function getWhatsappUrl(whatsappNumber: string): string | null {
  const digits = whatsappNumber.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

/** Accepte l'URL normale d'une page Audiomack (https://audiomack.com/song/…) ou
 * déjà une URL d'intégration (https://audiomack.com/embed/song/…, laissée
 * inchangée) et retourne toujours l'URL d'intégration — Audiomack refuse de
 * s'afficher en iframe sur l'URL de page normale (X-Frame-Options). */
export function getAudiomackEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("audiomack.com")) return null;
    if (!u.pathname.startsWith("/embed/")) {
      u.pathname = `/embed${u.pathname}`;
    }
    return u.toString();
  } catch {
    return null;
  }
}

/** Accepte l'URL normale d'une page SoundCloud (https://soundcloud.com/…) ou
 * déjà une URL du lecteur (https://w.soundcloud.com/player/?url=…, laissée
 * inchangée) et retourne toujours l'URL du lecteur intégrable. */
export function getSoundcloudEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "w.soundcloud.com" && u.pathname === "/player/") return u.toString();
    if (!u.hostname.endsWith("soundcloud.com")) return null;
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}`;
  } catch {
    return null;
  }
}
