import type { Metadata } from "next";
import CategoryView from "@/components/forum/CategoryView";

const categories: Record<string, { name: string; description: string }> = {
  bass: {
    name: "Bass Fishing",
    description: "Tackle, techniques, dams, tournaments and reports for SA bass anglers.",
  },
  saltwater: {
    name: "Saltwater Fishing",
    description: "Shore, offshore, lure, kayak and ski-boat angling along the SA coast.",
  },
  specimen: {
    name: "Specimen & Carp",
    description: "European-style specimen carp fishing, rigs, bait and big fish stories.",
  },
  general: {
    name: "General Angling",
    description: "Everything else — freshwater, fly fishing, beginner questions and more.",
  },
};

const slugs = Object.keys(categories);

export function generateStaticParams() {
  return slugs.map((slug) => ({ category: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const info = categories[category];
  if (!info) return {};
  return {
    title: info.name,
    description: `${info.description} Join the discussion on CastZone.`,
    alternates: { canonical: `/forum/${category}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return <CategoryView category={category} />;
}
