"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  CATEGORIES,
  CONDITIONS,
  PROVINCES,
  type ListingCategory,
  type ListingCondition,
} from "@/lib/tackleBox";

type ImagePreview = { file: File; preview: string };

const MAX_FILES = 5;
const MAX_SIZE_MB = 8;

export default function NewListingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ListingCategory>("rods-reels");
  const [condition, setCondition] = useState<ListingCondition>("good");
  const [price, setPrice] = useState("");
  const [province, setProvince] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
    });
    return () => { images.forEach((img) => URL.revokeObjectURL(img.preview)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_FILES - images.length;
    const toAdd = files.slice(0, remaining);

    if (toAdd.some((f) => f.size > MAX_SIZE_MB * 1024 * 1024)) {
      setError(`Each photo must be under ${MAX_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }
    setImages((prev) => [...prev, ...toAdd.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    setError("");
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadImages(userId: string): Promise<string[]> {
    if (!images.length) return [];
    const supabase = createClient();
    const urls: string[] = [];
    for (const { file } of images) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`);
      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !user) return;
    setError("");

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) { setError("Please enter a valid price."); return; }
    if (!province) { setError("Please choose a province."); return; }
    if (phone.replace(/[^\d]/g, "").length < 9) { setError("Please enter a valid contact number."); return; }
    if (images.length === 0) { setError("Add at least one photo — listings with photos sell far faster."); return; }

    setSubmitting(true);
    try {
      const imageUrls = await uploadImages(user.id);
      const supabase = createClient();
      const { data, error: dbErr } = await supabase
        .from("listings")
        .insert({
          seller_id:     user.id,
          title:         title.trim(),
          description:   description.trim(),
          price:         priceNum,
          category,
          condition,
          province,
          contact_phone: phone.trim(),
          image_urls:    imageUrls,
        })
        .select("id")
        .single();
      if (dbErr) throw new Error(dbErr.message);
      router.push(`/classifieds/listing?id=${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center"><p className="text-storm font-body">Loading…</p></div>;
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-pale-water font-body text-lg mb-6">You need to be signed in to post a listing.</p>
        <div className="flex justify-center gap-3">
          <Link href="/login" className="border border-surface-teal text-pale-water hover:text-bone-white font-heading font-bold uppercase px-6 py-3 rounded transition-colors">Sign In</Link>
          <Link href="/register" className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase px-6 py-3 rounded transition-colors">Join Free</Link>
        </div>
      </div>
    );
  }

  const inputClass = "w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors";
  const labelClass = "block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-storm mb-6">
        <Link href="/classifieds" className="hover:text-pale-water">Tackle Box</Link>
        <span className="mx-2">›</span>
        <span className="text-pale-water">Post a Listing</span>
      </nav>

      <h1 className="text-4xl font-heading font-bold text-bone-white uppercase mb-2">Post a Listing</h1>
      <p className="text-storm font-body text-sm mb-8">
        Listings are free and go live immediately. Be honest about condition and add clear photos.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded px-4 py-3 text-sm font-body">{error}</div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className={labelClass}>Title <span className="text-cast-orange">*</span></label>
          <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={120}
            placeholder="e.g. Shimano Stradic 4000 + spare spool" className={inputClass} />
        </div>

        {/* Category + Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className={labelClass}>Category <span className="text-cast-orange">*</span></label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value as ListingCategory)} className={inputClass}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="condition" className={labelClass}>Condition <span className="text-cast-orange">*</span></label>
            <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value as ListingCondition)} className={inputClass}>
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Price + Province */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className={labelClass}>Price (R) <span className="text-cast-orange">*</span></label>
            <input id="price" type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required
              placeholder="e.g. 1500" className={inputClass} />
          </div>
          <div>
            <label htmlFor="province" className={labelClass}>Province <span className="text-cast-orange">*</span></label>
            <select id="province" value={province} onChange={(e) => setProvince(e.target.value)} required className={inputClass}>
              <option value="" disabled>Choose a province…</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Contact phone */}
        <div>
          <label htmlFor="phone" className={labelClass}>WhatsApp / Phone number <span className="text-cast-orange">*</span></label>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
            placeholder="e.g. 081 234 5678" className={inputClass} />
          <p className="text-storm text-xs mt-1 font-body">Buyers will contact you on this number. Only shown on this listing.</p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelClass}>Description <span className="text-cast-orange">*</span></label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} maxLength={4000}
            placeholder="Condition, age, what's included, reason for selling, collection/courier options…" className={`${inputClass} resize-y`} />
        </div>

        {/* Photos */}
        <div>
          <label className={labelClass}>Photos <span className="text-cast-orange">*</span> <span className="text-storm font-normal normal-case">(up to {MAX_FILES})</span></label>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} className="hidden" />
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={img.preview} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.preview} alt={`Photo ${i + 1}`} className="w-24 h-24 object-cover rounded border border-surface-teal" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 bg-cast-orange text-white text-[10px] font-heading font-bold uppercase px-1.5 py-0.5 rounded">Cover</span>
                )}
                <button type="button" onClick={() => removeImage(i)} aria-label="Remove photo"
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none transition-colors">×</button>
              </div>
            ))}
            {images.length < MAX_FILES && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 border-2 border-dashed border-surface-teal hover:border-cast-orange/60 rounded flex flex-col items-center justify-center text-storm hover:text-pale-water transition-colors">
                <span className="text-2xl">📷</span>
                <span className="text-[10px] font-body mt-1">Add</span>
              </button>
            )}
          </div>
          <p className="text-storm text-xs mt-2 font-body">First photo is the cover. JPEG, PNG or WEBP · max {MAX_SIZE_MB}MB each.</p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link href="/classifieds" className="text-storm hover:text-pale-water text-sm font-body transition-colors">Cancel</Link>
          <button type="submit" disabled={submitting || !title.trim() || !description.trim() || !price || !province || !phone.trim() || images.length === 0}
            className="bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-heading font-bold uppercase tracking-wider px-8 py-3 rounded transition-colors">
            {submitting ? "Posting…" : "Post Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
