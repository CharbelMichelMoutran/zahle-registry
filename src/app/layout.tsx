import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Amiri, IBM_Plex_Sans, IBM_Plex_Sans_Arabic, IBM_Plex_Serif, Instrument_Serif, Inter_Tight } from "next/font/google";
import "./globals.css";

// DESIGN.md sections 4 and 15. Arabic falls back to IBM Plex Sans Arabic inside every stack.
// The logo's letters are outlined (src/components/ui/Logo.tsx), so it loads no font of its own.
const sans = IBM_Plex_Sans({ variable: "--nf-plex-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const serif = IBM_Plex_Serif({ variable: "--nf-plex-serif", subsets: ["latin"], weight: ["400", "500"] });
const arabic = IBM_Plex_Sans_Arabic({ variable: "--nf-arabic", subsets: ["arabic"], weight: ["400", "500", "600"] });
// The landing page only (plan item 28): Inter Tight and Instrument Serif, and Amiri for the giant زحلة.
const display = Inter_Tight({ variable: "--nf-inter-tight", subsets: ["latin"], weight: ["400", "500", "600"] });
const editorial = Instrument_Serif({ variable: "--nf-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const amiri = Amiri({ variable: "--nf-amiri", subsets: ["arabic"], weight: "700", preload: false });

export const metadata: Metadata = {
  title: "Zahle on Record",
  description: "A shared record of every building in Zahle, Lebanon, and an earthquake safety check that Red Cross volunteers can run with Claude.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F6F7F8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${arabic.variable} ${display.variable} ${editorial.variable} ${amiri.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
