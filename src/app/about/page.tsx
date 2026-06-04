import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-5xl font-heading font-bold text-bone-white uppercase mb-2">About CastZone</h1>
      <p className="text-cast-orange font-heading font-semibold uppercase tracking-widest text-sm mb-10">
        Where South Africa Fishes
      </p>

      <div className="space-y-10 font-body text-pale-water leading-relaxed">

        <section>
          <h2 className="text-2xl font-heading font-bold text-bone-white uppercase mb-4">Our Story</h2>
          <p className="mb-4">
            South Africa has over 1.3 million recreational anglers. We fish dams at dawn, chase bass in Gauteng, cast into the surf from the Eastern Cape, and haul carp from the banks of the Vaal. We&apos;re one of the most passionate angling nations on earth.
          </p>
          <p>
            Yet for years, the online spaces that were supposed to connect us have been falling apart. Forums built in the early 2000s went quiet. The ones that survived became outdated, hard to use on a phone, and impossible to find anything on. Anglers migrated to Facebook groups — dozens of them, fragmented and hard to search.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-bone-white uppercase mb-4">What CastZone Is</h2>
          <p className="mb-4">
            CastZone is the modern South African fishing community. Built mobile-first, designed for the way anglers actually use the internet — on a phone, at the water, in the bakkie on the way to the dam.
          </p>
          <p className="mb-4">We cover the three biggest disciplines in South African angling:</p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2"><span className="text-cast-orange mt-1">›</span><span><strong className="text-bone-white">Bass Fishing</strong> — tackle, techniques, tournaments, dams and reports</span></li>
            <li className="flex items-start gap-2"><span className="text-cast-orange mt-1">›</span><span><strong className="text-bone-white">Saltwater</strong> — shore, offshore, lure, kayak and ski-boat</span></li>
            <li className="flex items-start gap-2"><span className="text-cast-orange mt-1">›</span><span><strong className="text-bone-white">Specimen & Carp</strong> — rigs, bait, European-style specimen fishing</span></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-bone-white uppercase mb-4">What&apos;s Coming</h2>
          <p className="mb-4">CastZone is growing. On the roadmap:</p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2"><span className="text-cast-orange mt-1">›</span><span><strong className="text-bone-white">Tackle Box</strong> — buy and sell fishing gear directly with other SA anglers</span></li>
            <li className="flex items-start gap-2"><span className="text-cast-orange mt-1">›</span><span><strong className="text-bone-white">The Map</strong> — a searchable database of SA dams and venues, with species, permits and GPS</span></li>
            <li className="flex items-start gap-2"><span className="text-cast-orange mt-1">›</span><span><strong className="text-bone-white">Trophy Room</strong> — log your catches, track personal bests, share your fish</span></li>
            <li className="flex items-start gap-2"><span className="text-cast-orange mt-1">›</span><span><strong className="text-bone-white">Tournament Hub</strong> — the SA angling calendar, results and registrations in one place</span></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-bone-white uppercase mb-4">Our Values</h2>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2"><span className="text-cast-orange mt-1">›</span><span>Anglers first — every feature we build is for the community, not the advertiser</span></li>
            <li className="flex items-start gap-2"><span className="text-cast-orange mt-1">›</span><span>South African — built here, for here, by people who fish here</span></li>
            <li className="flex items-start gap-2"><span className="text-cast-orange mt-1">›</span><span>Respect the sport — conservation, ethics and fair play matter</span></li>
            <li className="flex items-start gap-2"><span className="text-cast-orange mt-1">›</span><span>No gatekeeping — beginners are as welcome as old hands</span></li>
          </ul>
        </section>

        <div className="border-t border-surface-teal pt-8 flex flex-wrap gap-4">
          <Link href="/register" className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-6 py-3 rounded transition-colors">
            Join the Community
          </Link>
          <Link href="/contact" className="border border-surface-teal hover:border-pale-water text-pale-water hover:text-bone-white font-heading font-bold uppercase tracking-wider px-6 py-3 rounded transition-colors">
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  );
}
