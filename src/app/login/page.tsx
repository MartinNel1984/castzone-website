import type { Metadata } from "next";
import LoginContent from "./LoginContent";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your CastZone account to post, chat and manage your fishing profile.",
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return <LoginContent />;
}
