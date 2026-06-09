"use client";

import { useEffect, useRef, useState, Suspense } from "react";
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

const MAX_FILES = 3;
const MAX_SIZE_MB = 5;

type ImagePreview = { file: File; preview: string };

function NewThreadForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultCategory = searchParams.get("category") ?? "general";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [category, setCategory] = useState(defaultCategory);
  const [title, setTitle] = useState(searchParams.get("title") ?? "");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setCheckingAuth(false);
    });
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_FILES - images.length;
    const toAdd = files.slice(0, remaining);

    const oversized = toAdd.filter((f) => f.size > MAX_SIZE_MB * 1024 * 1024);
    if (oversized.length) {
      setError(`Images must be under ${MAX_SIZE_MB}MB each.`);
      e.target.value = "";
      return;
    }

    const newPreviews: ImagePreview[] = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadImages(userId: string): Promise<string[]> {
    if (!images.length) return [];
    const supabase = createClient();
    const urls: string[] = [];

    for (const { file } of images) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSubmitting(true);

    try {
      const supabase = createClient();

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

      // Upload images before creating the thread so a failed upload doesn't leave an orphaned thread
      const imageUrls = await uploadImages(user.id);

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

      const { error: postError } = await supabase.from("posts").insert({
        thread_id: thread.id,
        author_id: user.id,
        content: content.trim(),
        is_first_post: true,
        image_urls: imageUrls,
      });

      if (postError) {
        setError("Could not save post. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push(`/forum/thread?id=${thread.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
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

            {images.length < MAX_FILES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-pale-water hover:text-bone-white font-body border border-surface-teal/60 hover:border-surface-teal rounded px-3 py-2 transition-colors"
              >
                <span>📷</span>
                <span>Add photos ({images.length}/{MAX_FILES})</span>
              </button>
            )}

            {/* Image previews */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {images.map((img, i) => (
                  <div key={img.preview} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.preview}
                      alt="preview"
                      className="w-24 h-24 object-cover rounded border border-surface-teal"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none transition-colors"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length > 0 && (
              <p className="text-storm text-xs mt-2 font-body">Max {MAX_FILES} photos, {MAX_SIZE_MB}MB each. JPEG, PNG or WEBP.</p>
            )}
          </div>
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
