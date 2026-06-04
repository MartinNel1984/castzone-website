"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Tournament = {
  id: string;
  title: string;
  discipline: string;
  organizer: string | null;
  province: string | null;
  venue_name: string | null;
  start_date: string;
  end_date: string | null;
  registration_url: string | null;
  description: string | null;
  contact_info: string | null;
};

const FILTERS = [
  { value: "all",       label: "All Events" },
  { value: "bass",      label: "Bass" },
  { value: "saltwater", label: "Saltwater" },
  { value: "specimen",  label: "Specimen" },
  { value: "fly",       label: "Fly Fishing" },
];

const DISC: Record<string, { color: string; icon: string; label: string }> = {
  bass:      { color: "#2d6a4f", icon: "🎣", label: "Bass" },
  saltwater: { color: "#1d3557", icon: "🌊", label: "Saltwater" },
  specimen:  { color: "#6b4226", icon: "🐟", label: "Specimen" },
  fly:       { color: "#0ea5e9", icon: "🪰", label: "Fly Fishing" },
  general:   { color: "#2a6e6e", icon: "📅", label: "General" },
};

function formatDateRange(start: string, end: string | null) {
  const s = new Date(start + "T00:00:00");
  const full: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  if (!end || end === start) return s.toLocaleDateString("en-ZA", full);
  const e = new Date(end + "T00:00:00");
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}`;
  }
  return `${s.toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} – ${e.toLocaleDateString("en-ZA", full)}`;
}

function TournamentCard({ t }: { t: Tournament }) {
  const disc = DISC[t.discipline] ?? DISC.general;
  return (
    <div
      className="bg-deep-water-light border border-surface-teal rounded-lg overflow-hidden flex"
    >
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: disc.color }} />
      <div className="flex-1 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-sm">{disc.icon}</span>
              <span className="text-xs font-heading font-bold uppercase tracking-wider"
                style={{ color: disc.color }}>
                {disc.label}
              </span>
              {t.organizer && (
                <span className="text-storm text-xs font-body">· {t.organizer}</span>
              )}
            </div>
            <h3 className="text-bone-white font-heading font-bold text-xl uppercase leading-tight mb-3">
              {t.title}
            </h3>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-body text-pale-water mb-3">
              <span>📅 {formatDateRange(t.start_date, t.end_date)}</span>
              {t.province && <span>📍 {t.province}</span>}
              {t.venue_name && <span>🎣 {t.venue_name}</span>}
            </div>
            {t.description && (
              <p className="text-storm font-body text-sm leading-relaxed">{t.description}</p>
            )}
            {t.contact_info && (
              <p className="text-storm font-body text-xs mt-2">Contact: {t.contact_info}</p>
            )}
          </div>
          {t.registration_url && (
            <a
              href={t.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded transition-colors"
            >
              Register
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("tournaments")
      .select("*")
      .order("start_date", { ascending: true })
      .then(({ data }) => {
        setTournaments((data as Tournament[]) ?? []);
        setLoading(false);
      });
  }, []);

  const visible  = filter === "all" ? tournaments : tournaments.filter((t) => t.discipline === filter);
  const upcoming = visible.filter((t) => (t.end_date ?? t.start_date) >= today);
  const past     = visible.filter((t) => (t.end_date ?? t.start_date) < today).reverse();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <div>
          <h1 className="text-5xl font-heading font-bold text-bone-white uppercase">Tournaments</h1>
          <p className="text-cast-orange font-heading font-semibold uppercase tracking-widest text-sm mt-1">
            SA Angling Calendar
          </p>
        </div>
        <Link
          href="/forum/new?category=general&title=Tournament+Submission"
          className="flex-shrink-0 self-center border border-surface-teal hover:border-cast-orange text-storm hover:text-cast-orange font-body text-sm px-4 py-2.5 rounded transition-colors"
        >
          + Submit a Tournament
        </Link>
      </div>

      {/* Discipline filters */}
      <div className="flex flex-wrap gap-2 mt-8 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`font-heading font-bold uppercase tracking-wider text-xs px-4 py-2 rounded border transition-colors ${
              filter === f.value
                ? "bg-cast-orange border-cast-orange text-white"
                : "border-surface-teal text-storm hover:border-pale-water/50 hover:text-pale-water"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-storm font-body text-center py-20">Loading calendar...</p>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <div className="bg-deep-water-light border border-surface-teal rounded-lg p-10 text-center">
          <p className="text-pale-water font-body">No tournaments listed yet — check back soon.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-heading font-bold text-bone-white uppercase mb-5">
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {upcoming.map((t) => <TournamentCard key={t.id} t={t} />)}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-xl font-heading font-bold text-storm uppercase mb-5">
                Past Events
              </h2>
              <div className="space-y-4 opacity-60">
                {past.map((t) => <TournamentCard key={t.id} t={t} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
