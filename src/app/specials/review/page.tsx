import type { Metadata } from "next";
import ReviewContent from "./ReviewContent";

export const metadata: Metadata = {
  title: "Review Specials",
  description: "Approve or reject incoming deals.",
  alternates: { canonical: "/specials/review" },
  robots: { index: false, follow: false },
};

export default function SpecialsReviewPage() {
  return <ReviewContent />;
}
