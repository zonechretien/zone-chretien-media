import { SITE_URL } from "@/lib/seo";

/**
 * Détermine si `url` peut être affichée dans un <iframe> cross-origin, en inspectant
 * les en-têtes X-Frame-Options / Content-Security-Policy (frame-ancestors) côté
 * serveur — un iframe bloqué par ces en-têtes déclenche quand même l'événement
 * "load" côté client (la requête réseau aboutit, seul le rendu est refusé), donc un
 * simple minuteur ne suffit pas à détecter ce cas précis. GitHub (page "blob", par
 * opposition à raw.githubusercontent.com) envoie systématiquement `X-Frame-Options:
 * deny`, un cas réel rencontré avec les PDF hébergés sur GitHub par les éditeurs.
 * Mis en cache 24h (par URL) : la config d'hébergement d'un fichier change rarement.
 */
export async function isPdfEmbeddable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 86400 },
    });

    const xFrameOptions = res.headers.get("x-frame-options")?.toLowerCase() ?? "";
    if (xFrameOptions.includes("deny") || xFrameOptions.includes("sameorigin")) return false;

    const csp = res.headers.get("content-security-policy") ?? "";
    const frameAncestors = csp.match(/frame-ancestors\s+([^;]+)/i)?.[1]?.trim();
    if (frameAncestors) {
      const tokens = frameAncestors.split(/\s+/);
      // "'self'" n'autorise jamais notre origine (on est nécessairement cross-origin
      // ici) : seul un wildcard ou une correspondance explicite avec notre propre
      // origine permet réellement l'intégration.
      const siteOrigin = new URL(SITE_URL).origin;
      const allowed = tokens.includes("*") || tokens.some((t) => t.replace(/\/$/, "") === siteOrigin);
      if (!allowed) return false;
    }

    return true;
  } catch {
    // Réseau/timeout/host indisponible : on laisse une chance à l'iframe (+ le
    // repli par minuteur côté client) plutôt que de bloquer l'aperçu à tort.
    return true;
  }
}
