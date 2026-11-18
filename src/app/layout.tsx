import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Sans_Arabic, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";

// DESIGN.md sections 4 and 15. Arabic falls back to IBM Plex Sans Arabic inside every stack.
// The logo's letters are outlined (src/components/ui/Logo.tsx), so it loads no font of its own.
const sans = IBM_Plex_Sans({ variable: "--nf-plex-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const serif = IBM_Plex_Serif({ variable: "--nf-plex-serif", subsets: ["latin"], weight: ["400", "500"] });
const arabic = IBM_Plex_Sans_Arabic({ variable: "--nf-arabic", subsets: ["arabic"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Zahle on Record",
  description: "A lasting record of Zahle's buildings, made by and for civil engineers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F6F7F8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${arabic.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
