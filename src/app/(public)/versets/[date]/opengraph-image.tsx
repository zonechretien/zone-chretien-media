import { ImageResponse } from "next/og";
import { getVerseByDateSlug } from "@/lib/queries/verses";
import { formatDate } from "@/lib/utils";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function VerseOgImage({ params }: { params: { date: string } }) {
  const verse = await getVerseByDateSlug(params.date);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0b1e3d 0%, #14315f 100%)",
          color: "white",
          fontFamily: "sans-serif",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#d4af37",
            marginBottom: 24,
            display: "flex",
          }}
        >
          {verse ? `Verset du ${formatDate(verse.date)}` : "Zone-Chrétien Media"}
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 600,
            lineHeight: 1.3,
            maxWidth: 900,
            display: "flex",
          }}
        >
          {verse ? `« ${verse.text} »` : "La musique, l'inspiration et la Parole"}
        </div>
        {verse && (
          <div style={{ fontSize: 30, fontWeight: 700, color: "#d4af37", marginTop: 32, display: "flex" }}>
            {verse.reference}
          </div>
        )}
        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.6)", marginTop: 48, display: "flex" }}>
          Zone-Chrétien Media
        </div>
      </div>
    ),
    { ...size },
  );
}
