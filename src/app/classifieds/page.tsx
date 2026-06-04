import Link from "next/link";

const categories = [
  { icon: "🎣", name: "Rods & Reels", description: "Spinning, baitcast, fly — all tackle types" },
  { icon: "🪝", name: "Terminal Tackle", description: "Hooks, lures, jigs, weights, line" },
  { icon: "🚤", name: "Boats & Watercraft", description: "Bass boats, kayaks, paddle skis, motors" },
  { icon: "🧰", name: "Accessories", description: "Nets, tackle boxes, clothing, electronics" },
  { icon: "🐟", name: "Carp & Specimen", description: "Rigs, bait, bivvies, bedchairs, buzzers" },
  { icon: "📦", name: "Other Fishing Gear", description: "Anything fishing-related that doesn&apos;t fit above" },
];

export default function ClassifiedsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-5xl font-heading font-bold text-bone-white uppercase mb-2">Tackle Box</h1>
        <p className="text-cast-orange font-heading font-semibold uppercase tracking-widest text-sm mb-4">
          Buy &amp; Sell with SA Anglers
        </p>
        <p className="text-pale-water font-body max-w-2xl">
          CastZone&apos;s classified section connects SA anglers directly — no middlemen, no big retail markups.
          List your gear, find a bargain, trade within the community you trust.
        </p>
      </div>

      {/* Coming soon banner */}
      <div className="bg-cast-orange/10 border border-cast-orange/40 rounded-lg p-6 mb-10 flex items-start gap-4">
        <span className="text-cast-orange text-2xl flex-shrink-0">🚧</span>
        <div>
          <p className="text-cast-orange font-heading font-bold uppercase text-lg mb-1">Coming Soon</p>
          <p className="text-pale-water font-body text-sm">
            The Tackle Box is under construction. Be the first to list when it opens —{" "}
            <Link href="/register" className="text-cast-orange hover:underline">register now</Link> and
            we&apos;ll notify you the moment listings go live.
          </p>
        </div>
      </div>

      {/* Categories */}
      <h2 className="text-2xl font-heading font-bold text-bone-white uppercase mb-6">Categories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="bg-deep-water-light border border-surface-teal rounded-lg p-5 opacity-70"
          >
            <div className="text-3xl mb-3">{cat.icon}</div>
            <h3 className="text-bone-white font-heading font-bold text-lg uppercase mb-1">{cat.name}</h3>
            <p className="text-storm font-body text-sm"
              dangerouslySetInnerHTML={{ __html: cat.description }} />
          </div>
        ))}
      </div>

      {/* How it will work */}
      <div className="bg-deep-water-light border border-surface-teal rounded-lg p-8">
        <h2 className="text-2xl font-heading font-bold text-bone-white uppercase mb-6">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: "01", title: "List your gear", body: "Post photos, set your price and choose your category. Listings are free for members." },
            { step: "02", title: "Connect directly", body: "Interested buyers contact you via the forum. No fees, no commission — you deal directly." },
            { step: "03", title: "Meet and fish", body: "Arrange a handover, collect at a tournament, or post via courier. The community handles the rest." },
          ].map((item) => (
            <div key={item.step}>
              <p className="text-cast-orange font-heading font-bold text-3xl mb-2">{item.step}</p>
              <h3 className="text-bone-white font-heading font-bold uppercase mb-2">{item.title}</h3>
              <p className="text-storm font-body text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/register"
          className="inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors"
        >
          Register to Be Notified
        </Link>
      </div>
    </div>
  );
}
