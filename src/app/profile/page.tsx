"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
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
  "Licenced":   "text-cast-orange border-cast-orange",
  "Regular":    "text-green-400 border-green-600",
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

  const [profile, setProfile]     = useState<Profile | null>(null);
  const [threads, setThreads]     = useState<Thread[]>([]);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [isOwn, setIsOwn]         = useState(false);

  // Edit state
  const [editing, setEditing]     = useState(false);
  const [bioInput, setBioInput]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!username) { setNotFound(true); setLoading(false); return; }
    const supabase = createClient();

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user ?? null;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, member_level, post_count, created_at")
        .eq("username", username)
        .single();

      if (!profileData) { setNotFound(true); setLoading(false); return; }
      setProfile(profileData as Profile);
      setBioInput((profileData as Profile).bio ?? "");

      // Three-way ownership check
      const ownById   = currentUser?.id === profileData.id;
      const ownByMeta = currentUser?.user_metadata?.username?.toLowerCase() === profileData.username?.toLowerCase();
      const ownByUrl  = currentUser?.user_metadata?.username?.toLowerCase() === username?.toLowerCase();
      if (currentUser && (ownById || ownByMeta || ownByUrl)) setIsOwn(true);

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

  async function handleSaveBio() {
    if (!profile) return;
    setSaving(true);
    setSaveError("");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ bio: bioInput.trim() || null })
      .eq("id", profile.id);

    if (error) {
      setSaveError("Could not save. Please try again.");
      setSaving(false);
    } else {
      setProfile((p) => p ? { ...p, bio: bioInput.trim() || null } : p);
      setEditing(false);
      setSaving(false);
    }
  }

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
  const initial    = profile.username[0]?.toUpperCase() ?? "?";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-storm mb-8">
        <Link href="/forum" className="hover:text-pale-water">Forum</Link>
        <span className="mx-2">›</span>
        <span className="text-pale-water">{profile.username}</span>
      </nav>

      {/* Profile header */}
      <div className="bg-deep-water-light border border-surface-teal rounded-lg p-6 sm:p-8 mb-8">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-surface-teal flex items-center justify-center text-bone-white font-heading font-bold text-3xl flex-shrink-0">
            {initial}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-3xl font-heading font-bold text-bone-white uppercase leading-tight">
                {profile.username}
              </h1>
              {isOwn && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex-shrink-0 text-storm hover:text-pale-water text-xs font-body border border-surface-teal hover:border-pale-water/50 rounded px-3 py-1.5 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
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

        {/* Bio */}
        {editing ? (
          <div className="mt-5">
            <textarea
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Tell the community about yourself — species you chase, favourite waters, techniques..."
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body text-sm focus:outline-none focus:border-cast-orange transition-colors resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <div>
                {saveError && <p className="text-red-400 text-xs font-body">{saveError}</p>}
                <p className="text-storm text-xs font-body">{bioInput.length}/200</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditing(false); setBioInput(profile.bio ?? ""); setSaveError(""); }}
                  disabled={saving}
                  className="text-storm hover:text-pale-water text-sm font-body transition-colors px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBio}
                  disabled={saving}
                  className="bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-heading font-bold uppercase tracking-wider text-xs px-4 py-1.5 rounded transition-colors"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : profile.bio ? (
          <p className="mt-4 text-pale-water font-body text-sm leading-relaxed border-t border-surface-teal/40 pt-4">
            {profile.bio}
          </p>
        ) : isOwn ? (
          <p className="mt-4 text-storm font-body text-sm italic border-t border-surface-teal/40 pt-4">
            No bio yet.{" "}
            <button onClick={() => setEditing(true)} className="text-cast-orange hover:underline not-italic">
              Add one →
            </button>
          </p>
        ) : null}
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
              <span className="flex-shrink-0 text-lg w-7 text-center">
                {thread.categories?.icon ?? "🎣"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-bone-white font-body font-medium group-hover:text-cast-orange transition-colors truncate">
                  {thread.title}
                </p>
                <p className="text-storm text-xs mt-0.5">
                  {thread.categories?.name ?? "General"} · {timeAgo(thread.created_at)}
                </p>
              </div>
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
