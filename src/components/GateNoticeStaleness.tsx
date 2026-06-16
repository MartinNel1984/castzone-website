"use client";

import { useEffect, useState } from "react";
import type { GateStatus } from "@/data/waterConditions";

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

export default function GateNoticeStaleness({
  latestDate,
  status,
}: {
  latestDate: string;
  status?: GateStatus;
}) {
  const [daysSince, setDaysSince] = useState<number | null>(null);

  useEffect(() => {
    const parsed = parseDWSDate(latestDate);
    if (!parsed) return;
    // Intentional: computed from Date.now() after mount to avoid an SSR/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDaysSince(Math.floor((Date.now() - parsed.getTime()) / 86_400_000));
  }, [latestDate]);

  // Off-season: DWS has closed flood-season reporting (winter / low flow).
  // Show an accurate, reassuring note rather than an alarmist staleness warning.
  if (status?.season === "closed") {
    return (
      <div className="mt-3 rounded border border-teal-600/40 bg-teal-900/10 px-4 py-3 text-sm font-body">
        <span className="font-bold text-teal-300">❄️ Flood-season gate reporting is closed.</span>{" "}
        DWS pauses daily Vaal gate notices over the dry winter
        {status.asOf ? ` (since ${status.asOf})` : ""}. The Vaal is on low / valve
        discharge — generally safe for bank anglers below the wall. Daily alerts
        resume with the summer rains.{" "}
        <a
          href="https://mobi.reservoir.org.za/dws-comms/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-teal-300 hover:opacity-80"
        >
          Check DWS directly →
        </a>
      </div>
    );
  }

  // In-season: warn if the latest dated notice is getting old.
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
