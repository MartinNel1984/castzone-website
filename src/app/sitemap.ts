import type { MetadataRoute } from "next";
import { VENUE_SLUGS } from "./venues/[slug]/page";
import { DAM_SLUGS } from "@/data/waterConditions";
import { CITY_SLUGS } from "@/data/cities";
import { getAllThreads } from "@/lib/forumBuild";

export const dynamic = "force-static";

const BASE = "https://castzone.co.za";

const STATIC_ROUTES = [
  "",
  "/about",
  "/advertise",
  "/catches",
  "/contact",
  "/forum",
  "/login",
  "/register",
  "/rules",
  "/search",
  "/tournaments",
  "/specials",
  "/venues",
  "/venues/suggest",
  "/conditions",
  "/bite-times",
  "/members",
  "/saved",
  "/list-your-venue",
];

const FORUM_CATEGORIES = ["bass", "saltwater", "specimen", "general"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const threads = await getAllThreads();

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${BASE}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...FORUM_CATEGORIES.map((slug) => ({
      url: `${BASE}/forum/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...threads.map((t) => ({
      url: `${BASE}/forum/thread/${t.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...VENUE_SLUGS.map((slug) => ({
      url: `${BASE}/venues/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...DAM_SLUGS.map((slug) => ({
      url: `${BASE}/conditions/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...CITY_SLUGS.map((slug) => ({
      url: `${BASE}/fishing-near/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
