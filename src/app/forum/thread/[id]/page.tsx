import type { Metadata } from "next";
import ThreadView from "@/components/forum/ThreadView";
import { getAllThreads } from "@/lib/forumBuild";

// Generated from threads that existed at build time. A thread posted after
// the last build isn't in this list yet — it's still fully reachable via the
// client-rendered /forum/thread?id= route (see ../page.tsx) until the next
// rebuild adds its dedicated static page here.
export async function generateStaticParams() {
  const threads = await getAllThreads();
  return threads.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const threads = await getAllThreads();
  const thread = threads.find((t) => t.id === id);
  if (!thread) return {};

  const categoryName = thread.category?.name ?? "General Angling";
  return {
    title: thread.title,
    description: `${thread.title} — ${categoryName} discussion on CastZone, South Africa's fishing forum.`,
    alternates: { canonical: `/forum/thread/${id}` },
  };
}

export default async function ThreadStaticPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ThreadView threadId={id} />;
}
