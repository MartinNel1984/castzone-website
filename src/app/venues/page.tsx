import Link from "next/link";

const provinces = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape",
];

export default function VenuesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-5xl font-heading font-bold text-bone-white uppercase mb-2">The Map</h1>
      <p className="text-cast-orange font-heading font-semibold uppercase tracking-widest text-sm mb-8">SA Venues & Dam Database</p>

      <div className="bg-cast-orange/10 border border-cast-orange/40 rounded-lg p-6 mb-10 flex items-start gap-4">
        <span className="text-cast-orange text-2xl flex-shrink-0">🚧</span>
        <div>
          <p className="text-cast-orange font-heading font-bold uppercase text-lg mb-1">Coming Soon</p>
          <p className="text-pale-water font-body text-sm">
            The Map is under construction. <Link href="/register" className="text-cast-orange hover:underline">Register now</Link> to be notified when it launches — and to submit your favourite venues.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        {[
          { icon: "🗺️", title: "All 9 provinces", body: "Every dam, river, estuary and launch site across South Africa — searchable by province, species and fishing type." },
          { icon: "🐟", title: "Species per venue", body: "Know what you're fishing for before you go. Each venue lists confirmed species with size and bag limit info." },
          { icon: "📋", title: "Permits & regulations", body: "Province-by-province permit links, MPA boundaries, closed seasons and bag limits. All in one place." },
          { icon: "📍", title: "GPS coordinates", body: "Exact launch coordinates, ramp locations and access points. Copy to Google Maps with one tap." },
        ].map((item) => (
          <div key={item.title} className="bg-deep-water-light border border-surface-teal rounded-lg p-6 flex gap-4">
            <span className="text-3xl flex-shrink-0">{item.icon}</span>
            <div>
              <h3 className="text-bone-white font-heading font-bold uppercase mb-2">{item.title}</h3>
              <p className="text-storm font-body text-sm leading-relaxed">{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-deep-water-light border border-surface-teal rounded-lg p-6 mb-8">
        <h2 className="text-bone-white font-heading font-bold uppercase mb-4">Provinces Covered</h2>
        <div className="flex flex-wrap gap-2">
          {provinces.map((p) => (
            <span key={p} className="bg-surface-teal/30 border border-surface-teal text-pale-water text-sm font-body px-3 py-1 rounded-full">
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link href="/register" className="inline-block bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-8 py-4 rounded text-lg transition-colors">
          Register to Be Notified
        </Link>
      </div>
    </div>
  );
}
