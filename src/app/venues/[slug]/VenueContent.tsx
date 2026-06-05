"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import BiteTimes from "@/components/BiteTimes";
import { VENUE_WATER_LEVELS, GATE_NOTICES } from "@/data/waterConditions";
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

type NearbyVenue = {
  id: string;
  name: string;
  slug: string;
  type: string;
  species: string[];
};

type RelatedThread = {
  id: string;
  title: string;
  reply_count: number;
  created_at: string;
  profiles: { username: string } | null;
  categories: { slug: string; name: string; icon: string } | null;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export default function VenueContent() {
  const params = useParams();
  const slug = params.slug as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<RelatedThread[]>([]);
  const [nearby, setNearby] = useState<NearbyVenue[]>([]);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("venues")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) { setLoading(false); return; }
        const v = data as Venue;
        setVenue(v);

        // Search for forum threads mentioning this venue. For names with a
        // qualifier (e.g. "Vaal River – Parys") match the distinctive place
        // name ("Parys") so natural threads link up too.
        const dash = v.name.indexOf("–");
        const searchTerm = dash !== -1 ? v.name.slice(dash + 1).trim() : v.name;
        const threadSelect = "id, title, reply_count, created_at, profiles(username), categories(slug, name, icon)";

        const { data: byTitle } = await supabase
          .from("threads")
          .select(threadSelect)
          .ilike("title", `%${searchTerm}%`)
          .order("created_at", { ascending: false })
          .limit(10);

        const titleIds = new Set((byTitle as unknown as RelatedThread[] ?? []).map((t) => t.id));

        const { data: matchedPosts } = await supabase
          .from("posts")
          .select("thread_id")
          .ilike("content", `%${searchTerm}%`)
          .limit(50);

        const postThreadIds = [...new Set((matchedPosts ?? []).map((p: { thread_id: string }) => p.thread_id))]
          .filter((id) => !titleIds.has(id));

        let byContent: RelatedThread[] = [];
        if (postThreadIds.length > 0) {
          const { data: pd } = await supabase
            .from("threads")
            .select(threadSelect)
            .in("id", postThreadIds)
            .order("created_at", { ascending: false })
            .limit(5);
          byContent = (pd ?? []) as unknown as RelatedThread[];
        }

        setThreads([...(byTitle as unknown as RelatedThread[] ?? []), ...byContent]);

        // Other venues in the same province
        const { data: nearbyData } = await supabase
          .from("venues")
          .select("id, name, slug, type, species")
          .eq("province", v.province)
          .neq("slug", slug)
          .limit(4);
        setNearby((nearbyData ?? []) as NearbyVenue[]);

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
  const newThreadUrl = `/forum/new?category=general&title=${encodeURIComponent(`Fishing at ${venue.name}`)}`;

  // Water conditions data for this venue
  const waterData = VENUE_WATER_LEVELS[slug];
  const latestNotices = GATE_NOTICES.filter((n) => n.latest);
  const isVaalRiver = ["vaal-river-parys", "vaal-river-vereeniging"].includes(slug);
  const isBarrage  = slug === "vaal-barrage";

  function levelTextClass(pct: number) {
    if (pct > 100) return "text-purple-400";
    if (pct >= 80)  return "text-green-400";
    if (pct >= 60)  return "text-amber-400";
    if (pct >= 30)  return "text-orange-400";
    return "text-red-400";
  }
  function levelBarColor(pct: number) {
    if (pct > 100) return "#a855f7";
    if (pct >= 80)  return "#22c55e";
    if (pct >= 60)  return "#f59e0b";
    if (pct >= 30)  return "#f97316";
    return "#ef4444";
  }
  function levelLabel(pct: number) {
    if (pct > 100) return "Overflow";
    if (pct >= 80)  return "Full";
    if (pct >= 60)  return "Moderate";
    if (pct >= 30)  return "Low";
    return "Critical";
  }

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

      {/* ── Water Conditions card ── */}
      {(waterData || isVaalRiver || isBarrage) && (
        <div className="bg-deep-water-light border border-surface-teal rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-pale-water text-xs font-body uppercase tracking-wider">Water Conditions</h2>
            <Link href="/conditions" className="text-xs font-body text-cast-orange hover:text-bone-white transition-colors">
              All dam levels →
            </Link>
          </div>

          {/* Dam level bar — shown for dam venues */}
          {waterData && (
            <div className="mb-4">
              <div className="flex items-end justify-between mb-1">
                <span className={`text-3xl font-heading font-bold ${levelTextClass(waterData.pct)}`}>
                  {waterData.pct}%
                </span>
                <span className={`text-sm font-body font-medium ${levelTextClass(waterData.pct)}`}>
                  {levelLabel(waterData.pct)}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-teal/20 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(waterData.pct, 100)}%`,
                    backgroundColor: levelBarColor(waterData.pct),
                  }}
                />
              </div>
              <div className="flex gap-4 text-xs font-body text-storm">
                <span>
                  vs last year:{" "}
                  <span className={waterData.pct >= waterData.lastYear ? "text-green-400" : "text-orange-400"}>
                    {waterData.pct >= waterData.lastYear ? "▲" : "▼"}{" "}
                    {Math.abs(waterData.pct - waterData.lastYear).toFixed(1)}%
                  </span>
                  {" "}({waterData.lastYear}% this time last year)
                </span>
              </div>
              <p className="text-xs font-body text-storm mt-1">Source: DWS · Updated weekly</p>
            </div>
          )}

          {/* Gate / river status — shown for Vaal system venues */}
          {(isVaalRiver || isBarrage || slug === "vaal-dam" || slug === "bloemhof-dam") && (
            <div className={`border rounded-lg p-3 mt-2 ${
              isVaalRiver
                ? "border-amber-700/50 bg-amber-900/10"
                : "border-green-700/50 bg-green-900/10"
            }`}>
              <p className="text-xs font-body font-bold uppercase tracking-wider mb-2 text-pale-water">
                Vaal System Gate Status
              </p>
              {latestNotices.map((n, i) => (
                <div key={i} className="text-xs font-body text-storm mb-1 last:mb-0">
                  <span className={`font-bold mr-1 ${
                    n.dam === "vaal" ? "text-green-400" : "text-amber-400"
                  }`}>
                    {n.dam === "vaal" ? "Vaal Dam:" : n.dam === "bloemhof" ? "Bloemhof:" : "Barrage:"}
                  </span>
                  {n.text}
                </div>
              ))}
              {(isVaalRiver) && (
                <p className="text-amber-300 text-xs mt-2 font-body">
                  ⚠ Bloemhof releasing 250 m³/s — exercise caution near banks.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Best bite times (solunar) */}
      <BiteTimes lat={venue.lat} lng={venue.lng} name={venue.name} />

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

      {/* Forum threads about this venue */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-bone-white font-heading font-bold uppercase text-lg">
            Forum Threads
          </h2>
          <Link
            href={newThreadUrl}
            className="text-cast-orange hover:text-bone-white text-sm font-body font-medium transition-colors"
          >
            + Start one
          </Link>
        </div>

        {threads.length === 0 ? (
          <div className="bg-deep-water-light border border-surface-teal rounded-lg p-8 text-center">
            <p className="text-storm font-body text-sm mb-4">
              No threads about {venue.name} yet — be the first.
            </p>
            <Link
              href={newThreadUrl}
              className="inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-5 py-2.5 rounded transition-colors text-sm"
            >
              Start a Thread
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-surface-teal/50 bg-deep-water-light border border-surface-teal rounded-lg overflow-hidden">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/forum/thread?id=${thread.id}`}
                className="group flex items-center gap-4 p-4 hover:bg-deep-water transition-colors"
              >
                <span className="flex-shrink-0 text-lg w-7 text-center">
                  {thread.categories?.icon ?? "🎣"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-bone-white font-body font-medium group-hover:text-cast-orange transition-colors truncate">
                    {thread.title}
                  </p>
                  <p className="text-storm text-xs mt-0.5">
                    by <span className="text-pale-water">{thread.profiles?.username ?? "Unknown"}</span>
                    {" · "}{timeAgo(thread.created_at)}
                  </p>
                </div>
                <span className="flex-shrink-0 text-pale-water text-xs">{thread.reply_count} replies</span>
              </Link>
            ))}
            <div className="p-4 text-center">
              <Link
                href={newThreadUrl}
                className="text-cast-orange hover:underline text-sm font-body"
              >
                + Start a new thread about {venue.name}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* More in this province */}
      {nearby.length > 0 && (
        <div className="mb-6">
          <h2 className="text-bone-white font-heading font-bold uppercase text-lg mb-4">
            More in {venue.province}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nearby.map((v) => (
              <Link
                key={v.id}
                href={`/venues/${v.slug}`}
                className="group bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg p-4 transition-colors block"
              >
                <p className="text-bone-white font-heading font-bold uppercase text-sm group-hover:text-cast-orange transition-colors leading-tight mb-1">
                  {v.name}
                </p>
                <p className="text-storm text-xs font-body capitalize mb-2">{v.type}</p>
                <div className="flex flex-wrap gap-1">
                  {v.species.slice(0, 3).map((s) => (
                    <span key={s} className="bg-surface-teal/20 text-pale-water text-xs font-body px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Suggest a venue */}
      <div className="bg-surface-teal/10 border border-surface-teal/40 rounded-lg p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-bone-white font-body font-medium text-sm">Know a great fishing spot not on The Map?</p>
          <p className="text-storm font-body text-xs mt-0.5">Submit it and we&apos;ll review it.</p>
        </div>
        <Link
          href="/venues/suggest"
          className="flex-shrink-0 border border-surface-teal text-pale-water hover:text-bone-white hover:border-cast-orange text-sm font-heading font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors"
        >
          Suggest
        </Link>
      </div>

      <div className="mt-2">
        <Link href="/venues" className="text-storm hover:text-pale-water text-sm font-body transition-colors">
          ← Back to The Map
        </Link>
      </div>
    </div>
  );
}
