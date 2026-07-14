import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tackle Box — Coming Soon",
  description:
    "The CastZone Tackle Box marketplace is coming soon — buy and sell fishing gear directly with SA anglers. Register free to be first.",
  alternates: { canonical: "/classifieds" },
  robots: { index: false, follow: true },
};

// NOTE: the full marketplace is built and preserved in ClassifiedsContent.tsx +
// /classifieds/new + /classifieds/listing. It's intentionally behind this
// "coming soon" gate until the community is large enough to support listings.
// To relaunch: restore `return <ClassifiedsContent />` here and re-add the
// navbar link + sitemap entry.
export default function ClassifiedsPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-xl text-center">
        <div className="text-5xl mb-6">🎣</div>
        <h1 className="font-heading text-4xl md:text-5xl font-semibold text-bone-white">
          Tackle Box
        </h1>
        <p className="mt-3 text-cast-orange font-semibold uppercase tracking-widest text-sm">
          Coming Soon
        </p>
        <p className="mt-6 text-pale-water leading-relaxed">
          We&apos;re building a place for South African anglers to buy and sell gear
          directly — rods, reels, boats and tackle, no middlemen and no commission.
          The Tackle Box opens as the community grows.
        </p>
        <p className="mt-4 text-pale-water leading-relaxed">
          Want to be first to list your gear? Join CastZone free and you&apos;ll be
          ready the day it goes live.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Link
            href="/register"
            className="bg-cast-orange text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition"
          >
            Join free →
          </Link>
          <Link
            href="/venues"
            className="border border-surface-teal text-bone-white font-semibold px-6 py-3 rounded-lg hover:bg-surface-teal/20 transition"
          >
            Explore The Map
          </Link>
        </div>
      </div>
    </main>
  );
}
