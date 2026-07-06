// Shared constants + helpers for CastZone Specials (fishing & camping deals).

import { formatPrice } from "@/lib/tackleBox";

export { formatPrice };

export type DealCategory = "fishing" | "camping";

export type Deal = {
  id: string;
  title: string;
  retailer: string;
  category: DealCategory;
  original_price: number | null;
  sale_price: number | null;
  discount_pct: number | null;
  url: string;
  image_url: string | null;
  status: "pending" | "approved" | "rejected";
  found_at: string;
  approved_at: string | null;
  expires_at: string | null;
};

export const DEAL_CATEGORIES: { value: DealCategory; label: string; icon: string }[] = [
  { value: "fishing", label: "Fishing", icon: "🎣" },
  { value: "camping", label: "Camping", icon: "⛺" },
];

export function categoryLabel(value: string): string {
  return DEAL_CATEGORIES.find((c) => c.value === value)?.label ?? "Fishing";
}

export function categoryIcon(value: string): string {
  return DEAL_CATEGORIES.find((c) => c.value === value)?.icon ?? "🎣";
}

// Percentage saved, e.g. was 1000, now 400 -> 60.
export function discountPct(
  original: number | null,
  sale: number | null,
  stored?: number | null
): number | null {
  if (stored != null) return stored;
  if (original == null || sale == null || original <= 0 || sale < 0) return null;
  return Math.round((1 - sale / original) * 100);
}

// True once expires_at has passed (null = never expires).
export function isExpired(deal: Pick<Deal, "expires_at">): boolean {
  return deal.expires_at != null && new Date(deal.expires_at).getTime() <= Date.now();
}
