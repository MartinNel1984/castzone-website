import Link from "next/link";

const forumCategories = [
  {
    name: "Bass Fishing",
    slug: "bass",
    description: "Tackle, techniques, dams, tournaments and reports for SA bass anglers.",
    colour: "bg-bass-green",
    icon: "🎣",
    threads: 0,
    posts: 0,
  },
  {
    name: "Saltwater Fishing",
    slug: "saltwater",
    description: "Shore, offshore, lure, kayak and ski-boat angling along the SA coast.",
    colour: "bg-saltwater-blue",
    icon: "🌊",
    threads: 0,
    posts: 0,
  },
  {
    name: "Specimen & Carp",
    slug: "specimen",
    description: "European-style specimen carp fishing, rigs, bait and big fish stories.",
    colour: "bg-specimen-brown",
    icon: "🐟",
    threads: 0,
    posts: 0,
  },
  {
    name: "General Angling",
    slug: "general",
    description: "Everything else — freshwater, fly fishing, beginner questions and more.",
    colour: "bg-surface-teal",
    icon: "🏞️",
    threads: 0,
    posts: 0,
  },
];

const featureCards = [
  {
    title: "Tackle Box",
    description: "Buy and sell fishing gear. Rods, reels, boats, tackle — all in one place.",
    href: "/classifieds",
    icon: "🛒",
  },
  {
    title: "The Map",
    description: "Find dams and venues across all 9 provinces. Species, permits, GPS.",
    href: "/venues",
    icon: "🗺️",
  },
  {
    title: "Trophy Room",
    description: "Log your catches, track personal bests, and show off your fish.",
    href: "/catches",
    icon: "🏆",
  },
  {
    title: "Tournaments",
    description: "SA tournament calendar — bass, carp, saltwater and more.",
    href: "/tournaments",
    icon: "🥇",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-deep-water border-b border-surface-teal overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #f26522 0%, transparent 60%)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-cast-orange font-heading font-semibold uppercase tracking-widest text-sm mb-3">
              South Africa&apos;s Fishing Community
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-bone-white leading-none mb-6 uppercase">
              Where South<br />Africa Fishes
            </h1>
            <p className="text-pale-water text-lg leading-relaxed mb-8 font-body max-w-xl">
              Bass, saltwater, specimen and everything in between. Join the forum built for SA anglers — share catches, find venues, buy gear, and connect.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors"
              >
                Join Free
              </Link>
              <Link
                href="/forum"
                className="border border-surface-teal hover:border-pale-water text-pale-water hover:text-bone-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors"
              >
                Browse Forum
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="bg-deep-water-light border-b border-surface-teal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap justify-center sm:justify-start gap-8 sm:gap-12 text-center">
            {[
              { value: "Be the first", label: "to register" },
              { value: "3 categories", label: "Bass · Saltwater · Specimen" },
              { value: "Free forever", label: "to join and post" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-cast-orange font-heading font-bold text-xl uppercase">{stat.value}</p>
                <p className="text-storm text-xs uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Forum categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-3xl font-heading font-bold text-bone-white uppercase mb-8">
          Forum Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {forumCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/forum/${cat.slug}`}
              className="group bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg p-5 flex items-start gap-4 transition-all"
            >
              <div className={`${cat.colour} rounded-lg w-12 h-12 flex items-center justify-center text-2xl flex-shrink-0`}>
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-bone-white font-heading font-bold text-xl uppercase group-hover:text-cast-orange transition-colors">
                  {cat.name}
                </h3>
                <p className="text-storm text-sm mt-1 leading-relaxed font-body">{cat.description}</p>
                <div className="flex gap-4 mt-3">
                  <span className="text-pale-water text-xs">{cat.threads} threads</span>
                  <span className="text-pale-water text-xs">{cat.posts} posts</span>
                </div>
              </div>
              <svg className="w-5 h-5 text-storm group-hover:text-cast-orange transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section className="bg-deep-water-light border-t border-b border-surface-teal py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold text-bone-white uppercase mb-8">
            More Than a Forum
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group bg-deep-water border border-surface-teal hover:border-cast-orange rounded-lg p-6 transition-all"
              >
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="text-bone-white font-heading font-bold text-lg uppercase mb-2 group-hover:text-cast-orange transition-colors">
                  {card.title}
                </h3>
                <p className="text-storm text-sm leading-relaxed font-body">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-4xl sm:text-5xl font-heading font-bold text-bone-white uppercase mb-4">
          Ready to Cast?
        </h2>
        <p className="text-pale-water text-lg font-body mb-8 max-w-xl mx-auto">
          Registration is free. Join the community that&apos;s building the best SA angling platform online.
        </p>
        <Link
          href="/register"
          className="inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-10 py-4 rounded text-lg transition-colors"
        >
          Create Your Account
        </Link>
      </section>
    </div>
  );
}
