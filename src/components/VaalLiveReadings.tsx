"use client";

import { useEffect, useState } from "react";

type Reading = { station: string; time: string; value: number };
type Live = {
  fetchedAt: string;
  vaalDamCapacity?: Reading;
  vaalDamOutflow: Reading;
  bloemhofCapacity?: Reading;
  bloemhofOutflow: Reading;
};

const MAX_AGE_HOURS = 12;

export function flowLevel(cms: number): "danger" | "caution" | "normal" {
  if (cms >= 500) return "danger";
  if (cms >= 100) return "caution";
  return "normal";
}

const STYLE = {
  danger: { box: "border-red-600/60 bg-red-900/10", text: "text-red-400", label: "High release — avoid the banks" },
  caution: { box: "border-amber-600/60 bg-amber-900/10", text: "text-amber-400", label: "Elevated release — take care" },
  normal: { box: "border-surface-teal bg-deep-water-light", text: "text-teal-300", label: "Low flow — normal conditions" },
};

export default function VaalLiveReadings() {
  const [live, setLive] = useState<Live | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "stale">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/vaal-live.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Live) => {
        if (cancelled) return;
        const ageH = (Date.now() - new Date(d.fetchedAt).getTime()) / 3_600_000;
        setLive(d);
        setState(ageH <= MAX_AGE_HOURS ? "ok" : "stale");
      })
      .catch(() => !cancelled && setState("stale"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") return null;

  if (state === "stale" || !live) {
    return (
      <div className="mb-5 rounded border border-amber-600/50 bg-amber-900/10 px-4 py-3 text-sm font-body">
        <span className="font-bold text-amber-400">⚠️ Live flow readings are temporarily unavailable.</span>{" "}
        Always check current conditions before fishing near the Vaal River.{" "}
        <a href="https://www.dws.gov.za/hydrology/Unverified" target="_blank" rel="noopener noreferrer" className="underline text-amber-400 hover:opacity-80">
          Check DWS directly →
        </a>
      </div>
    );
  }

  const worst = Math.max(live.vaalDamOutflow.value, live.bloemhofOutflow.value);
  const level = flowLevel(worst);
  const s = STYLE[level];
  const cards = [
    { label: "Vaal Dam release", r: live.vaalDamOutflow, cap: live.vaalDamCapacity },
    { label: "Bloemhof release", r: live.bloemhofOutflow, cap: live.bloemhofCapacity },
  ];

  return (
    <div className={`border rounded-lg p-5 mb-5 ${s.box}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className={`font-mono uppercase tracking-wider text-xs ${s.text}`}>Live flow — measured by DWS</p>
        <p className={`text-xs font-mono font-semibold ${s.text}`}>{s.label}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ label, r, cap }) => (
          <div key={label} className="bg-black/20 rounded p-3">
            <p className="text-xs font-mono font-semibold uppercase tracking-wider mb-1 text-blue-300">{label}</p>
            <p className="text-bone-white text-lg font-mono">{r.value.toFixed(r.value < 10 ? 1 : 0)} m³/s</p>
            <p className="text-storm text-xs mt-1 font-mono">
              {cap ? `Dam ${cap.value.toFixed(0)}% full · ` : ""}read {r.time}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs font-body text-storm">
        Unverified near-real-time DWS data, refreshed every few hours. Gate openings can change flow quickly — always check conditions on the day.
      </p>
    </div>
  );
}
