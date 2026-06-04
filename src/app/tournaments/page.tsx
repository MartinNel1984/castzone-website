import type { Metadata } from "next";
import TournamentsContent from "./TournamentsContent";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "The South African angling calendar — bass, carp, saltwater and fly fishing tournaments, dates and registration.",
  alternates: { canonical: "/tournaments" },
};

export default function TournamentsPage() {
  return <TournamentsContent />;
}
