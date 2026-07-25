import type { Metadata } from "next";
import SuggestVenueContent from "./SuggestVenueContent";

export const metadata: Metadata = {
  title: "Suggest a Venue",
  description: "Suggest a dam, river, estuary or stretch of coast for CastZone's Map of South African fishing venues.",
  alternates: { canonical: "/venues/suggest" },
};

export default function SuggestVenuePage() {
  return <SuggestVenueContent />;
}
