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
    // n'est hébergé sur le site) : on autorise tout hôte HTTPS.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // @libsql/client embarque des fichiers non-JS (LICENSE, binaires natifs)
  // que le bundler tente de parser s'il l'inclut dans le bundle. Ces packages
  // sont serveur-only (Prisma/Turso) : on les laisse en require() natif.
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],

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
