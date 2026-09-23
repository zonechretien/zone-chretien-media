import { defineConfig } from "vitest/config";

// Tests de la logique pure du module Reels (templates partagés remotion/).
export default defineConfig({
  test: {
    include: ["remotion/**/*.test.ts"],
    environment: "node",
  },
});
