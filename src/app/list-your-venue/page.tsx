import type { Metadata } from "next";
import ListYourVenueContent from "./ListYourVenueContent";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "List Your Venue",
  description:
    "Get your fishing venue, private dam, or resort listed on CastZone — South Africa's fastest-growing fishing platform. Free listing, your own venue page, and reach thousands of SA anglers.",
  alternates: { canonical: "/list-your-venue" },
  openGraph: {
    title: "List Your Fishing Venue on CastZone",
    description:
      "Join 67 venues already on the map. Free listing, your own venue page, and direct reach to thousands of SA anglers.",
    url: "https://castzone.co.za/list-your-venue",
  },
};

export default function ListYourVenuePage() {
  return <ListYourVenueContent />;
}
