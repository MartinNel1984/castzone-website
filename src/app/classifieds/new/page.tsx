import type { Metadata } from "next";
import NewListingContent from "./NewListingContent";

export const metadata: Metadata = {
  title: "Post a Listing",
  description: "Sell your fishing tackle and gear on CastZone's Tackle Box classifieds — free listings, live immediately.",
  alternates: { canonical: "/classifieds/new" },
};

export default function NewListingPage() {
  return <NewListingContent />;
}
