import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import WaitingPanel from "@/components/auth/WaitingPanel";

export const metadata: Metadata = { title: "Waiting for approval · Zahle Building Registry" };

export default function WaitingPage() {
  return (
    <AuthShell>
      <WaitingPanel />
    </AuthShell>
  );
}
