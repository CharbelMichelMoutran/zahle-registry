import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Inter_Tight, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// DESIGN.md section 4. Arabic falls back to IBM Plex Sans Arabic inside every stack.
const inter = Inter({ variable: "--nf-inter", subsets: ["latin"], weight: ["400", "500", "600"] });
const interTight = Inter_Tight({ variable: "--nf-inter-tight", subsets: ["latin"], weight: ["600"] });
const serif = Source_Serif_4({ variable: "--nf-serif", subsets: ["latin"], weight: ["500"] });
const arabic = IBM_Plex_Sans_Arabic({ variable: "--nf-arabic", subsets: ["arabic"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Zahle Building Registry",
  description: "A lasting record of Zahle's buildings, made by and for civil engineers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F6F2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${serif.variable} ${arabic.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
