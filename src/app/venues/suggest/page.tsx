"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const PROVINCES = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape",
];

const TYPES = [
  { value: "dam",       label: "Dam / Reservoir" },
  { value: "river",     label: "River" },
  { value: "estuary",   label: "Estuary / Lagoon" },
  { value: "saltwater", label: "Saltwater / Coast" },
];

export default function SuggestVenuePage() {
  const [name, setName] = useState("");
  const [province, setProvince] = useState("");
  const [type, setType] = useState("");
  const [gps, setGps] = useState("");
  const [notes, setNotes] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const supabase = createClient();
    const { error: dbError } = await supabase.from("venue_suggestions").insert({
      name: name.trim(),
      province,
      type,
      gps: gps.trim() || null,
      notes: notes.trim() || null,
      submitted_by: submittedBy.trim() || null,
    });

    if (dbError) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    setDone(true);
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-5xl mb-6">🎣</div>
        <h1 className="text-3xl font-heading font-bold text-bone-white uppercase mb-3">
          Thanks for the tip!
        </h1>
        <p className="text-pale-water font-body mb-8">
          We&apos;ll review your suggestion and add it to The Map if it&apos;s a good fit.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/venues" className="border border-surface-teal text-pale-water hover:text-bone-white font-heading font-bold uppercase tracking-wider px-5 py-2.5 rounded transition-colors text-sm">
            Back to The Map
          </Link>
          <button
            onClick={() => { setDone(false); setName(""); setProvince(""); setType(""); setGps(""); setNotes(""); setSubmittedBy(""); }}
            className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-5 py-2.5 rounded transition-colors text-sm"
          >
            Suggest Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-storm mb-6">
        <Link href="/venues" className="hover:text-pale-water">The Map</Link>
        <span className="mx-2">›</span>
        <span className="text-pale-water">Suggest a Venue</span>
      </nav>

      <h1 className="text-4xl font-heading font-bold text-bone-white uppercase mb-2">
        Suggest a Venue
      </h1>
      <p className="text-storm font-body text-sm mb-8">
        Know a dam, river, estuary or stretch of coast that should be on The Map? Tell us about it.
        We review all suggestions and add the best ones.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded px-4 py-3 text-sm font-body">
            {error}
          </div>
        )}

        {/* Venue name */}
        <div>
          <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
            Venue Name <span className="text-cast-orange">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            placeholder="e.g. Klipdrift Private Bass Dam"
            className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
          />
        </div>

        {/* Province + Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
              Province <span className="text-cast-orange">*</span>
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              required
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white font-body focus:outline-none focus:border-cast-orange transition-colors"
            >
              <option value="">Select province</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
              Venue Type <span className="text-cast-orange">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white font-body focus:outline-none focus:border-cast-orange transition-colors"
            >
              <option value="">Select type</option>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* GPS */}
        <div>
          <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
            GPS Coordinates <span className="text-storm font-normal normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={gps}
            onChange={(e) => setGps(e.target.value)}
            placeholder="e.g. -25.8767, 28.3167 or Google Maps link"
            className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
          />
          <p className="text-storm text-xs mt-1 font-body">
            Open Google Maps, long-press the location, and copy the coordinates shown.
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
            Tell Us About It <span className="text-storm font-normal normal-case">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Target species, access details, permit info, why it deserves to be on the map..."
            className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors resize-y"
          />
        </div>

        {/* Your name */}
        <div>
          <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
            Your Name / Username <span className="text-storm font-normal normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
            maxLength={60}
            placeholder="So we can credit you when we add it"
            className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link href="/venues" className="text-storm hover:text-pale-water text-sm font-body transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !name.trim() || !province || !type}
            className="bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-heading font-bold uppercase tracking-wider px-8 py-3 rounded transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Suggestion"}
          </button>
        </div>
      </form>
    </div>
  );
}
