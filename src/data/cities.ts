// Major SA towns/cities for "fishing near {city}" SEO pages.
// Each links anglers to the nearest CastZone venues (computed at build time).

export type City = {
  name: string;
  slug: string;
  province: string;
  lat: number;
  lng: number;
  blurb: string;
};

export const CITIES: City[] = [
  { name: "Johannesburg", slug: "johannesburg", province: "Gauteng", lat: -26.2041, lng: 28.0473,
    blurb: "Joburg anglers are spoilt for bass and carp water within an easy drive — from the Vaal system to the dams ringing the city." },
  { name: "Pretoria", slug: "pretoria", province: "Gauteng", lat: -25.7479, lng: 28.2293,
    blurb: "Pretoria sits within reach of some of Gauteng's best carp and bass dams, plus trout water in the escarpment to the east." },
  { name: "Cape Town", slug: "cape-town", province: "Western Cape", lat: -33.9249, lng: 18.4241,
    blurb: "From stillwater trout in the Cape fold mountains to bass dams and deep-sea charters off the peninsula, there's water for every Cape angler." },
  { name: "Durban", slug: "durban", province: "KwaZulu-Natal", lat: -29.8587, lng: 31.0218,
    blurb: "Durban anglers have it all — ski-boat and deep-sea charters off the coast, plus bass and carp dams inland toward the Midlands." },
  { name: "Bloemfontein", slug: "bloemfontein", province: "Free State", lat: -29.0852, lng: 26.1596,
    blurb: "The Free State around Bloemfontein holds big-water carp and yellowfish dams, with the Gariep and Vaal systems within striking distance." },
  { name: "Gqeberha (Port Elizabeth)", slug: "gqeberha-port-elizabeth", province: "Eastern Cape", lat: -33.9608, lng: 25.6022,
    blurb: "Gqeberha anglers can chase bass and carp in the surrounding dams or head out for saltwater on the Algoa Bay charters." },
  { name: "East London", slug: "east-london", province: "Eastern Cape", lat: -33.0153, lng: 27.9116,
    blurb: "East London is a gateway to Eastern Cape river and dam fishing as well as the productive saltwater of the Wild Coast." },
  { name: "Polokwane", slug: "polokwane", province: "Limpopo", lat: -23.8962, lng: 29.4486,
    blurb: "Limpopo's bushveld dams around Polokwane offer warm-water carp, bass and tilapia in some genuinely wild settings." },
  { name: "Mbombela (Nelspruit)", slug: "mbombela-nelspruit", province: "Mpumalanga", lat: -25.4753, lng: 30.9694,
    blurb: "From the Lowveld dams to the cool trout water of the Mpumalanga escarpment, Mbombela anglers have huge variety on the doorstep." },
  { name: "Kimberley", slug: "kimberley", province: "Northern Cape", lat: -28.7282, lng: 24.7499,
    blurb: "The Vaal and Orange (Gariep) river systems near Kimberley are yellowfish and carp country, with big open water for the committed angler." },
  { name: "Rustenburg", slug: "rustenburg", province: "North West", lat: -25.6672, lng: 27.2424,
    blurb: "North West dams around Rustenburg are well-known carp and bass venues, several within an hour of town." },
  { name: "Vereeniging", slug: "vereeniging", province: "Gauteng", lat: -26.6736, lng: 27.9319,
    blurb: "On the banks of the Vaal, Vereeniging is prime carp, barbel and yellowfish territory with river and dam options both close by." },
];

export const CITY_SLUGS = CITIES.map((c) => c.slug);
export const CITY_BY_SLUG: Record<string, City> = Object.fromEntries(CITIES.map((c) => [c.slug, c]));

// Haversine distance in km
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}
