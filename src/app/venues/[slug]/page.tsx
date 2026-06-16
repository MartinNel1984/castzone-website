import type { Metadata } from "next";
import VenueContent from "./VenueContent";
import { getAllVenues } from "@/lib/venuesBuild";

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
  // Public dams bulk-added 2026-06-14
  "berg-river-dam", "stompdrift-dam", "floriskraal-dam", "gamkapoort-dam", "eikenhof-dam", "steenbras-upper-dam", "steenbras-lower-dam", "garden-route-dam", "elandskloof-dam", "lakenvallei-dam", "keerom-dam", "de-bos-dam", "misverstand-dam", "buffeljags-dam", "bellair-dam", "oukloof-dam", "calitzdorp-dam", "bulshoek-dam", "stettynskloof-dam", "ceres-dam", "poortjieskloof-dam", "prinsrivier-dam", "klipberg-dam", "gamka-dam", "pietersfontein-dam", "tierkloof-dam", "knellpoort-dam", "rustfontein-dam", "krugersdrift-dam", "tierpoort-dam", "saulspoort-dam", "fika-patso-dam", "armenia-dam", "egmont-dam", "welbedacht-dam", "bon-accord-dam", "bivane-dam", "craigie-burn-dam", "driel-barrage-dam", "hluhluwe-dam", "klipfontein-dam", "nagle-dam", "spring-grove-dam", "zaaihoek-dam", "dap-naude-dam", "de-hoop-dam", "doorndraai-dam", "glen-alpine-dam", "klaserie-dam", "luphephe-dam", "magoebaskloof-dam", "middel-letaba-dam", "rust-de-winter-dam", "vergelegen-dam", "vondo-dam", "da-gama-dam", "driekoppies-dam", "grootdraai-dam", "jericho-dam", "longmere-dam", "middelburg-dam", "morgenstond-dam", "nooitgedacht-dam", "ohrigstad-dam", "primkop-dam", "vygeboom-dam", "westoe-dam", "witklip-dam", "bospoort-dam", "buffelspoort-dam", "disaneng-dam", "elandskuil-dam", "klein-maricopoort-dam", "kromellenboog-dam", "marico-bosveld-dam", "middelkraal-dam", "ngotwane-dam", "olifantsnek-dam", "pella-dam", "potchefstroom-dam", "rietspruit-dam", "sehujwane-dam", "swartruggens-dam", "belfort-dam", "binfield-dam", "bridle-drift-dam", "cata-dam", "corana-dam", "de-mistkraal-dam", "debe-dam", "elandsdrift-dam", "glen-melville-dam", "grassridge-dam", "groendal-dam", "gubu-dam", "katrivier-dam", "laing-dam", "lake-arthur-dam", "loerie-dam", "lubisi-dam", "macubeni-dam", "mnyameni-dam", "nqadu-dam", "nqweba-dam", "ntenetyana-dam", "oxkraal-dam", "rooikrans-dam", "tsojana-dam", "waterdown-dam", "xonxa-dam", "karee-dam",
  // Dams + Vaal River stretches 2026-06-14
  "kwaggaskloof-dam", "kammanassie-dam", "duiwenhoks-dam", "haarlem-dam", "klipheuwel-dam", "ernest-robertson-dam", "groothoek-dam", "klipdrift-dam", "mearns-dam", "hans-merensky-dam", "modjadji-dam", "mutshedzi-dam", "nsami-dam", "nwanedzi-dam", "thabina-dam", "tonteldoos-dam", "tours-dam", "warmbad-dam", "buffelskloof-dam", "klerkskraal-dam", "madikwe-dam", "setumo-dam", "kromrivier-dam", "mabeleni-dam", "sandile-dam", "douglas-weir-dam", "vaal-river-vanderbijlpark", "vaal-river-deneysville", "vaal-river-standerton", "vaal-river-villiers", "vaal-river-klerksdorp", "vaal-river-orkney", "vaal-river-bothaville", "vaal-river-christiana", "vaal-river-warrenton", "vaal-river-douglas", "vaal-river-vredefort",
  // River systems 2026-06-14
  "orange-river-upington", "orange-river-keimoes", "orange-river-kakamas", "orange-river-augrabies", "orange-river-groblershoop", "orange-river-prieska", "orange-river-hopetown", "orange-river-aliwal-north", "orange-river-bethulie", "orange-river-onseepkans", "crocodile-river-brits", "crocodile-river-thabazimbi", "olifants-river-phalaborwa", "olifants-river-hoedspruit", "olifants-river-clanwilliam", "olifants-river-citrusdal", "olifants-river-lutzville", "breede-river-robertson", "breede-river-swellendam", "breede-river-bonnievale", "breede-river-malgas", "breede-river-estuary-witsand", "tugela-river-colenso", "tugela-river-weenen", "tugela-river-tugela-ferry", "tugela-river-mouth-mandini", "limpopo-river-musina", "limpopo-river-pont-drift", "crocodile-river-malelane", "komati-river-komatipoort", "berg-river-paarl", "berg-river-wellington", "caledon-river-smithfield", "sundays-river-kirkwood", "great-fish-river-cradock",
  // Coastal & estuary 2026-06-14
  "struisbaai", "cape-point", "gordon-s-bay", "hermanus-shore", "mossel-bay-shore", "stilbaai", "cape-agulhas", "arniston", "yzerfontein", "langebaan-lagoon", "lambert-s-bay", "strandfontein", "knysna-lagoon", "plettenberg-bay", "sedgefield", "storms-river-mouth", "jeffreys-bay", "cape-st-francis", "kenton-on-sea", "port-alfred-shore", "kei-mouth", "mazeppa-bay", "coffee-bay", "port-st-johns", "hamburg", "port-edward",
  // Final coastal + rivers 2026-06-15
  "mooi-river-mooi-river", "wilge-river-frankfort", "sabie-river-sabie", "margate", "ballito", "umhlanga-rocks", "scottburgh", "richards-bay-shore", "sodwana-bay", "pongola-river-pongola", "buffalo-river-king-william-s-town", "mkomazi-river-hella-hella",
  // Partner venue — Wild Trout Association 2026-06-15
  "wild-trout-rivers-rhodes",
  // Partner venue — Flamingo Bay Resort 2026-06-15
  "flamingo-bay-resort",
  // Partner venues — venue outreach replies 2026-06-15
  "two-dam-sustainable", "angler-antelope-guesthouse",
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

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Server-rendered TouristAttraction structured data so search engines see it
  // on the first fetch (no JS needed). Venue data comes from the build-time
  // Supabase fetch; if unavailable, we simply omit the schema (graceful).
  const venue = (await getAllVenues()).find((v) => v.slug === slug);
  const jsonLd = venue
    ? {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        name: venue.name,
        description: `Fishing at ${venue.name} in ${venue.province}, South Africa. Species include ${(venue.species || []).slice(0, 4).join(", ")}.`,
        geo: { "@type": "GeoCoordinates", latitude: venue.lat, longitude: venue.lng },
        address: { "@type": "PostalAddress", addressCountry: "ZA", addressRegion: venue.province },
        url: `https://castzone.co.za/venues/${venue.slug}`,
        touristType: "Angler",
        amenityFeature: (venue.facilities || []).map((f) => ({
          "@type": "LocationFeatureSpecification",
          name: f,
          value: true,
        })),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <VenueContent />
    </>
  );
}
