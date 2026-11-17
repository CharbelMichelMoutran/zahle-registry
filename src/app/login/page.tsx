import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import LoginScreen from "@/components/auth/LoginScreen";

export const metadata: Metadata = { title: "Log in · Zahle Building Registry" };

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense>
        <LoginScreen />
      </Suspense>
    </AuthShell>
  );
}
