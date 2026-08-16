import { prisma } from "@/lib/db";
import { GeminiProvider } from "./providers/gemini";
import { OllamaProvider } from "./providers/ollama";
import type { AIProvider, AIProviderName } from "./types";

/**
 * Détermine le moteur IA actif.
 * Priorité : variable d'env AI_PROVIDER > préférence enregistrée dans les
 * Paramètres du site (CMS) > "gemini" par défaut.
 * Garde-fou : Ollama ne fonctionne pas sur Vercel (serverless) — il est donc
 * toujours ignoré en production, quelle que soit la source de la préférence.
 */
export async function getAIProvider(): Promise<AIProvider> {
  const name = await resolveProviderName();
  return name === "ollama" ? new OllamaProvider() : new GeminiProvider();
}

async function resolveProviderName(): Promise<AIProviderName> {
  const envValue = normalize(process.env.AI_PROVIDER);
  let requested: AIProviderName = envValue ?? "gemini";

  if (!envValue) {
    const settings = await prisma.settings
      .findUnique({ where: { id: "settings" }, select: { aiProvider: true } })
      .catch(() => null);
    if (settings?.aiProvider === "OLLAMA") requested = "ollama";
  }

  const isProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  if (requested === "ollama" && isProduction) {
    console.warn(
      "[IA] Ollama demandé mais indisponible en production (Vercel serverless) — bascule sur Gemini.",
    );
    return "gemini";
  }

  return requested;
}

function normalize(value: string | undefined): AIProviderName | null {
  const v = value?.toLowerCase().trim();
  return v === "gemini" || v === "ollama" ? v : null;
}
