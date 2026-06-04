import type { Metadata } from "next";
import VenuesContent from "./VenuesContent";

export const metadata: Metadata = {
  title: "The Map",
  description: "Find dams, rivers and saltwater venues across all 9 SA provinces — target species, permits and GPS coordinates.",
  alternates: { canonical: "/venues" },
};

export default function VenuesPage() {
  return <VenuesContent />;
}
