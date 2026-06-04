// Shared constants for the Tackle Box (classifieds marketplace).

export type ListingCategory =
  | "rods-reels"
  | "terminal-tackle"
  | "boats"
  | "accessories"
  | "carp-specimen"
  | "other";

export const CATEGORIES: { value: ListingCategory; label: string; icon: string; description: string }[] = [
  { value: "rods-reels",     label: "Rods & Reels",       icon: "🎣", description: "Spinning, baitcast, fly — all tackle types" },
  { value: "terminal-tackle", label: "Terminal Tackle",   icon: "🪝", description: "Hooks, lures, jigs, weights, line" },
  { value: "boats",          label: "Boats & Watercraft", icon: "🚤", description: "Bass boats, kayaks, paddle skis, motors" },
  { value: "accessories",    label: "Accessories",        icon: "🧰", description: "Nets, tackle boxes, clothing, electronics" },
  { value: "carp-specimen",  label: "Carp & Specimen",    icon: "🐟", description: "Rigs, bait, bivvies, bedchairs, buzzers" },
  { value: "other",          label: "Other Fishing Gear", icon: "📦", description: "Anything fishing-related that doesn’t fit above" },
];

export type ListingCondition = "new" | "like-new" | "good" | "fair";

export const CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: "new",      label: "New / Unused" },
  { value: "like-new", label: "Like New" },
  { value: "good",     label: "Good" },
  { value: "fair",     label: "Fair / Well Used" },
];

export const PROVINCES = [
  "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape",
  "Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape",
];

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Other Fishing Gear";
}

export function categoryIcon(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.icon ?? "📦";
}

export function conditionLabel(value: string): string {
  return CONDITIONS.find((c) => c.value === value)?.label ?? value;
}

// Format a rand price for display, e.g. 1500 -> "R1 500"
export function formatPrice(rand: number): string {
  return "R" + Math.round(rand).toLocaleString("en-ZA").replace(/,/g, " ");
}

// Normalise a SA phone number into the wa.me international form (27XXXXXXXXX).
// Accepts "081 234 5678", "0812345678", "+27 81 234 5678", "27812345678".
export function toWhatsAppNumber(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.startsWith("27") && digits.length === 11) return digits;          // 27812345678
  if (digits.startsWith("0") && digits.length === 10) return "27" + digits.slice(1); // 0812345678
  if (digits.length === 9) return "27" + digits;                                // 812345678
  return digits; // fall back to whatever was entered
}
