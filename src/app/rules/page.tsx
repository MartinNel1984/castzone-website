import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Rules",
  description: "The community rules that keep CastZone a respectful, fishing-focused space for all South African anglers.",
  alternates: { canonical: "/rules" },
};

const rules = [
  {
    number: "01",
    title: "Respect every angler",
    body: "Treat all members with respect regardless of experience level, discipline, or opinion. No personal attacks, name-calling or harassment. Beginners are as welcome here as veterans.",
  },
  {
    number: "02",
    title: "Keep it fishing",
    body: "CastZone is a fishing community. Keep your posts relevant to angling. Politics, religion and unrelated topics belong elsewhere.",
  },
  {
    number: "03",
    title: "No spam or advertising",
    body: "Do not post unsolicited advertising, affiliate links or spam. Commercial entities must contact us about our sponsor and advertiser packages. Tackle Box is the place to sell your personal gear.",
  },
  {
    number: "04",
    title: "Post in the right category",
    body: "Choose the correct forum section for your post. Bass fishing in Bass, saltwater in Saltwater, and so on. Threads posted in the wrong section will be moved by a Bailiff.",
  },
  {
    number: "05",
    title: "No illegal fishing content",
    body: "Do not post content that promotes illegal fishing practices — undersized fish, fishing outside seasons, fishing in closed waters, or exceeding bag limits. Celebrate the catch, respect the resource.",
  },
  {
    number: "06",
    title: "Tackle Box rules",
    body: "When listing gear for sale: be honest about condition, include a price, and use clear photos. No bait-and-switch. Disputes between buyers and sellers are their own responsibility — CastZone does not mediate transactions.",
  },
  {
    number: "07",
    title: "One account per person",
    body: "One account per member. Creating multiple accounts to evade a ban or misrepresent yourself will result in permanent removal.",
  },
  {
    number: "08",
    title: "Listen to Bailiffs and Wardens",
    body: "Moderators (Bailiffs) and Admins (Wardens) keep CastZone running fairly. Their decisions are final. If you disagree with a moderation decision, contact us privately — do not argue in public threads.",
  },
  {
    number: "09",
    title: "No doxxing or personal information",
    body: "Do not post anyone’s personal information (real name, address, phone number, workplace) without their explicit consent.",
  },
  {
    number: "10",
    title: "Good sportsmanship",
    body: "CastZone is a community of people who love fishing. Encourage others, share knowledge generously, and remember that we’re all here because we love the same thing.",
  },
];

export default function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-5xl font-heading font-semibold text-bone-white mb-2">Community Rules</h1>
      <p className="text-storm font-body mb-10">
        CastZone is built on mutual respect between anglers. These rules keep it that way.
        Breaking them may result in warnings, post removal, or a ban at the discretion of the moderation team.
      </p>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.number} className="bg-deep-water-light border border-surface-teal rounded-lg p-6 flex gap-5">
            <span className="text-cast-orange font-heading font-bold text-2xl leading-none flex-shrink-0 w-8">
              {rule.number}
            </span>
            <div>
              <h2 className="text-bone-white font-heading font-semibold text-lg mb-2">{rule.title}</h2>
              <p className="text-pale-water font-body text-sm leading-relaxed">{rule.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-surface-teal mt-10 pt-8">
        <p className="text-storm font-body text-sm mb-4">
          Questions about the rules or a moderation decision?
        </p>
        <Link href="/contact" className="text-cast-orange hover:underline font-body text-sm">
          Contact the moderation team →
        </Link>
      </div>
    </div>
  );
}
