import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CITIES, CITY_SLUGS, CITY_BY_SLUG, distanceKm } from "@/data/cities";
import { getAllVenues } from "@/lib/venuesBuild";
import { VENUE_SLUGS } from "../../venues/[slug]/page";

export const dynamic = "force-static";

const VALID = new Set(VENUE_SLUGS);

export function generateStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const c = CITY_BY_SLUG[city];
  if (!c) return {};
  const title = `Fishing Near ${c.name} — Dams, Venues & Spots`;
  const description = `Where to fish near ${c.name}, ${c.province}: the closest dams, rivers and fishing venues with species, GPS and live water levels. A free SA fishing guide from CastZone.`;
  return {
    title,
    description,
    alternates: { canonical: `/fishing-near/${city}` },
    openGraph: { title, description },
  };
}

export default async function FishingNearCityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const c = CITY_BY_SLUG[city];
  if (!c) notFound();

  const venues = await getAllVenues();
  const nearest = venues
    .filter((v) => VALID.has(v.slug))
    .map((v) => ({ ...v, km: distanceKm(c.lat, c.lng, v.lat, v.lng) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 10);

  const otherCities = CITIES.filter((x) => x.slug !== c.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Fishing venues near ${c.name}`,
    itemListElement: nearest.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: v.name,
      url: `https://castzone.co.za/venues/${v.slug}`,
    })),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="text-xs font-body text-storm mb-4 flex flex-wrap gap-1.5">
        <Link href="/" className="hover:text-cast-orange transition-colors">Home</Link>
        <span>/</span>
        <Link href="/venues" className="hover:text-cast-orange transition-colors">The Map</Link>
        <span>/</span>
        <span className="text-pale-water">Fishing near {c.name}</span>
      </nav>

      <h1 className="text-4xl sm:text-5xl font-heading font-bold text-bone-white uppercase leading-none mb-3">
        Fishing Near {c.name}
      </h1>
      <p className="text-pale-water font-body leading-relaxed mb-8 max-w-2xl">{c.blurb}</p>

      {nearest.length > 0 ? (
        <>
          <h2 className="text-2xl font-heading font-bold text-bone-white uppercase mb-4">
            Closest Fishing Venues to {c.name}
          </h2>
          <div className="grid grid-cols-1 gap-2 mb-10">
            {nearest.map((v) => (
              <Link
                key={v.slug}
                href={`/venues/${v.slug}`}
                className="group flex items-center justify-between gap-4 bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg px-4 py-3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-bone-white font-body text-sm group-hover:text-cast-orange transition-colors truncate">
                    {v.name}
                  </p>
                  <p className="text-storm text-xs mt-0.5 truncate">
                    {v.province}
                    {v.species?.length ? ` · ${v.species.slice(0, 3).join(", ")}` : ""}
                  </p>
                </div>
                <span className="text-pale-water text-sm font-heading font-bold whitespace-nowrap">
                  ~{v.km} km
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <p className="text-pale-water font-body mb-10">
          We&apos;re still mapping venues near {c.name} —{" "}
          <Link href="/venues" className="text-cast-orange hover:text-bone-white underline">browse the full map</Link>{" "}
          or{" "}
          <Link href="/venues/suggest" className="text-cast-orange hover:text-bone-white underline">suggest a venue</Link>.
        </p>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap gap-3 mb-12">
        <Link href="/venues" className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-6 py-3 rounded text-sm transition-colors">
          Explore the full map →
        </Link>
        <Link href="/conditions" className="border border-surface-teal hover:border-cast-orange text-pale-water hover:text-bone-white font-heading font-bold uppercase tracking-wider px-6 py-3 rounded text-sm transition-colors">
          Check dam levels
        </Link>
        <Link href="/register" className="border border-surface-teal hover:border-cast-orange text-pale-water hover:text-bone-white font-heading font-bold uppercase tracking-wider px-6 py-3 rounded text-sm transition-colors">
          Join free
        </Link>
      </div>

      {/* Other cities */}
      <div>
        <h2 className="text-2xl font-heading font-bold text-bone-white uppercase mb-4">Fishing Near Other Towns</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {otherCities.map((o) => (
            <Link
              key={o.slug}
              href={`/fishing-near/${o.slug}`}
              className="bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg px-4 py-3 text-bone-white hover:text-cast-orange font-body text-sm transition-colors"
            >
              {o.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
