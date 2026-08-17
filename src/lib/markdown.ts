import { marked } from "marked";
import sanitizeHtmlLib from "sanitize-html";
import { sanitizeHtml } from "./sanitize";

marked.use({ breaks: true });

/** Rend en HTML sûr le Markdown saisi dans les champs texte du CMS (bio, contenu, réflexion...). */
export function renderMarkdown(text: string): string {
  return sanitizeHtml(marked.parse(text) as string);
}

/** Version texte brut (balises et syntaxe Markdown retirées), pour les meta description / JSON-LD. */
export function markdownToText(text: string): string {
  return sanitizeHtmlLib(marked.parse(text) as string, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}
