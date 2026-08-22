import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, DM_Sans, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { JsonLd } from "@/components/shared/json-ld";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Typographie de la nouvelle charte du site public (maquette de référence) : chargées
// ici pour que next/font optimise leur mise en cache, mais exposées via des tokens
// distincts (--font-display / --font-body / --font-accent) qui ne remplacent PAS
// --font-sans (Geist, toujours utilisé par le CMS admin — voir globals.css).
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_TAGLINE,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_TAGLINE,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1E3D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${dmSans.variable} ${bebasNeue.variable} flex min-h-screen flex-col antialiased`}
      >
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            description: SITE_TAGLINE,
            url: SITE_URL,
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/recherche?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
            publisher: {
              "@type": "Organization",
              name: SITE_NAME,
              url: SITE_URL,
            },
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
