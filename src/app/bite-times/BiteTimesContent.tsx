"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import BiteTimes from "@/components/BiteTimes";
import { useSpot, JOHANNESBURG } from "@/lib/geo";

type PickerVenue = {
  name: string;
  slug: string;
  province: string;
  lat: number;
  lng: number;
};

export default function BiteTimesContent() {
  const { spot, setSpot, locateMe, locating, geoError } = useSpot(JOHANNESBURG);
  const [venues, setVenues] = useState<PickerVenue[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("venues")
      .select("name,slug,province,lat,lng")
      .order("name")
      .then(({ data }) => setVenues((data ?? []) as PickerVenue[]));
  }, []);

  const byProvince = useMemo(() => {
    const map = new Map<string, PickerVenue[]>();
    venues.forEach((v) => {
      if (v.lat == null || v.lng == null) return;
      const list = map.get(v.province) ?? [];
      list.push(v);
      map.set(v.province, list);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [venues]);

  function pickVenue(slug: string) {
    setSelectedSlug(slug);
    const v = venues.find((x) => x.slug === slug);
    if (v) setSpot({ lat: v.lat, lng: v.lng, label: v.name });
  }

  function handleLocateMe() {
    setSelectedSlug("");
    locateMe();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <h1 className="text-5xl font-heading font-bold text-bone-white uppercase">Best Bite Times</h1>
      <p className="text-cast-orange font-heading font-semibold uppercase tracking-widest text-sm mt-1 mb-6">
        When the fish are most likely to feed
      </p>

      {/* Spot picker */}
      <div className="bg-deep-water-light border border-surface-teal rounded-lg p-5 mb-6">
        <p className="text-pale-water text-xs font-heading font-bold uppercase tracking-wider mb-3">
          Pick your spot
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedSlug}
            onChange={(e) => pickVenue(e.target.value)}
            className="flex-1 bg-deep-water border border-surface-teal focus:border-cast-orange text-bone-white text-sm font-body rounded px-3 py-2.5 outline-none"
            aria-label="Choose a fishing venue"
          >
            <option value="">
              {venues.length > 0 ? `Choose a venue (${venues.length})…` : "Loading venues…"}
            </option>
            {byProvince.map(([province, list]) => (
              <optgroup key={province} label={province}>
                {list.map((v) => (
                  <option key={v.slug} value={v.slug}>{v.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="flex-shrink-0 border border-surface-teal hover:border-cast-orange text-pale-water hover:text-bone-white text-sm font-heading font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-colors disabled:opacity-50"
          >
            📍 {locating ? "Finding you…" : "Use my location"}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
          <p className="text-storm text-xs font-body">
            Showing forecast for <span className="text-bone-white">{spot.label}</span>
          </p>
          {selectedSlug && (
            <Link
              href={`/venues/${selectedSlug}`}
              className="text-cast-orange hover:text-bone-white text-xs font-body transition-colors"
            >
              View venue page →
            </Link>
          )}
        </div>
        {geoError && <p className="text-amber-400 text-xs font-body mt-2">{geoError}</p>}
      </div>

      {/* The forecast card */}
      <BiteTimes lat={spot.lat} lng={spot.lng} name={spot.label} variant="full" />

      {/* How it works — also good for search engines */}
      <div className="bg-deep-water-light border border-surface-teal rounded-lg p-5 mt-2">
        <h2 className="text-bone-white font-heading font-bold uppercase text-lg mb-3">How It Works</h2>
        <div className="space-y-3 text-sm font-body text-pale-water leading-relaxed">
          <p>
            <span className="text-bone-white font-medium">Solunar periods.</span> Fish tend to feed more
            actively when the moon is directly overhead or underfoot (<span className="text-cast-orange">major periods</span>)
            and around moonrise and moonset (<span className="text-cast-orange">minor periods</span>). Days around the
            new and full moon usually rate higher than the quarter moons.
          </p>
          <p>
            <span className="text-bone-white font-medium">Live weather.</span> Falling barometric pressure ahead
            of a front often switches fish on; high, rising pressure after a front tends to slow things down. We blend
            the live pressure trend and wind into the rating, and the 7-day outlook shows each day&apos;s expected
            weather, temperature and rain chance — refreshed live every time you load the page.
          </p>
          <p className="text-storm">
            Solunar theory is a guide trusted by generations of anglers, not a science — local knowledge, bait and
            patience still out-fish any forecast. Weather data: Open-Meteo.
          </p>
        </div>
      </div>

      {/* Cross-links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <Link href="/venues" className="group bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg p-5 transition-colors">
          <p className="text-bone-white font-heading font-bold uppercase group-hover:text-cast-orange transition-colors">🗺️ The Map</p>
          <p className="text-storm text-sm font-body mt-1">Every venue has its own bite forecast, water conditions and depth map.</p>
        </Link>
        <Link href="/conditions" className="group bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg p-5 transition-colors">
          <p className="text-bone-white font-heading font-bold uppercase group-hover:text-cast-orange transition-colors">🌊 Water Conditions</p>
          <p className="text-storm text-sm font-body mt-1">Dam levels and Vaal gate notices before you tow the boat.</p>
        </Link>
      </div>
    </div>
  );
}
