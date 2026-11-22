import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Zahle on Record",
  description: "A lasting record of every building in Zahle, made by civil engineers.",
  alternates: { canonical: "/" },
};

/**
 * The public landing page, where you choose the Engineer or EMT map. It is
 * static and reads nothing from the registry.
 */
export default function LandingPage() {
  return <Landing />;
}
