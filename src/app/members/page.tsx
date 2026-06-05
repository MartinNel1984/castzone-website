import type { Metadata } from "next";
import { Suspense } from "react";
import MembersContent from "./MembersContent";

export const metadata: Metadata = {
  title: "Members | CastZone",
  description: "Meet the CastZone community — South Africa's most active fishing anglers.",
};

export default function MembersPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-storm font-body">Loading…</p>
      </div>
    }>
      <MembersContent />
    </Suspense>
  );
}
