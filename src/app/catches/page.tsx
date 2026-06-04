import type { Metadata } from "next";
import CatchesContent from "./CatchesContent";

export const metadata: Metadata = {
  title: "Trophy Room",
  description: "South Africa's biggest catches. Log your catch with a photo, claim the leaderboard and track personal bests.",
  alternates: { canonical: "/catches" },
};

export default function CatchesPage() {
  return <CatchesContent />;
}
