import type { Metadata } from "next";
import RegisterContent from "./RegisterContent";

export const metadata: Metadata = {
  title: "Join Free",
  description:
    "Create your free CastZone account — join South Africa's fishing community to share catches, get Vaal gate alerts, and find dams near you.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return <RegisterContent />;
}
