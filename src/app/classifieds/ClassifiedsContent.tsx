"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  CATEGORIES,
  LISTING_EXPIRY_DAYS,
  categoryIcon,
  categoryLabel,
  conditionLabel,
  formatPrice,
  type ListingCategory,
} from "@/lib/tackleBox";

type Listing = {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  province: string;
  image_urls: string[];
  created_at: string;
  profiles: { username: string } | null;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.image_urls?.[0] ?? null;
  const daysLeft = Math.ceil(
    (new Date(listing.created_at).getTime() + LISTING_EXPIRY_DAYS * 86400000 - Date.now()) / 86400000
  );
  return (
    <Link
      href={`/classifieds/listing?id=${listing.id}`}
      className="group bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg overflow-hidden transition-colors flex flex-col"
    >
      <div className="aspect-[4/3] bg-deep-water relative overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">
            {categoryIcon(listing.category)}
          </div>
        )}
        <span className="absolute top-2 left-2 bg-deep-water/85 text-pale-water text-xs font-body px-2 py-0.5 rounded-full">
          {categoryIcon(listing.category)} {categoryLabel(listing.category)}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-cast-orange font-heading font-bold text-xl leading-none mb-1">
          {formatPrice(listing.price)}
        </p>
        <h3 className="text-bone-white font-body font-medium leading-snug line-clamp-2 group-hover:text-cast-orange transition-colors">
          {listing.title}
        </h3>
        <div className="mt-auto pt-3 flex items-center justify-between text-xs text-storm font-body">
          <span>{conditionLabel(listing.condition)} · {listing.province}</span>
          <div className="flex flex-col items-end gap-0.5">
            <span>{timeAgo(listing.created_at)}</span>
            {daysLeft <= 7 && (
              <span className="text-amber-400">{daysLeft}d left</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ClassifiedsContent() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<ListingCategory | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const cutoff = new Date(Date.now() - LISTING_EXPIRY_DAYS * 86400000).toISOString();
    supabase
      .from("listings")
      .select("id, title, price, category, condition, province, image_urls, created_at, profiles(username)")
      .eq("status", "active")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setListings((data as unknown as Listing[]) ?? []);
        setLoading(false);
      });
  }, []);

  const q = query.trim().toLowerCase();
  const visible = listings.filter((l) => {
    if (filter !== "all" && l.category !== filter) return false;
    if (q && !l.title.toLowerCase().includes(q)) return false;
    return true;
  });

  const postHref = user ? "/classifieds/new" : "/login";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-5xl font-heading font-bold text-bone-white uppercase">Tackle Box</h1>
          <p className="text-cast-orange font-heading font-semibold uppercase tracking-widest text-sm mt-1">
            Buy &amp; Sell with SA Anglers
          </p>
        </div>
        <Link
          href={postHref}
          className="flex-shrink-0 self-center bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-5 py-3 rounded transition-colors text-sm"
        >
          + Post a Listing
        </Link>
      </div>
      <p className="text-pale-water font-body max-w-2xl mb-8">
        List your gear, find a bargain, deal directly with the community you trust — no middlemen, no commission.
      </p>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search listings…"
          className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setFilter("all")}
          className={`font-heading font-bold uppercase tracking-wider text-xs px-4 py-2 rounded border transition-colors ${
            filter === "all"
              ? "bg-cast-orange border-cast-orange text-white"
              : "border-surface-teal text-storm hover:border-pale-water/50 hover:text-pale-water"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            className={`font-heading font-bold uppercase tracking-wider text-xs px-4 py-2 rounded border transition-colors ${
              filter === c.value
                ? "bg-cast-orange border-cast-orange text-white"
                : "border-surface-teal text-storm hover:border-pale-water/50 hover:text-pale-water"
            }`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-deep-water-light border border-surface-teal rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-surface-teal/30" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-16 bg-surface-teal/40 rounded" />
                <div className="h-4 w-full bg-surface-teal/20 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-deep-water-light border border-surface-teal rounded-lg p-12 text-center">
          <div className="text-5xl mb-4 opacity-50">🎣</div>
          {listings.length === 0 ? (
            <>
              <p className="text-pale-water font-heading font-bold uppercase text-lg mb-2">No listings yet</p>
              <p className="text-storm font-body text-sm mb-6">Be the first to list your gear in the Tackle Box.</p>
              <Link
                href={postHref}
                className="inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-6 py-3 rounded transition-colors text-sm"
              >
                + Post the First Listing
              </Link>
            </>
          ) : (
            <p className="text-storm font-body">No listings match your search.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {visible.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
