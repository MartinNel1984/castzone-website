import type { Metadata } from "next";
import ResetPasswordContent from "./ResetPasswordContent";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Choose a new password for your CastZone account.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/reset-password" },
};

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
