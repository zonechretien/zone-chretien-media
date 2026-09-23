/**
 * Typographie française pour l'affichage (le texte source n'est pas modifié) :
 * apostrophe courbe, espace fine insécable avant ; ! ? et espace insécable
 * avant :, comme dans une édition imprimée soignée. Les « : » entre deux
 * chiffres (références « 34:8 ») sont laissés tels quels.
 */
const NNBSP = "\u202F";
const NBSP = "\u00A0";

export function frenchTypography(text: string): string {
  return text
    .replace(/'/g, "’")
    .replace(/[ \u00A0\u202F]*([;!?])/g, `${NNBSP}$1`)
    .replace(/[ \u00A0\u202F]*:(?!\d)|(?<!\d)[ \u00A0\u202F]*:/g, `${NBSP}:`);
}

/** Ajoute les guillemets français autour d'une citation. */
export function frenchQuote(text: string): string {
  return `«${NNBSP}${text}${NNBSP}»`;
}
