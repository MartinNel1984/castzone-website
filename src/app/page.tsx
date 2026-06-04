"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import ShareButtons from "@/components/ShareButtons";
import BiteTimes from "@/components/BiteTimes";

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
  { title: "Tackle Box", description: "Buy and sell fishing gear. Rods, reels, boats, tackle — all in one place.", href: "/classifieds", icon: "🛒" },
  { title: "The Map", description: "Find dams and venues across all 9 provinces. Species, permits, GPS.", href: "/venues", icon: "🗺️" },
  { title: "Trophy Room", description: "Log your catches, track personal bests, and show off your fish.", href: "/catches", icon: "🏆" },
  { title: "Tournaments", description: "SA tournament calendar — bass, carp, saltwater and more.", href: "/tournaments", icon: "🥇" },
];

type Stats = { members: number; threads: number; posts: number; categories: number };

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [categories, setCategories] = useState<Record<string, { thread_count: number; post_count: number }>>({});
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));

    async function loadStats() {
      const [{ count: members }, { count: threads }, { count: posts }, { data: cats }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("threads").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("slug,thread_count,post_count"),
      ]);
      setStats({ members: members ?? 0, threads: threads ?? 0, posts: posts ?? 0, categories: cats?.length ?? 0 });
      if (cats) {
        const map: Record<string, { thread_count: number; post_count: number }> = {};
        cats.forEach((c) => { map[c.slug] = { thread_count: c.thread_count, post_count: c.post_count }; });
        setCategories(map);
      }
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
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors">
                  Join Free
                </Link>
                <Link href="/forum" className="border border-surface-teal hover:border-pale-water text-pale-water hover:text-bone-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors">
                  Browse Forum
                </Link>
              </div>
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
                <div><p className="text-cast-orange font-heading font-bold text-xl uppercase">{stats.members.toLocaleString()}</p><p className="text-storm text-xs uppercase tracking-wider mt-0.5">Members</p></div>
                <div><p className="text-cast-orange font-heading font-bold text-xl uppercase">{stats.threads.toLocaleString()}</p><p className="text-storm text-xs uppercase tracking-wider mt-0.5">Threads</p></div>
                <div><p className="text-cast-orange font-heading font-bold text-xl uppercase">{stats.posts.toLocaleString()}</p><p className="text-storm text-xs uppercase tracking-wider mt-0.5">Posts</p></div>
                <div><p className="text-cast-orange font-heading font-bold text-xl uppercase">{stats.categories.toLocaleString()}</p><p className="text-storm text-xs uppercase tracking-wider mt-0.5">Categories</p></div>
              </>
            ) : (
              [1, 2, 3, 4].map((i) => (
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
        <BiteTimes lat={-26.2041} lng={28.0473} variant="compact" />
      </section>

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
