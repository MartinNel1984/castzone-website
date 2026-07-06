"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  categoryIcon,
  categoryLabel,
  discountPct,
  formatPrice,
  type Deal,
} from "@/lib/deals";

type Status = "loading" | "unauth" | "notadmin" | "ready";

export default function ReviewContent() {
  const [status, setStatus] = useState<Status>("loading");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) { setStatus("unauth"); return; }

      const { data: adminRow } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!adminRow) { setStatus("notadmin"); return; }

      const { data } = await supabase
        .from("deals")
        .select("*")
        .eq("status", "pending")
        .order("discount_pct", { ascending: false, nullsFirst: false })
        .order("found_at", { ascending: false });
      setDeals((data ?? []) as Deal[]);
      setStatus("ready");
    })();
  }, []);

  async function decide(deal: Deal, next: "approved" | "rejected") {
    setBusy(deal.id);
    const supabase = createClient();
    const patch: Record<string, unknown> = { status: next };
    if (next === "approved") patch.approved_at = new Date().toISOString();
    const { error } = await supabase.from("deals").update(patch).eq("id", deal.id);
    setBusy(null);
    if (error) { alert("Could not save: " + error.message); return; }
    // Remove from the pending list once decided.
    setDeals((prev) => prev.filter((d) => d.id !== deal.id));
  }

  if (status === "loading") {
    return <main className="max-w-3xl mx-auto px-6 py-20 text-center text-storm">Loading…</main>;
  }

  if (status === "unauth" || status === "notadmin") {
    return (
      <main className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-6">🔒</div>
        <h1 className="font-heading text-3xl text-bone-white font-bold uppercase">Not authorised</h1>
        <p className="mt-3 text-pale-water">
          {status === "unauth"
            ? "You need to sign in with an admin account to review deals."
            : "This page is for CastZone admins only."}
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          {status === "unauth" && (
            <Link href="/login" className="bg-cast-orange text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90">
              Sign in
            </Link>
          )}
          <Link href="/specials" className="border border-surface-teal text-bone-white font-semibold px-6 py-3 rounded-lg hover:bg-surface-teal/20">
            View Specials
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-bone-white font-bold uppercase tracking-wide">
            Review Specials
          </h1>
          <p className="mt-1 text-pale-water text-sm">
            {deals.length} deal{deals.length === 1 ? "" : "s"} waiting. Approve to publish + notify members.
          </p>
        </div>
        <Link href="/specials" className="text-pale-water hover:text-cast-orange text-sm underline">
          View live page →
        </Link>
      </div>

      {deals.length === 0 ? (
        <div className="text-center py-16 border border-surface-teal rounded-lg">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="font-heading text-2xl text-bone-white font-bold uppercase">All caught up</h2>
          <p className="mt-2 text-pale-water">No deals waiting for review. The bot will drop new ones here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => {
            const pct = discountPct(deal.original_price, deal.sale_price, deal.discount_pct);
            return (
              <div
                key={deal.id}
                className="bg-deep-water-light border border-surface-teal rounded-lg p-4 flex flex-col sm:flex-row gap-4"
              >
                <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-deep-water rounded overflow-hidden flex items-center justify-center">
                  {deal.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={deal.image_url} alt={deal.title} className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-4xl opacity-40">{categoryIcon(deal.category)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-storm text-xs uppercase tracking-wider">
                    {categoryIcon(deal.category)} {categoryLabel(deal.category)} · {deal.retailer}
                  </p>
                  <h3 className="text-bone-white font-medium leading-snug mt-0.5">{deal.title}</h3>
                  <div className="mt-2 flex items-center gap-3 flex-wrap">
                    {deal.original_price != null && (
                      <span className="text-storm line-through text-sm">{formatPrice(deal.original_price)}</span>
                    )}
                    {deal.sale_price != null && (
                      <span className="text-cast-orange font-heading font-bold text-xl">{formatPrice(deal.sale_price)}</span>
                    )}
                    {pct != null && (
                      <span className="bg-cast-orange/20 text-cast-orange text-xs font-bold px-2 py-0.5 rounded-full">
                        -{pct}%
                      </span>
                    )}
                  </div>
                  <a
                    href={deal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-pale-water hover:text-cast-orange text-xs underline break-all"
                  >
                    Open on retailer site ↗
                  </a>
                </div>

                <div className="flex sm:flex-col gap-2 sm:justify-center flex-shrink-0">
                  <button
                    onClick={() => decide(deal, "approved")}
                    disabled={busy === deal.id}
                    className="flex-1 sm:flex-none bg-cast-orange text-white font-semibold px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {busy === deal.id ? "…" : "Approve"}
                  </button>
                  <button
                    onClick={() => decide(deal, "rejected")}
                    disabled={busy === deal.id}
                    className="flex-1 sm:flex-none border border-surface-teal text-pale-water font-semibold px-5 py-2 rounded-lg hover:bg-surface-teal/20 disabled:opacity-50 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
