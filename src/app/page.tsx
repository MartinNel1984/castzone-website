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
import { categoryIcon, discountPct, formatPrice, isExpired, type Deal } from "@/lib/deals";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";

type DealPreview = Pick<Deal, "id" | "title" | "retailer" | "category" | "original_price" | "sale_price" | "discount_pct" | "image_url"> & { url?: string };

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

type HeroPhoto = {
  id: string;
  species: string;
  weight_kg: number;
  venue: string | null;
  image_url: string;
};

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
  const [heroPhotos, setHeroPhotos] = useState<HeroPhoto[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [dealsPreview, setDealsPreview] = useState<DealPreview[] | null>(null);
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
        { data: specials },
        { data: cats },
        { data: latest },
        { data: latestCatches },
        { data: heroCatches },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("threads").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("venues").select("*", { count: "exact", head: true }),
        supabase.rpc("get_deals_public_count"),
        supabase.from("categories").select("slug,thread_count,post_count"),
        supabase.from("threads").select("id,title,reply_count,created_at,profiles(username),categories(slug,name,icon)").order("created_at", { ascending: false }).limit(6),
        supabase.from("catches").select("id,species,weight_kg,category,venue,image_url,profiles(username)").eq("approved", true).order("approved_at", { ascending: false }).limit(3),
        supabase.from("catches").select("id,species,weight_kg,venue,image_url").eq("approved", true).not("image_url", "is", null).order("approved_at", { ascending: false }).limit(5),
      ]);
      setStats({ members: members ?? 0, threads: threads ?? 0, posts: posts ?? 0, categories: cats?.length ?? 0, venues: venues ?? 0, specials: (specials as unknown as number) ?? 0 });
      if (cats) {
        const map: Record<string, { thread_count: number; post_count: number }> = {};
        cats.forEach((c) => { map[c.slug] = { thread_count: c.thread_count, post_count: c.post_count }; });
        setCategories(map);
      }
      setRecentThreads((latest ?? []) as unknown as RecentThread[]);
      setRecentCatches((latestCatches as unknown as RecentCatch[]) ?? []);
      setHeroPhotos((heroCatches as unknown as HeroPhoto[]) ?? []);
    }

    loadStats();
    return () => listener.subscription.unsubscribe();
  }, []);

  const username = user?.user_metadata?.username ?? user?.email?.split("@")[0];
  const loggedIn = user !== undefined && user !== null;

  useEffect(() => {
    if (user === undefined) return; // still loading auth state
    const supabase = createClient();
    if (user) {
      supabase
        .from("deals")
        .select("id,title,retailer,category,original_price,sale_price,discount_pct,image_url,url,expires_at")
        .eq("status", "approved")
        .order("discount_pct", { ascending: false, nullsFirst: false })
        .order("found_at", { ascending: false })
        .limit(8)
        .then(({ data }) => {
          const live = (data as unknown as Deal[] ?? []).filter((d) => !isExpired(d));
          setDealsPreview(live.slice(0, 4));
        });
    } else {
      supabase.rpc("get_deals_public_preview", { limit_count: 4 }).then(({ data }) => {
        setDealsPreview((data as DealPreview[]) ?? []);
      });
    }
  }, [user]);

  // Auto-rotate the hero backdrop photos; pause while the tab isn't visible.
  useEffect(() => {
    if (heroPhotos.length < 2) return;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      setHeroIndex((i) => (i + 1) % heroPhotos.length);
    };
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, [heroPhotos.length]);

  // Vaal River gate status — computed once, used by both the hero readout and the Angler Safety section.
  const latestVaal = GATE_NOTICES.find((n) => n.dam === "vaal" && n.latest);
  const latestBloemhof = GATE_NOTICES.find((n) => n.dam === "bloemhof" && n.latest);
  const latestBarrage = GATE_NOTICES.find((n) => n.dam === "barrage" && n.latest);
  const bloemhofLevel = latestBloemhof ? vaalAlertLevel(latestBloemhof.text) : "normal";
  const bannerColour =
    bloemhofLevel === "danger" ? "border-red-600/60 bg-red-900/10" :
    bloemhofLevel === "caution" ? "border-amber-600/60 bg-amber-900/10" :
    "border-surface-teal bg-deep-water-light";
  const titleColour =
    bloemhofLevel === "danger" ? "text-red-400" :
    bloemhofLevel === "caution" ? "text-amber-400" :
    "text-pale-water";
  const safetyIcon = bloemhofLevel === "danger" ? "🚨" : bloemhofLevel === "caution" ? "⚠️" : "ℹ️";

  return (
    <div>
      {/* Hero */}
      <section className="relative border-b border-surface-teal overflow-hidden">
        {/* Rotating backdrop — real approved Trophy Room catches, not stock photography */}
        {heroPhotos.length > 0 && (
          <div className="absolute inset-0" aria-hidden="true">
            {heroPhotos.map((photo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.image_url}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                sizes="100vw"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                  i === heroIndex ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-deep-water via-deep-water/85 to-deep-water/60" />
          </div>
        )}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "repeating-linear-gradient(180deg, transparent 0 38px, var(--color-pale-water) 38px 39px)",
            maskImage: "linear-gradient(180deg, transparent, black 25%, black 75%, transparent)",
          }}
        />
        <div className="cz-glow" aria-hidden="true" />
        <div className="cz-linework" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-10 lg:gap-14 items-end">
            <div>
              <p className="cz-eyebrow text-cast-orange mb-3">South Africa&apos;s Fishing Community</p>
              <h1 className="text-[clamp(2.6rem,2rem+4.5vw,5rem)] leading-[0.98] font-heading font-semibold text-bone-white">
                Where South Africa <em className="italic text-cast-orange">Fishes</em>
              </h1>
              <p className="mt-2 font-script text-2xl text-cast-orange/90">Tight lines, always.</p>
              <p className="text-pale-water text-lg leading-relaxed mt-6 font-body max-w-xl">
                Bass, saltwater, specimen and everything in between. Join the forum built for SA anglers — share catches, find venues, buy gear, and connect.
              </p>

              {/* Auth-aware CTAs */}
              {user === undefined ? null : loggedIn ? (
                <div className="flex flex-wrap gap-4 items-center mt-8">
                  <Button href="/forum" size="lg">Go to Forum</Button>
                  <Button href="/forum/new" variant="line" size="lg">Start a Thread</Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-4 mt-8">
                    <Button href="/register" size="lg">Join Free</Button>
                    <Button href="/forum" variant="line" size="lg">Browse Forum</Button>
                  </div>
                  <p className="text-pale-water/70 text-sm font-body mt-4">
                    Free forever · Dam &amp; gate-level alerts · Find venues near you
                  </p>
                </>
              )}
            </div>

            {/* Live readout — real Vaal River gate data, not a stock photo */}
            <div className="bg-deep-water-light border border-surface-teal rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="cz-eyebrow text-cast-orange">Vaal River — Live Reading</p>
                <span className="font-mono text-xs text-storm">{latestBloemhof?.date ?? "—"}</span>
              </div>
              <div className="divide-y divide-surface-teal/40">
                <div className="flex items-center justify-between py-2 font-mono text-sm">
                  <span className="text-storm">Bloemhof release</span>
                  <span className={titleColour}>{latestBloemhof?.text ?? "No recent notice"}</span>
                </div>
                <div className="flex items-center justify-between py-2 font-mono text-sm">
                  <span className="text-storm">Vaal Dam gate</span>
                  <span className="text-bone-white">{latestVaal?.text ?? "No recent notice"}</span>
                </div>
                <div className="flex items-center justify-between py-2 font-mono text-sm">
                  <span className="text-storm">Barrage flow</span>
                  <span className="text-bone-white">{latestBarrage?.text ?? "No recent notice"}</span>
                </div>
                <div className="flex items-center justify-between py-2 font-mono text-sm">
                  <span className="text-storm">Your spot</span>
                  <span className="text-bone-white">{spot.label}</span>
                </div>
              </div>
              <Link href="/conditions" className="font-mono text-xs uppercase tracking-wider text-cast-orange hover:text-bone-white cz-transition mt-4 inline-block">
                Full dam levels &amp; conditions →
              </Link>
            </div>
          </div>
        </div>

        {/* Caption + slide-progress dots for the rotating backdrop */}
        {heroPhotos.length > 1 && (
          // Bottom-LEFT, not bottom-right — the floating trip-shortlist button
          // (fixed bottom-6 right-4, site-wide) collides with anything docked
          // bottom-right once a section's end lines up with the viewport bottom.
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-5">
            <p className="font-mono text-xs text-pale-water/80 truncate mb-2">
              {(() => {
                const p = heroPhotos[heroIndex];
                return `${Number(p.weight_kg).toFixed(2)}kg ${p.species}${p.venue ? ` — ${p.venue}` : ""}`;
              })()}
            </p>
            <div className="flex gap-2">
              {heroPhotos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => setHeroIndex(i)}
                  aria-label={`Show photo ${i + 1} of ${heroPhotos.length}`}
                  aria-current={i === heroIndex}
                  className={`w-6 h-1.5 rounded-full cz-transition ${i === heroIndex ? "bg-cast-orange" : "bg-pale-water/30 hover:bg-pale-water/60"}`}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Live stats banner */}
      <section className="relative overflow-hidden bg-deep-water-light border-b border-surface-teal">
        <div className="cz-linework" aria-hidden="true" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap justify-center sm:justify-start gap-8 sm:gap-12 text-center sm:text-left">
            {stats ? (
              <>
                <Link href="/members" className="group"><p className="text-cast-orange group-hover:text-bone-white font-mono font-semibold text-xl cz-transition">{stats.members.toLocaleString()}</p><p className="cz-eyebrow text-storm mt-0.5">Members</p></Link>
                <Link href="/specials" className="group"><p className="text-cast-orange group-hover:text-bone-white font-mono font-semibold text-xl cz-transition">{stats.specials.toLocaleString()}</p><p className="cz-eyebrow text-storm mt-0.5">Specials</p></Link>
                <div><p className="text-cast-orange font-mono font-semibold text-xl">{stats.threads.toLocaleString()}</p><p className="cz-eyebrow text-storm mt-0.5">Threads</p></div>
                <div><p className="text-cast-orange font-mono font-semibold text-xl">{stats.posts.toLocaleString()}</p><p className="cz-eyebrow text-storm mt-0.5">Posts</p></div>
                {stats.venues > 0 && <Link href="/venues" className="group"><p className="text-cast-orange group-hover:text-bone-white font-mono font-semibold text-xl cz-transition">{stats.venues.toLocaleString()}</p><p className="cz-eyebrow text-storm mt-0.5">Venues</p></Link>}
                <div><p className="text-cast-orange font-mono font-semibold text-xl">{stats.categories.toLocaleString()}</p><p className="cz-eyebrow text-storm mt-0.5">Categories</p></div>
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

      {/* Specials teaser */}
      {dealsPreview && dealsPreview.length > 0 && (
        <Section title="Latest Specials" action={{ label: "See all deals", href: "/specials" }} texture>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {dealsPreview.map((deal) => {
              const pct = discountPct(deal.original_price, deal.sale_price, deal.discount_pct);
              const locked = !deal.url;
              return (
                <Card key={deal.id} href={locked ? "/register" : deal.url} external={!locked} className="flex flex-col">
                  <div className="aspect-[4/3] bg-deep-water relative overflow-hidden">
                    {deal.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={deal.image_url}
                        alt={locked ? "Locked deal" : deal.title}
                        loading="lazy"
                        className={`w-full h-full object-contain p-3 transition-transform duration-500 ${locked ? "blur-sm scale-105" : "group-hover:scale-105"}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">
                        {categoryIcon(deal.category)}
                      </div>
                    )}
                    {pct != null && (
                      <span className="absolute top-2 right-2 bg-cast-orange text-white text-sm font-mono font-semibold px-2.5 py-1 rounded-full shadow">
                        -{pct}%
                      </span>
                    )}
                    {locked && (
                      <div className="absolute inset-0 bg-deep-water/60 flex items-center justify-center">
                        <span className="text-3xl">🔒</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <p className="text-storm text-xs font-mono uppercase tracking-wider mb-1">{deal.retailer}</p>
                    <h3 className={`text-bone-white text-sm font-body font-medium leading-snug line-clamp-2 ${locked ? "" : "group-hover:text-cast-orange"} cz-transition`}>
                      {locked ? "Sign up to reveal this deal" : deal.title}
                    </h3>
                    {deal.sale_price != null && (
                      <div className="mt-auto pt-2 font-mono">
                        {deal.original_price != null && (
                          <span className="text-storm text-xs line-through mr-2">{formatPrice(deal.original_price)}</span>
                        )}
                        <span className="text-cast-orange font-semibold text-base leading-none">{formatPrice(deal.sale_price)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
          <div className="bg-deep-water-light border border-surface-teal rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-pale-water font-body">
              {loggedIn
                ? `${stats?.specials ?? "More"} live deals waiting — fishing & camping gear at 50%+ off.`
                : "Loads more deals inside — sign up to unlock every one. It's free."}
            </p>
            <Button href={loggedIn ? "/specials" : "/register"}>
              {loggedIn ? "See all specials" : "Join free — see all deals"}
            </Button>
          </div>
        </Section>
      )}

      {/* Bite forecast widget */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-wrap items-center justify-end gap-3 mb-2">
          {geoError && <span className="text-amber-400 text-xs font-body">{geoError}</span>}
          <button
            onClick={locateMe}
            disabled={locating}
            className="border border-surface-teal hover:border-cast-orange text-pale-water hover:text-bone-white text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded cz-transition disabled:opacity-50"
          >
            📍 {locating ? "Finding you…" : "Use my location"}
          </button>
        </div>
        <BiteTimes lat={spot.lat} lng={spot.lng} variant="compact" locationLabel={spot.label} />
      </section>

      {/* Angler Safety — Vaal River */}
      <Section title={`${safetyIcon} Angler Safety — Vaal River`} action={{ label: "Full dam levels", href: "/conditions" }} texture>
        <div className={`border rounded-lg p-5 mb-5 ${bannerColour}`}>
          <p className={`font-mono uppercase tracking-wider text-xs mb-3 ${titleColour}`}>
            Latest Gate Notices — Updated by DWS
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Vaal Dam", notice: latestVaal, colour: "text-blue-300" },
              { label: "Bloemhof", notice: latestBloemhof, colour: titleColour },
              { label: "Barrage", notice: latestBarrage, colour: "text-teal-300" },
            ].map(({ label, notice, colour }) => (
              <div key={label} className="bg-black/20 rounded p-3">
                <p className={`text-xs font-mono font-semibold uppercase tracking-wider mb-1 ${colour}`}>{label}</p>
                {notice ? (
                  <>
                    <p className="text-bone-white text-sm font-body leading-snug">{notice.text}</p>
                    <p className="text-storm text-xs mt-1 font-mono">{notice.date}</p>
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
            <Card key={section} href={`/venues/${slug}`} className="p-4">
              <p className="text-cast-orange font-mono font-semibold uppercase text-sm group-hover:text-bone-white cz-transition mb-1">{section}</p>
              <p className="text-pale-water text-xs font-body mb-2">{stretch}</p>
              <p className="text-storm text-xs font-body leading-relaxed">{tip}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Forum categories with photos */}
      <Section title="Forum Categories" texture>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {forumCategories.map((cat) => {
            const catStats = categories[cat.slug];
            return (
              <Card key={cat.slug} href={`/forum/${cat.slug}`} className="relative">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${cat.photo}')` }} />
                <div className="absolute inset-0 bg-deep-water/80 group-hover:bg-deep-water/70 cz-transition" />

                <div className="relative p-5 flex items-start gap-4">
                  <div className={`${cat.colour} rounded-lg w-12 h-12 flex items-center justify-center text-2xl flex-shrink-0`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-bone-white font-heading font-semibold text-xl group-hover:text-cast-orange cz-transition">
                      {cat.name}
                    </h3>
                    <p className="text-pale-water/80 text-sm mt-1 leading-relaxed font-body">{cat.description}</p>
                    <div className="flex gap-4 mt-3 font-mono">
                      <span className="text-pale-water text-xs">{catStats?.thread_count ?? 0} threads</span>
                      <span className="text-pale-water text-xs">{catStats?.post_count ?? 0} posts</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-storm group-hover:text-cast-orange cz-transition flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* Feature cards */}
      <Section title="More Than a Forum" bleed>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featureCards.map((card) => (
            <Card key={card.title} href={card.href} className="bg-deep-water p-6">
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="text-bone-white font-heading font-semibold text-lg mb-2 group-hover:text-cast-orange cz-transition">{card.title}</h3>
              <p className="text-storm text-sm leading-relaxed font-body">{card.description}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Recent Forum Activity */}
      {recentThreads.length > 0 && (
        <Section title="Latest from the Community" action={{ label: "All threads", href: "/forum" }} bleed>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentThreads.map((thread) => (
              <Card key={thread.id} href={`/forum/thread?id=${thread.id}`} className="bg-deep-water flex items-center gap-4 p-4">
                <span className="flex-shrink-0 text-2xl w-9 text-center">
                  {thread.categories?.icon ?? "🎣"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-bone-white font-body font-medium group-hover:text-cast-orange cz-transition truncate text-sm">
                    {thread.title}
                  </p>
                  <p className="text-storm text-xs mt-0.5 font-mono">
                    <span className="text-pale-water">{thread.profiles?.username ?? "Angler"}</span>
                    {" · "}{thread.categories?.name ?? "General"}
                    {" · "}{threadTimeAgo(thread.created_at)}
                  </p>
                </div>
                <span className="flex-shrink-0 text-storm text-xs whitespace-nowrap font-mono">{thread.reply_count} replies</span>
              </Card>
            ))}
          </div>
          <div className="mt-5 text-center">
            <Button href="/forum/new" variant="line" size="md">+ Start a Thread</Button>
          </div>
        </Section>
      )}

      {/* Latest Catches */}
      {recentCatches.length > 0 && (
        <Section title="Latest Catches" action={{ label: "Trophy Room", href: "/catches" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentCatches.map((c) => (
              <Card key={c.id} href="/catches">
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
                  <p className="text-cast-orange font-mono font-semibold text-xl leading-none mb-1">
                    {Number(c.weight_kg).toFixed(2)} kg
                  </p>
                  <p className="text-bone-white font-body font-medium">{c.species}</p>
                  <p className="text-storm text-xs mt-1 font-mono">
                    by <span className="text-pale-water">{c.profiles?.username ?? "Angler"}</span>
                    {c.venue ? ` · ${c.venue}` : ""}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Share */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center border-b border-surface-teal">
        <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-bone-white mb-2">Know an Angler? Reel Them In</h2>
        <p className="text-storm font-body mb-7 max-w-xl mx-auto">
          Help build South Africa&apos;s fishing community — share CastZone with your fishing mates.
        </p>
        <ShareButtons />
      </section>

      {/* Bottom CTA — hide for logged-in users */}
      {!loggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl sm:text-5xl font-heading font-semibold text-bone-white mb-4">Ready to Cast?</h2>
          <p className="text-pale-water text-lg font-body mb-8 max-w-xl mx-auto">
            Registration is free. Join the community that&apos;s building the best SA angling platform online.
          </p>
          <Button href="/register" size="lg">Create Your Account</Button>
        </section>
      )}

      {/* Welcome section for logged-in users */}
      {loggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl sm:text-5xl font-heading font-semibold text-bone-white mb-4">
            Welcome back{username ? `, ${username}` : ""}!
          </h2>
          <p className="text-pale-water text-lg font-body mb-8 max-w-xl mx-auto">
            The fish aren&apos;t going to catch themselves.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/forum" size="lg">Go to Forum</Button>
            <Button href="/forum/new" variant="line" size="lg">Start a Thread</Button>
          </div>
        </section>
      )}
    </div>
  );
}