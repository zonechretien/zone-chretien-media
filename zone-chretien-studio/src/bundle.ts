import { bundle } from "@remotion/bundler";
import { BRAND_PUBLIC_DIR, REMOTION_ENTRY, STUDIO_NODE_MODULES } from "./paths";

/**
 * Construit le bundle des templates pour le rendu.
 *
 * Les fichiers de remotion/ sont dans le dépôt du CMS : sans précaution,
 * webpack irait chercher remotion, react et zod dans le node_modules du CMS
 * (absent sur le disque externe, ou dans une autre version). On place donc le
 * node_modules du studio en tête de la résolution : le rendu n'utilise que les
 * dépendances du studio, dont les versions sont figées.
 */
export async function bundleTemplates(onProgress?: (percent: number) => void): Promise<string> {
  return bundle({
    entryPoint: REMOTION_ENTRY,
    publicDir: BRAND_PUBLIC_DIR,
    onProgress,
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        modules: [STUDIO_NODE_MODULES, ...(config.resolve?.modules ?? ["node_modules"])],
      },
    }),
  });
}
