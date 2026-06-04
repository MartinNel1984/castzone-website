"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  categoryIcon,
  categoryLabel,
  conditionLabel,
  formatPrice,
  toWhatsAppNumber,
} from "@/lib/tackleBox";

type Listing = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  province: string;
  contact_phone: string;
  image_urls: string[];
  status: string;
  created_at: string;
  profiles: { username: string } | null;
};

function postedDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

function ListingDetail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("listings")
        .select("id, seller_id, title, description, price, category, condition, province, contact_phone, image_urls, status, created_at, profiles(username)")
        .eq("id", id)
        .single();
      if (data) {
        setListing(data as unknown as Listing);
        setIsOwner(!!user && user.id === (data as unknown as Listing).seller_id);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function toggleSold() {
    if (!listing || working) return;
    setWorking(true);
    const supabase = createClient();
    const next = listing.status === "active" ? "sold" : "active";
    const { error } = await supabase.from("listings").update({ status: next }).eq("id", listing.id);
    if (!error) setListing({ ...listing, status: next });
    setWorking(false);
  }

  async function deleteListing() {
    if (!listing || working) return;
    if (!confirm("Delete this listing permanently? This can't be undone.")) return;
    setWorking(true);
    const supabase = createClient();
    const { error } = await supabase.from("listings").delete().eq("id", listing.id);
    if (!error) router.push("/classifieds");
    else setWorking(false);
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><p className="text-storm font-body">Loading…</p></div>;
  }

  if (!id || !listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-pale-water text-xl font-heading font-bold uppercase mb-3">Listing not found</p>
        <p className="text-storm font-body text-sm mb-6">It may have been removed or sold.</p>
        <Link href="/classifieds" className="text-cast-orange hover:underline font-body text-sm">← Back to the Tackle Box</Link>
      </div>
    );
  }

  const wa = toWhatsAppNumber(listing.contact_phone);
  const isSold = listing.status === "sold";
  const images = listing.image_urls ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-storm mb-6">
        <Link href="/classifieds" className="hover:text-pale-water">Tackle Box</Link>
        <span className="mx-2">›</span>
        <span className="text-pale-water">{categoryLabel(listing.category)}</span>
      </nav>

      {/* Owner controls */}
      {isOwner && (
        <div className="bg-surface-teal/10 border border-surface-teal/40 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-pale-water font-body text-sm">This is your listing.</p>
          <div className="flex gap-2">
            <button onClick={toggleSold} disabled={working}
              className="border border-surface-teal text-pale-water hover:text-bone-white hover:border-pale-water/60 disabled:opacity-50 font-heading font-bold uppercase tracking-wider text-xs px-4 py-2 rounded transition-colors">
              {isSold ? "Mark as Active" : "Mark as Sold"}
            </button>
            <button onClick={deleteListing} disabled={working}
              className="border border-red-700/60 text-red-300 hover:bg-red-900/30 disabled:opacity-50 font-heading font-bold uppercase tracking-wider text-xs px-4 py-2 rounded transition-colors">
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <div className="aspect-square bg-deep-water-light border border-surface-teal rounded-lg overflow-hidden relative">
            {images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[activeImage]} alt={listing.title} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-7xl opacity-40">{categoryIcon(listing.category)}</div>
            )}
            {isSold && (
              <div className="absolute inset-0 bg-deep-water/70 flex items-center justify-center">
                <span className="bg-storm text-bone-white font-heading font-bold uppercase tracking-widest text-2xl px-8 py-3 rounded -rotate-12">Sold</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {images.map((url, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded overflow-hidden border-2 transition-colors ${i === activeImage ? "border-cast-orange" : "border-surface-teal hover:border-pale-water/50"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <span className="inline-block bg-surface-teal/20 text-pale-water text-xs font-body px-2.5 py-1 rounded-full mb-3">
            {categoryIcon(listing.category)} {categoryLabel(listing.category)}
          </span>
          <h1 className="text-3xl font-heading font-bold text-bone-white uppercase leading-tight mb-2">{listing.title}</h1>
          <p className="text-cast-orange font-heading font-bold text-4xl mb-4">{formatPrice(listing.price)}</p>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-body text-pale-water mb-6">
            <span><span className="text-storm">Condition:</span> {conditionLabel(listing.condition)}</span>
            <span><span className="text-storm">Location:</span> {listing.province}</span>
          </div>

          {/* Contact */}
          {isSold ? (
            <div className="bg-deep-water-light border border-surface-teal rounded-lg p-4 text-center mb-4">
              <p className="text-storm font-body text-sm">This item has been marked as sold.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {wa && (
                <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi, is your "${listing.title}" still available on CastZone?`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-6 py-3.5 rounded transition-colors">
                  💬 WhatsApp Seller
                </a>
              )}
              <a href={`tel:${listing.contact_phone.replace(/\s/g, "")}`}
                className="flex items-center justify-center gap-2 w-full border border-surface-teal text-pale-water hover:text-bone-white hover:border-pale-water/60 font-heading font-bold uppercase tracking-wider px-6 py-3.5 rounded transition-colors">
                📞 {listing.contact_phone}
              </a>
            </div>
          )}

          {/* Seller + posted */}
          <div className="text-sm font-body text-storm border-t border-surface-teal/40 pt-4">
            Listed by{" "}
            {listing.profiles?.username ? (
              <Link href={`/profile?username=${encodeURIComponent(listing.profiles.username)}`} className="text-pale-water hover:text-cast-orange transition-colors">
                {listing.profiles.username}
              </Link>
            ) : "a member"}
            {" · "}{postedDate(listing.created_at)}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 bg-deep-water-light border border-surface-teal rounded-lg p-6">
        <h2 className="text-bone-white font-heading font-bold uppercase text-lg mb-3">Description</h2>
        <p className="text-pale-water font-body text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>
      </div>

      {/* Safety note */}
      <div className="mt-6 bg-cast-orange/10 border border-cast-orange/40 rounded-lg p-4 flex gap-3">
        <span className="text-cast-orange text-lg flex-shrink-0">⚠</span>
        <p className="text-pale-water font-body text-xs leading-relaxed">
          Deal safely — meet in a public place, inspect gear before paying, and never send a deposit before
          you&apos;ve confirmed the item is genuine. CastZone doesn&apos;t handle payments or mediate transactions.
        </p>
      </div>

      <div className="mt-6">
        <Link href="/classifieds" className="text-storm hover:text-pale-water text-sm font-body transition-colors">← Back to the Tackle Box</Link>
      </div>
    </div>
  );
}

export default function ListingPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-20 text-center"><p className="text-storm font-body">Loading…</p></div>}>
      <ListingDetail />
    </Suspense>
  );
}
