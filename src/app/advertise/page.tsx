import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise",
  description: "Reach South Africa's fishing community. Brand zones, display advertising and featured listings for tackle brands and retailers.",
  alternates: { canonical: "/advertise" },
};

const adFormats = [
  {
    title: "Brand Zone",
    description: "A dedicated sub-forum for your brand. Post product launches, how-to content, run giveaways and respond to member questions. The most engaged ad format on the platform.",
    badge: "Most Effective",
    badgeColour: "bg-cast-orange",
  },
  {
    title: "Display Advertising",
    description: "Banner placement across forum pages, category listings and the homepage. Contextual fishing audience — your ad is seen by people actively researching tackle and planning trips.",
    badge: "High Visibility",
    badgeColour: "bg-surface-teal",
  },
  {
    title: "Tackle Box Featured Listings",
    description: "Pin your products at the top of the Tackle Box classifieds. Ideal for retailers and distributors wanting to reach buyers with high purchase intent.",
    badge: "Coming Soon",
    badgeColour: "bg-storm",
  },
  {
    title: "Newsletter & Announcements",
    description: "Reach the full CastZone member base with a dedicated send or inclusion in the community newsletter. Great for product launches and tournament sponsorships.",
    badge: "Coming Soon",
    badgeColour: "bg-storm",
  },
];

const stats = [
  { value: "1.3M+", label: "SA recreational anglers" },
  { value: "R18.9B", label: "Annual angler spend" },
  { value: "3", label: "Core disciplines covered" },
  { value: "Growing", label: "Member base" },
];

export default function AdvertisePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-heading font-semibold text-bone-white mb-2">Advertise on CastZone</h1>
        <p className="text-cast-orange font-heading font-semibold text-sm mb-6">
          Reach South Africa&apos;s Fishing Community
        </p>
        <p className="text-pale-water font-body text-lg max-w-2xl leading-relaxed">
          CastZone connects your brand directly with passionate SA anglers — people who are actively researching tackle, planning trips, and buying gear. No wasted impressions.
        </p>
      </div>

      {/* Market stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-deep-water-light border border-surface-teal rounded-lg p-5 text-center">
            <p className="text-cast-orange font-heading font-semibold text-2xl mb-1">{stat.value}</p>
            <p className="text-storm font-body text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Ad formats */}
      <h2 className="text-2xl font-heading font-semibold text-bone-white mb-6">Advertising Formats</h2>
      <div className="space-y-4 mb-14">
        {adFormats.map((format) => (
          <div key={format.title} className="bg-deep-water-light border border-surface-teal rounded-lg p-6 flex gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-bone-white font-heading font-semibold text-xl ">{format.title}</h3>
                <span className={`${format.badgeColour} text-white text-xs font-mono font-semibold uppercase px-2 py-0.5 rounded`}>
                  {format.badge}
                </span>
              </div>
              <p className="text-pale-water font-body text-sm leading-relaxed">{format.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Why CastZone */}
      <div className="bg-deep-water-light border border-surface-teal rounded-lg p-8 mb-10">
        <h2 className="text-2xl font-heading font-semibold text-bone-white mb-6">Why CastZone</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-body text-sm text-pale-water">
          {[
            { title: "Contextual audience", body: "Every member is a fishing enthusiast. No demographic guesswork — your tackle brand reaches tackle buyers." },
            { title: "Community trust", body: "Forum advertising is seen as support, not interruption. Members appreciate brands that back the community." },
            { title: "SA-specific", body: "No international platform reaches SA anglers as directly. This is the local community, built for local brands." },
            { title: "Early mover advantage", body: "CastZone is new and growing. Brands that come in early build recognition as the community scales." },
          ].map((item) => (
            <div key={item.title}>
              <p className="text-bone-white font-heading font-semibold mb-1">{item.title}</p>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-pale-water font-body mb-6">
          Interested in advertising or a brand partnership? Get in touch and we&apos;ll put together a proposal.
        </p>
        <Link
          href="/contact"
          className="inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-mono font-semibold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors"
        >
          Get in Touch
        </Link>
      </div>
    </div>
  );
}
