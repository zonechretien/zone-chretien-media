/**
 * Dates et heures en français pour les annonces d'événement. Écrit à la main
 * (sans Intl) pour un résultat identique dans l'aperçu et au rendu, quel que
 * soit le navigateur ou la langue de l'ordinateur.
 */

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** « 2026-10-12 » → « Lundi 12 octobre 2026 » (« 1er » pour le premier du mois). */
export function formatEventDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return "";
  return `${DAYS[date.getUTCDay()]} ${day === 1 ? "1er" : day} ${MONTHS[month - 1]} ${year}`;
}

/** « 19:30 » → « 19 h 30 », « 09:00 » → « 9 h ». */
export function formatEventTime(hhmm: string): string {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return "";
  const [h, min] = [Number(m[1]), Number(m[2])];
  if (h > 23 || min > 59) return "";
  return min === 0 ? `${h} h` : `${h} h ${String(min).padStart(2, "0")}`;
}
