import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ALL_DAMS,
  DAM_BY_SLUG,
  DAM_SLUGS,
  DATA_UPDATED,
  damSlug,
} from "@/data/waterConditions";

export const dynamic = "force-static";

function levelLabel(pct: number): { label: string; tone: string } {
  if (pct >= 100) return { label: "Full", tone: "text-teal-300" };
  if (pct >= 75) return { label: "High", tone: "text-green-400" };
  if (pct >= 50) return { label: "Moderate", tone: "text-amber-300" };
  if (pct >= 25) return { label: "Low", tone: "text-orange-400" };
  return { label: "Critically low", tone: "text-red-400" };
}

function trendWord(now: number, then: number): "risen" | "dropped" | "held steady" {
  const d = +(now - then).toFixed(1);
  if (d > 0.2) return "risen";
  if (d < -0.2) return "dropped";
  return "held steady";
}

export function generateStaticParams() {
  return DAM_SLUGS.map((dam) => ({ dam }));
}

export async function generateMetadata({ params }: { params: Promise<{ dam: string }> }): Promise<Metadata> {
  const { dam } = await params;
  const d = DAM_BY_SLUG[dam];
  if (!d) return {};
  const title = `${d.name} Water Level — ${d.pct.toFixed(1)}% Full`;
  const description = `${d.name} on the ${d.river} (${d.province}) is currently ${d.pct.toFixed(1)}% full — ${trendWord(d.pct, d.lastWeek)} from last week and ${d.pct >= d.lastYear ? "up on" : "down on"} ${d.lastYear.toFixed(1)}% a year ago. Live SA dam levels for anglers, sourced from DWS.`;
  return {
    title,
    description,
    alternates: { canonical: `/conditions/${dam}` },
    openGraph: { title: `${d.name} Water Level — ${d.pct.toFixed(1)}% Full`, description },
  };
}

export default async function DamConditionPage({ params }: { params: Promise<{ dam: string }> }) {
  const { dam } = await params;
  const d = DAM_BY_SLUG[dam];
  if (!d) notFound();

  const { label, tone } = levelLabel(d.pct);
  const weekTrend = trendWord(d.pct, d.lastWeek);
  const yearTrend = trendWord(d.pct, d.lastYear);
  const isVaalSystem = /vaal|bloemhof/i.test(d.name) || /vaal/i.test(d.river);

  // Nearby dams in the same province (for internal linking + SEO)
  const nearby = ALL_DAMS.filter((x) => x.province === d.province && x.name !== d.name).slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${d.name}`,
    description: `${d.name} water level and fishing conditions on the ${d.river}, ${d.province}.`,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Storage level", value: `${d.pct.toFixed(1)}%` },
      { "@type": "PropertyValue", name: "Full storage capacity", value: `${d.fsc} million m³` },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="text-xs font-body text-storm mb-4 flex flex-wrap gap-1.5">
        <Link href="/conditions" className="hover:text-cast-orange transition-colors">Water Conditions</Link>
        <span>/</span>
        <Link href={`/conditions?province=${encodeURIComponent(d.province)}`} className="hover:text-cast-orange transition-colors">{d.province}</Link>
        <span>/</span>
        <span className="text-pale-water">{d.name}</span>
      </nav>

      <h1 className="text-4xl sm:text-5xl font-heading font-semibold text-bone-white leading-none mb-2">
        {d.name} Water Level
      </h1>
      <p className="text-storm font-body mb-8">
        {d.river} · {d.province} · updated {DATA_UPDATED} from DWS Hydrological Services
      </p>

      {/* Headline level */}
      <div className="bg-deep-water-light border border-surface-teal rounded-lg p-6 mb-6">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="text-cast-orange font-heading font-bold text-6xl leading-none">{d.pct.toFixed(1)}%</p>
          <p className={`font-mono font-semibold uppercase text-xl ${tone}`}>{label}</p>
        </div>
        {/* Fill bar */}
        <div className="mt-5 h-3 w-full bg-deep-water rounded-full overflow-hidden">
          <div className="h-full bg-cast-orange rounded-full" style={{ width: `${Math.min(d.pct, 100)}%` }} />
        </div>
        <p className="text-pale-water font-body mt-5 leading-relaxed">
          {d.name} is currently <strong className="text-bone-white">{d.pct.toFixed(1)}% full</strong>. Compared to last
          week it has <strong className="text-bone-white">{weekTrend}</strong> (was {d.lastWeek.toFixed(1)}%), and
          year-on-year it has <strong className="text-bone-white">{yearTrend}</strong> (was {d.lastYear.toFixed(1)}% this
          time last year). Full storage capacity is {d.fsc.toLocaleString()} million m³.
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "This week", value: `${d.pct.toFixed(1)}%` },
          { label: "Last week", value: `${d.lastWeek.toFixed(1)}%` },
          { label: "A year ago", value: `${d.lastYear.toFixed(1)}%` },
          { label: "Capacity", value: `${d.fsc.toLocaleString()} Mm³` },
        ].map((s) => (
          <div key={s.label} className="bg-deep-water-light border border-surface-teal rounded-lg p-4 text-center">
            <p className="text-cast-orange font-heading font-bold text-xl">{s.value}</p>
            <p className="text-storm text-xs uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Vaal safety callout */}
      {isVaalSystem && (
        <div className="border border-amber-600/50 bg-amber-900/10 rounded-lg p-4 mb-8">
          <p className="text-amber-300 font-body text-sm">
            ⚠️ {d.name} is part of the Vaal system. Always check the latest{" "}
            <Link href="/conditions" className="text-cast-orange hover:text-bone-white underline">gate-release notices</Link>{" "}
            before fishing the banks — releases raise river levels downstream within 24–72 hours.
          </p>
        </div>
      )}

      {/* CTAs / cross-links */}
      <div className="flex flex-wrap gap-3 mb-10">
        {d.venueSlug && (
          <Link href={`/venues/${d.venueSlug}`} className="bg-cast-orange hover:bg-cast-orange-hover text-white font-mono font-semibold uppercase tracking-wider px-6 py-3 rounded text-sm transition-colors">
            Fish {d.name} — venue guide →
          </Link>
        )}
        <Link href="/conditions" className="border border-surface-teal hover:border-cast-orange text-pale-water hover:text-bone-white font-heading font-semibold px-6 py-3 rounded text-sm transition-colors">
          All SA dam levels
        </Link>
        <Link href="/register" className="border border-surface-teal hover:border-cast-orange text-pale-water hover:text-bone-white font-heading font-semibold px-6 py-3 rounded text-sm transition-colors">
          Join free for venue updates
        </Link>
      </div>

      {/* Nearby dams */}
      {nearby.length > 0 && (
        <div>
          <h2 className="text-2xl font-heading font-semibold text-bone-white mb-4">More {d.province} Dam Levels</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {nearby.map((n) => (
              <Link
                key={n.name}
                href={`/conditions/${damSlug(n.name)}`}
                className="group flex items-center justify-between bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg px-4 py-3 transition-colors"
              >
                <span className="text-bone-white font-body text-sm group-hover:text-cast-orange transition-colors">{n.name}</span>
                <span className="text-pale-water text-sm font-heading font-bold">{n.pct.toFixed(1)}%</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
