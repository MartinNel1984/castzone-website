import type { Metadata } from "next";
import BiteTimesContent from "./BiteTimesContent";

export const metadata: Metadata = {
  title: "Best Bite Times",
  description:
    "Today's bite forecast for any SA fishing spot — solunar major & minor periods, live barometric pressure, and a 7-day bite + weather outlook. Pick a venue or use your location.",
  alternates: { canonical: "/bite-times" },
};

export default function BiteTimesPage() {
  return <BiteTimesContent />;
}
