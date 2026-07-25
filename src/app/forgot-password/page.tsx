import type { Metadata } from "next";
import ForgotPasswordContent from "./ForgotPasswordContent";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your CastZone account password.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/forgot-password" },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
