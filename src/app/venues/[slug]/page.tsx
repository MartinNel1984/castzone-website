import type { Metadata } from "next";
import VenueContent from "./VenueContent";

// All seeded venue slugs — add new ones here when you add venues to the database
export const VENUE_SLUGS = [
  "vaal-dam", "rietvlei-dam", "hartbeespoort-dam", "bronkhorstspruit-dam", "roodeplaat-dam",
  "theewaterskloof-dam", "voelvlei-dam", "kalk-bay-harbour", "gansbaai-harbour", "wilderness-lagoon",
  "midmar-dam", "albert-falls-dam", "bluff-pier", "st-lucia-estuary", "chakas-rock",
  "nandoni-dam", "tzaneen-dam",
  "loskop-dam", "witbank-dam",
  "vaalkop-dam", "klipvoor-dam",
  "gariep-dam", "sterkfontein-dam",
  "nahoon-dam", "kowie-river",
  "vanderkloof-dam", "boegoeberg-dam",
  "vaal-river-parys", "vaal-barrage", "vaal-river-vereeniging",
  "clanwilliam-dam", "roodekopjes-dam", "ebenezer-dam", "inanda-dam", "brandvlei-dam",
  "wemmershoek-dam", "wolwedans-dam",
  "bloemhof-dam", "allemanskraal-dam", "erfenis-dam", "kalkfontein-dam", "koppies-dam",
  // KZN
  "pongolapoort-dam", "woodstock-dam", "spioenkop-dam", "goedertrouw-dam",
  "ntshingwayo-dam", "wagendrift-dam", "hazelmere-dam",
  // Limpopo
  "mokolo-dam", "flag-boshielo-dam", "albasini-dam", "nzhelele-dam",
  // Mpumalanga
  "kwena-dam", "heyshope-dam", "blyderivierpoort-dam",
  // North West
  "molatedi-dam", "taung-dam", "boskop-dam",
  // Eastern Cape
  "darlington-dam", "kouga-dam", "impofu-dam", "umtata-dam", "ncora-dam", "wriggleswade-dam",
  // Northern Cape
  "vaalharts-weir", "spitskop-dam",
  "dimalachite-river-lodge", // onboarded
];

function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = slugToName(slug);
  return {
    title: `${name} Fishing | Water Conditions & Venue Guide`,
    description: `Fishing at ${name} — live water conditions, best bite times, GPS coordinates, species guide, permit info, and tips from SA anglers on CastZone.`,
    alternates: { canonical: `/venues/${slug}` },
    openGraph: {
      title: `${name} Fishing Venue | CastZone`,
      description: `Everything you need to fish ${name}: conditions, species, GPS, and tips from South African anglers.`,
    },
  };
}

export function generateStaticParams() {
  return VENUE_SLUGS.map((slug) => ({ slug }));
}

export default function VenuePage() {
  return <VenueContent />;
}
