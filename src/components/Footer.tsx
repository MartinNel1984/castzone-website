import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-charcoal border-t border-surface-teal mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-1 mb-3">
              <span className="text-cast-orange text-2xl font-heading font-bold">C</span>
              <span className="text-bone-white text-lg font-heading font-bold tracking-widest uppercase">ASTZONE</span>
            </div>
            <p className="text-storm text-sm leading-relaxed">
              Where South Africa Fishes.
            </p>
          </div>

          {/* Forum */}
          <div>
            <h4 className="text-bone-white font-heading font-semibold uppercase tracking-wider text-sm mb-3">Forum</h4>
            <ul className="space-y-2">
              {[
                { label: "Bass Fishing", href: "/forum/bass" },
                { label: "Saltwater", href: "/forum/saltwater" },
                { label: "Specimen/Carp", href: "/forum/specimen" },
                { label: "General", href: "/forum/general" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-storm hover:text-pale-water text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-bone-white font-heading font-semibold uppercase tracking-wider text-sm mb-3">Community</h4>
            <ul className="space-y-2">
              {[
                { label: "Tackle Box", href: "/classifieds" },
                { label: "The Map", href: "/venues" },
                { label: "Bite Times", href: "/bite-times" },
                { label: "Tournaments", href: "/tournaments" },
                { label: "Trophy Room", href: "/catches" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-storm hover:text-pale-water text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-bone-white font-heading font-semibold uppercase tracking-wider text-sm mb-3">Info</h4>
            <ul className="space-y-2">
              {[
                { label: "About", href: "/about" },
                { label: "Rules", href: "/rules" },
                { label: "Contact", href: "/contact" },
                { label: "Advertise", href: "/advertise" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-storm hover:text-pale-water text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-surface-teal mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-storm text-xs">
            © {new Date().getFullYear()} CastZone. All rights reserved.
          </p>
          <p className="text-storm text-xs">
            Built for South African anglers.
          </p>
        </div>
      </div>
    </footer>
  );
}
