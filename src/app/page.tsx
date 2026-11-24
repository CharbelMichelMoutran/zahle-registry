import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Zahle on Record",
  description: "A shared record of every building in Zahle, Lebanon, and an earthquake safety check that Red Cross volunteers can run with Claude.",
  alternates: { canonical: "/" },
};

/**
 * The public landing page (plan.md item 28): the case study, with links to the
 * Engineer and Volunteer maps. It is static and reads nothing from the registry.
 */
export default function LandingPage() {
  return <Landing />;
}
