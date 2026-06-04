"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  member_level: string;
  post_count: number;
  created_at: string;
};

type Thread = {
  id: string;
  title: string;
  reply_count: number;
  view_count: number;
  created_at: string;
  categories: { slug: string; name: string; icon: string } | null;
};

const LEVEL_COLOURS: Record<string, string> = {
  "Licenced": "text-cast-orange border-cast-orange",
  "Regular":  "text-green-400 border-green-600",
  "First Cast": "text-storm border-surface-teal",
};

function joinedDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

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

function ProfileContent() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) { setNotFound(true); setLoading(false); return; }
    const supabase = createClient();

    async function load() {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, member_level, post_count, created_at")
        .eq("username", username)
        .single();

      if (!profileData) { setNotFound(true); setLoading(false); return; }
      setProfile(profileData as Profile);

      const { data: threadData } = await supabase
        .from("threads")
        .select("id, title, reply_count, view_count, created_at, categories(slug, name, icon)")
        .eq("author_id", profileData.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (threadData) setThreads(threadData as unknown as Thread[]);
      setLoading(false);
    }

    load();
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-storm">Loading...</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-pale-water text-xl font-heading font-bold uppercase mb-3">Member not found</p>
        <p className="text-storm font-body text-sm mb-6">That username doesn&apos;t exist on CastZone.</p>
        <Link href="/forum" className="text-cast-orange hover:underline font-body text-sm">← Back to Forum</Link>
      </div>
    );
  }

  const levelClass = LEVEL_COLOURS[profile.member_level] ?? LEVEL_COLOURS["First Cast"];
  const initial = profile.username[0]?.toUpperCase() ?? "?";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-storm mb-8">
        <Link href="/forum" className="hover:text-pale-water">Forum</Link>
        <span className="mx-2">›</span>
        <span className="text-pale-water">{profile.username}</span>
      </nav>

      {/* Profile header */}
      <div className="bg-deep-water-light border border-surface-teal rounded-lg p-6 sm:p-8 flex items-center gap-6 mb-8">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-surface-teal flex items-center justify-center text-bone-white font-heading font-bold text-3xl flex-shrink-0">
          {initial}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <h1 className="text-3xl font-heading font-bold text-bone-white uppercase leading-tight">
            {profile.username}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className={`text-xs font-heading font-bold uppercase tracking-wider border rounded px-2 py-0.5 ${levelClass}`}>
              {profile.member_level}
            </span>
            <span className="text-storm text-sm font-body">
              {profile.post_count} {profile.post_count === 1 ? "post" : "posts"}
            </span>
            <span className="text-storm text-sm font-body">
              Joined {joinedDate(profile.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Threads */}
      <h2 className="text-xl font-heading font-bold text-bone-white uppercase mb-4">
        Threads by {profile.username}
      </h2>

      {threads.length === 0 ? (
        <div className="bg-deep-water-light border border-surface-teal rounded-lg p-10 text-center">
          <p className="text-storm font-body text-sm">No threads started yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-teal/50 bg-deep-water-light border border-surface-teal rounded-lg overflow-hidden">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/forum/thread?id=${thread.id}`}
              className="group flex items-center gap-4 p-4 hover:bg-deep-water transition-colors"
            >
              {/* Category icon */}
              <span className="flex-shrink-0 text-lg w-7 text-center">
                {thread.categories?.icon ?? "🎣"}
              </span>

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-bone-white font-body font-medium group-hover:text-cast-orange transition-colors truncate">
                  {thread.title}
                </p>
                <p className="text-storm text-xs mt-0.5">
                  {thread.categories?.name ?? "General"} · {timeAgo(thread.created_at)}
                </p>
              </div>

              {/* Replies */}
              <div className="flex-shrink-0 text-right">
                <span className="text-pale-water text-xs">{thread.reply_count} replies</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-storm">Loading profile...</p>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
