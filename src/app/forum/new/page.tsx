import type { Metadata } from "next";
import NewThreadContent from "./NewThreadContent";

export const metadata: Metadata = {
  title: "Start a Thread",
  description: "Start a new discussion thread on the CastZone fishing forum.",
  alternates: { canonical: "/forum/new" },
};

export default function NewThreadPage() {
  return <NewThreadContent />;
}
