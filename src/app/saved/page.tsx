import type { Metadata } from "next";
import { Suspense } from "react";
import SavedContent from "./SavedContent";

export const metadata: Metadata = {
  title: "Saved Threads | CastZone",
  description: "Your bookmarked CastZone forum threads.",
};

export default function SavedPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-storm font-body">Loading…</p>
      </div>
    }>
      <SavedContent />
    </Suspense>
  );
}
