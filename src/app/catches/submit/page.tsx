import type { Metadata } from "next";
import { Suspense } from "react";
import SubmitCatchContent from "./SubmitCatchContent";

export const metadata: Metadata = {
  title: "Submit a Catch",
  description: "Submit your catch to the CastZone Trophy Room, with photo proof, and see where you rank on the leaderboard.",
  alternates: { canonical: "/catches/submit" },
};

export default function SubmitCatchPage() {
  return (
    <Suspense fallback={null}>
      <SubmitCatchContent />
    </Suspense>
  );
}
