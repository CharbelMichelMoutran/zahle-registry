import type { Metadata } from "next";
import ResidentApp from "@/components/ResidentApp";

export const metadata: Metadata = { title: "Your building · Zahle Building Registry" };

/** The resident map. Only signed-in residents reach it (src/proxy.ts). */
export default function ResidentPage() {
  return <ResidentApp />;
}
