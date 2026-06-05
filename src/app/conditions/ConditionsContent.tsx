"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ALL_DAMS,
  WC_DAMS,
  FS_DAMS,
  GATE_NOTICES,
  DATA_UPDATED,
  NATIONAL_AVG,
  type DamLevel,
} from "@/data/waterConditions";

// ─── helpers ──────────────────────────────────────────────────────────────

function levelTextClass(pct: number) {
  if (pct > 100) return "text-purple-400";
  if (pct >= 80)  return "text-green-400";
  if (pct >= 60)  return "text-amber-400";
  if (pct >= 30)  return "text-orange-400";
  return "text-red-400";
}

function levelBadgeClass(pct: number) {
  if (pct > 100) return "bg-purple-900/40 border-purple-600 text-purple-300";
  if (pct >= 80)  return "bg-green-900/40 border-green-700 text-green-300";
  if (pct >= 60)  return "bg-amber-900/40 border-amber-600 text-amber-300";
  if (pct >= 30)  return "bg-orange-900/40 border-orange-600 text-orange-300";
  return "bg-red-900/40 border-red-700 text-red-300";
}

function levelBarColor(pct: number) {
  if (pct > 100) return "#a855f7";
  if (pct >= 80)  return "#22c55e";
  if (pct >= 60)  return "#f59e0b";
  if (pct >= 30)  return "#f97316";
  return "#ef4444";
}

function deltaLabel(now: number, prev: number) {
  const d = +(now - prev).toFixed(1);
  if (Math.abs(d) < 0.05) return <span className="text-storm text-xs">—</span>;
  return d > 0
    ? <span className="text-green-400 text-xs font-body">▲ {Math.abs(d)}%</span>
    : <span className="text-red-400 text-xs font-body">▼ {Math.abs(d)}%</span>;
}

function provinceSummary(dams: DamLevel[]) {
  const totalFSC = dams.reduce((a, d) => a + d.fsc, 0);
  const weightedPct = dams.reduce((a, d) => a + d.fsc * d.pct, 0) / totalFSC;
  const above80 = dams.filter((d) => d.pct >= 80).length;
  const below50 = dams.filter((d) => d.pct < 50).length;
  return { totalFSC, weightedPct, above80, below50 };
}

const PROVINCES = [
  { key: "wc", label: "Western Cape", dams: WC_DAMS },
  { key: "fs", label: "Free State",   dams: FS_DAMS },
];

type SortKey = "name" | "pct" | "fsc";

// ─── component ────────────────────────────────────────────────────────────

export default function ConditionsContent() {
  const [province, setProvince] = useState<"wc" | "fs">("wc");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fsc");
  const [sortAsc, setSortAsc] = useState(false);
  const [showAllNotices, setShowAllNotices] = useState(false);

  const activeDams = province === "wc" ? WC_DAMS : FS_DAMS;

  const displayedDams = useMemo(() => {
    let list = activeDams.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.river.toLowerCase().includes(search.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      let diff = 0;
      if (sortKey === "name") diff = a.name.localeCompare(b.name);
      if (sortKey === "pct")  diff = a.pct - b.pct;
      if (sortKey === "fsc")  diff = a.fsc - b.fsc;
      return sortAsc ? diff : -diff;
    });
    return list;
  }, [activeDams, search, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  const summary = provinceSummary(displayedDams.length === activeDams.length ? activeDams : displayedDams);
  const nationalSummary = provinceSummary(ALL_DAMS);

  const latestNotices  = GATE_NOTICES.filter((n) => n.latest);
  const visibleNotices = showAllNotices ? GATE_NOTICES : GATE_NOTICES.slice(0, 6);

  function SortTh({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <th
        onClick={() => toggleSort(col)}
        className="px-4 py-3 text-left text-xs font-heading font-bold uppercase tracking-wider text-storm cursor-pointer hover:text-pale-water select-none whitespace-nowrap"
      >
        {label}{" "}
        {active ? (sortAsc ? "↑" : "↓") : <span className="opacity-30">↕</span>}
      </th>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-5xl font-heading font-bold text-bone-white uppercase">
            Water Conditions
          </h1>
          <p className="text-cast-orange font-heading font-semibold uppercase tracking-widest text-sm mt-1">
            Live dam levels &amp; Vaal system gate alerts
          </p>
        </div>
        <div className="text-xs font-body text-storm bg-deep-water-light border border-surface-teal rounded px-3 py-2 self-start mt-1">
          DWS data updated <span className="text-pale-water font-medium">{DATA_UPDATED}</span>
          <span className="mx-2">·</span>
          Next update <span className="text-pale-water font-medium">Mon 8 Jun 2026</span>
        </div>
      </div>

      {/* ── National stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "National Average",  value: `${NATIONAL_AVG}%`,         sub: `${ALL_DAMS.length} dams tracked`,          cls: "text-cast-orange" },
          { label: "Western Cape",      value: `${provinceSummary(WC_DAMS).weightedPct.toFixed(1)}%`, sub: `${WC_DAMS.length} dams · 1 918 Mm³`,  cls: levelTextClass(provinceSummary(WC_DAMS).weightedPct) },
          { label: "Free State",        value: `${provinceSummary(FS_DAMS).weightedPct.toFixed(1)}%`, sub: `${FS_DAMS.length} dams · 15 665 Mm³`, cls: levelTextClass(provinceSummary(FS_DAMS).weightedPct) },
          { label: "Vaal Dam Gates",    value: "CLOSED",                    sub: "Season reporting closed",                  cls: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="bg-deep-water-light border border-surface-teal rounded-lg p-4">
            <div className="text-xs font-heading font-bold uppercase tracking-wider text-storm mb-1">{s.label}</div>
            <div className={`text-2xl font-heading font-bold ${s.cls}`}>{s.value}</div>
            <div className="text-xs font-body text-storm mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Gate Alert Panel ── */}
      <div className="border border-amber-700/50 rounded-lg overflow-hidden mb-8">
        <div className="bg-amber-900/20 border-b border-amber-700/50 px-5 py-3 flex items-center gap-3 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
          <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-amber-300">
            Vaal System — Gate &amp; Discharge Operations
          </h2>
          <span className="ml-auto text-xs font-body bg-green-900/40 border border-green-700 text-green-300 px-2 py-0.5 rounded">
            Season Closed
          </span>
        </div>

        <div className="bg-deep-water-light grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
          {/* Vaal Dam */}
          <div className="border border-surface-teal rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-heading font-bold uppercase text-bone-white">Vaal Dam</h3>
              <span className="text-xs font-body bg-green-900/40 border border-green-700 text-green-300 px-2 py-0.5 rounded uppercase tracking-wider">
                Gates Closed
              </span>
            </div>
            <div className="space-y-2 text-sm font-body">
              <div className="flex justify-between border-b border-surface-teal pb-2">
                <span className="text-storm">Status</span>
                <span className="text-green-400 font-medium">All gates closed</span>
              </div>
              <div className="flex justify-between border-b border-surface-teal pb-2">
                <span className="text-storm">Last gate closed</span>
                <span className="text-pale-water">19 May 2026 · 12:00</span>
              </div>
              <div className="flex justify-between border-b border-surface-teal pb-2">
                <span className="text-storm">Current release</span>
                <span className="text-pale-water">Valve discharge only</span>
              </div>
              <div className="flex justify-between border-b border-surface-teal pb-2">
                <span className="text-storm">Flow rate</span>
                <span className="text-pale-water">≈ 16.7 m³/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-storm">Dam level</span>
                <span className={`font-bold ${levelTextClass(106.1)}`}>106.1%</span>
              </div>
            </div>
            <div className="mt-3 border-l-2 border-amber-500 pl-3 text-xs font-body text-amber-300">
              Safe conditions for bank anglers downstream. Season reporting closed — gates will remain shut until next significant rainfall event.
            </div>
          </div>

          {/* Bloemhof Dam */}
          <div className="border border-surface-teal rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-heading font-bold uppercase text-bone-white">Bloemhof Dam</h3>
              <span className="text-xs font-body bg-amber-900/40 border border-amber-600 text-amber-300 px-2 py-0.5 rounded uppercase tracking-wider">
                Controlled
              </span>
            </div>
            <div className="space-y-2 text-sm font-body">
              <div className="flex justify-between border-b border-surface-teal pb-2">
                <span className="text-storm">Status</span>
                <span className="text-amber-400 font-medium">Controlled release</span>
              </div>
              <div className="flex justify-between border-b border-surface-teal pb-2">
                <span className="text-storm">Current discharge</span>
                <span className="text-pale-water font-medium">250 m³/s</span>
              </div>
              <div className="flex justify-between border-b border-surface-teal pb-2">
                <span className="text-storm">Last notice</span>
                <span className="text-pale-water">19 May 2026</span>
              </div>
              <div className="flex justify-between border-b border-surface-teal pb-2">
                <span className="text-storm">Previous</span>
                <span className="text-pale-water">700 m³/s (12 May)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-storm">Dam level</span>
                <span className={`font-bold ${levelTextClass(104.6)}`}>104.6%</span>
              </div>
            </div>
            <div className="mt-3 border-l-2 border-amber-500 pl-3 text-xs font-body text-amber-300">
              Discharge stepping down steadily since January. Exercise caution near banks on the Vaal below Bloemhof — elevated but stable and falling.
            </div>
          </div>

          {/* River Safety */}
          <div className="sm:col-span-2 border border-red-900/50 rounded-lg p-4 bg-red-900/10">
            <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Angler Safety — Vaal River Sections
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { section: "Vaal Dam → Barrage", status: "Safe", statusCls: "bg-green-900/40 border-green-700 text-green-300", detail: "Valve only · ~16.7 m³/s · Ideal for bank fishing" },
                { section: "Barrage → Bloemhof", status: "Caution", statusCls: "bg-amber-900/40 border-amber-600 text-amber-300", detail: "250 m³/s controlled · Elevated but stable" },
                { section: "Below Bloemhof → Confluence", status: "Caution", statusCls: "bg-amber-900/40 border-amber-600 text-amber-300", detail: "Downstream release · Stay clear of deep channels" },
                { section: "Harts River", status: "Safe", statusCls: "bg-green-900/40 border-green-700 text-green-300", detail: "Normal levels · No active operations" },
              ].map((r) => (
                <div key={r.section} className="flex items-start gap-3 text-xs font-body py-1.5 border-b border-red-900/30 last:border-0">
                  <span className={`flex-shrink-0 border rounded px-2 py-0.5 font-bold uppercase tracking-wider ${r.statusCls}`}>
                    {r.status}
                  </span>
                  <div>
                    <div className="text-pale-water font-medium">{r.section}</div>
                    <div className="text-storm mt-0.5">{r.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Province Tabs + Dam Table ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <h2 className="text-xl font-heading font-bold text-bone-white uppercase">Dam Levels</h2>
          <div className="flex bg-deep-water-light border border-surface-teal rounded-lg p-1 gap-1">
            {PROVINCES.map((p) => (
              <button
                key={p.key}
                onClick={() => { setProvince(p.key as "wc" | "fs"); setSearch(""); }}
                className={`px-4 py-1.5 rounded text-xs font-heading font-bold uppercase tracking-wider transition-colors ${
                  province === p.key
                    ? "bg-cast-orange text-white"
                    : "text-pale-water hover:text-bone-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {[
            { label: "Weighted avg",    value: `${summary.weightedPct.toFixed(1)}%`,      cls: levelTextClass(summary.weightedPct) },
            { label: "Total FSC",       value: `${summary.totalFSC.toFixed(0)} Mm³`,      cls: "text-pale-water" },
            { label: "Dams shown",      value: `${displayedDams.length}`,                 cls: "text-pale-water" },
            { label: "Above 80%",       value: `${summary.above80}`,                      cls: "text-green-400" },
            { label: "Below 50%",       value: `${summary.below50}`,                      cls: summary.below50 > 0 ? "text-red-400" : "text-storm" },
          ].map((s) => (
            <div key={s.label} className="bg-deep-water-light border border-surface-teal rounded p-2.5 text-center">
              <div className="text-xs font-body text-storm">{s.label}</div>
              <div className={`text-lg font-heading font-bold ${s.cls}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Level legend */}
        <div className="flex flex-wrap gap-3 mb-3 text-xs font-body">
          {[
            { label: "Overflow >100%", cls: "bg-purple-900/40 border-purple-600 text-purple-300" },
            { label: "Full 80–100%",   cls: "bg-green-900/40 border-green-700 text-green-300" },
            { label: "Good 60–80%",    cls: "bg-amber-900/40 border-amber-600 text-amber-300" },
            { label: "Low 30–60%",     cls: "bg-orange-900/40 border-orange-600 text-orange-300" },
            { label: "Critical <30%",  cls: "bg-red-900/40 border-red-700 text-red-300" },
          ].map((l) => (
            <span key={l.label} className={`border rounded px-2 py-0.5 ${l.cls}`}>{l.label}</span>
          ))}
        </div>

        {/* Search + sort controls */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dam or river…"
            className="bg-deep-water-light border border-surface-teal rounded px-3 py-2 text-sm font-body text-bone-white placeholder-storm focus:outline-none focus:border-cast-orange w-52"
          />
          <div className="flex gap-1">
            {(["fsc", "pct", "name"] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => toggleSort(k)}
                className={`px-3 py-2 rounded text-xs font-heading font-bold uppercase tracking-wider border transition-colors ${
                  sortKey === k
                    ? "bg-cast-orange border-cast-orange text-white"
                    : "border-surface-teal text-pale-water hover:border-cast-orange"
                }`}
              >
                {k === "fsc" ? "Size" : k === "pct" ? "% Full" : "A–Z"}
                {sortKey === k && (sortAsc ? " ↑" : " ↓")}
              </button>
            ))}
          </div>
        </div>

        {/* Dam table */}
        <div className="rounded-lg border border-surface-teal overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="bg-deep-water border-b border-surface-teal">
                  <SortTh col="name" label="Dam" />
                  <th className="px-4 py-3 text-left text-xs font-heading font-bold uppercase tracking-wider text-storm">River</th>
                  <SortTh col="fsc"  label="FSC (Mm³)" />
                  <SortTh col="pct"  label="This Week" />
                  <th className="px-4 py-3 text-left text-xs font-heading font-bold uppercase tracking-wider text-storm">Last Wk</th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-bold uppercase tracking-wider text-storm">Last Yr</th>
                  <th className="px-4 py-3 text-left text-xs font-heading font-bold uppercase tracking-wider text-storm">vs Last Yr</th>
                </tr>
              </thead>
              <tbody>
                {displayedDams.map((dam) => (
                  <tr
                    key={dam.name}
                    className="border-b border-surface-teal/50 hover:bg-surface-teal/10 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {dam.venueSlug ? (
                        <Link
                          href={`/venues/${dam.venueSlug}`}
                          className="font-heading font-bold text-bone-white hover:text-cast-orange transition-colors text-sm"
                        >
                          {dam.name}
                        </Link>
                      ) : (
                        <span className="font-heading font-bold text-bone-white text-sm">{dam.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-body text-storm">{dam.river}</td>
                    <td className="px-4 py-3 text-sm font-body text-pale-water">{dam.fsc.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* bar */}
                        <div className="w-16 h-2 rounded-full bg-surface-teal/30 overflow-hidden flex-shrink-0">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(dam.pct, 100)}%`,
                              backgroundColor: levelBarColor(dam.pct),
                            }}
                          />
                        </div>
                        <span className={`text-sm font-heading font-bold whitespace-nowrap ${levelTextClass(dam.pct)}`}>
                          {dam.pct}%
                          {dam.pct > 100 && (
                            <span className="ml-1 text-xs border border-purple-600 text-purple-300 rounded px-1 py-0.5 font-body">OVF</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-body text-storm">{dam.lastWeek}%</td>
                    <td className="px-4 py-3 text-sm font-body text-storm">{dam.lastYear}%</td>
                    <td className="px-4 py-3">{deltaLabel(dam.pct, dam.lastYear)}</td>
                  </tr>
                ))}
                {displayedDams.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-storm font-body text-sm">
                      No dams match &ldquo;{search}&rdquo;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs font-body text-storm mt-2">
          Dam name links to venue page · FSC = Full Storage Capacity · Source: DWS Weekly State of Dams
        </p>
      </div>

      {/* ── Gate Notices History ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-xl font-heading font-bold text-bone-white uppercase">Gate Notice History</h2>
          <a
            href="https://mobi.reservoir.org.za/dws-comms/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-body text-cast-orange hover:text-bone-white transition-colors"
          >
            View on VB Hydrology →
          </a>
        </div>

        <div className="border border-surface-teal rounded-lg overflow-hidden">
          {visibleNotices.map((notice, i) => (
            <div
              key={i}
              className={`px-4 py-3 border-b border-surface-teal/50 last:border-0 ${
                notice.latest ? "bg-amber-900/10 border-l-2 border-l-amber-500" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-body text-storm">{notice.date}</span>
                <span className={`text-xs font-heading font-bold uppercase tracking-wider border rounded px-2 py-0.5 ${
                  notice.dam === "vaal"
                    ? "bg-green-900/30 border-green-700 text-green-300"
                    : notice.dam === "barrage"
                    ? "bg-purple-900/30 border-purple-700 text-purple-300"
                    : "bg-amber-900/30 border-amber-600 text-amber-300"
                }`}>
                  {notice.dam === "bloemhof" ? "Bloemhof" : notice.dam === "barrage" ? "Barrage" : "Vaal Dam"}
                </span>
                {notice.latest && (
                  <span className="text-xs font-body text-green-400 font-medium">Latest</span>
                )}
              </div>
              <p className="text-sm font-body text-pale-water">{notice.text}</p>
            </div>
          ))}
        </div>

        {GATE_NOTICES.length > 6 && (
          <button
            onClick={() => setShowAllNotices((v) => !v)}
            className="mt-3 text-sm font-body text-cast-orange hover:text-bone-white transition-colors"
          >
            {showAllNotices
              ? "Show less ↑"
              : `Show all ${GATE_NOTICES.length} notices ↓`}
          </button>
        )}
      </div>

      {/* ── Footer note ── */}
      <div className="border-t border-surface-teal pt-5 text-xs font-body text-storm space-y-1">
        <p>Data sourced from <a href="https://www.dws.gov.za/hydrology/" target="_blank" rel="noopener noreferrer" className="text-cast-orange hover:text-bone-white">DWS Hydrological Services</a> and <a href="https://mobi.reservoir.org.za/dws-comms/" target="_blank" rel="noopener noreferrer" className="text-cast-orange hover:text-bone-white">VB Hydrology (DWS Comms)</a>. Updated weekly every Monday. CastZone does not warrant the accuracy of DWS data — always exercise caution near water.</p>
      </div>

    </div>
  );
}
