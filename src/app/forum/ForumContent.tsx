"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

type Category = {
  id: number;
  slug: string;
  name: string;
  description: string;
  colour: string;
  icon: string;
  thread_count: number;
  post_count: number;
};

const colourMap: Record<string, string> = {
  "#2d6a4f": "bg-bass-green",
  "#1d3557": "bg-saltwater-blue",
  "#6b4226": "bg-specimen-brown",
  "#2a6e6e": "bg-surface-teal",
};

export default function ForumPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        if (data) setCategories(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-heading font-semibold text-bone-white ">Forum</h1>
          <p className="text-storm font-body mt-1">South Africa&apos;s fishing discussion</p>
        </div>
        <Link
          href="/forum/new"
          className="bg-cast-orange hover:bg-cast-orange-hover text-white font-mono font-semibold uppercase tracking-wider px-5 py-3 rounded transition-colors text-sm"
        >
          + New Thread
        </Link>
      </div>

      {/* Categories */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-deep-water-light border border-surface-teal rounded-lg p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/forum/${cat.slug}`}
              className="group bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg p-5 flex items-center gap-4 transition-all"
            >
              <div className={`${colourMap[cat.colour] ?? "bg-surface-teal"} rounded-lg w-12 h-12 flex items-center justify-center text-2xl flex-shrink-0`}>
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-bone-white font-heading font-semibold text-xl group-hover:text-cast-orange transition-colors">
                  {cat.name}
                </h2>
                <p className="text-storm text-sm font-body mt-0.5">{cat.description}</p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0 text-right">
                <span className="text-pale-water text-sm font-body">{cat.thread_count} threads</span>
                <span className="text-storm text-xs font-body">{cat.post_count} posts</span>
              </div>
              <svg className="w-5 h-5 text-storm group-hover:text-cast-orange transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}