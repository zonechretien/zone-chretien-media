import type { NextConfig } from "next";
import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [{ url: "/offline", revision }],
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
});

const nextConfig: NextConfig = {
  images: {
    // Le CMS accepte des URLs d'images externes arbitraires (aucun fichier
    // n'est hébergé sur le site) : on autorise tout hôte, en HTTPS comme en
    // HTTP — certains éditeurs collent des URLs encore en http:// (anciens
    // sites, services qui ne forcent pas HTTPS), et next/image rejette
    // silencieusement toute URL dont le protocole n'est pas listé ici.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // @libsql/client embarque des fichiers non-JS (LICENSE, binaires natifs)
  // que le bundler tente de parser s'il l'inclut dans le bundle. Ces packages
  // sont serveur-only (Prisma/Turso) : on les laisse en require() natif.
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],

  // Reels : le texte LSG 1910 est lu avec fs dans le fichier du dépôt
  // (src/lib/bible/lsg1910.ts) par l'éditeur et par « Transformer en Reel » ;
  // on l'inclut explicitement dans les fonctions Vercel de ces pages, le
  // traçage automatique ne pouvant pas le deviner.
  outputFileTracingIncludes: {
    "/admin/reels/**/*": ["./prisma/bible-data/lsg1910.json"],
    "/admin/versets/**/*": ["./prisma/bible-data/lsg1910.json"],
    "/admin/devotions/**/*": ["./prisma/bible-data/lsg1910.json"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
