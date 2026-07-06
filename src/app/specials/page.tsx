import type { Metadata } from "next";
import SpecialsContent from "./SpecialsContent";

export const metadata: Metadata = {
  title: "Specials — Fishing & Camping Deals",
  description:
    "Hand-checked South African fishing and camping deals, all at least 50% off. Rods, reels, tackle, tents, coolers and outdoor gear on special — updated daily by the CastZone deal bot.",
  alternates: { canonical: "/specials" },
};

export default function SpecialsPage() {
  return <SpecialsContent />;
}
