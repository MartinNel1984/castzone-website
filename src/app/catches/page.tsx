"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Category = "carp" | "bass" | "saltwater";

type Catch = {
  id: string;
  species: string;
  weight_kg: number;
  catch_date: string;
  venue: string | null;
  image_url: string | null;
  approved_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

const CATEGORIES = [
  { value: "carp"      as Category, label: "Carp",      icon: "🐟", description: "Common, Mirror, Grass & all carp species" },
  { value: "bass"      as Category, label: "Bass",       icon: "🎣", description: "Largemouth, Smallmouth & Spotted Bass" },
  { value: "saltwater" as Category, label: "Saltwater",  icon: "🌊", description: "Shore, offshore, kayak & ski-boat species" },
];

const MEDALS  = ["🥇", "🥈", "🥉"];
const MEDAL_COLOURS = ["text-yellow-400", "text-gray-300", "text-amber-600"];

function daysHeld(approvedAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(approvedAt).getTime()) / 86_400_000));
}

function formatWeight(kg: number): string {
  return `${Number(kg).toFixed(2)} kg`;
}

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-ZA", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function DaysHeldBadge({ approvedAt }: { approvedAt: string }) {
  const days = daysHeld(approvedAt);
  const label = days === 0 ? "Claimed today" : days === 1 ? "#1 for 1 day" : `#1 for ${days} days`;
  return (
    <span className="inline-flex items-center gap-2 bg-cast-orange/10 border border-cast-orange/40 text-cast-orange text-sm font-heading font-bold uppercase tracking-wider rounded px-4 py-2">
      <span>👑</span>
      {label}
    </span>
  );
}

function EmptyState({ cat, user }: { cat: typeof CATEGORIES[number]; user: User | null }) {
  return (
    <div className="py-24 text-center">
      <div className="text-7xl mb-5">{cat.icon}</div>
      <h2 className="text-2xl font-heading font-bold text-bone-white uppercase mb-3">
        No catches yet
      </h2>
      <p className="text-pale-water font-body mb-8 max-w-xs mx-auto">
        Be the first to claim the {cat.label} crown. All you need is a catch and a photo.
      </p>
      <Link
        href={user ? "/catches/submit" : "/login"}
        className="inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-8 py-3 rounded transition-colors"
      >
        Submit Your Catch
      </Link>
    </div>
  );
}

export default function TrophyRoomPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("carp");
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    setLoading(true);
    supabase
      .from("catches")
      .select("id, species, weight_kg, catch_date, venue, image_url, approved_at, profiles(username, avatar_url)")
      .eq("category", activeCategory)
      .eq("approved", true)
      .order("weight_kg", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setCatches((data as unknown as Catch[]) ?? []);
        setLoading(false);
      });
  }, [activeCategory]);

  const champion = catches[0] ?? null;
  const rest     = catches.slice(1);
  const cat      = CATEGORIES.find((c) => c.value === activeCategory)!;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

      {/* Page header */}
      <div className="flex items-end justify-between mb-2 gap-4">
        <div>
          <h1 className="text-5xl font-heading font-bold text-bone-white uppercase leading-tight">
            Trophy Room
          </h1>
          <p className="text-cast-orange font-heading font-semibold uppercase tracking-widest text-sm mt-1">
            South Africa&apos;s Biggest Catches
          </p>
        </div>
        <Link
          href={user ? "/catches/submit" : "/login"}
          className="hidden sm:inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-5 py-2.5 rounded transition-colors text-sm flex-shrink-0"
        >
          Submit a Catch
        </Link>
      </div>
      <p className="text-storm font-body text-sm mb-8">
        Submit your catch with a photo and go straight onto the leaderboard.
      </p>

      {/* Category tabs */}
      <div className="flex border-b border-surface-teal mb-8">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setActiveCategory(c.value)}
            className={`font-heading font-bold uppercase tracking-wider text-sm px-5 py-3 border-b-2 transition-colors ${
              activeCategory === c.value
                ? "border-cast-orange text-bone-white"
                : "border-transparent text-storm hover:text-pale-water"
            }`}
          >
            <span className="mr-1.5">{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-24 text-center text-storm font-body">Loading leaderboard...</div>
      ) : !champion ? (
        <EmptyState cat={cat} user={user} />
      ) : (
        <>
          {/* ── Champion card ── */}
          <div className="bg-deep-water-light border-2 border-cast-orange rounded-xl overflow-hidden mb-8">
            <div className="bg-cast-orange/10 px-6 py-3 flex items-center gap-2 border-b border-cast-orange/30">
              <span className="text-2xl">🏆</span>
              <span className="text-cast-orange font-heading font-bold uppercase tracking-widest text-sm">
                Current Champion — {cat.label}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row">
              {champion.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={champion.image_url}
                  alt={`${champion.species} caught by ${champion.profiles?.username ?? "Angler"} — ${Number(champion.weight_kg).toFixed(2)} kg`}
                  className="w-full sm:w-72 h-60 sm:h-auto object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-full sm:w-72 h-60 sm:h-auto bg-surface-teal/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-8xl opacity-30">{cat.icon}</span>
                </div>
              )}
              <div className="p-6 sm:p-8 flex flex-col justify-center gap-4">
                <div>
                  <p className="text-bone-white font-heading font-bold text-3xl leading-tight">
                    {champion.profiles?.username ?? "Angler"}
                  </p>
                  <p className="text-pale-water font-body mt-0.5">{champion.species}</p>
                </div>
                <p className="text-cast-orange font-heading font-bold text-5xl leading-none">
                  {formatWeight(champion.weight_kg)}
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-body text-storm">
                  <span>Caught {formatDate(champion.catch_date)}</span>
                  {champion.venue && <span>📍 {champion.venue}</span>}
                </div>
                <DaysHeldBadge approvedAt={champion.approved_at} />
              </div>
            </div>
          </div>

          {/* ── Leaderboard ── */}
          {rest.length > 0 && (
            <div className="bg-deep-water-light border border-surface-teal rounded-xl overflow-hidden mb-8">
              <div className="px-6 py-3 border-b border-surface-teal flex items-center gap-2">
                <span className="text-pale-water font-heading font-bold uppercase text-sm tracking-wider">
                  All-Time Leaderboard
                </span>
                <span className="text-storm text-sm font-body">— top {catches.length}</span>
              </div>
              <div className="divide-y divide-surface-teal/50">
                {rest.map((c, i) => {
                  const rank = i + 2;
                  return (
                    <div key={c.id} className="flex items-center gap-4 px-6 py-4">
                      {/* Rank */}
                      <div className="w-8 text-center flex-shrink-0">
                        {rank <= 3 ? (
                          <span className={`text-xl ${MEDAL_COLOURS[rank - 1]}`}>{MEDALS[rank - 1]}</span>
                        ) : (
                          <span className="text-storm font-heading font-bold text-sm">#{rank}</span>
                        )}
                      </div>

                      {/* Thumbnail */}
                      {c.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.image_url}
                          alt=""
                          className="w-12 h-12 rounded object-cover flex-shrink-0 border border-surface-teal"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-surface-teal/20 flex items-center justify-center flex-shrink-0 border border-surface-teal">
                          <span className="text-lg">{cat.icon}</span>
                        </div>
                      )}

                      {/* Name + details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-bone-white font-body font-semibold truncate">
                          {c.profiles?.username ?? "Angler"}
                        </p>
                        <p className="text-storm text-sm font-body truncate">
                          {c.species} · {formatDate(c.catch_date)}
                          {c.venue ? ` · ${c.venue}` : ""}
                        </p>
                      </div>

                      {/* Weight */}
                      <p className="text-cast-orange font-heading font-bold text-lg flex-shrink-0">
                        {formatWeight(c.weight_kg)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Mobile submit CTA */}
      <div className="sm:hidden mt-2">
        <Link
          href={user ? "/catches/submit" : "/login"}
          className="block w-full text-center bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-5 py-3 rounded transition-colors"
        >
          Submit a Catch
        </Link>
      </div>

    </div>
  );
}
