"use client";

import { useEffect, useState } from "react";

const MONTHS: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

function parseDWSDate(s: string): Date | null {
  const m = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[2]];
  if (month === undefined) return null;
  return new Date(parseInt(m[3]), month, parseInt(m[1]));
}

export default function GateNoticeStaleness({ latestDate }: { latestDate: string }) {
  const [daysSince, setDaysSince] = useState<number | null>(null);

  useEffect(() => {
    const parsed = parseDWSDate(latestDate);
    if (!parsed) return;
    const diff = Math.floor((Date.now() - parsed.getTime()) / 86_400_000);
    setDaysSince(diff);
  }, [latestDate]);

  if (daysSince === null || daysSince <= 7) return null;

  const isRed = daysSince > 21;
  const border = isRed ? "border-red-600/50 bg-red-900/10" : "border-amber-600/50 bg-amber-900/10";
  const text   = isRed ? "text-red-400"   : "text-amber-400";
  const icon   = isRed ? "🚨" : "⚠️";

  return (
    <div className={`mt-3 rounded border px-4 py-3 text-sm font-body ${border}`}>
      <span className={`font-bold ${text}`}>
        {icon} DWS last issued gate notices {daysSince} day{daysSince !== 1 ? "s" : ""} ago.
      </span>
      {" "}Conditions may have changed — always verify before fishing near the Vaal River.{" "}
      <a
        href="https://mobi.reservoir.org.za/dws-comms/"
        target="_blank"
        rel="noopener noreferrer"
        className={`underline ${text} hover:opacity-80`}
      >
        Check DWS directly →
      </a>
    </div>
  );
}
