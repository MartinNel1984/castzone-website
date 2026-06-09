"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const PROVINCES = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Free State",
  "Northern Cape",
];

const VENUE_TYPES = [
  { value: "private_dam", label: "Private Dam / Resort" },
  { value: "tackle_shop", label: "Tackle Shop / Fishing Stand" },
  { value: "caravan_park", label: "Caravan Park / Public Resort" },
  { value: "club", label: "Fishing Club / Private Water" },
  { value: "other", label: "Other" },
];

const BENEFITS = [
  {
    icon: "📍",
    title: "Your venue on The Map",
    body: "A pin on our interactive map covering all 9 provinces. Anglers search by province and filter by type — your water shows up where they're looking.",
  },
  {
    icon: "📄",
    title: "Your own venue page",
    body: "A dedicated page with your GPS location, target species, facilities, permit info, and bite time forecast. Built and maintained by us — no tech skills needed.",
  },
  {
    icon: "⭐",
    title: "Reviews & ratings",
    body: "Members leave star ratings and feedback on venue pages. Good reviews build your reputation and bring repeat visitors.",
  },
  {
    icon: "🎣",
    title: "Reach SA anglers",
    body: "CastZone is built for the 1.3 million South Africans who fish. Members actively search for new spots — your water gets in front of the right people.",
  },
  {
    icon: "💬",
    title: "Forum threads linked to your venue",
    body: "When members discuss your water in the forum, those threads automatically appear on your venue page — organic word of mouth at no cost to you.",
  },
  {
    icon: "💸",
    title: "Completely free",
    body: "No listing fee, no commission, no catch. We list venues because a complete map makes CastZone more valuable for everyone.",
  },
];

export default function ListYourVenueContent() {
  const [venueName, setVenueName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [province, setProvince] = useState("");
  const [venueType, setVenueType] = useState("");
  const [description, setDescription] = useState("");
  const [gps, setGps] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const supabase = createClient();
    const { error: dbError } = await supabase.from("venue_partner_requests").insert({
      venue_name: venueName.trim(),
      contact_name: contactName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      province,
      venue_type: venueType,
      description: description.trim() || null,
      gps: gps.trim() || null,
    });

    if (dbError) {
      setError("Something went wrong — please try again or WhatsApp us directly.");
      setSubmitting(false);
      return;
    }

    setDone(true);
    setSubmitting(false);
  }

  const canSubmit =
    venueName.trim() &&
    contactName.trim() &&
    phone.trim() &&
    email.trim() &&
    province &&
    venueType;

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full text-center">
          <div className="text-6xl mb-6">🎣</div>
          <h1 className="text-4xl font-heading font-bold text-bone-white uppercase mb-3">
            We&apos;ll be in touch!
          </h1>
          <p className="text-pale-water font-body mb-2">
            Thanks for reaching out, <span className="text-bone-white">{contactName.split(" ")[0]}</span>.
          </p>
          <p className="text-storm font-body text-sm mb-8">
            We&apos;ve received your listing request for <span className="text-pale-water">{venueName}</span>.
            We&apos;ll review it and contact you within 2 business days to get the details right before going live.
          </p>
          <Link
            href="/venues"
            className="inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-8 py-3 rounded transition-colors"
          >
            See The Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative border-b border-surface-teal/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-deep-water via-surface-teal/10 to-deep-water pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-block bg-cast-orange/10 border border-cast-orange/30 rounded-full px-4 py-1.5 text-cast-orange text-sm font-body font-medium mb-6 uppercase tracking-wider">
            Free for venue owners
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-bone-white uppercase leading-tight mb-4">
            List Your Venue<br />
            <span className="text-cast-orange">on The Map</span>
          </h1>
          <p className="text-pale-water font-body text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Join 67 fishing venues already reaching thousands of SA anglers on CastZone —
            South Africa&apos;s fastest-growing fishing platform.
          </p>

          {/* Stats strip */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {[
              { value: "67", label: "Venues on The Map" },
              { value: "All 9", label: "Provinces covered" },
              { value: "Free", label: "No cost, ever" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-heading font-bold text-cast-orange">{s.value}</div>
                <div className="text-storm text-sm font-body mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <a
              href="#submit"
              className="inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-10 py-4 rounded text-lg transition-colors"
            >
              List My Venue — It&apos;s Free
            </a>
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-bone-white uppercase text-center mb-2">
          What you get
        </h2>
        <p className="text-storm font-body text-center mb-10">Everything included. Nothing to pay.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="bg-deep-water-light border border-surface-teal/40 rounded-lg p-5 hover:border-cast-orange/40 transition-colors"
            >
              <div className="text-3xl mb-3">{b.icon}</div>
              <h3 className="text-lg font-heading font-bold text-bone-white uppercase mb-2">{b.title}</h3>
              <p className="text-storm font-body text-sm leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What a listing looks like ── */}
      <section className="border-y border-surface-teal/30 bg-deep-water-light/50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-bone-white uppercase mb-4">
                What your venue page looks like
              </h2>
              <p className="text-pale-water font-body mb-4">
                Each venue gets a dedicated, permanently linked page on CastZone. We write it up,
                keep it current, and link it from the interactive map — you don&apos;t lift a finger.
              </p>
              <ul className="space-y-2">
                {[
                  "Interactive map pin with GPS coordinates",
                  "Target species and fishing type",
                  "Facilities: braai, ablutions, accommodation",
                  "Permit and access information",
                  "Solunar bite time forecast",
                  "Member reviews and star ratings",
                  "Linked forum threads about your water",
                  "Nearby venues for context",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-storm font-body text-sm">
                    <span className="text-cast-orange mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock venue card */}
            <div className="bg-deep-water border border-surface-teal/50 rounded-xl overflow-hidden shadow-xl">
              {/* Header */}
              <div className="bg-surface-teal/20 border-b border-surface-teal/30 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-cast-orange/20 text-cast-orange font-body font-medium px-2 py-0.5 rounded uppercase tracking-wider">Dam</span>
                      <span className="text-xs text-storm font-body">Limpopo</span>
                    </div>
                    <h3 className="text-xl font-heading font-bold text-bone-white uppercase">Your Venue Name</h3>
                    <p className="text-storm text-xs font-body mt-0.5">Private Dam · Permit required</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-cast-orange text-sm">★★★★★</span>
                    </div>
                    <p className="text-storm text-xs font-body">4.8 · 12 reviews</p>
                  </div>
                </div>
              </div>
              {/* Body */}
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-storm font-body uppercase tracking-wider mb-1.5">Target Species</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Largemouth Bass", "Carp", "Catfish"].map((s) => (
                      <span key={s} className="text-xs bg-bass-green/20 text-pale-water font-body px-2 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-deep-water-light rounded p-3">
                    <p className="text-xs text-storm font-body uppercase tracking-wider mb-1">Bite Forecast</p>
                    <p className="text-bone-white font-heading font-bold text-lg">76%</p>
                    <p className="text-storm text-xs font-body">Good day</p>
                  </div>
                  <div className="bg-deep-water-light rounded p-3">
                    <p className="text-xs text-storm font-body uppercase tracking-wider mb-1">Water Level</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-surface-teal/20 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "78%" }} />
                      </div>
                      <span className="text-bone-white text-xs font-body font-medium">78%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-storm font-body uppercase tracking-wider mb-1.5">Facilities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Braai areas", "Ablutions", "Accommodation", "Day visitors"].map((f) => (
                      <span key={f} className="text-xs bg-surface-teal/20 text-pale-water font-body px-2 py-0.5 rounded">{f}</span>
                    ))}
                  </div>
                </div>
                <div className="border-t border-surface-teal/30 pt-3 flex items-center justify-between">
                  <span className="text-storm text-xs font-body">3 forum threads linked</span>
                  <span className="text-cast-orange text-xs font-body font-medium">View on The Map →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who we're looking for ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-bone-white uppercase text-center mb-2">
          Who can list
        </h2>
        <p className="text-storm font-body text-center mb-10 max-w-2xl mx-auto">
          If anglers fish there, it belongs on the map. We&apos;re actively looking for:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {[
            { icon: "🏕️", label: "Private dams & resorts", desc: "Game farms, lodges, private fishing estates" },
            { icon: "🪣", label: "Tackle shops & fishing stands", desc: "Businesses operating on public dams and rivers" },
            { icon: "🏞️", label: "Caravan parks & public resorts", desc: "Municipal and provincial resorts with fishing access" },
            { icon: "🤝", label: "Fishing clubs", desc: "Members-only clubs with private or leased water" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-4 bg-deep-water-light border border-surface-teal/30 rounded-lg p-4">
              <span className="text-2xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="text-bone-white font-heading font-bold text-base uppercase">{item.label}</p>
                <p className="text-storm font-body text-sm mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Submission form ── */}
      <section id="submit" className="border-t border-surface-teal/30 bg-deep-water-light/30 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-bone-white uppercase mb-3">
              List your venue
            </h2>
            <p className="text-pale-water font-body">
              Fill in the form below and we&apos;ll reach out within 2 business days to confirm details before going live.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 rounded px-4 py-3 text-sm font-body">
                {error}
              </div>
            )}

            {/* Venue name */}
            <div>
              <label className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">
                Venue / Business Name <span className="text-cast-orange">*</span>
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                required
                maxLength={120}
                placeholder="e.g. Klipdrift Bass Resort"
                className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
              />
            </div>

            {/* Contact name */}
            <div>
              <label className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">
                Your Name (Owner / Manager) <span className="text-cast-orange">*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                maxLength={80}
                placeholder="e.g. Johan van der Merwe"
                className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
              />
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">
                  Phone <span className="text-cast-orange">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  maxLength={20}
                  placeholder="e.g. 082 555 0100"
                  className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
                />
              </div>
              <div>
                <label className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">
                  Email <span className="text-cast-orange">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={120}
                  placeholder="e.g. info@klipdrift.co.za"
                  className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
                />
              </div>
            </div>

            {/* Province + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">
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
                <label className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">
                  Venue Type <span className="text-cast-orange">*</span>
                </label>
                <select
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value)}
                  required
                  className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white font-body focus:outline-none focus:border-cast-orange transition-colors"
                >
                  <option value="">Select type</option>
                  {VENUE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">
                Tell us about your venue <span className="text-storm font-normal normal-case">(optional but helpful)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={800}
                placeholder="Target species, fishing type (catch-and-release, fly, carp), facilities (braai, ablutions, accommodation), access (day visitors, overnight, by appointment)..."
                className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors resize-y"
              />
            </div>

            {/* GPS */}
            <div>
              <label className="block text-pale-water text-xs font-body font-medium mb-2 uppercase tracking-wider">
                GPS Coordinates <span className="text-storm font-normal normal-case">(optional — we can sort this out together)</span>
              </label>
              <input
                type="text"
                value={gps}
                onChange={(e) => setGps(e.target.value)}
                placeholder="e.g. -25.8767, 28.3167 or paste a Google Maps link"
                className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
              />
              <p className="text-storm text-xs mt-1.5 font-body">
                Open Google Maps → long-press your venue → copy the coordinates at the top.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !canSubmit}
                className="w-full bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors"
              >
                {submitting ? "Submitting..." : "List My Venue — It's Free"}
              </button>
              <p className="text-storm text-xs text-center mt-3 font-body">
                We&apos;ll review your submission and contact you within 2 business days.
                No spam, no sales pitch — just getting your venue live.
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* ── Footer nudge ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-storm font-body text-sm">
          Questions? Email{" "}
          <a href="mailto:info@castzone.co.za" className="text-pale-water hover:text-bone-white transition-colors">
            info@castzone.co.za
          </a>{" "}
          or{" "}
          <Link href="/venues" className="text-pale-water hover:text-bone-white transition-colors">
            browse The Map
          </Link>{" "}
          to see what&apos;s already listed.
        </p>
      </section>
    </div>
  );
}
