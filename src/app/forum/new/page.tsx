"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const CATEGORIES = [
  { slug: "bass",      name: "Bass Fishing" },
  { slug: "saltwater", name: "Saltwater" },
  { slug: "specimen",  name: "Specimen & Carp" },
  { slug: "general",   name: "General Angling" },
];

function NewThreadForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultCategory = searchParams.get("category") ?? "general";

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [category, setCategory] = useState(defaultCategory);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSubmitting(true);

    const supabase = createClient();

    // Get category id
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();

    if (!cat) {
      setError("Invalid category. Please try again.");
      setSubmitting(false);
      return;
    }

    // Create thread
    const { data: thread, error: threadError } = await supabase
      .from("threads")
      .insert({ category_id: cat.id, author_id: user.id, title: title.trim() })
      .select("id")
      .single();

    if (threadError || !thread) {
      setError("Could not create thread. Please try again.");
      setSubmitting(false);
      return;
    }

    // Create first post
    const { error: postError } = await supabase.from("posts").insert({
      thread_id: thread.id,
      author_id: user.id,
      content: content.trim(),
      is_first_post: true,
    });

    if (postError) {
      setError("Thread created but could not save content. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push(`/forum/thread?id=${thread.id}`);
  }

  if (checkingAuth) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center"><p className="text-storm">Loading...</p></div>;
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-pale-water font-body text-lg mb-6">You need to be signed in to start a thread.</p>
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-storm mb-6">
        <Link href="/forum" className="hover:text-pale-water">Forum</Link>
        <span className="mx-2">›</span>
        <span className="text-pale-water">New Thread</span>
      </nav>

      <h1 className="text-4xl font-heading font-bold text-bone-white uppercase mb-8">Start a Thread</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded px-4 py-3 text-sm font-body">
            {error}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white font-body focus:outline-none focus:border-cast-orange transition-colors"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
            Thread Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="Keep it clear and descriptive"
            className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-pale-water text-sm font-body font-medium mb-2 uppercase tracking-wider">
            Your Post
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            placeholder="Write your post here..."
            className="w-full bg-deep-water border border-surface-teal rounded px-4 py-3 text-bone-white placeholder-storm font-body focus:outline-none focus:border-cast-orange transition-colors resize-y"
          />
        </div>

        <div className="flex items-center justify-between">
          <Link href="/forum" className="text-storm hover:text-pale-water text-sm font-body transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="bg-cast-orange hover:bg-cast-orange-hover disabled:opacity-50 text-white font-heading font-bold uppercase tracking-wider px-8 py-3 rounded transition-colors"
          >
            {submitting ? "Posting..." : "Post Thread"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewThreadPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-20 text-center"><p className="text-storm">Loading...</p></div>}>
      <NewThreadForm />
    </Suspense>
  );
}
