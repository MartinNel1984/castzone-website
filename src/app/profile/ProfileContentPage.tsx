"use client";

import { useEffect, useRef, useState, Suspense } from "react";
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
  const [loading, setLoading]     = useState(Boolean(username));
  const [notFound, setNotFound]   = useState(!username);
  const [isOwn, setIsOwn]         = useState(false);

  // Edit state
  const [editing, setEditing]     = useState(false);
  const [bioInput, setBioInput]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  // Username change state
  const [usernameInput, setUsernameInput]   = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const usernameCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Avatar edit state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;
    const supabase = createClient();

    async function load() {
      // getUser() validates against the server (same call the navbar uses,
      // which reliably detects the logged-in user).
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio, member_level, post_count, created_at")
        .eq("username", username)
        .single();

      if (!profileData) { setNotFound(true); setLoading(false); return; }
      setProfile(profileData as Profile);
      setBioInput((profileData as Profile).bio ?? "");

      // Ownership: this profile is mine if the auth id matches the row id, OR if
      // my canonical username matches the viewed one. We take the username from
      // auth metadata, falling back to my own profile row (covers accounts whose
      // metadata has no username, and any id/row mismatch from early signups).
      if (currentUser) {
        let myUsername =
          (currentUser.user_metadata?.username as string | undefined)?.toLowerCase() ?? null;
        if (!myUsername) {
          const { data: me } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", currentUser.id)
            .maybeSingle();
          myUsername = me?.username?.toLowerCase() ?? null;
        }
        const viewed = profileData.username?.toLowerCase();
        if (currentUser.id === profileData.id || (myUsername !== null && myUsername === viewed)) {
          setIsOwn(true);
        }
      }

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

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveError("Profile picture must be under 5MB.");
      e.target.value = "";
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setSaveError("");
    e.target.value = "";
  }

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.trim();
    setUsernameInput(val);
    if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
    if (!profile) return;
    if (val === profile.username) { setUsernameStatus("idle"); return; }
    if (val.length < 3 || !/^[a-zA-Z0-9_]{3,30}$/.test(val)) { setUsernameStatus("invalid"); return; }
    setUsernameStatus("checking");
    usernameCheckRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", val)
        .neq("id", profile.id)
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 600);
  }

  function cancelEdit() {
    if (!profile) return;
    setEditing(false);
    setBioInput(profile.bio ?? "");
    setUsernameInput(profile.username);
    setUsernameStatus("idle");
    setSaveError("");
    setAvatarFile(null);
    if (avatarPreview) { URL.revokeObjectURL(avatarPreview); setAvatarPreview(null); }
  }

  async function handleSave() {
    if (!profile) return;
    const newUsername     = usernameInput.trim();
    const usernameChanged = newUsername !== profile.username;
    if (usernameChanged && usernameStatus !== "available") return;

    setSaving(true);
    setSaveError("");
    const supabase = createClient();
    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() ?? "jpg";
        const path = `${profile.id}/avatar_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { contentType: avatarFile.type, upsert: true });
        if (upErr) throw new Error(upErr.message);
        avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      const updates: Record<string, unknown> = { bio: bioInput.trim() || null, avatar_url: avatarUrl };
      if (usernameChanged) updates.username = newUsername;

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);
      if (error) throw new Error(error.message);

      if (usernameChanged) {
        await supabase.auth.updateUser({ data: { username: newUsername } });
        // Redirect to new profile URL — hard navigate so everything reloads with new name
        window.location.href = `/profile?username=${encodeURIComponent(newUsername)}`;
        return;
      }

      setProfile((p) => p ? { ...p, bio: bioInput.trim() || null, avatar_url: avatarUrl } : p);
      setEditing(false);
      setAvatarFile(null);
      if (avatarPreview) { URL.revokeObjectURL(avatarPreview); setAvatarPreview(null); }
    } catch {
      setSaveError("Could not save. Please try again.");
    } finally {
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
        <p className="text-pale-water text-xl font-mono font-semibold uppercase mb-3">Member not found</p>
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
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-surface-teal overflow-hidden flex items-center justify-center text-bone-white font-heading font-bold text-3xl">
              {avatarPreview || profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview ?? profile.avatar_url!} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            {editing && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-cast-orange hover:bg-cast-orange-hover text-white w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-deep-water-light transition-colors"
                  aria-label="Change profile picture"
                  title="Change profile picture"
                >
                  📷
                </button>
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-3xl font-heading font-semibold text-bone-white leading-tight">
                {profile.username}
              </h1>
              {isOwn && !editing && (
                <button
                  onClick={() => { setEditing(true); setUsernameInput(profile.username); setUsernameStatus("idle"); }}
                  className="flex-shrink-0 text-storm hover:text-pale-water text-xs font-body border border-surface-teal hover:border-pale-water/50 rounded px-3 py-1.5 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className={`text-xs font-mono font-semibold uppercase tracking-wider border rounded px-2 py-0.5 ${levelClass}`}>
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
            <p className="text-storm text-xs font-body mb-4">Tap the 📷 on your photo to upload a profile picture (JPEG, PNG or WEBP, max 5MB).</p>

            {/* Username */}
            <div className="mb-4">
              <label className="block text-xs font-body text-storm uppercase tracking-wider mb-1.5">Username</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={handleUsernameChange}
                  maxLength={30}
                  className="flex-1 bg-deep-water border border-surface-teal rounded px-4 py-2.5 text-bone-white font-body text-sm focus:outline-none focus:border-cast-orange transition-colors"
                />
                <span className="text-xs font-body flex-shrink-0 w-24">
                  {usernameInput === profile.username ? (
                    <span className="text-storm">Current name</span>
                  ) : usernameStatus === "checking" ? (
                    <span className="text-storm">Checking…</span>
                  ) : usernameStatus === "available" ? (
                    <span className="text-green-400">✓ Available</span>
                  ) : usernameStatus === "taken" ? (
                    <span className="text-red-400">✗ Already taken</span>
                  ) : usernameStatus === "invalid" ? (
                    <span className="text-red-400">✗ Invalid</span>
                  ) : null}
                </span>
              </div>
              <p className="text-storm text-xs font-body mt-1.5">3–30 characters · letters, numbers and underscores only · no spaces</p>
            </div>

            {/* Bio */}
            <label className="block text-xs font-body text-storm uppercase tracking-wider mb-1.5">Bio</label>
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
                  onClick={cancelEdit}
                  disabled={saving}
                  className="text-storm hover:text-pale-water text-sm font-body transition-colors px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || (usernameInput !== profile.username && usernameStatus !== "available")}
                  className="bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-mono font-semibold uppercase tracking-wider text-xs px-4 py-1.5 rounded transition-colors"
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
            <button onClick={() => { setEditing(true); setUsernameInput(profile.username); setUsernameStatus("idle"); }} className="text-cast-orange hover:underline not-italic">
              Add one →
            </button>
          </p>
        ) : null}
      </div>

      {/* Threads */}
      <h2 className="text-xl font-heading font-semibold text-bone-white mb-4">
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

export default function ProfilePageContent() {
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