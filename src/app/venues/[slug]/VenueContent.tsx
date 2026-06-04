"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { Venue } from "@/components/VenueMap";

const VenueMapPin = dynamic(() => import("@/components/VenueMapPin"), { ssr: false });

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

export default function VenueContent({ slug }: { slug: string }) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("venues")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data }) => {
        setVenue(data as Venue | null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-storm font-body">Loading...</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-pale-water text-xl font-heading font-bold uppercase mb-3">Venue not found</p>
        <Link href="/venues" className="text-cast-orange hover:underline font-body text-sm">← Back to The Map</Link>
      </div>
    );
  }

  const typeClass = TYPE_COLOUR[venue.type] ?? "";
  const typeLabel = TYPE_LABEL[venue.type] ?? venue.type;
  const gpsUrl = `https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-storm mb-6">
        <Link href="/venues" className="hover:text-pale-water">The Map</Link>
        <span className="mx-2">›</span>
        <span className="text-pale-water">{venue.name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 mb-2">
        <h1 className="text-4xl sm:text-5xl font-heading font-bold text-bone-white uppercase leading-tight flex-1">
          {venue.name}
        </h1>
        <span className={`text-sm font-body border rounded px-3 py-1 mt-1 flex-shrink-0 ${typeClass}`}>
          {typeLabel}
        </span>
      </div>
      <p className="text-storm font-body text-sm mb-8">{venue.province}</p>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-surface-teal mb-8" style={{ height: 280 }}>
        <VenueMapPin name={venue.name} type={venue.type} lat={venue.lat} lng={venue.lng} />
      </div>

      {/* GPS */}
      <div className="bg-deep-water-light border border-surface-teal rounded-lg p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-storm text-xs font-body uppercase tracking-wider mb-1">GPS Coordinates</p>
          <p className="text-bone-white font-body font-mono text-sm">{venue.lat.toFixed(4)}, {venue.lng.toFixed(4)}</p>
        </div>
        <a
          href={gpsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 bg-cast-orange hover:bg-cast-orange-hover text-white text-sm font-heading font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors"
        >
          Open in Maps
        </a>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Species */}
        <div className="bg-deep-water-light border border-surface-teal rounded-lg p-5">
          <h2 className="text-pale-water text-xs font-body uppercase tracking-wider mb-3">Target Species</h2>
          <div className="flex flex-wrap gap-2">
            {venue.species.map((s) => (
              <span key={s} className="bg-surface-teal/20 text-bone-white text-sm font-body px-3 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Facilities */}
        <div className="bg-deep-water-light border border-surface-teal rounded-lg p-5">
          <h2 className="text-pale-water text-xs font-body uppercase tracking-wider mb-3">Facilities</h2>
          {venue.facilities.length === 0 ? (
            <p className="text-storm text-sm font-body">Information not available.</p>
          ) : (
            <ul className="space-y-1">
              {venue.facilities.map((f) => (
                <li key={f} className="text-bone-white text-sm font-body flex items-center gap-2">
                  <span className="text-cast-orange">✓</span> {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Permit warning */}
      {venue.permit_required && venue.permit_info && (
        <div className="bg-cast-orange/10 border border-cast-orange/40 rounded-lg p-5 mb-6 flex gap-3">
          <span className="text-cast-orange text-lg flex-shrink-0">⚠</span>
          <div>
            <p className="text-cast-orange font-heading font-bold uppercase text-sm mb-1">Permit Required</p>
            <p className="text-pale-water font-body text-sm">{venue.permit_info}</p>
          </div>
        </div>
      )}

      {/* Forum CTA */}
      <div className="bg-deep-water-light border border-surface-teal rounded-lg p-6 text-center">
        <p className="text-pale-water font-body mb-4">
          Fished here? Share a report or ask a question in the forum.
        </p>
        <Link
          href="/forum/new?category=general"
          className="inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-6 py-3 rounded transition-colors"
        >
          Start a Thread
        </Link>
      </div>

      <div className="mt-6">
        <Link href="/venues" className="text-storm hover:text-pale-water text-sm font-body transition-colors">
          ← Back to The Map
        </Link>
      </div>
    </div>
  );
}
