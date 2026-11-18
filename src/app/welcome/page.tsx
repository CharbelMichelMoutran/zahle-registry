import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Zahle Building Registry",
  description: "A lasting record of every building in Zahle, made by civil engineers.",
  alternates: { canonical: "/" },
};

/**
 * The public landing page. Signed-out visitors see it at / (src/proxy.ts
 * rewrites / here); it is static and reads nothing from the registry.
 */
export default function WelcomePage() {
  return <Landing />;
}
