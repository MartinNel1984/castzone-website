"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Post = {
  id: string;
  content: string;
  is_first_post: boolean;
  created_at: string;
  updated_at: string;
  profiles: { username: string; member_level: string } | null;
};

type Thread = {
  id: string;
  title: string;
  is_locked: boolean;
  reply_count: number;
  categories: { slug: string; name: string } | null;
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

function ThreadContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const threadId = searchParams.get("id");

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");

  useEffect(() => {
    if (!threadId) { setLoading(false); return; }
    const supabase = createClient();

    async function load() {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      // Increment view count
      await supabase.rpc("increment_view_count", { thread_id: threadId }).maybeSingle();

      // Load thread
      const { data: threadData } = await supabase
        .from("threads")
        .select("id, title, is_locked, reply_count, categories(slug, name)")
        .eq("id", threadId)
        .single();
      if (threadData) setThread(threadData as unknown as Thread);

      // Load posts
      const { data: postData } = await supabase
        .from("posts")
        .select("id, content, is_first_post, created_at, updated_at, profiles(username, member_level)")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (postData) setPosts(postData as unknown as Post[]);

      setLoading(false);
    }

    load();
  }, [threadId]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !user || !threadId) return;
    setSubmitting(true);
    setReplyError("");

    const supabase = createClient();
    const { error } = await supabase.from("posts").insert({
      thread_id: threadId,
      author_id: user.id,
      content: reply.trim(),
      is_first_post: false,
    });

    if (error) {
      setReplyError("Could not post reply. Please try again.");
    } else {
      setReply("");
      // Reload posts
      const { data } = await supabase
        .from("posts")
        .select("id, content, is_first_post, created_at, updated_at, profiles(username, member_level)")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (data) setPosts(data as unknown as Post[]);
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
      <h1 className="text-3xl sm:text-4xl font-heading font-bold text-bone-white uppercase mb-8 leading-tight">
        {loading ? <span className="animate-pulse bg-surface-teal rounded h-8 block w-3/4" /> : thread?.title}
      </h1>

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
                  <div className="w-9 h-9 rounded-full bg-surface-teal flex items-center justify-center text-bone-white font-heading font-bold text-sm flex-shrink-0">
                    {post.profiles?.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-bone-white font-body font-semibold text-sm">{post.profiles?.username ?? "Unknown"}</p>
                    <p className="text-storm text-xs">{post.profiles?.member_level ?? "First Cast"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-storm text-xs">#{index + 1}</p>
                  <p className="text-storm text-xs">{timeAgo(post.created_at)}</p>
                </div>
              </div>

              {/* Post content */}
              <div className="text-bone-white font-body leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                {post.content}
              </div>
            </div>
          ))}
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
            <div className="flex justify-end mt-3">
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

      {/* Back link */}
      {category && (
        <div className="mt-6">
          <Link href={`/forum/${category.slug}`} className="text-storm hover:text-pale-water text-sm font-body transition-colors">
            ← Back to {category.name}
          </Link>
        </div>
      )}
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
