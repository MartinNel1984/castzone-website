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
            <a
              href="https://instagram.com/castzonefishing"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow CastZone on Instagram"
              className="inline-flex items-center gap-2 mt-4 text-storm hover:text-cast-orange text-sm transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.62c-3.15 0-3.5.01-4.74.07-.89.04-1.37.19-1.69.31-.43.17-.73.37-1.05.69-.32.32-.52.62-.69 1.05-.12.32-.27.8-.31 1.69-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.04.89.19 1.37.31 1.69.17.43.37.73.69 1.05.32.32.62.52 1.05.69.32.12.8.27 1.69.31 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c.89-.04 1.37-.19 1.69-.31.43-.17.73-.37 1.05-.69.32-.32.52-.62.69-1.05.12-.32.27-.8.31-1.69.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.04-.89-.19-1.37-.31-1.69a2.82 2.82 0 0 0-.69-1.05 2.82 2.82 0 0 0-1.05-.69c-.32-.12-.8-.27-1.69-.31-1.24-.06-1.59-.07-4.74-.07Zm0 2.76a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6Zm0 1.62a3.68 3.68 0 1 0 0 7.36 3.68 3.68 0 0 0 0-7.36Zm5.48-2.91a1.24 1.24 0 1 1 0 2.48 1.24 1.24 0 0 1 0-2.48Z" />
              </svg>
              @castzonefishing
            </a>
            <a
              href="https://www.facebook.com/CastZoneFishing"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow CastZone on Facebook"
              className="flex items-center gap-2 mt-2 text-storm hover:text-cast-orange text-sm transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8v8.44C19.61 23.08 24 18.09 24 12.07Z" />
              </svg>
              CastZone Fishing
            </a>
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
                { label: "The Map", href: "/venues" },
                { label: "Specials", href: "/specials" },
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
