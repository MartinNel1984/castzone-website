"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ThreadView from "@/components/forum/ThreadView";

function ThreadFromQuery() {
  const searchParams = useSearchParams();
  return <ThreadView threadId={searchParams.get("id")} />;
}

export default function ThreadPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-storm">Loading thread...</p>
      </div>
    }>
      <ThreadFromQuery />
    </Suspense>
  );
}
