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
];

export function generateStaticParams() {
  return VENUE_SLUGS.map((slug) => ({ slug }));
}

export default function VenuePage() {
  return <VenueContent />;
}
