"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  DEAL_CATEGORIES,
  categoryIcon,
  categoryLabel,
  discountPct,
  formatPrice,
  isExpired,
  type Deal,
  type DealCategory,
} from "@/lib/deals";

type Filter = "all" | DealCategory;

const WHATSAPP_GROUP_URL = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL;

function DealCard({ deal }: { deal: Deal }) {
  const pct = discountPct(deal.original_price, deal.sale_price, deal.discount_pct);
  return (
    <a
      href={deal.url}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      className="group bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg overflow-hidden transition-colors flex flex-col"
    >
      <div className="aspect-[4/3] bg-deep-water relative overflow-hidden">
        {deal.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={deal.image_url}
            alt={deal.title}
            loading="lazy"
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">
            {categoryIcon(deal.category)}
          </div>
        )}
        {pct != null && (
          <span className="absolute top-2 right-2 bg-cast-orange text-white text-sm font-heading font-bold px-2.5 py-1 rounded-full shadow">
            -{pct}%
          </span>
        )}
        <span className="absolute top-2 left-2 bg-deep-water/85 text-pale-water text-xs font-body px-2 py-0.5 rounded-full">
          {categoryIcon(deal.category)} {categoryLabel(deal.category)}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-storm text-xs font-body uppercase tracking-wider mb-1">{deal.retailer}</p>
        <h3 className="text-bone-white font-body font-medium leading-snug line-clamp-2 group-hover:text-cast-orange transition-colors">
          {deal.title}
        </h3>
        <div className="mt-auto pt-3 flex items-end justify-between">
          <div>
            {deal.original_price != null && (
              <span className="text-storm text-sm line-through mr-2">
                {formatPrice(deal.original_price)}
              </span>
            )}
            {deal.sale_price != null && (
              <span className="text-cast-orange font-heading font-bold text-xl leading-none">
                {formatPrice(deal.sale_price)}
              </span>
            )}
          </div>
          <span className="text-pale-water text-xs font-medium group-hover:text-cast-orange transition-colors whitespace-nowrap">
            Get the deal →
          </span>
        </div>
      </div>
    </a>
  );
}

export default function SpecialsContent() {
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      setSignedIn(!!userData.user);
      if (!userData.user) return;
      const { data: adminRow } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      setIsAdmin(!!adminRow);
    })();
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    const supabase = createClient();
    supabase
      .from("deals")
      .select("*")
      .eq("status", "approved")
      .order("approved_at", { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        const live = (data ?? []).filter((d) => !isExpired(d as Deal));
        setDeals(live as Deal[]);
      });
  }, [signedIn]);

  const filtered = useMemo(() => {
    if (!deals) return [];
    return filter === "all" ? deals : deals.filter((d) => d.category === filter);
  }, [deals, filter]);

  const counts = useMemo(() => {
    const c = { all: deals?.length ?? 0, fishing: 0, camping: 0 };
    for (const d of deals ?? []) {
      if (d.category === "fishing") c.fishing++;
      else if (d.category === "camping") c.camping++;
    }
    return c;
  }, [deals]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="font-heading text-4xl md:text-5xl font-semibold text-bone-white">
            🔥 Specials
          </h1>
          {isAdmin && (
            <Link
              href="/specials/review"
              className="bg-surface-teal/30 border border-surface-teal text-bone-white text-sm font-medium px-4 py-2 rounded-lg hover:border-cast-orange transition-colors whitespace-nowrap"
            >
              🛠️ Review queue →
            </Link>
          )}
        </div>
        <p className="mt-3 text-pale-water leading-relaxed max-w-2xl">
          Hand-checked South African fishing &amp; camping deals — every one at least{" "}
          <span className="text-cast-orange font-semibold">50% off</span>. Our bot scans the
          big SA retailers daily and we approve each one before it lands here. Prices and stock
          are set by the retailer — grab them while they last.
        </p>
      </div>

      {WHATSAPP_GROUP_URL && (
        <a
          href={WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 flex items-center justify-between gap-3 flex-wrap bg-surface-teal/20 border border-surface-teal hover:border-cast-orange rounded-lg px-4 py-3 text-sm transition-colors"
        >
          <span className="text-bone-white">
            🎣 Join our WhatsApp Specials group — deal alerts as they land
          </span>
          <span className="text-cast-orange font-mono font-semibold uppercase tracking-wider whitespace-nowrap">
            Join now →
          </span>
        </a>
      )}

      {/* Filter tabs */}
      {signedIn && (
      <div className="flex flex-wrap gap-2 mb-8">
        {(
          [
            { value: "all" as Filter, label: "All Deals", icon: "🏷️", count: counts.all },
            ...DEAL_CATEGORIES.map((c) => ({
              value: c.value as Filter,
              label: c.label,
              icon: c.icon,
              count: counts[c.value],
            })),
          ]
        ).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-colors border ${
              filter === tab.value
                ? "bg-cast-orange border-cast-orange text-white"
                : "border-surface-teal text-pale-water hover:border-cast-orange"
            }`}
          >
            {tab.icon} {tab.label}
            <span className="ml-1.5 opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>
      )}

      {/* Grid */}
      {signedIn === null ? (
        <p className="text-storm py-16 text-center">Loading deals…</p>
      ) : !signedIn ? (
        <div className="text-center py-16 border border-surface-teal rounded-lg">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-heading text-2xl text-bone-white font-semibold ">
            Members-only deals
          </h2>
          <p className="mt-2 text-pale-water max-w-md mx-auto">
            Sign up free to see today&apos;s hand-checked fishing &amp; camping specials — every
            one at least 50% off.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/register"
              className="inline-block bg-cast-orange text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition"
            >
              Join free →
            </Link>
            <Link
              href="/login"
              className="inline-block border border-surface-teal text-pale-water font-medium px-6 py-3 rounded-lg hover:border-cast-orange transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      ) : deals === null ? (
        <p className="text-storm py-16 text-center">Loading deals…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-surface-teal rounded-lg">
          <div className="text-5xl mb-4">🎣</div>
          <h2 className="font-heading text-2xl text-bone-white font-semibold ">No live specials right now</h2>
          <p className="mt-2 text-pale-water max-w-md mx-auto">
            Our bot checks the SA retailers every day — new 50%-off fishing and camping deals
            land here as soon as we approve them. Sign up free to get notified the moment they do.
          </p>
          <Link
            href="/register"
            className="inline-block mt-6 bg-cast-orange text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition"
          >
            Get deal alerts — join free →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}

      {/* Disclosure */}
      <p className="mt-10 text-storm text-xs leading-relaxed max-w-3xl">
        CastZone lists deals from third-party South African retailers. We don&apos;t sell these
        items or hold stock — clicking &quot;Get the deal&quot; takes you to the retailer&apos;s
        own site, where their prices, availability and terms apply. Discounts are checked when
        found but may change or sell out. Some links may earn CastZone a small commission at no
        cost to you.
      </p>
    </main>
  );
}