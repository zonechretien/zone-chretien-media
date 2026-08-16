import { ImageResponse } from "next/og";
import { IconMark } from "@/lib/icon-mark";

export const runtime = "edge";

// Icône "maskable" : le fond doit couvrir tout le canevas, le contenu visible
// doit rester dans la zone de sécurité centrale (~80%) pour survivre au
// découpage en cercle/arrondi appliqué par certains launchers Android.
export async function GET() {
  return new ImageResponse(<IconMark size={512} padding={51} shape="square" />, {
    width: 512,
    height: 512,
  });
}
