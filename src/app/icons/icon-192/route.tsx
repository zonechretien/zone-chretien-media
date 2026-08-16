import { ImageResponse } from "next/og";
import { IconMark } from "@/lib/icon-mark";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(<IconMark size={192} />, { width: 192, height: 192 });
}
