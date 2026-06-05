"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Post = {
  id: string;
  author_id: string;
  content: string;
  image_urls: string[];
  is_first_post: boolean;
  created_at: string;
  updated_at: string;
  profiles: { username: string; member_level: string; avatar_url: string | null } | null;
};

type Thread = {
  id: string;
  title: string;
  is_locked: boolean;
  reply_count: number;
  categories: { slug: string; name: string } | null;
};

type ImagePreview = { file: File; preview: string };

const MAX_FILES = 3;
const MAX_SIZE_MB = 5;

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

function PostImages({ urls, locked }: { urls: string[]; locked: boolean }) {
  if (!urls || urls.length === 0) return null;
  if (locked) {
    return (
      <div className="mt-4 bg-deep-water border border-surface-teal/60 rounded-lg px-5 py-4 flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">🔒</span>
        <p className="text-pale-water font-body text-sm">
          {urls.length === 1 ? "1 photo" : `${urls.length} photos`} in this post —{" "}
          <Link href="/register" className="text-cast-orange hover:underline font-medium">join free</Link> or{" "}
          <Link href="/login" className="text-cast-orange hover:underline font-medium">sign in</Link> to view.
        </p>
      </div>
    );
  }
  return (
    <div className={`mt-4 grid gap-2 ${urls.length === 1 ? "grid-cols-1" : urls.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
      {urls.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded overflow-hidden border border-surface-teal/50 hover:border-cast-orange transition-colors">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Image ${i + 1}`}
            className="w-full object-cover max-h-72"
            loading="lazy"
          />
        </a>
      ))}
    </div>
  );
}

function ThreadContent() {
  const searchParams = useSearchParams();
  const threadId = searchParams.get("id");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const postsEndRef = useRef<HTMLDivElement>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(threadId));
  const [reply, setReply] = useState("");
  const [replyImages, setReplyImages] = useState<ImagePreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkWorking, setBookmarkWorking] = useState(false);
  const [bookmarkFlash, setBookmarkFlash] = useState(false);

  useEffect(() => {
    if (!threadId) return;
    const supabase = createClient();

    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      if (userData.user) {
        const { data: bmData } = await supabase
          .from("bookmarks")
          .select("id")
          .eq("user_id", userData.user.id)
          .eq("thread_id", threadId)
          .maybeSingle();
        setBookmarked(!!bmData);
      }

      await supabase.rpc("increment_view_count", { thread_id: threadId }).maybeSingle();

      const { data: threadData } = await supabase
        .from("threads")
        .select("id, title, is_locked, reply_count, categories(slug, name)")
        .eq("id", threadId)
        .single();
      if (threadData) setThread(threadData as unknown as Thread);

      const { data: postData } = await supabase
        .from("posts")
        .select("id, author_id, content, image_urls, is_first_post, created_at, updated_at, profiles(username, member_level, avatar_url)")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (postData) setPosts(postData as unknown as Post[]);

      setLoading(false);
    }

    load();
  }, [threadId]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_FILES - replyImages.length;
    const toAdd = files.slice(0, remaining);

    const oversized = toAdd.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length) {
      setReplyError(`Images must be under ${MAX_SIZE_MB}MB each.`);
      e.target.value = "";
      return;
    }

    const newPreviews: ImagePreview[] = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setReplyImages((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  }

  function removeReplyImage(index: number) {
    setReplyImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadImages(userId: string): Promise<string[]> {
    if (!replyImages.length) return [];
    const supabase = createClient();
    const urls: string[] = [];

    for (const { file } of replyImages) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `${userId}/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    return urls;
  }

  async function handleBookmarkToggle() {
    if (!user || !threadId || bookmarkWorking) return;
    setBookmarkWorking(true);
    const supabase = createClient();
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("thread_id", threadId);
      setBookmarked(false);
      setBookmarkFlash(false);
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, thread_id: threadId });
      setBookmarked(true);
      setBookmarkFlash(true);
      setTimeout(() => setBookmarkFlash(false), 5000);
    }
    setBookmarkWorking(false);
  }

  async function handleEditSave(postId: string) {
    if (!editContent.trim() || editSaving || !user) return;
    setEditSaving(true);
    const supabase = createClient();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("posts")
      .update({ content: editContent.trim(), updated_at: now })
      .eq("id", postId)
      .eq("author_id", user.id);
    if (!error) {
      setPosts((prev) =>
        prev.map((p) => p.id === postId ? { ...p, content: editContent.trim(), updated_at: now } : p)
      );
      setEditingPostId(null);
    }
    setEditSaving(false);
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !reply.trim() || !user || !threadId) return;
    setSubmitting(true);
    setReplyError("");

    try {
      const imageUrls = await uploadImages(user.id);

      const supabase = createClient();
      const { error } = await supabase.from("posts").insert({
        thread_id: threadId,
        author_id: user.id,
        content: reply.trim(),
        is_first_post: false,
        image_urls: imageUrls,
      });

      if (error) {
        setReplyError("Could not post reply. Please try again.");
      } else {
        setReply("");
        setReplyImages([]);
        const { data } = await supabase
          .from("posts")
          .select("id, author_id, content, image_urls, is_first_post, created_at, updated_at, profiles(username, member_level, avatar_url)")
          .eq("thread_id", threadId)
          .order("created_at", { ascending: true });
        if (data) {
          setPosts(data as unknown as Post[]);
          setTimeout(() => postsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
      }
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }

    setSubmitting(false);
  }

  if (!threadId || (!loading && !thread)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-storm text-lg">Thread not found.</p>
        <Link href="/forum" className="text-cast-orange mt-4 inline-block">← Back to Forum</Link>
      </div>
    );
  }

  const category = thread?.categories;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-storm mb-6">
        <Link href="/forum" className="hover:text-pale-water">Forum</Link>
        {category && (
          <>
            <span className="mx-2">›</span>
            <Link href={`/forum/${category.slug}`} className="hover:text-pale-water">{category.name}</Link>
          </>
        )}
        <span className="mx-2">›</span>
        <span className="text-pale-water truncate">{thread?.title}</span>
      </nav>

      {/* Thread title */}
      <div className="flex items-start justify-between gap-3 mb-8">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-bone-white uppercase leading-tight flex-1">
          {loading ? <span className="animate-pulse bg-surface-teal rounded h-8 block w-3/4" /> : thread?.title}
        </h1>
        {user && !loading && (
          <button
            onClick={handleBookmarkToggle}
            disabled={bookmarkWorking}
            title={bookmarked ? "Remove bookmark" : "Save this thread"}
            className={`flex-shrink-0 mt-1 text-2xl leading-none transition-colors ${bookmarked ? "text-cast-orange" : "text-storm hover:text-pale-water"}`}
          >
            {bookmarked ? "★" : "☆"}
          </button>
        )}
      </div>
      {bookmarkFlash && (
        <p className="text-xs text-storm -mt-5 mb-6">
          Thread saved ·{" "}
          <Link href="/saved" className="text-cast-orange hover:underline">View all saved threads</Link>
        </p>
      )}

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-deep-water-light border border-surface-teal rounded-lg p-6 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div
              key={post.id}
              className={`bg-deep-water-light border rounded-lg p-5 sm:p-6 ${post.is_first_post ? "border-surface-teal" : "border-surface-teal/50"}`}
            >
              {/* Post header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-teal/40">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/profile?username=${encodeURIComponent(post.profiles?.username ?? "")}`}
                    className="w-9 h-9 rounded-full bg-surface-teal overflow-hidden flex items-center justify-center text-bone-white font-heading font-bold text-sm flex-shrink-0"
                  >
                    {post.profiles?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.profiles.avatar_url} alt={post.profiles.username} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      post.profiles?.username?.[0]?.toUpperCase() ?? "?"
                    )}
                  </Link>
                  <div>
                    <Link
                      href={`/profile?username=${encodeURIComponent(post.profiles?.username ?? "")}`}
                      className="text-bone-white hover:text-cast-orange font-body font-semibold text-sm transition-colors"
                    >
                      {post.profiles?.username ?? "Unknown"}
                    </Link>
                    <p className="text-storm text-xs">{post.profiles?.member_level ?? "First Cast"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-storm text-xs">#{index + 1}</p>
                  <p className="text-storm text-xs">{timeAgo(post.created_at)}</p>
                  {user && post.author_id === user.id &&
                    Date.now() - new Date(post.created_at).getTime() < 86400000 &&
                    editingPostId !== post.id && (
                    <button
                      onClick={() => { setEditingPostId(post.id); setEditContent(post.content); }}
                      className="text-storm hover:text-pale-water text-xs mt-1 font-body underline underline-offset-2 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Post content */}
              {editingPostId === post.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white font-body text-sm focus:outline-none focus:border-cast-orange transition-colors resize-y"
                  />
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button
                      onClick={() => setEditingPostId(null)}
                      className="text-storm hover:text-pale-water text-sm font-body px-3 py-1.5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditSave(post.id)}
                      disabled={editSaving || !editContent.trim()}
                      className="bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-heading font-bold uppercase tracking-wider text-xs px-4 py-1.5 rounded transition-colors"
                    >
                      {editSaving ? "Saving…" : "Save Edit"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-bone-white font-body leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                    {post.content}
                  </div>
                  {new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 5000 && (
                    <p className="text-storm text-xs mt-2 italic">Edited</p>
                  )}
                </>
              )}

              {/* Post images — gated for logged-out visitors */}
              <PostImages urls={post.image_urls} locked={!user} />
            </div>
          ))}
          <div ref={postsEndRef} />
        </div>
      )}

      {/* Reply form */}
      <div className="mt-8">
        {thread?.is_locked ? (
          <div className="bg-deep-water-light border border-surface-teal rounded-lg p-5 text-center">
            <p className="text-storm font-body">🔒 This thread is locked. No new replies.</p>
          </div>
        ) : user ? (
          <form onSubmit={handleReply} className="bg-deep-water-light border border-surface-teal rounded-lg p-5">
            <h3 className="text-bone-white font-heading font-bold uppercase mb-4">Post a Reply</h3>
            {replyError && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 rounded px-4 py-3 text-sm mb-4">
                {replyError}
              </div>
            )}
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              required
              rows={5}
              placeholder="Write your reply..."
              className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors resize-y text-sm"
            />

            {/* Image picker */}
            <div className="mt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              {replyImages.length < MAX_FILES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm text-pale-water hover:text-bone-white font-body border border-surface-teal/60 hover:border-surface-teal rounded px-3 py-2 transition-colors"
                >
                  <span>📷</span>
                  <span>Add photos ({replyImages.length}/{MAX_FILES})</span>
                </button>
              )}

              {replyImages.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {replyImages.map((img, i) => (
                    <div key={i} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.preview}
                        alt="preview"
                        className="w-20 h-20 object-cover rounded border border-surface-teal"
                      />
                      <button
                        type="button"
                        onClick={() => removeReplyImage(i)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none transition-colors"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={submitting || !reply.trim()}
                className="bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-heading font-bold uppercase tracking-wider px-6 py-3 rounded transition-colors"
              >
                {submitting ? "Posting..." : "Post Reply"}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-deep-water-light border border-surface-teal rounded-lg p-6 text-center">
            <p className="text-pale-water font-body mb-4">Sign in to join the conversation.</p>
            <div className="flex justify-center gap-3">
              <Link href="/login" className="border border-surface-teal text-pale-water hover:text-bone-white font-heading font-bold uppercase tracking-wider px-5 py-2 rounded transition-colors text-sm">
                Sign In
              </Link>
              <Link href="/register" className="bg-cast-orange hover:bg-cast-orange-hover text-white font-heading font-bold uppercase tracking-wider px-5 py-2 rounded transition-colors text-sm">
                Join Free
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Back link — always visible */}
      <div className="mt-6">
        <Link
          href={category ? `/forum/${category.slug}` : "/forum"}
          className="text-storm hover:text-pale-water text-sm font-body transition-colors"
        >
          ← Back to {category ? category.name : "Forum"}
        </Link>
      </div>
    </div>
  );
}

export default function ThreadPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-storm">Loading thread...</p>
      </div>
    }>
      <ThreadContent />
    </Suspense>
  );
}
