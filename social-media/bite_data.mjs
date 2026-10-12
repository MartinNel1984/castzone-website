// Prints solunar bite-time data as JSON for the social bot.
// Usage: TZ=Africa/Johannesburg node bite_data.mjs <lat> <lng> <YYYY-MM-DD> <days>
// Reuses the site's own engine (src/lib/solunar.ts) so posts match /bite-times.
import { computeBiteDays } from "../src/lib/solunar.ts";

const [lat, lng, start, n] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4], Number(process.argv[5] || 2)];
const [y, m, d] = start.split("-").map(Number);
const days = computeBiteDays(new Date(y, m - 1, d, 12, 0, 0), n, lat, lng);
const t = (x) => (x ? x.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Johannesburg" }) : null);
console.log(JSON.stringify(days.map((b) => ({
  date: b.date.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Johannesburg" }),
  score: Math.round(b.score), rating: b.rating,
  moon: b.moon.name, illum: Math.round(b.moon.fraction * 100),
  sunrise: t(b.sunrise), sunset: t(b.sunset),
  periods: b.periods.map((p) => ({ type: p.type, start: t(p.start), end: t(p.end) })).sort((a, c) => a.start.localeCompare(c.start)),
}))));
