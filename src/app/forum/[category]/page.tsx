import CategoryView from "@/components/forum/CategoryView";

const slugs = ["bass", "saltwater", "specimen", "general"];

export function generateStaticParams() {
  return slugs.map((slug) => ({ category: slug }));
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  return <CategoryView category={params.category} />;
}
