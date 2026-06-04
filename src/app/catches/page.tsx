import Link from "next/link";

export default function TrophyRoomPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-5xl font-heading font-bold text-bone-white uppercase mb-2">Trophy Room</h1>
      <p className="text-cast-orange font-heading font-semibold uppercase tracking-widest text-sm mb-8">Your Catches. Your Records.</p>

      <div className="bg-cast-orange/10 border border-cast-orange/40 rounded-lg p-6 mb-10 flex items-start gap-4">
        <span className="text-cast-orange text-2xl flex-shrink-0">🚧</span>
        <div>
          <p className="text-cast-orange font-heading font-bold uppercase text-lg mb-1">Coming Soon</p>
          <p className="text-pale-water font-body text-sm">
            Trophy Room is under construction. <Link href="/register" className="text-cast-orange hover:underline">Register now</Link> to be first when it launches.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {[
          { icon: "🐟", title: "Log every catch", body: "Record species, weight, length, location, conditions and tackle used. Build your personal fishing history." },
          { icon: "🏆", title: "Track personal bests", body: "Automatic PBs per species. See how your biggest catches compare with other CastZone members." },
          { icon: "📍", title: "Linked to The Map", body: "Each catch is tagged to a dam or venue. See which spots produce the biggest fish." },
        ].map((item) => (
          <div key={item.title} className="bg-deep-water-light border border-surface-teal rounded-lg p-6">
            <div className="text-4xl mb-3">{item.icon}</div>
            <h3 className="text-bone-white font-heading font-bold uppercase mb-2">{item.title}</h3>
            <p className="text-storm font-body text-sm leading-relaxed">{item.body}</p>
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
