"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import ShareButtons from "@/components/ShareButtons";
import BiteTimes from "@/components/BiteTimes";
import GateNoticeStaleness from "@/components/GateNoticeStaleness";
import { GATE_NOTICES, GATE_STATUS } from "@/data/waterConditions";
import { useSpot, JOHANNESBURG } from "@/lib/geo";

const forumCategories = [
  {
    name: "Bass Fishing",
    slug: "bass",
    description: "Tackle, techniques, dams, tournaments and reports for SA bass anglers.",
    colour: "bg-bass-green",
    icon: "🎣",
    photo: "https://images.unsplash.com/photo-1601248981876-29b78bd607df?w=600&q=80&auto=format&fit=crop",
  },
  {
    name: "Saltwater Fishing",
    slug: "saltwater",
    description: "Shore, offshore, lure, kayak and ski-boat angling along the SA coast.",
    colour: "bg-saltwater-blue",
    icon: "🌊",
    photo: "https://images.unsplash.com/photo-1529230117010-b6c436154f25?w=600&q=80&auto=format&fit=crop",
  },
  {
    name: "Specimen & Carp",
    slug: "specimen",
    description: "European-style specimen carp fishing, rigs, bait and big fish stories.",
    colour: "bg-specimen-brown",
    icon: "🐟",
    photo: "https://images.unsplash.com/photo-1545450660-3378a7f3a364?w=600&q=80&auto=format&fit=crop",
  },
  {
    name: "General Angling",
    slug: "general",
    description: "Everything else — freshwater, fly fishing, beginner questions and more.",
    colour: "bg-surface-teal",
    icon: "🏞️",
    photo: "https://images.unsplash.com/photo-1493787039806-2edcbe808750?w=600&q=80&auto=format&fit=crop",
  },
];

const featureCards = [
  { title: "Best Bite Times", description: "Solunar + weather forecast for the best times to fish, anywhere in SA.", href: "/bite-times", icon: "🎣" },
  { title: "The Map", description: "Find dams and venues across all 9 provinces. Species, permits, GPS.", href: "/venues", icon: "🗺️" },
  { title: "Trophy Room", description: "Log your catches, track personal bests, and show off your fish.", href: "/catches", icon: "🏆" },
  { title: "Tournaments", description: "SA tournament calendar — bass, carp, saltwater and more.", href: "/tournaments", icon: "🥇" },
];

type Stats = { members: number; threads: number; posts: number; categories: number; venues: number; specials: number };

type RecentCatch = {
  id: string;
  species: string;
  weight_kg: number;
  category: string;
  venue: string | null;
  image_url: string | null;
  profiles: { username: string } | null;
};

type RecentThread = {
  id: string;
  title: string;
  reply_count: number;
  created_at: string;
  profiles: { username: string } | null;
  categories: { slug: string; name: string; icon: string } | null;
};

function threadTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function vaalAlertLevel(text: string): "danger" | "caution" | "normal" {
  const m = text.match(/(\d[\d\s]*)\s*m³\/s/i);
  if (!m) return "normal";
  const cms = parseInt(m[1].replace(/\s/g, ""), 10);
  if (cms >= 500) return "danger";
  if (cms >= 100) return "caution";
  return "normal";
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<Record<string, { thread_count: number; post_count: number }>>({});
  const [recentThreads, setRecentThreads] = useState<RecentThread[]>([]);
  const [recentCatches, setRecentCatches] = useState<RecentCatch[]>([]);
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const { spot, locateMe, locating, geoError } = useSpot(JOHANNESBURG);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));

    async function loadStats() {
      const [
        { count: members },
        { count: threads },
        { count: posts },
        { count: venues },
        { count: specials },
        { data: cats },
        { data: latest },
        { data: latestCatches },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("threads").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("venues").select("*", { count: "exact", head: true }),
        supabase.from("deals").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("categories").select("slug,thread_count,post_count"),
        supabase.from("threads").select("id,title,reply_count,created_at,profiles(username),categories(slug,name,icon)").order("created_at", { ascending: false }).limit(6),
        supabase.from("catches").select("id,species,weight_kg,category,venue,image_url,profiles(username)").eq("approved", true).order("approved_at", { ascending: false }).limit(3),
      ]);
      setStats({ members: members ?? 0, threads: threads ?? 0, posts: posts ?? 0, categories: cats?.length ?? 0, venues: venues ?? 0, specials: specials ?? 0 });
      if (cats) {
        const map: Record<string, { thread_count: number; post_count: number }> = {};
        cats.forEach((c) => { map[c.slug] = { thread_count: c.thread_count, post_count: c.post_count }; });
        setCategories(map);
      }
      setRecentThreads((latest ?? []) as unknown as RecentThread[]);
      setRecentCatches((latestCatches as unknown as RecentCatch[]) ?? []);
    }

    loadStats();
    return () => listener.subscription.unsubscribe();
  }, []);

  const username = user?.user_metadata?.username ?? user?.email?.split("@")[0];
  const loggedIn = user !== undefined && user !== null;

  return (
    <div>
      {/* Hero with background photo */}
      <section className="relative border-b border-surface-teal overflow-hidden min-h-[520px] flex items-center">
        {/* Background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541742425281-c1d3fc8aff96?w=1920&q=80&auto=format&fit=crop')" }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-deep-water/85" />
        {/* Orange glow */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #f26522 0%, transparent 60%)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full">
          <div className="max-w-2xl">
            <p className="text-cast-orange font-heading font-semibold uppercase tracking-widest text-sm mb-3">
              South Africa&apos;s Fishing Community
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-bone-white leading-none mb-6 uppercase">
              Where South<br />Africa Fishes
            </h1>
            <p className="text-pale-water text-lg leading-relaxed mb-8 font-body max-w-xl">
              Bass, saltwater, specimen and everything in between. Join the forum built for SA anglers — share catches, find venues, buy gear, and connect.
            </p>

            {/* Auth-aware CTAs */}
            {user === undefined ? null : loggedIn ? (
              <div className="flex flex-wrap gap-4 items-center">
                <Link href="/forum" className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors">
                  Go to Forum
                </Link>
                <Link href="/forum/new" className="border border-surface-teal hover:border-pale-water text-pale-water hover:text-bone-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors">
                  Start a Thread
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-4">
                  <Link href="/register" className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors">
                    Join Free
                  </Link>
                  <Link href="/forum" className="border border-surface-teal hover:border-pale-water text-pale-water hover:text-bone-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors">
                    Browse Forum
                  </Link>
                </div>
                <p className="text-pale-water/70 text-sm font-body mt-4">
                  Free forever · Dam &amp; gate-level alerts · Find venues near you
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Live stats banner */}
      <section className="bg-deep-water-light border-b border-surface-teal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap justify-center sm:justify-start gap-8 sm:gap-12 text-center">
            {stats ? (
              <>
                <Link href="/members" className="group"><p className="text-cast-orange group-hover:text-bone-white font-heading font-bold text-xl uppercase transition-colors">{stats.members.toLocaleString()}</p><p className="text-storm text-xs uppercase tracking-wider mt-0.5">Members</p></Link>
                <Link href="/specials" className="group"><p className="text-cast-orange group-hover:text-bone-white font-heading font-bold text-xl uppercase transition-colors">{stats.specials.toLocaleString()}</p><p className="text-storm text-xs uppercase tracking-wider mt-0.5">Specials</p></Link>
                <div><p className="text-cast-orange font-heading font-bold text-xl uppercase">{stats.threads.toLocaleString()}</p><p className="text-storm text-xs uppercase tracking-wider mt-0.5">Threads</p></div>
                <div><p className="text-cast-orange font-heading font-bold text-xl uppercase">{stats.posts.toLocaleString()}</p><p className="text-storm text-xs uppercase tracking-wider mt-0.5">Posts</p></div>
                {stats.venues > 0 && <Link href="/venues" className="group"><p className="text-cast-orange group-hover:text-bone-white font-heading font-bold text-xl uppercase transition-colors">{stats.venues.toLocaleString()}</p><p className="text-storm text-xs uppercase tracking-wider mt-0.5">Venues</p></Link>}
                <div><p className="text-cast-orange font-heading font-bold text-xl uppercase">{stats.categories.toLocaleString()}</p><p className="text-storm text-xs uppercase tracking-wider mt-0.5">Categories</p></div>
              </>
            ) : (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 w-12 bg-surface-teal rounded mb-1" />
                  <div className="h-3 w-16 bg-surface-teal/50 rounded" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Bite forecast widget */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-wrap items-center justify-end gap-3 mb-2">
          {geoError && <span className="text-amber-400 text-xs font-body">{geoError}</span>}
          <button
            onClick={locateMe}
            disabled={locating}
            className="border border-surface-teal hover:border-cast-orange text-pale-water hover:text-bone-white text-xs font-heading font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors disabled:opacity-50"
          >
            📍 {locating ? "Finding you…" : "Use my location"}
          </button>
        </div>
        <BiteTimes lat={spot.lat} lng={spot.lng} variant="compact" locationLabel={spot.label} />
      </section>

      {/* Angler Safety — Vaal River */}
      {(() => {
        const latestVaal      = GATE_NOTICES.find((n) => n.dam === "vaal"     && n.latest);
        const latestBloemhof  = GATE_NOTICES.find((n) => n.dam === "bloemhof" && n.latest);
        const latestBarrage   = GATE_NOTICES.find((n) => n.dam === "barrage"  && n.latest);
        const bloemhofLevel   = latestBloemhof ? vaalAlertLevel(latestBloemhof.text) : "normal";
        const bannerColour =
          bloemhofLevel === "danger"  ? "border-red-600/60 bg-red-900/10"   :
          bloemhofLevel === "caution" ? "border-amber-600/60 bg-amber-900/10" :
          "border-surface-teal bg-deep-water-light";
        const titleColour =
          bloemhofLevel === "danger"  ? "text-red-400"    :
          bloemhofLevel === "caution" ? "text-amber-400"  :
          "text-pale-water";
        const icon = bloemhofLevel === "danger" ? "🚨" : bloemhofLevel === "caution" ? "⚠️" : "ℹ️";
        return (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-heading font-bold text-bone-white uppercase">
                {icon} Angler Safety — Vaal River
              </h2>
              <Link href="/conditions" className="text-cast-orange hover:text-bone-white text-sm font-body transition-colors">
                Full dam levels →
              </Link>
            </div>

            {/* Gate status cards */}
            <div className={`border rounded-lg p-5 mb-5 ${bannerColour}`}>
              <p className={`font-heading font-bold uppercase text-sm mb-3 ${titleColour}`}>
                Latest Gate Notices — Updated by DWS
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Vaal Dam",  notice: latestVaal,     colour: "text-blue-300"  },
                  { label: "Bloemhof",  notice: latestBloemhof, colour: titleColour       },
                  { label: "Barrage",   notice: latestBarrage,  colour: "text-teal-300"  },
                ].map(({ label, notice, colour }) => (
                  <div key={label} className="bg-black/20 rounded p-3">
                    <p className={`text-xs font-body font-bold uppercase tracking-wider mb-1 ${colour}`}>{label}</p>
                    {notice ? (
                      <>
                        <p className="text-bone-white text-sm font-body leading-snug">{notice.text}</p>
                        <p className="text-storm text-xs mt-1">{notice.date}</p>
                      </>
                    ) : (
                      <p className="text-storm text-sm font-body">No recent notice</p>
                    )}
                  </div>
                ))}
              </div>
              {bloemhofLevel !== "normal" && (
                <p className={`mt-4 text-sm font-body font-medium ${titleColour}`}>
                  {bloemhofLevel === "danger"
                    ? "⚠ Bloemhof releasing at high volume — avoid all Vaal River banks. Strong current and rising water levels expected downstream."
                    : "⚠ Bloemhof releasing water — exercise caution near Vaal River banks. Current stronger than normal downstream of Parys."}
                </p>
              )}
            </div>

            <GateNoticeStaleness latestDate={GATE_NOTICES.find((n) => n.latest)?.date ?? ""} status={GATE_STATUS} />

            {/* Vaal sections guide */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  section: "Upper Vaal",
                  stretch: "Vaal Dam → Parys (~150 km)",
                  slug: "vaal-river-parys",
                  tip: "Responds to Vaal Dam gate openings within 24–48 hours. Check the Vaal Dam gate notice before fishing the Parys banks.",
                },
                {
                  section: "Middle Vaal",
                  stretch: "Parys → Vereeniging / Barrage (~180 km)",
                  slug: "vaal-barrage",
                  tip: "Affected by Bloemhof releases 3–5 days after discharge. When Bloemhof is releasing over 300 m³/s, bank levels rise significantly.",
                },
                {
                  section: "Lower Vaal",
                  stretch: "Barrage → Boegoeberg (~400 km)",
                  slug: "vaal-river-vereeniging",
                  tip: "Barrage controls flow into the lower reach. Controlled releases make this section more predictable — but always check current notices.",
                },
              ].map(({ section, stretch, slug, tip }) => (
                <Link
                  key={section}
                  href={`/venues/${slug}`}
                  className="group bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg p-4 transition-colors"
                >
                  <p className="text-cast-orange font-heading font-bold uppercase text-sm group-hover:text-bone-white transition-colors mb-1">{section}</p>
                  <p className="text-pale-water text-xs font-body mb-2">{stretch}</p>
                  <p className="text-storm text-xs font-body leading-relaxed">{tip}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Forum categories with photos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-3xl font-heading font-bold text-bone-white uppercase mb-8">Forum Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {forumCategories.map((cat) => {
            const catStats = categories[cat.slug];
            return (
              <Link
                key={cat.slug}
                href={`/forum/${cat.slug}`}
                className="group relative border border-surface-teal hover:border-cast-orange rounded-lg overflow-hidden transition-all"
              >
                {/* Background photo */}
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${cat.photo}')` }} />
                <div className="absolute inset-0 bg-deep-water/80 group-hover:bg-deep-water/70 transition-colors" />

                <div className="relative p-5 flex items-start gap-4">
                  <div className={`${cat.colour} rounded-lg w-12 h-12 flex items-center justify-center text-2xl flex-shrink-0`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-bone-white font-heading font-bold text-xl uppercase group-hover:text-cast-orange transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-pale-water/80 text-sm mt-1 leading-relaxed font-body">{cat.description}</p>
                    <div className="flex gap-4 mt-3">
                      <span className="text-pale-water text-xs">{catStats?.thread_count ?? 0} threads</span>
                      <span className="text-pale-water text-xs">{catStats?.post_count ?? 0} posts</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-storm group-hover:text-cast-orange transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Feature cards */}
      <section className="bg-deep-water-light border-t border-b border-surface-teal py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold text-bone-white uppercase mb-8">More Than a Forum</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureCards.map((card) => (
              <Link key={card.title} href={card.href} className="group bg-deep-water border border-surface-teal hover:border-cast-orange rounded-lg p-6 transition-all">
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="text-bone-white font-heading font-bold text-lg uppercase mb-2 group-hover:text-cast-orange transition-colors">{card.title}</h3>
                <p className="text-storm text-sm leading-relaxed font-body">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Forum Activity */}
      {recentThreads.length > 0 && (
        <section className="bg-deep-water-light border-t border-b border-surface-teal py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-heading font-bold text-bone-white uppercase">Latest from the Community</h2>
              <Link href="/forum" className="text-cast-orange hover:text-bone-white text-sm font-body transition-colors">
                All threads →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentThreads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/forum/thread?id=${thread.id}`}
                  className="group flex items-center gap-4 bg-deep-water border border-surface-teal hover:border-cast-orange rounded-lg p-4 transition-colors"
                >
                  <span className="flex-shrink-0 text-2xl w-9 text-center">
                    {thread.categories?.icon ?? "🎣"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-bone-white font-body font-medium group-hover:text-cast-orange transition-colors truncate text-sm">
                      {thread.title}
                    </p>
                    <p className="text-storm text-xs mt-0.5">
                      <span className="text-pale-water">{thread.profiles?.username ?? "Angler"}</span>
                      {" · "}{thread.categories?.name ?? "General"}
                      {" · "}{threadTimeAgo(thread.created_at)}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-storm text-xs whitespace-nowrap">{thread.reply_count} replies</span>
                </Link>
              ))}
            </div>
            <div className="mt-5 text-center">
              <Link
                href="/forum/new"
                className="inline-block border border-surface-teal hover:border-cast-orange text-pale-water hover:text-bone-white font-heading font-bold uppercase tracking-wider px-6 py-2.5 rounded text-sm transition-colors"
              >
                + Start a Thread
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Latest Catches */}
      {recentCatches.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-heading font-bold text-bone-white uppercase">Latest Catches</h2>
            <Link href="/catches" className="text-cast-orange hover:text-bone-white text-sm font-body transition-colors">
              Trophy Room →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentCatches.map((c) => (
              <Link
                key={c.id}
                href="/catches"
                className="group bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg overflow-hidden transition-colors"
              >
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image_url}
                    alt={`${c.species} by ${c.profiles?.username ?? "Angler"}`}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-44 bg-surface-teal/10 flex items-center justify-center text-5xl opacity-40">🐟</div>
                )}
                <div className="p-4">
                  <p className="text-cast-orange font-heading font-bold text-xl leading-none mb-1">
                    {Number(c.weight_kg).toFixed(2)} kg
                  </p>
                  <p className="text-bone-white font-body font-medium">{c.species}</p>
                  <p className="text-storm text-xs mt-1">
                    by <span className="text-pale-water">{c.profiles?.username ?? "Angler"}</span>
                    {c.venue ? ` · ${c.venue}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Share */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-bone-white uppercase mb-2">Know an Angler? Reel Them In</h2>
        <p className="text-storm font-body mb-7 max-w-xl mx-auto">
          Help build South Africa&apos;s fishing community — share CastZone with your fishing mates.
        </p>
        <ShareButtons />
      </section>

      {/* Bottom CTA — hide for logged-in users */}
      {!loggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-bone-white uppercase mb-4">Ready to Cast?</h2>
          <p className="text-pale-water text-lg font-body mb-8 max-w-xl mx-auto">
            Registration is free. Join the community that&apos;s building the best SA angling platform online.
          </p>
          <Link href="/register" className="inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-10 py-4 rounded text-lg transition-colors">
            Create Your Account
          </Link>
        </section>
      )}

      {/* Welcome section for logged-in users */}
      {loggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-bone-white uppercase mb-4">
            Welcome back{username ? `, ${username}` : ""}!
          </h2>
          <p className="text-pale-water text-lg font-body mb-8 max-w-xl mx-auto">
            The fish aren&apos;t going to catch themselves.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/forum" className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors">
              Go to Forum
            </Link>
            <Link href="/forum/new" className="border border-surface-teal hover:border-pale-water text-pale-water hover:text-bone-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors">
              Start a Thread
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
