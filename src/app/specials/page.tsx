import type { Metadata } from "next";
import SpecialsContent from "./SpecialsContent";

export const metadata: Metadata = {
  title: "Specials — Fishing & Camping Deals",
  description:
    "Hand-checked South African fishing and camping deals: markdowns of 50% off and more, plus tackle shop specials. Rods, reels, tackle, bait, tents, coolers and outdoor gear — updated daily by the CastZone deal bot.",
  alternates: { canonical: "/specials" },
};

export default function SpecialsPage() {
  return <SpecialsContent />;
}
