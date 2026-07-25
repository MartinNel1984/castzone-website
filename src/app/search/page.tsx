import type { Metadata } from "next";
import SearchPageContent from "./SearchContentPage";

export const metadata: Metadata = {
  title: "Search",
  description: "Search CastZone forum threads and posts — species, dams, techniques and gear.",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return <SearchPageContent />;
}
