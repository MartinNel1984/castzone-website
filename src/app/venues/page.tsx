import type { Metadata } from "next";
import VenuesContent from "./VenuesContent";
import type { Venue } from "@/components/VenueMap";

export const metadata: Metadata = {
  title: "The Map",
  description: "Find dams, rivers and saltwater venues across all 9 SA provinces — target species, permits and GPS coordinates.",
  alternates: { canonical: "/venues" },
};

// This site is a static export (output: "export" in next.config), so this
// runs once at build/deploy time — same as the VENUE_SLUGS/DAM_SLUGS arrays
// elsewhere in the app — baking the venue list into the static HTML instead
// of shipping a blank page that only fills in once client JS fetches from
// Supabase. That blank-shell pattern is why ~300 /venues/* pages had no
// server-rendered links pointing at them and sat as "Discovered — currently
// not indexed" in Search Console: Google had no crawl path to them.
async function getVenues(): Promise<Venue[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/venues?select=*&order=name`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) return [];
    return (await res.json()) as Venue[];
  } catch {
    return [];
  }
}

export default async function VenuesPage() {
  const initialVenues = await getVenues();
  return <VenuesContent initialVenues={initialVenues} />;
}
