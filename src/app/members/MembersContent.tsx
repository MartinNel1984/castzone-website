"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Member = {
  id: string;
  username: string;
  avatar_url: string | null;
  member_level: string;
  post_count: number;
  created_at: string;
};

type SortBy = "post_count" | "created_at";

export default function MembersContent() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("post_count");
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, member_level, post_count, created_at")
        .eq("is_seed", false)
        .order(sortBy, { ascending: false })
        .limit(200);
      setMembers((data as unknown as Member[]) ?? []);
      setLoading(false);
    }
    load();
  }, [sortBy]);

  const q = query.trim().toLowerCase();
  const visible = members.filter((m) => !q || m.username.toLowerCase().includes(q));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-5xl font-heading font-semibold text-bone-white ">Members</h1>
        <p className="text-cast-orange font-heading font-semibold text-sm mt-1">
          The CastZone Community
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members…"
          className="flex-1 min-w-48 bg-deep-water border border-surface-teal rounded px-4 py-2.5 text-bone-white placeholder-storm font-body text-sm focus:outline-none focus:border-cast-orange transition-colors"
        />
        <div className="flex gap-2">
          {(["post_count", "created_at"] as SortBy[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`font-mono font-semibold uppercase tracking-wider text-xs px-4 py-2.5 rounded border transition-colors ${
                sortBy === s
                  ? "bg-cast-orange border-cast-orange text-white"
                  : "border-surface-teal text-storm hover:border-pale-water/50 hover:text-pale-water"
              }`}
            >
              {s === "post_count" ? "Most Active" : "Newest"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-deep-water-light border border-surface-teal rounded-lg p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-pale-water font-mono font-semibold uppercase text-lg mb-2">No members found</p>
          <p className="text-storm font-body text-sm">Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {visible.map((m) => (
            <Link
              key={m.id}
              href={`/profile?username=${encodeURIComponent(m.username)}`}
              className="group bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg p-4 transition-colors flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-surface-teal overflow-hidden flex items-center justify-center text-bone-white font-heading font-bold text-sm flex-shrink-0">
                {m.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.avatar_url} alt={m.username} className="w-full h-full object-cover" />
                ) : (
                  m.username[0]?.toUpperCase() ?? "?"
                )}
              </div>
              <div className="min-w-0">
                <p className="text-bone-white font-body font-semibold text-sm truncate group-hover:text-cast-orange transition-colors">
                  {m.username}
                </p>
                <p className="text-storm text-xs truncate">{m.member_level}</p>
                <p className="text-pale-water text-xs">{m.post_count} posts</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="text-storm text-xs text-center mt-8 font-body">
        {visible.length} member{visible.length !== 1 ? "s" : ""}{query ? " matching your search" : ""}
      </p>
    </div>
  );
}