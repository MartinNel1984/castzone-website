"use client";

// Venue Spots ("Add a spot") — angler-contributed fishing positions.
// Each spot is the exact bank/pen where you set up your rod: a photo, GPS
// captured on-site, and a casting tip. Mirrors the catch-submit upload flow
// (storage bucket → public URL → table insert) and the venue page design tokens.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Spot = {
  id: string;
  venue_slug: string;
  user_id: string;
  name: string;
  access: string | null;
  tip: string | null;
  species: string[];
  lat: number | null;
  lng: number | null;
  image_url: string;
  confirms: number;
  created_at: string;
  profiles?: { username: string } | null;
};

const ACCESS_OPTIONS = ["Bank", "Wall", "Jetty / pier", "Boat", "Float-tube", "Rocks"];
const MAX_SIZE_MB = 8;

function fmtCoord(lat: number | null, lng: number | null): string | null {
  if (lat == null || lng == null) return null;
  return `${Math.abs(lat).toFixed(4)}°${lat < 0 ? "S" : "N"} ${Math.abs(lng).toFixed(4)}°${lng < 0 ? "W" : "E"}`;
}

export default function VenueSpots({ venueSlug, venueName }: { venueSlug: string; venueName: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [access, setAccess] = useState("");
  const [tip, setTip] = useState("");
  const [speciesInput, setSpeciesInput] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    loadSpots();
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueSlug]);

  async function loadSpots() {
    const supabase = createClient();
    const { data } = await supabase
      .from("venue_spots")
      .select("*, profiles(username)")
      .eq("venue_slug", venueSlug)
      .order("created_at", { ascending: false });
    setSpots((data ?? []) as Spot[]);
    setLoading(false);
  }

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

  function captureLocation() {
    setLocError("");
    if (!("geolocation" in navigator)) {
      setLocError("Your device doesn't support location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy });
        setLocating(false);
      },
      (err) => {
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location blocked. Allow location access, or you can still add the spot without GPS."
            : "Couldn't get your location. Try again, or add the spot without GPS.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  function resetForm() {
    setName(""); setAccess(""); setTip(""); setSpeciesInput("");
    setCoords(null); setLocError(""); setError("");
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null); setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!user) return;
    if (!photoFile) { setError("A photo of the spot is required — that's the whole point!"); return; }
    if (!name.trim()) { setError("Give the spot a name, e.g. “The North Wall”."); return; }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const ext = photoFile.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("spot-images")
        .upload(path, photoFile, { contentType: photoFile.type, upsert: false });
      if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`);
      const imageUrl = supabase.storage.from("spot-images").getPublicUrl(path).data.publicUrl;

      const species = speciesInput.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8);
      const { error: dbErr } = await supabase.from("venue_spots").insert({
        venue_slug: venueSlug,
        user_id: user.id,
        name: name.trim(),
        access: access || null,
        tip: tip.trim() || null,
        species,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        accuracy_m: coords?.acc ?? null,
        image_url: imageUrl,
      });
      if (dbErr) throw new Error(dbErr.message);

      resetForm();
      setFormOpen(false);
      await loadSpots();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-bone-white font-heading font-bold uppercase text-lg">
          📍 Fishing Spots &amp; Pens
        </h2>
        {!formOpen && (
          <button
            onClick={() => (user ? setFormOpen(true) : null)}
            disabled={!user}
            className="bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-40 text-white font-heading font-bold uppercase tracking-wider text-xs px-4 py-2 rounded transition-colors"
            title={user ? "Add a spot" : "Sign in to add a spot"}
          >
            ＋ Add a spot
          </button>
        )}
      </div>
      <p className="text-storm text-sm font-body mb-4">
        The exact spots anglers fish from at {venueName} — a photo of the bank, where to cast, and the species there.
      </p>

      {/* ── Add-a-spot form ── */}
      {formOpen && (
        <form onSubmit={handleSubmit} className="bg-deep-water-light border border-cast-orange/40 rounded-lg p-5 mb-5 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 rounded px-4 py-3 text-sm font-body">{error}</div>
          )}

          {/* Photo */}
          <div>
            <label className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">
              Photo of the spot <span className="text-cast-orange">*</span>
            </label>
            {photoPreview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Spot preview" className="w-full max-w-sm h-52 object-cover rounded border-2 border-cast-orange" />
                <button type="button" onClick={() => { if (photoPreview) URL.revokeObjectURL(photoPreview); setPhotoFile(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white w-7 h-7 rounded-full text-sm flex items-center justify-center" aria-label="Remove photo">×</button>
              </div>
            ) : (
              <>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handlePhotoChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 w-full border-2 border-dashed border-surface-teal hover:border-cast-orange/60 rounded-lg px-5 py-6 text-storm hover:text-pale-water transition-colors">
                  <span className="text-2xl">📷</span>
                  <div className="text-left">
                    <p className="font-heading font-bold uppercase text-sm tracking-wider">Take / add a photo</p>
                    <p className="text-xs mt-0.5">Stand at the spot and shoot the water you cast into · max {MAX_SIZE_MB}MB</p>
                  </div>
                </button>
              </>
            )}
          </div>

          {/* GPS capture */}
          <div>
            <label className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">Pin the spot</label>
            {coords ? (
              <div className="flex items-center gap-3 bg-deep-water border border-surface-teal rounded px-4 py-3">
                <span className="text-green-400 text-lg">📍</span>
                <div className="text-sm font-body">
                  <p className="text-bone-white">{fmtCoord(coords.lat, coords.lng)}</p>
                  <p className="text-storm text-xs">Accurate to ~{Math.round(coords.acc)}m · <button type="button" onClick={() => setCoords(null)} className="text-cast-orange hover:underline">clear</button></p>
                </div>
              </div>
            ) : (
              <>
                <button type="button" onClick={captureLocation} disabled={locating}
                  className="w-full border border-surface-teal hover:border-cast-orange/60 text-pale-water hover:text-bone-white rounded px-4 py-3 text-sm font-body transition-colors flex items-center justify-center gap-2">
                  {locating ? "Getting your location…" : "📍 Use my current location"}
                </button>
                <p className="text-storm text-xs mt-1 font-body">
                  Tap this while standing at the spot to drop an exact pin. Optional — you can add it without GPS.
                </p>
                {locError && <p className="text-amber-400 text-xs mt-1 font-body">{locError}</p>}
              </>
            )}
          </div>

          {/* Name + access */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="spot-name" className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">
                Spot name <span className="text-cast-orange">*</span>
              </label>
              <input id="spot-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required
                placeholder="e.g. The North Wall"
                className="w-full bg-deep-water border border-surface-teal rounded px-4 py-2.5 text-bone-white placeholder-storm font-body text-sm focus:outline-none focus:border-cast-orange transition-colors" />
            </div>
            <div>
              <label htmlFor="spot-access" className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">
                How you fish it
              </label>
              <select id="spot-access" value={access} onChange={(e) => setAccess(e.target.value)}
                className="w-full bg-deep-water border border-surface-teal rounded px-4 py-2.5 text-bone-white font-body text-sm focus:outline-none focus:border-cast-orange transition-colors">
                <option value="">Select…</option>
                {ACCESS_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Tip */}
          <div>
            <label htmlFor="spot-tip" className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">
              Tip — where &amp; how to cast
            </label>
            <textarea id="spot-tip" value={tip} onChange={(e) => setTip(e.target.value)} rows={2} maxLength={400}
              placeholder="e.g. Drops to 6m within a rod-length of the wall. Fish tight to the structure at first light."
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-2.5 text-bone-white placeholder-storm font-body text-sm focus:outline-none focus:border-cast-orange transition-colors resize-y" />
          </div>

          {/* Species */}
          <div>
            <label htmlFor="spot-species" className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">
              Species here <span className="text-storm font-normal normal-case">(comma-separated)</span>
            </label>
            <input id="spot-species" type="text" value={speciesInput} onChange={(e) => setSpeciesInput(e.target.value)} maxLength={120}
              placeholder="e.g. Common Carp, Grass Carp, Tigerfish"
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-2.5 text-bone-white placeholder-storm font-body text-sm focus:outline-none focus:border-cast-orange transition-colors" />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={() => { resetForm(); setFormOpen(false); }} className="text-storm hover:text-pale-water text-sm font-body transition-colors">Cancel</button>
            <button type="submit" disabled={submitting || !photoFile || !name.trim()}
              className="bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-heading font-bold uppercase tracking-wider px-6 py-2.5 rounded transition-colors text-sm">
              {submitting ? "Adding…" : "Add this spot"}
            </button>
          </div>
        </form>
      )}

      {/* ── Spots list ── */}
      {loading ? (
        <p className="text-storm font-body text-sm">Loading spots…</p>
      ) : spots.length === 0 ? (
        <div className="border-2 border-dashed border-surface-teal rounded-lg px-6 py-10 text-center">
          <p className="text-pale-water font-body mb-1">No spots added yet.</p>
          <p className="text-storm text-sm font-body mb-4">Know a good spot here? Be the first to put it on the map.</p>
          {user ? (
            <button onClick={() => setFormOpen(true)} className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider text-xs px-5 py-2.5 rounded transition-colors">＋ Add the first spot</button>
          ) : (
            <Link href="/login" className="text-cast-orange hover:underline font-body text-sm">Sign in to add a spot</Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {spots.map((s, i) => {
            const coord = fmtCoord(s.lat, s.lng);
            return (
              <div key={s.id} className="bg-deep-water-light border border-surface-teal rounded-lg overflow-hidden flex flex-col">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image_url} alt={s.name} className="w-full h-44 object-cover" loading="lazy" />
                  <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-cast-orange text-white font-heading font-bold text-sm flex items-center justify-center">{i + 1}</span>
                  {coord && <span className="absolute left-2 bottom-2 text-[11px] bg-black/55 text-pale-water px-2 py-1 rounded">{coord}</span>}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-bone-white font-heading font-bold text-base">{s.name}</h3>
                  {s.access && <p className="text-storm text-xs font-body mb-2">{s.access}</p>}
                  {s.tip && <p className="text-pale-water text-sm font-body leading-relaxed"><span className="text-cast-orange font-semibold">Tip:</span> {s.tip}</p>}
                  {s.species.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {s.species.map((sp) => <span key={sp} className="text-[11px] bg-deep-water border border-surface-teal px-2 py-0.5 rounded text-pale-water">{sp}</span>)}
                    </div>
                  )}
                  <div className="text-storm text-[11px] font-body mt-3 pt-3 border-t border-surface-teal/60">
                    👤 {s.profiles?.username ?? "An angler"}{s.confirms > 0 ? ` · ✓ ${s.confirms} confirms` : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
