import Link from "next/link";

const disciplines = [
  { icon: "🎣", name: "Bass", bodies: ["SABAA", "MLF South Africa", "Cast for Cash"] },
  { icon: "🌊", name: "Saltwater", bodies: ["SADSAA", "SASAA", "Shore Angling SA"] },
  { icon: "🐟", name: "Carp & Specimen", bodies: ["SACS", "Carp SA Events"] },
  { icon: "🦟", name: "Fly Fishing", bodies: ["FOSAF", "SAFFA"] },
];

export default function TournamentsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-5xl font-heading font-bold text-bone-white uppercase mb-2">Tournaments</h1>
      <p className="text-cast-orange font-heading font-semibold uppercase tracking-widest text-sm mb-8">SA Angling Calendar</p>

      <div className="bg-cast-orange/10 border border-cast-orange/40 rounded-lg p-6 mb-10 flex items-start gap-4">
        <span className="text-cast-orange text-2xl flex-shrink-0">🚧</span>
        <div>
          <p className="text-cast-orange font-heading font-bold uppercase text-lg mb-1">Coming Soon</p>
          <p className="text-pale-water font-body text-sm">
            The CastZone tournament hub is under construction. It will be the single calendar for all SA angling events — bass, saltwater, carp and fly.{" "}
            <Link href="/register" className="text-cast-orange hover:underline">Register now</Link> to be notified at launch.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-heading font-bold text-bone-white uppercase mb-6">What&apos;s Coming</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          { icon: "📅", title: "Full SA calendar", body: "Every tournament across all disciplines and provinces in one searchable calendar." },
          { icon: "🏅", title: "Live results", body: "Scores, leaderboards and results posted as tournaments happen." },
          { icon: "📝", title: "Online entry", body: "Enter tournaments directly through CastZone — one profile, all events." },
        ].map((item) => (
          <div key={item.title} className="bg-deep-water-light border border-surface-teal rounded-lg p-6">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="text-bone-white font-heading font-bold uppercase mb-2">{item.title}</h3>
            <p className="text-storm font-body text-sm leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-heading font-bold text-bone-white uppercase mb-6">Disciplines Covered</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {disciplines.map((d) => (
          <div key={d.name} className="bg-deep-water-light border border-surface-teal rounded-lg p-5">
            <h3 className="text-bone-white font-heading font-bold uppercase mb-2">{d.icon} {d.name}</h3>
            <div className="flex flex-wrap gap-2">
              {d.bodies.map((b) => (
                <span key={b} className="bg-surface-teal/30 border border-surface-teal text-pale-water text-xs font-body px-2 py-1 rounded">
                  {b}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link href="/register" className="inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors">
          Register to Be Notified
        </Link>
      </div>
    </div>
  );
}
