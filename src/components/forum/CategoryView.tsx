"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Thread = {
  id: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  last_post_at: string;
  created_at: string;
  profiles: { username: string } | null;
};

type Category = {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CategoryView({ category }: { category: string }) {
  const [cat, setCat] = useState<Category | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", category)
        .single();

      if (!catData) { setLoading(false); return; }
      setCat(catData);

      const { data: threadData } = await supabase
        .from("threads")
        .select("id, title, is_pinned, is_locked, view_count, reply_count, last_post_at, created_at, profiles(username)")
        .eq("category_id", catData.id)
        .order("is_pinned", { ascending: false })
        .order("last_post_at", { ascending: false })
        .limit(50);

      if (threadData) setThreads(threadData as unknown as Thread[]);
      setLoading(false);
    }

    load();
  }, [category]);

  if (!loading && !cat) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-storm text-lg">Category not found.</p>
        <Link href="/forum" className="text-cast-orange mt-4 inline-block">← Back to Forum</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-storm mb-6">
        <Link href="/forum" className="hover:text-pale-water transition-colors">Forum</Link>
        <span className="mx-2">›</span>
        <span className="text-pale-water">{cat?.name ?? category}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-heading font-bold text-bone-white uppercase">
            {cat?.icon} {cat?.name}
          </h1>
          <p className="text-storm font-body mt-1 text-sm">{cat?.description}</p>
        </div>
        <Link
          href={`/forum/new?category=${category}`}
          className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-5 py-3 rounded transition-colors text-sm flex-shrink-0 ml-4"
        >
          + New Thread
        </Link>
      </div>

      {/* Thread list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-deep-water-light border border-surface-teal rounded-lg p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="bg-deep-water-light border border-surface-teal rounded-lg p-12 text-center">
          <p className="text-pale-water text-lg font-heading font-bold uppercase mb-2">No threads yet</p>
          <p className="text-storm font-body text-sm mb-6">Be the first to start a cast.</p>
          <Link
            href={`/forum/new?category=${category}`}
            className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-6 py-3 rounded transition-colors"
          >
            Start the first thread
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-surface-teal bg-deep-water-light border border-surface-teal rounded-lg overflow-hidden">
          {threads.map((thread, index) => (
            <Link
              key={thread.id}
              href={`/forum/thread?id=${thread.id}`}
              className="group flex items-center gap-4 p-4 hover:bg-deep-water transition-colors"
            >
              <div className="flex-shrink-0 w-8 text-center">
                {thread.is_pinned && <span title="Pinned" className="text-tournament-gold text-lg">📌</span>}
                {!thread.is_pinned && thread.is_locked && <span title="Locked" className="text-storm text-lg">🔒</span>}
                {!thread.is_pinned && !thread.is_locked && (
                  <span className="text-storm text-sm font-body">{index + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-bone-white font-body font-medium group-hover:text-cast-orange transition-colors truncate">
                  {thread.title}
                </p>
                <p className="text-storm text-xs mt-0.5">
                  by <span className="text-pale-water">{thread.profiles?.username ?? "Unknown"}</span>
                  {" · "}{timeAgo(thread.created_at)}
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
                <span className="text-pale-water text-xs">{thread.reply_count} replies</span>
                <span className="text-storm text-xs">last {timeAgo(thread.last_post_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
