"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Category = "carp" | "barbel" | "freshwater" | "bass" | "saltwater";

type Catch = {
  id: string;
  species: string;
  weight_kg: number;
  catch_date: string;
  venue: string | null;
  image_url: string | null;
  approved_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
  comment_count?: number;
};

const CATEGORIES = [
  { value: "carp"       as Category, label: "Carp",            icon: "🐟", description: "Common, Mirror, Grass, Ghost & other carp" },
  { value: "barbel"     as Category, label: "Barbel",          icon: "🐡", description: "Sharptooth barbel, catfish & relatives" },
  { value: "freshwater" as Category, label: "Other Freshwater", icon: "🐠", description: "Yellowfish, mudfish, tilapia, tigerfish & other freshwater species" },
  { value: "bass"       as Category, label: "Bass",            icon: "🎣", description: "Largemouth, Smallmouth & Spotted Bass" },
  { value: "saltwater"  as Category, label: "Saltwater",       icon: "🌊", description: "Shore, offshore, kayak & ski-boat species" },
];

function commentLabel(n: number): string {
  return n === 1 ? "1 comment" : `${n} comments`;
}

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

// Relative time for comments. Date.now() lives inside this helper (not in render)
// so it doesn't trip the React-compiler purity lint — same pattern as daysHeld().
function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

type CatchComment = {
  id: string;
  body: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
};

async function fetchComments(catchId: string): Promise<CatchComment[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("catch_comments")
    .select("id, body, created_at, profiles(username, avatar_url)")
    .eq("catch_id", catchId)
    .order("created_at", { ascending: true });
  return (data as unknown as CatchComment[]) ?? [];
}

function CatchComments({ catchId, user }: { catchId: string; user: User | null }) {
  const [comments, setComments] = useState<CatchComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const rows = await fetchComments(catchId);
      setComments(rows);
      setLoading(false);
    }
    load();
  }, [catchId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !user || posting) return;
    setPosting(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase
      .from("catch_comments")
      .insert({ catch_id: catchId, user_id: user.id, body: text });
    if (err) {
      setError("Couldn't post your comment — please try again.");
      setPosting(false);
      return;
    }
    setBody("");
    setComments(await fetchComments(catchId));
    setPosting(false);
  }

  return (
    <div className="mt-5 pt-5 border-t border-surface-teal/40">
      <p className="text-pale-water font-heading font-bold uppercase tracking-wider text-sm mb-4">
        💬 Comments{comments.length > 0 ? ` (${comments.length})` : ""}
      </p>

      {loading ? (
        <p className="text-storm font-body text-sm">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-storm font-body text-sm">No comments yet — be the first to give some feedback. 🎣</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((cm) => {
            const name = cm.profiles?.username ?? "Angler";
            return (
              <li key={cm.id} className="flex gap-3">
                {cm.profiles?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cm.profiles.avatar_url} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-surface-teal/30 flex items-center justify-center flex-shrink-0 text-pale-water font-heading font-bold text-sm">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <Link href={`/profile?username=${encodeURIComponent(name)}`} className="text-bone-white font-heading font-bold text-sm hover:text-cast-orange transition-colors truncate">
                      {name}
                    </Link>
                    <span className="text-storm text-xs font-body flex-shrink-0">{timeAgo(cm.created_at)}</span>
                  </div>
                  <p className="text-pale-water font-body text-sm whitespace-pre-wrap break-words">{cm.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {user ? (
        <form onSubmit={submit} className="mt-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            maxLength={1000}
            className="w-full bg-deep-water border border-surface-teal rounded px-3 py-2 text-bone-white font-body text-sm placeholder:text-storm focus:border-cast-orange focus:outline-none resize-y"
          />
          {error && <p className="text-red-400 font-body text-xs mt-1">{error}</p>}
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!body.trim() || posting}
              className="bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-heading font-bold uppercase tracking-wider text-sm px-5 py-2 rounded transition-colors"
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-storm font-body text-sm mt-4">
          <Link href="/login" className="text-cast-orange hover:underline">Sign in</Link> to leave a comment.
        </p>
      )}
    </div>
  );
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

function CatchModal({ c, cat, user, onClose }: { c: Catch; cat: typeof CATEGORIES[number]; user: User | null; onClose: () => void }) {
  const close = useCallback(() => onClose(), [onClose]);
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [close]);

  return (
    <div
      className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-deep-water-light border border-cast-orange/60 rounded-xl overflow-hidden w-full max-w-lg max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-surface-teal/40 flex-shrink-0">
          <span className="text-cast-orange font-heading font-bold uppercase tracking-wider text-sm">{cat.icon} {cat.label}</span>
          <button onClick={onClose} className="text-storm hover:text-bone-white text-3xl leading-none transition-colors" aria-label="Close">×</button>
        </div>

        {/* Image */}
        <div className="bg-black overflow-auto flex-shrink-0">
          {c.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.image_url}
              alt={`${c.species} by ${c.profiles?.username ?? "Angler"} — ${formatWeight(c.weight_kg)}`}
              className="w-full max-h-[55vh] object-contain"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center text-7xl opacity-30">{cat.icon}</div>
          )}
        </div>

        {/* Details */}
        <div className="p-5 overflow-y-auto">
          <p className="text-bone-white font-heading font-bold text-2xl leading-tight mb-1">
            {c.profiles?.username ?? "Angler"}
          </p>
          <p className="text-cast-orange font-heading font-bold text-4xl leading-none mb-3">
            {formatWeight(c.weight_kg)}
          </p>
          <p className="text-pale-water font-body mb-1">{c.species}</p>
          <p className="text-storm font-body text-sm">Caught {formatDate(c.catch_date)}</p>
          {c.venue && <p className="text-storm font-body text-sm mt-0.5">📍 {c.venue}</p>}

          <CatchComments catchId={c.id} user={user} />
        </div>
      </div>
    </div>
  );
}

export default function TrophyRoomPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("carp");
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [selectedCatch, setSelectedCatch] = useState<Catch | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("catches")
        .select("id, species, weight_kg, catch_date, venue, image_url, approved_at, profiles(username, avatar_url)")
        .eq("category", activeCategory)
        .eq("approved", true)
        .order("weight_kg", { ascending: false })
        .limit(10);
      const list = (data as unknown as Catch[]) ?? [];
      // Comment counts for the visible catches — one query, tallied client-side
      if (list.length > 0) {
        const { data: cc } = await supabase
          .from("catch_comments")
          .select("catch_id")
          .in("catch_id", list.map((c) => c.id));
        const counts = new Map<string, number>();
        for (const row of (cc as { catch_id: string }[] | null) ?? []) {
          counts.set(row.catch_id, (counts.get(row.catch_id) ?? 0) + 1);
        }
        for (const c of list) c.comment_count = counts.get(c.id) ?? 0;
      }
      setCatches(list);
      setLoading(false);
    }
    load();
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
      <div className="flex border-b border-surface-teal mb-8 overflow-x-auto">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setActiveCategory(c.value)}
            className={`font-heading font-bold uppercase tracking-wider text-sm px-4 sm:px-5 py-3 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
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
                  onClick={() => setSelectedCatch(champion)}
                  className="w-full sm:w-72 h-60 sm:h-auto object-cover flex-shrink-0 cursor-zoom-in"
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
                <button
                  onClick={() => setSelectedCatch(champion)}
                  className="text-storm hover:text-cast-orange font-body text-sm text-left transition-colors w-fit"
                >
                  💬 {(champion.comment_count ?? 0) > 0 ? commentLabel(champion.comment_count!) : "Add a comment"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Leaderboard (cards, ~half the champion's size) ── */}
          {rest.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-pale-water font-heading font-bold uppercase text-sm tracking-wider">
                  All-Time Leaderboard
                </span>
                <span className="text-storm text-sm font-body">— top {catches.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rest.map((c, i) => {
                  const rank = i + 2;
                  return (
                    <div key={c.id} onClick={() => setSelectedCatch(c)} className="bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-xl overflow-hidden flex cursor-pointer transition-colors">
                      {/* Image — roughly half the champion card */}
                      {c.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.image_url}
                          alt={`${c.species} caught by ${c.profiles?.username ?? "Angler"} — ${formatWeight(c.weight_kg)}`}
                          className="w-32 h-32 sm:w-36 sm:h-36 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-32 h-32 sm:w-36 sm:h-36 bg-surface-teal/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-5xl opacity-30">{cat.icon}</span>
                        </div>
                      )}

                      {/* Details */}
                      <div className="p-4 flex flex-col justify-center gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {rank <= 3 ? (
                            <span className={`text-xl flex-shrink-0 ${MEDAL_COLOURS[rank - 1]}`}>{MEDALS[rank - 1]}</span>
                          ) : (
                            <span className="text-storm font-heading font-bold text-sm flex-shrink-0">#{rank}</span>
                          )}
                          <p className="text-bone-white font-heading font-bold text-lg truncate">
                            {c.profiles?.username ?? "Angler"}
                          </p>
                        </div>
                        <p className="text-cast-orange font-heading font-bold text-3xl leading-none">
                          {formatWeight(c.weight_kg)}
                        </p>
                        <p className="text-pale-water font-body text-sm truncate">{c.species}</p>
                        <p className="text-storm text-xs font-body truncate">
                          {formatDate(c.catch_date)}{c.venue ? ` · ${c.venue}` : ""}
                          {(c.comment_count ?? 0) > 0 ? ` · 💬 ${c.comment_count}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Lightbox modal */}
      {selectedCatch && (
        <CatchModal c={selectedCatch} cat={cat} user={user} onClose={() => setSelectedCatch(null)} />
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
