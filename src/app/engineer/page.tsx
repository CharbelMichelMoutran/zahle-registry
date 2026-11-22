import type { Metadata } from "next";
import EngineerApp from "@/components/engineer/EngineerApp";

export const metadata: Metadata = { title: "Engineer map · Zahle on Record" };

/** The engineer map. Open to anyone while login is frozen (src/proxy.ts). */
export default function EngineerPage() {
  return <EngineerApp />;
}
