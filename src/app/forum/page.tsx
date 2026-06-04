import type { Metadata } from "next";
import ForumContent from "./ForumContent";

export const metadata: Metadata = {
  title: "Forum",
  description: "Join the conversation with SA anglers — bass, saltwater, specimen and general angling discussion, reports and advice.",
  alternates: { canonical: "/forum" },
};

export default function ForumPage() {
  return <ForumContent />;
}
