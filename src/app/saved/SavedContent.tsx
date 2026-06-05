"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type SavedItem = {
  thread_id: string;
  created_at: string;
  threads: {
    id: string;
    title: string;
    reply_count: number;
    last_post_at: string;
    categories: { slug: string; name: string; icon: string } | null;
    profiles: { username: string } | null;
  } | null;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export default function SavedContent() {
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoggedIn(false); setLoading(false); return; }

      const { data } = await supabase
        .from("bookmarks")
        .select("thread_id, created_at, threads(id, title, reply_count, last_post_at, categories(slug, name, icon), profiles(username))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      setSaved((data as unknown as SavedItem[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleRemove(threadId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("thread_id", threadId);
    setSaved((prev) => prev.filter((s) => s.thread_id !== threadId));
  }

  if (!loggedIn) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-pale-water font-body text-lg mb-6">Sign in to see your saved threads.</p>
        <div className="flex justify-center gap-3">
          <Link href="/login" className="border border-surface-teal text-pale-water hover:text-bone-white font-heading font-bold uppercase px-6 py-3 rounded transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase px-6 py-3 rounded transition-colors">
            Join Free
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-bold text-bone-white uppercase">Saved Threads</h1>
          <p className="text-storm font-body text-sm mt-1">Threads you&apos;ve bookmarked</p>
        </div>
        <Link href="/forum" className="text-cast-orange hover:text-bone-white text-sm font-body transition-colors">
          Forum →
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-deep-water-light border border-surface-teal rounded-lg p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : saved.length === 0 ? (
        <div className="bg-deep-water-light border border-surface-teal rounded-lg p-12 text-center">
          <p className="text-pale-water font-heading font-bold uppercase text-lg mb-2">No saved threads yet</p>
          <p className="text-storm font-body text-sm mb-6">
            Tap the ☆ on any thread to save it here for later.
          </p>
          <Link href="/forum" className="text-cast-orange hover:underline font-body text-sm">
            Browse the forum →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-surface-teal/50 bg-deep-water-light border border-surface-teal rounded-lg overflow-hidden">
          {saved.map((item) => {
            const t = item.threads;
            if (!t) return null;
            return (
              <div key={item.thread_id} className="group flex items-center gap-4 p-4 hover:bg-deep-water transition-colors">
                <span className="flex-shrink-0 text-lg w-7 text-center">
                  {t.categories?.icon ?? "🎣"}
                </span>
                <Link href={`/forum/thread?id=${t.id}`} className="flex-1 min-w-0">
                  <p className="text-bone-white font-body font-medium group-hover:text-cast-orange transition-colors truncate">
                    {t.title}
                  </p>
                  <p className="text-storm text-xs mt-0.5">
                    {t.categories?.name ?? "General"}
                    {" · by "}
                    <span className="text-pale-water">{t.profiles?.username ?? "Angler"}</span>
                    {" · "}{timeAgo(t.last_post_at)}
                    {" · "}{t.reply_count} replies
                  </p>
                </Link>
                <button
                  onClick={() => handleRemove(item.thread_id)}
                  title="Remove bookmark"
                  className="flex-shrink-0 text-storm hover:text-red-400 text-lg leading-none transition-colors"
                >
                  ★
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
