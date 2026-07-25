import type { Metadata } from "next";
import ProfilePageContent from "./ProfileContentPage";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your CastZone profile.",
  robots: { index: false, follow: true },
};

export default function ProfilePage() {
  return <ProfilePageContent />;
}
