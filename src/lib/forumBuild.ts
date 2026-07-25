// Build-time thread fetch for static SEO pages (/forum/thread/[id]). Reads
// from Supabase with the public anon key (RLS allows SELECT). Memoised so
// the whole static export shares ONE fetch. Returns [] on failure so a build
// never breaks because of a transient network/DB blip.
//
// New threads posted after a build won't have a static page here until the
// next rebuild — they stay reachable via the client-rendered /forum/thread?id=
// route in the meantime, so nothing breaks for fresh content.

export type BuildThread = {
  id: string;
  title: string;
  category: { slug: string; name: string } | null;
};

let cache: Promise<BuildThread[]> | null = null;

export function getAllThreads(): Promise<BuildThread[]> {
  if (cache) return cache;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cache = (async () => {
    if (!url || !key) return [];
    try {
      const res = await fetch(
        `${url}/rest/v1/threads?select=id,title,categories(slug,name)`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "force-cache" },
      );
      if (!res.ok) return [];
      const rows = (await res.json()) as Array<{ id: string; title: string; categories: { slug: string; name: string } | null }>;
      return rows.map((r) => ({ id: r.id, title: r.title, category: r.categories }));
    } catch {
      return [];
    }
  })();
  return cache;
}
