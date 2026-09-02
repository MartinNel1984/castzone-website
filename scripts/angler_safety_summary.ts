// Prints a short Angler Safety / Vaal River dam summary as one JSON line,
// for the WhatsApp digest. Reads the same committed data the site renders
// (src/data/waterConditions.ts) — no live fetch, so it's always in sync with
// whatever the DWS scraper (Home Server cron) last wrote.
//
// Usage: npx tsx scripts/angler_safety_summary.ts

import { ALL_DAMS, GATE_NOTICES, GATE_STATUS, DATA_UPDATED } from "../src/data/waterConditions";

function vaalAlertLevel(text: string): "danger" | "caution" | "normal" {
  const m = text.match(/(\d[\d\s]*)\s*m³\/s/i);
  if (!m) return "normal";
  const cms = parseInt(m[1].replace(/\s/g, ""), 10);
  if (cms >= 500) return "danger";
  if (cms >= 100) return "caution";
  return "normal";
}

function dam(name: string) {
  return ALL_DAMS.find((d) => d.name === name);
}

function main() {
  const vaalDam = dam("Vaal Dam");
  const bloemhofDam = dam("Bloemhof Dam");
  const gariepDam = dam("Gariep Dam");

  const latestVaal = GATE_NOTICES.find((n) => n.dam === "vaal" && n.latest);
  const latestBloemhof = GATE_NOTICES.find((n) => n.dam === "bloemhof" && n.latest);
  const latestBarrage = GATE_NOTICES.find((n) => n.dam === "barrage" && n.latest);
  const level = latestBloemhof ? vaalAlertLevel(latestBloemhof.text) : "normal";

  console.log(JSON.stringify({
    dataUpdated: DATA_UPDATED,
    season: GATE_STATUS.season,
    level,
    vaalPct: vaalDam?.pct ?? null,
    bloemhofPct: bloemhofDam?.pct ?? null,
    gariepPct: gariepDam?.pct ?? null,
    vaalNotice: latestVaal ? { text: latestVaal.text, date: latestVaal.date } : null,
    bloemhofNotice: latestBloemhof ? { text: latestBloemhof.text, date: latestBloemhof.date } : null,
    barrageNotice: latestBarrage ? { text: latestBarrage.text, date: latestBarrage.date } : null,
  }));
}

main();
