import type { ReactElement } from "react";

/**
 * Le badge de marque (fond bleu foncé, note dorée) utilisé pour le favicon,
 * l'icône Apple Touch et les icônes du manifest PWA — un seul dessin, décliné
 * à différentes tailles / rembourrages (zone de sécurité "maskable").
 */
export function IconMark({
  size,
  padding = 0,
  shape = "rounded",
}: {
  size: number;
  padding?: number;
  /** "square" pour les icônes maskable : l'OS applique déjà son propre découpage. */
  shape?: "square" | "rounded" | "circle";
}): ReactElement {
  const borderRadius = shape === "circle" ? size / 2 : shape === "rounded" ? size * 0.18 : 0;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0B1E3D",
        borderRadius,
      }}
    >
      <div
        style={{
          width: size - padding * 2,
          height: size - padding * 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: (size - padding * 2) * 0.55,
          color: "#D4AF37",
        }}
      >
        ♪
      </div>
    </div>
  );
}
