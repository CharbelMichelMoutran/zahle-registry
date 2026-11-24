import type { Metadata } from "next";
import EmtApp from "@/components/emt/EmtApp";

export const metadata: Metadata = { title: "Volunteer map · Zahle on Record" };

/** The EMT (Red Cross) map. Open to anyone while login is frozen (src/proxy.ts). */
export default function EmtPage() {
  return <EmtApp />;
}
