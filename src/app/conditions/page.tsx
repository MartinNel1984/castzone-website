import type { Metadata } from "next";
import ConditionsContent from "./ConditionsContent";

export const metadata: Metadata = {
  title: "Water Conditions",
  description:
    "Live SA dam levels, Vaal system gate alerts and river flow data — sourced weekly from DWS Hydrological Services. Essential reading before your next session.",
  alternates: { canonical: "/conditions" },
};

export default function ConditionsPage() {
  return <ConditionsContent />;
}
