import CategoryView from "@/components/forum/CategoryView";

const slugs = ["bass", "saltwater", "specimen", "general"];

export function generateStaticParams() {
  return slugs.map((slug) => ({ category: slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return <CategoryView category={category} />;
}
