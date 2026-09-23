import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests de la logique pure du module Reels (templates partagés remotion/ et
// logique de l'éditeur dans src/). Mêmes alias que tsconfig.json.
export default defineConfig({
  resolve: {
    alias: {
      "@reels": fileURLToPath(new URL("./remotion", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["remotion/**/*.test.ts", "src/**/*.test.ts"],
    environment: "node",
  },
});
