import type { Metadata } from "next";
import ClassifiedsContent from "./ClassifiedsContent";

export const metadata: Metadata = {
  title: "Tackle Box",
  description: "Buy and sell fishing gear directly with SA anglers — rods, reels, boats, tackle and more. No middlemen, no commission.",
  alternates: { canonical: "/classifieds" },
};

export default function ClassifiedsPage() {
  return <ClassifiedsContent />;
}
