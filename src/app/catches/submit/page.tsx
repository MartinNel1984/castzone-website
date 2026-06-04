"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Category = "carp" | "bass" | "saltwater";

const CATEGORIES = [
  { value: "carp"      as Category, label: "Carp",      icon: "🐟" },
  { value: "bass"      as Category, label: "Bass",       icon: "🎣" },
  { value: "saltwater" as Category, label: "Saltwater",  icon: "🌊" },
];

const SPECIES: Record<Category, string[]> = {
  carp: [
    "Common Carp", "Mirror Carp", "Grass Carp", "Bighead Carp",
    "Crucian Carp", "F1 Carp", "Leather Carp", "Ghost Carp",
  ],
  bass: [
    "Largemouth Bass", "Smallmouth Bass", "Spotted Bass",
  ],
  saltwater: [
    "Yellowtail", "Kob / Kabeljou", "Dusky Kob", "Musselcracker / Poenskop",
    "Galjoen", "Garrick / Leervis", "Dorado / Mahi-Mahi",
    "Yellowfin Tuna", "Bluefin Tuna", "Snoek", "Shad / Elf",
    "Red Roman", "Couta / King Mackerel", "Geelbek / Cape Salmon",
    "Bronzewing / Natal Stumpnose", "Slinger", "Karanteen",
  ],
};

const MAX_SIZE_MB = 8;
const today = new Date().toISOString().split("T")[0];

export default function SubmitCatchPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser]               = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [category, setCategory]   = useState<Category>("carp");
  const [species, setSpecies]     = useState("");
  const [weightKg, setWeightKg]   = useState("");
  const [catchDate, setCatchDate] = useState("");
  const [venue, setVenue]         = useState("");
  const [notes, setNotes]         = useState("");

  const [photoFile, setPhotoFile]       = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [reviewing, setReviewing]   = useState(false);
  const [error, setError]           = useState("");
  const [done, setDone]             = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
    });
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Photo must be under ${MAX_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  }

  function removePhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadPhoto(userId: string): Promise<string> {
    if (!photoFile) throw new Error("No photo selected.");
    const supabase = createClient();
    const ext = photoFile.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("catch-images")
      .upload(path, photoFile, { contentType: photoFile.type, upsert: false });

    if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
    const { data } = supabase.storage.from("catch-images").getPublicUrl(path);
    return data.publicUrl;
  }

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!photoFile) {
      setError("A photo is required — trophy catches need proof!");
      return;
    }
    const weight = parseFloat(weightKg);
    if (isNaN(weight) || weight <= 0) {
      setError("Please enter a valid weight.");
      return;
    }
    setReviewing(true);
  }

  async function handleConfirmSubmit() {
    if (!user) return;
    setError("");
    setSubmitting(true);
    try {
      const imageUrl = await uploadPhoto(user.id);
      const supabase = createClient();
      const { error: dbError } = await supabase.from("catches").insert({
        user_id:     user.id,
        category,
        species:     species.trim(),
        weight_kg:   parseFloat(weightKg),
        catch_date:  catchDate,
        venue:       venue.trim() || null,
        notes:       notes.trim() || null,
        image_url:   imageUrl,
        approved:    true,
        approved_at: new Date().toISOString(),
      });
      if (dbError) throw new Error(dbError.message);
      setDone(true);
    } catch (err: unknown) {
      setReviewing(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-storm font-body">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-pale-water font-body text-lg mb-6">
          You need to be signed in to submit a catch.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/login" className="border border-surface-teal text-pale-water hover:text-bone-white font-heading font-bold uppercase px-6 py-3 rounded transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase px-6 py-3 rounded transition-colors">
            Join Free
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-6xl mb-5">🏆</div>
        <h1 className="text-3xl font-heading font-bold text-bone-white uppercase mb-3">
          Catch Submitted!
        </h1>
        <p className="text-pale-water font-body mb-2">
          Your catch is live on the leaderboard!
        </p>
        <p className="text-storm text-sm font-body mb-8">
          Head to the Trophy Room to see where you rank.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/catches"
            className="border border-surface-teal text-pale-water hover:text-bone-white font-heading font-bold uppercase tracking-wider px-5 py-2.5 rounded transition-colors text-sm"
          >
            View Trophy Room
          </Link>
          <button
            onClick={() => {
              setDone(false);
              setSpecies("");
              setWeightKg("");
              setCatchDate("");
              setVenue("");
              setNotes("");
              removePhoto();
            }}
            className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-5 py-2.5 rounded transition-colors text-sm"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  const catObj = CATEGORIES.find((c) => c.value === category)!;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-storm mb-6">
        <Link href="/catches" className="hover:text-pale-water">Trophy Room</Link>
        <span className="mx-2">›</span>
        <span className="text-pale-water">Submit a Catch</span>
      </nav>

      <h1 className="text-4xl font-heading font-bold text-bone-white uppercase mb-2">
        Submit a Catch
      </h1>
      <p className="text-storm font-body text-sm mb-8">
        Think you&apos;ve got what it takes to top the leaderboard? Submit your catch with a photo and
        we&apos;ll review it. A photo is required — no proof, no crown.
      </p>

      <form onSubmit={handleReview} className="space-y-6">
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded px-4 py-3 text-sm font-body">
            {error}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
            Category <span className="text-cast-orange">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => { setCategory(c.value); setSpecies(""); }}
                className={`flex flex-col items-center gap-2 py-4 rounded border-2 transition-colors font-heading font-bold uppercase text-sm tracking-wider ${
                  category === c.value
                    ? "border-cast-orange bg-cast-orange/10 text-bone-white"
                    : "border-surface-teal bg-deep-water text-storm hover:border-pale-water/50 hover:text-pale-water"
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Species */}
        <div>
          <label htmlFor="species" className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
            Species <span className="text-cast-orange">*</span>
          </label>
          <input
            id="species"
            list="species-list"
            type="text"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            required
            maxLength={80}
            placeholder={`e.g. ${SPECIES[category][0]}`}
            className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
          />
          <datalist id="species-list">
            {SPECIES[category].map((s) => <option key={s} value={s} />)}
          </datalist>
          <p className="text-storm text-xs mt-1 font-body">
            Start typing — common {catObj.label} species will appear as suggestions.
          </p>
        </div>

        {/* Weight + Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="weight" className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
              Weight (kg) <span className="text-cast-orange">*</span>
            </label>
            <input
              id="weight"
              type="number"
              step="0.01"
              min="0.01"
              max="999"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
              placeholder="e.g. 17.800"
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
            />
          </div>
          <div>
            <label htmlFor="catch-date" className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
              Date Caught <span className="text-cast-orange">*</span>
            </label>
            <input
              id="catch-date"
              type="date"
              value={catchDate}
              onChange={(e) => setCatchDate(e.target.value)}
              required
              max={today}
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white font-body focus:outline-none focus:border-cast-orange transition-colors"
            />
          </div>
        </div>

        {/* Venue */}
        <div>
          <label htmlFor="venue" className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
            Venue / Location <span className="text-storm font-normal normal-case">(optional)</span>
          </label>
          <input
            id="venue"
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            maxLength={120}
            placeholder="e.g. Roodeplaat Dam, Gauteng"
            className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
            Notes <span className="text-storm font-normal normal-case">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Bait used, conditions, tackle setup..."
            className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors resize-y"
          />
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
            Trophy Photo <span className="text-cast-orange">*</span>
          </label>

          {photoPreview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Trophy catch preview"
                className="w-full max-w-sm h-64 object-cover rounded border-2 border-cast-orange"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white w-7 h-7 rounded-full text-sm flex items-center justify-center transition-colors"
                aria-label="Remove photo"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 w-full border-2 border-dashed border-surface-teal hover:border-cast-orange/60 rounded-lg px-6 py-8 text-storm hover:text-pale-water transition-colors"
              >
                <span className="text-3xl">📷</span>
                <div className="text-left">
                  <p className="font-heading font-bold uppercase text-sm tracking-wider">Add trophy photo</p>
                  <p className="text-xs mt-0.5">JPEG, PNG or WEBP · max {MAX_SIZE_MB}MB · required</p>
                </div>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link href="/catches" className="text-storm hover:text-pale-water text-sm font-body transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!species.trim() || !weightKg || !catchDate || !photoFile}
            className="bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-heading font-bold uppercase tracking-wider px-8 py-3 rounded transition-colors"
          >
            Review Catch →
          </button>
        </div>
      </form>

      {/* ── Review / Confirm modal ── */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-deep-water-light border border-surface-teal rounded-xl max-w-md w-full overflow-hidden">
            <div className="bg-cast-orange/10 border-b border-cast-orange/30 px-6 py-4">
              <h2 className="text-bone-white font-heading font-bold uppercase text-lg">Confirm Your Catch</h2>
              <p className="text-storm text-sm font-body mt-0.5">Check everything looks right before submitting.</p>
            </div>
            {photoPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Trophy catch" className="w-full h-52 object-cover" />
            )}
            <div className="px-6 py-5 space-y-3">
              {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 rounded px-4 py-3 text-sm font-body">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-body">
                <span className="text-storm uppercase tracking-wider text-xs">Category</span>
                <span className="text-bone-white">{CATEGORIES.find(c => c.value === category)?.icon} {CATEGORIES.find(c => c.value === category)?.label}</span>
                <span className="text-storm uppercase tracking-wider text-xs">Species</span>
                <span className="text-bone-white">{species}</span>
                <span className="text-storm uppercase tracking-wider text-xs">Weight</span>
                <span className="text-cast-orange font-bold">{parseFloat(weightKg).toFixed(2)} kg</span>
                <span className="text-storm uppercase tracking-wider text-xs">Date</span>
                <span className="text-bone-white">{new Date(catchDate + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</span>
                {venue && <><span className="text-storm uppercase tracking-wider text-xs">Venue</span><span className="text-bone-white">{venue}</span></>}
                {notes && <><span className="text-storm uppercase tracking-wider text-xs">Notes</span><span className="text-pale-water">{notes}</span></>}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setReviewing(false); setError(""); }}
                disabled={submitting}
                className="flex-1 border border-surface-teal text-pale-water hover:text-bone-white font-heading font-bold uppercase tracking-wider py-3 rounded transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex-1 bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-heading font-bold uppercase tracking-wider py-3 rounded transition-colors text-sm"
              >
                {submitting ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
