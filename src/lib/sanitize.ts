import sanitizeHtmlLib from "sanitize-html";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
  "h2", "h3", "h4", "blockquote", "img", "figure", "figcaption",
  "code", "pre", "hr", "span",
];
const ALLOWED_ATTR = ["href", "src", "alt", "title", "target", "rel", "class"];

/** Nettoie le HTML produit par l'éditeur riche du CMS avant affichage public (protection XSS). */
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { "*": ALLOWED_ATTR },
    allowedSchemes: ["http", "https", "mailto"],
  });
}
