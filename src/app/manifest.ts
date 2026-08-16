import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Zone-Chrétien",
    description: SITE_TAGLINE,
    start_url: "/",
    display: "standalone",
    background_color: "#0B1E3D",
    theme_color: "#0B1E3D",
    lang: "fr",
    orientation: "portrait-primary",
    categories: ["music", "lifestyle", "religion"],
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
