import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function DefaultOgImage() {
  return new ImageResponse(
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
          fontSize: 64,
          fontWeight: 700,
          color: "#d4af37",
          marginBottom: 32,
          display: "flex",
        }}
      >
        {SITE_NAME}
      </div>
      <div
        style={{
          fontSize: 34,
          lineHeight: 1.4,
          maxWidth: 900,
          color: "rgba(255,255,255,0.9)",
          display: "flex",
        }}
      >
        {SITE_TAGLINE}
      </div>
    </div>,
    { ...size },
  );
}
