import { BRAND } from "../brand";

/**
 * ⚠️ LOGO PROVISOIRE — monogramme « ZC » dessiné en CSS, en attendant le logo
 * officiel (qui sera un fichier de Logos/ sur le disque, ou public/reels/).
 */
export function BrandMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        border: `${Math.max(2, size * 0.035)}px solid ${BRAND.colors.gold}`,
        background: BRAND.colors.navy,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 ${size * 0.4}px rgba(212,175,55,0.25)`,
      }}
    >
      <span
        style={{
          fontFamily: BRAND.fonts.serif,
          fontWeight: 700,
          fontSize: size * 0.4,
          color: BRAND.colors.gold,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        ZC
      </span>
    </div>
  );
}
