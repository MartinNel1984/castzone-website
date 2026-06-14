// Build-time venue fetch for static SEO pages (e.g. "fishing near {city}").
// Reads from Supabase with the public anon key (RLS allows SELECT). Memoised so
// the whole static export shares ONE fetch. Returns [] on failure so a build
// never breaks because of a transient network/DB blip.

export type BuildVenue = {
  name: string;
  slug: string;
  province: string;
  type: string;
  species: string[];
  lat: number;
  lng: number;
};

let cache: Promise<BuildVenue[]> | null = null;

export function getAllVenues(): Promise<BuildVenue[]> {
  if (cache) return cache;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cache = (async () => {
    if (!url || !key) return [];
    try {
      const res = await fetch(
        `${url}/rest/v1/venues?select=name,slug,province,type,species,lat,lng`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
      );
      if (!res.ok) return [];
      const rows = (await res.json()) as BuildVenue[];
      return rows.filter((v) => typeof v.lat === "number" && typeof v.lng === "number");
    } catch {
      return [];
    }
  })();
  return cache;
}
