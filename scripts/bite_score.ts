// Prints today's Gauteng (Johannesburg) bite forecast as one JSON line.
// Reuses the exact same solunar + weather logic as the live site
// (src/lib/solunar.ts, src/lib/weather.ts) so the WhatsApp digest never
// drifts from what visitors see on /bite-times — no reimplementation.
//
// Usage: npx tsx scripts/bite_score.ts

import { computeBiteDays, ratingFor, fmtTime } from "../src/lib/solunar";
import { fetchConditions } from "../src/lib/weather";

const LAT = -26.2041;
const LNG = 28.0473; // Johannesburg

async function main() {
  const now = new Date();
  const [today] = computeBiteDays(now, 1, LAT, LNG);
  const cond = await fetchConditions(LAT, LNG);
  const mod = cond?.modifier ?? 0;
  const score = Math.max(0, Math.min(100, today.score + mod));
  const { rating } = ratingFor(score);

  const nowMs = now.getTime();
  const nextMajor = today.periods
    .filter((p) => p.type === "major" && p.end.getTime() >= nowMs)
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

  console.log(JSON.stringify({
    score,
    rating,
    moon: `${today.moon.emoji} ${today.moon.name}`,
    nextMajor: nextMajor ? `${fmtTime(nextMajor.start)}–${fmtTime(nextMajor.end)}` : null,
    pressureSummary: cond?.summary ?? null,
  }));
}

main();
