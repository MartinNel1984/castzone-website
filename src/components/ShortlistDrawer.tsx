"use client";

import { useState } from "react";
import Link from "next/link";
import { useShortlist } from "@/hooks/useShortlist";

const TYPE_LABEL: Record<string, string> = {
  dam:       "Dam",
  river:     "River",
  estuary:   "Estuary",
  saltwater: "Saltwater",
};

export default function ShortlistDrawer() {
  const { items, remove, clear } = useShortlist();
  const [open, setOpen] = useState(false);

  if (items.length === 0 && !open) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={`Trip (${items.length}) — open shortlist of ${items.length} saved venue${items.length === 1 ? "" : "s"}`}
        className="fixed bottom-6 right-4 z-40 flex items-center gap-2 bg-cast-orange hover:bg-cast-orange-hover text-white rounded-full pl-4 pr-5 py-3 shadow-2xl cz-transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="font-mono text-xs font-semibold uppercase tracking-wider">
          Trip{items.length > 0 ? ` (${items.length})` : ""}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Close shortlist"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative w-full max-w-sm h-full bg-deep-water-light border-l border-surface-teal shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-surface-teal/40 flex items-center justify-between">
              <h2 className="text-bone-white font-heading font-semibold">My Trip Shortlist</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-storm hover:text-bone-white text-2xl leading-none px-1 cz-transition"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-surface-teal/20">
              {items.length === 0 ? (
                <p className="text-storm font-body text-sm text-center py-10 px-5">
                  No venues saved yet. Tap the bookmark on any venue to plan your next trip.
                </p>
              ) : (
                items.map((v) => (
                  <div key={v.id} className="flex items-start gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/venues/${v.slug}`}
                        onClick={() => setOpen(false)}
                        className="text-bone-white font-body font-medium text-sm hover:text-cast-orange cz-transition"
                      >
                        {v.name}
                      </Link>
                      <p className="text-storm text-xs font-body mt-0.5">
                        {v.province} · {TYPE_LABEL[v.type] ?? v.type}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(v.id)}
                      aria-label={`Remove ${v.name} from shortlist`}
                      className="flex-shrink-0 text-storm hover:text-cast-orange text-lg leading-none px-1 cz-transition"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-surface-teal/40 flex items-center justify-between gap-3">
                <button
                  onClick={clear}
                  className="text-storm hover:text-bone-white text-xs font-body cz-transition"
                >
                  Clear all
                </button>
                <Link
                  href="/venues"
                  onClick={() => setOpen(false)}
                  className="bg-cast-orange hover:bg-cast-orange-hover text-white text-xs font-mono font-semibold uppercase tracking-wider rounded px-4 py-2 cz-transition"
                >
                  Browse more venues
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
