"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type ThreadResult = {
  id: string;
  title: string;
  reply_count: number;
  last_post_at: string;
  created_at: string;
  profiles: { username: string } | null;
  categories: { slug: string; name: string; icon: string } | null;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";

  const [inputValue, setInputValue] = useState(initialQuery);
  const [results, setResults] = useState<ThreadResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setInputValue(q);
    if (q.trim().length >= 2) {
      runSearch(q.trim());
    } else {
      setResults([]);
      setSearched(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function runSearch(q: string) {
    setLoading(true);
    setSearched(false);
    const supabase = createClient();

    const threadSelect = "id, title, reply_count, last_post_at, created_at, profiles(username), categories(slug, name, icon)";

    // Search threads by title
    const { data: byTitle } = await supabase
      .from("threads")
      .select(threadSelect)
      .ilike("title", `%${q}%`)
      .order("last_post_at", { ascending: false })
      .limit(30);

    const titleIds = new Set((byTitle ?? []).map((t) => t.id));

    // Search posts by content → find their threads
    const { data: matchedPosts } = await supabase
      .from("posts")
      .select("thread_id")
      .ilike("content", `%${q}%`)
      .limit(100);

    const postThreadIds = [...new Set((matchedPosts ?? []).map((p) => p.thread_id))].filter(
      (id) => !titleIds.has(id)
    );

    let byContent: ThreadResult[] = [];
    if (postThreadIds.length > 0) {
      const { data } = await supabase
        .from("threads")
        .select(threadSelect)
        .in("id", postThreadIds)
        .order("last_post_at", { ascending: false })
        .limit(20);
      byContent = (data ?? []) as unknown as ThreadResult[];
    }

    setResults([...(byTitle as unknown as ThreadResult[] ?? []), ...byContent]);
    setSearched(true);
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputValue.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const currentQuery = searchParams.get("q") ?? "";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-storm mb-6">
        <Link href="/forum" className="hover:text-pale-water">Forum</Link>
        <span className="mx-2">›</span>
        <span className="text-pale-water">Search</span>
      </nav>

      <h1 className="text-4xl font-heading font-bold text-bone-white uppercase mb-6">Search</h1>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <input
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search threads and posts..."
          autoFocus
          className="flex-1 bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || loading}
          className="bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-heading font-bold uppercase tracking-wider px-6 py-3 rounded transition-colors flex-shrink-0"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-deep-water-light border border-surface-teal rounded-lg p-4 animate-pulse h-16" />
          ))}
        </div>
      )}

      {!loading && searched && (
        <>
          <p className="text-storm text-sm font-body mb-4">
            {results.length === 0
              ? `No results for "${currentQuery}"`
              : `${results.length} result${results.length === 1 ? "" : "s"} for "${currentQuery}"`}
          </p>

          {results.length > 0 && (
            <div className="divide-y divide-surface-teal/50 bg-deep-water-light border border-surface-teal rounded-lg overflow-hidden">
              {results.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/forum/thread?id=${thread.id}`}
                  className="group flex items-center gap-4 p-4 hover:bg-deep-water transition-colors"
                >
                  <span className="flex-shrink-0 text-lg w-7 text-center">
                    {thread.categories?.icon ?? "🎣"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-bone-white font-body font-medium group-hover:text-cast-orange transition-colors truncate">
                      {thread.title}
                    </p>
                    <p className="text-storm text-xs mt-0.5">
                      {thread.categories?.name ?? "General"}
                      {" · by "}
                      <span className="text-pale-water">{thread.profiles?.username ?? "Unknown"}</span>
                      {" · "}{timeAgo(thread.created_at)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-pale-water text-xs">{thread.reply_count} replies</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {results.length === 0 && (
            <div className="bg-deep-water-light border border-surface-teal rounded-lg p-12 text-center">
              <p className="text-pale-water font-heading font-bold uppercase text-lg mb-2">No results found</p>
              <p className="text-storm font-body text-sm mb-6">Try a different search — species, dam name, technique or brand.</p>
              <Link href="/forum" className="text-cast-orange hover:underline font-body text-sm">
                Browse the forum instead →
              </Link>
            </div>
          )}
        </>
      )}

      {!loading && !searched && !currentQuery && (
        <div className="text-center py-12">
          <p className="text-storm font-body text-sm">Search for a species, dam, technique or topic.</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-storm">Loading...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
