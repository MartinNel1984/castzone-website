"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { Venue } from "@/components/VenueMap";

const VenueMap = dynamic(() => import("@/components/VenueMap"), { ssr: false });

const PROVINCES = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape",
];

const TYPE_LABEL: Record<string, string> = {
  dam:       "Dam",
  river:     "River",
  estuary:   "Estuary",
  saltwater: "Saltwater",
};

const TYPE_COLOUR: Record<string, string> = {
  dam:       "bg-green-900/40 text-green-300 border-green-700",
  river:     "bg-teal-900/40 text-teal-300 border-teal-700",
  estuary:   "bg-amber-900/40 text-amber-300 border-amber-700",
  saltwater: "bg-blue-900/40 text-blue-300 border-blue-700",
};

const TYPE_DOT: Record<string, string> = {
  dam:       "#2d6a4f",
  river:     "#2a6e6e",
  estuary:   "#6b4226",
  saltwater: "#1d3557",
};

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [province, setProvince] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("venues")
      .select("*")
      .order("province")
      .order("name")
      .then(({ data }) => {
        setVenues((data ?? []) as Venue[]);
        setLoading(false);
      });
  }, []);

  const filtered = province ? venues.filter((v) => v.province === province) : venues;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-5xl font-heading font-bold text-bone-white uppercase">The Map</h1>
        <p className="text-cast-orange font-heading font-semibold uppercase tracking-widest text-sm mt-1">
          SA Venues &amp; Dam Database
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs font-body">
        {Object.entries(TYPE_LABEL).map(([type, label]) => (
          <span key={type} className={`flex items-center gap-1.5 border rounded-full px-2.5 py-1 ${TYPE_COLOUR[type]}`}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: TYPE_DOT[type] }} />
            {label}
          </span>
        ))}
        <span className="text-storm self-center text-xs">— click a pin for details</span>
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-surface-teal mb-6" style={{ height: 480 }}>
        {loading ? (
          <div className="w-full h-full bg-deep-water-light flex items-center justify-center">
            <p className="text-storm font-body">Loading map...</p>
          </div>
        ) : (
          <VenueMap venues={filtered} />
        )}
      </div>

      {/* Province filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setProvince(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-body font-medium transition-colors border ${
            province === null
              ? "bg-cast-orange border-cast-orange text-white"
              : "border-surface-teal text-pale-water hover:border-cast-orange hover:text-bone-white"
          }`}
        >
          All ({venues.length})
        </button>
        {PROVINCES.map((p) => {
          const count = venues.filter((v) => v.province === p).length;
          if (count === 0) return null;
          return (
            <button
              key={p}
              onClick={() => setProvince(p)}
              className={`px-4 py-1.5 rounded-full text-sm font-body font-medium transition-colors border ${
                province === p
                  ? "bg-cast-orange border-cast-orange text-white"
                  : "border-surface-teal text-pale-water hover:border-cast-orange hover:text-bone-white"
              }`}
            >
              {p} ({count})
            </button>
          );
        })}
      </div>

      {/* Venue cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-deep-water-light border border-surface-teal rounded-lg p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-storm font-body">No venues listed for this province yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((venue) => (
            <Link
              key={venue.id}
              href={`/venues/${venue.slug}`}
              className="group bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg p-5 transition-colors block"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-bone-white font-heading font-bold uppercase group-hover:text-cast-orange transition-colors leading-tight">
                  {venue.name}
                </h3>
                <span className={`flex-shrink-0 ml-2 text-xs font-body border rounded px-2 py-0.5 ${TYPE_COLOUR[venue.type] ?? ""}`}>
                  {TYPE_LABEL[venue.type] ?? venue.type}
                </span>
              </div>
              <p className="text-storm text-xs font-body mb-3">{venue.province}</p>
              <div className="flex flex-wrap gap-1">
                {venue.species.slice(0, 4).map((s) => (
                  <span key={s} className="bg-surface-teal/20 text-pale-water text-xs font-body px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
                {venue.species.length > 4 && (
                  <span className="text-storm text-xs font-body py-0.5">+{venue.species.length - 4}</span>
                )}
              </div>
              {venue.permit_required && (
                <p className="text-cast-orange text-xs font-body mt-3">⚠ Permit required</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
