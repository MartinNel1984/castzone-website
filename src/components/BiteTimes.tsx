"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { computeBiteDays, ratingFor, fmtTime, type BiteDay } from "@/lib/solunar";
import { fetchConditions, fetchForecast, type Conditions, type DayForecast } from "@/lib/weather";
import { createClient } from "@/lib/supabase";

// Days of the outlook visible without an account (today + tomorrow).
const FREE_DAYS = 2;

type Props = {
  lat: number;
  lng: number;
  name?: string;
  variant?: "full" | "compact";
  locationLabel?: string;
};

function barColor(v: number): string {
  if (v >= 70) return "#f26522"; // cast orange — prime
  if (v >= 45) return "#f59e0b"; // amber
  if (v >= 20) return "#5b8a8a"; // muted teal
  return "#33474a"; // low
}

const clamp = (v: number) => Math.max(0, Math.min(100, v));

export default function BiteTimes({ lat, lng, name, variant = "full", locationLabel }: Props) {
  // Computed on mount only (client-side) so the current time doesn't get baked
  // into the prerendered HTML and cause a hydration mismatch.
  const [state, setState] = useState<{ days: BiteDay[]; nowMin: number; nowMs: number } | null>(null);
  const [cond, setCond] = useState<Conditions | null>(null);
  const [forecast, setForecast] = useState<DayForecast[] | null>(null);
  // false until we *know* the visitor is logged out, so members never see a flash of the lock
  const [lockedOut, setLockedOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    supabase.auth.getUser().then(({ data }) => { if (active) setLockedOut(!data.user); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLockedOut(!session?.user);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const now = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: client-only mount computation that depends on the wall clock
    setState({
      days: computeBiteDays(now, 7, lat, lng),
      nowMin: now.getHours() * 60 + now.getMinutes(),
      nowMs: now.getTime(),
    });
    let active = true;
    fetchConditions(lat, lng).then((c) => { if (active) setCond(c); });
    fetchForecast(lat, lng).then((f) => { if (active) setForecast(f); });
    return () => { active = false; };
  }, [lat, lng]);

  if (!state) {
    return (
      <div className="bg-deep-water-light border border-surface-teal rounded-lg p-5 mb-6 animate-pulse">
        <div className="h-4 w-40 bg-surface-teal rounded mb-3" />
        <div className="h-20 w-full bg-surface-teal/40 rounded" />
      </div>
    );
  }

  const { days, nowMin, nowMs } = state;
  const today = days[0];
  const mod = cond?.modifier ?? 0;
  const score = clamp(today.score + mod);
  const { rating, color } = ratingFor(score);
  const hourly = today.hourly.map((v) => Math.round(clamp(v * (1 + mod / 100))));
  const majors = today.periods.filter((p) => p.type === "major");
  const minors = today.periods.filter((p) => p.type === "minor");
  const dateLabel = today.date.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });
  const nowIdx = Math.round(nowMin / 30);

  // ---- compact (homepage widget) ----
  if (variant === "compact") {
    const nextMajor = majors
      .filter((p) => p.end.getTime() >= nowMs)
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
    return (
      <Link
        href="/bite-times"
        className="group block bg-deep-water-light border border-surface-teal hover:border-cast-orange rounded-lg p-5 transition-colors"
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-storm text-xs font-body uppercase tracking-wider">Today&apos;s Bite Forecast</p>
          {locationLabel && (
            <span className="text-pale-water text-xs font-body flex items-center gap-1">📍 {locationLabel}</span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-heading font-bold text-4xl leading-none" style={{ color }}>{score}%</span>
          <span className="font-heading font-bold uppercase text-base" style={{ color }}>{rating}</span>
        </div>
        <p className="text-pale-water text-xs font-body mt-1 mb-3">
          {today.moon.emoji} {today.moon.name}
          {forecast?.[0] && <> · {forecast[0].emoji} {forecast[0].tMax}°<span className="text-storm">/{forecast[0].tMin}°</span></>}
          {nextMajor && <> · next prime <span className="text-bone-white">{fmtTime(nextMajor.start)}–{fmtTime(nextMajor.end)}</span></>}
        </p>

        {/* full-width 24h graph */}
        <div className="flex items-end gap-[2px] h-24 bg-deep-water rounded-md p-2" aria-hidden>
          {hourly.map((v, i) => {
            const isNow = i === nowIdx;
            return (
              <div key={i} className="flex-1 flex items-end h-full">
                <div
                  className="w-full rounded-sm"
                  style={{ height: `${Math.max(4, v)}%`, backgroundColor: isNow ? "#f9f7f4" : barColor(v) }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-storm text-[10px] font-body mt-1 px-1">
          <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>12am</span>
        </div>

        <p className="text-cast-orange text-xs font-body mt-3 group-hover:underline">See best bite times for your spot →</p>
      </Link>
    );
  }

  // ---- full (venue page) ----
  return (
    <div className="bg-deep-water-light border border-surface-teal rounded-lg p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-bone-white font-heading font-bold uppercase text-lg flex items-center gap-2">
          🎣 Best Bite Times
        </h2>
        <span className="text-storm text-xs font-body">{dateLabel}</span>
      </div>

      {/* Rating + moon */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-bold text-4xl leading-none" style={{ color }}>{score}%</span>
            <span className="font-heading font-bold uppercase text-base" style={{ color }}>{rating}</span>
          </div>
          <p className="text-storm text-xs font-body mt-1">
            Overall bite rating for today{cond ? "" : " · solunar only"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl leading-none">{today.moon.emoji}</div>
          <p className="text-pale-water text-xs font-body mt-1">{today.moon.name}</p>
          <p className="text-storm text-xs font-body">{Math.round(today.moon.fraction * 100)}% lit</p>
        </div>
      </div>

      {/* Live conditions (Open-Meteo) */}
      {cond && (
        <div className="bg-deep-water border border-surface-teal/60 rounded-md p-3 mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-body">
          <span className="text-pale-water">{cond.trendIcon} {cond.summary}</span>
          <span className="text-storm">🌡 {cond.tempC}°C</span>
          <span className="font-body" style={{ color: mod > 0 ? "#4ade80" : mod < 0 ? "#f59e0b" : "#8a9a9a" }}>
            {mod > 0 ? `+${mod}` : mod} pts from weather
          </span>
        </div>
      )}

      {/* 24h curve */}
      <div className="mb-4">
        <div className="relative flex items-end gap-[2px] h-20 bg-deep-water rounded-md p-2">
          {hourly.map((v, i) => {
            const isNow = i === nowIdx;
            const mm = (i * 30) % 60 === 0 ? "00" : "30";
            return (
              <div key={i} className="flex-1 flex items-end h-full" title={`${String(Math.floor((i * 30) / 60)).padStart(2, "0")}:${mm} · ${v}%`}>
                <div
                  className="w-full rounded-sm transition-all"
                  style={{ height: `${Math.max(4, v)}%`, backgroundColor: isNow ? "#f9f7f4" : barColor(v) }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-storm text-[10px] font-body mt-1 px-1">
          <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>12am</span>
        </div>
      </div>

      {/* Windows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-deep-water border border-cast-orange/30 rounded-md p-3">
          <p className="text-cast-orange text-xs font-heading font-bold uppercase tracking-wider mb-2">Major (prime)</p>
          {majors.length === 0 ? (
            <p className="text-storm text-xs font-body">—</p>
          ) : majors.map((p, i) => (
            <p key={i} className="text-bone-white text-sm font-body font-mono">
              {fmtTime(p.start)} – {fmtTime(p.end)} <span className="text-storm font-sans">· {p.label}</span>
            </p>
          ))}
        </div>
        <div className="bg-deep-water border border-surface-teal rounded-md p-3">
          <p className="text-pale-water text-xs font-heading font-bold uppercase tracking-wider mb-2">Minor</p>
          {minors.length === 0 ? (
            <p className="text-storm text-xs font-body">—</p>
          ) : minors.map((p, i) => (
            <p key={i} className="text-bone-white text-sm font-body font-mono">
              {fmtTime(p.start)} – {fmtTime(p.end)} <span className="text-storm font-sans">· {p.label}</span>
            </p>
          ))}
        </div>
      </div>

      {/* 7-day bite + weather outlook */}
      <div className="mb-4">
        <p className="text-pale-water text-xs font-heading font-bold uppercase tracking-wider mb-2">
          7-Day Outlook{forecast ? " · Bite + Weather" : ""}
        </p>
        <div className="relative grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            const sc = i === 0 ? score : d.score;
            const r = ratingFor(sc);
            const fc = forecast?.[i];
            const locked = lockedOut && i >= FREE_DAYS;
            return (
              <div
                key={i}
                className={`text-center rounded-md py-2 ${i === 0 ? "bg-deep-water border border-cast-orange/40" : "bg-deep-water"} ${locked ? "blur-[5px] select-none pointer-events-none" : ""}`}
                aria-hidden={locked}
                title={locked ? undefined : `${r.rating} · ${sc}%${fc ? ` · ${fc.label}, ${fc.tMin}–${fc.tMax}°C, rain ${fc.rainPct}%, wind up to ${fc.windMax} km/h` : ""}`}
              >
                <p className="text-storm text-[10px] font-body uppercase">
                  {i === 0 ? "Today" : d.date.toLocaleDateString("en-ZA", { weekday: "short" })}
                </p>
                <p className="text-base leading-tight my-0.5">{d.moon.emoji}</p>
                <p className="font-heading font-bold text-sm" style={{ color: r.color }}>{sc}</p>
                {fc && (
                  <div className="border-t border-surface-teal/30 mt-1.5 pt-1">
                    <p className="text-sm leading-tight">{fc.emoji}</p>
                    <p className="text-pale-water text-[10px] font-body leading-tight mt-0.5">
                      {fc.tMax}°<span className="text-storm">/{fc.tMin}°</span>
                    </p>
                    <p className={`text-[10px] font-body leading-tight ${fc.rainPct >= 40 ? "text-blue-300" : "text-storm"}`}>
                      💧{fc.rainPct}%
                    </p>
                  </div>
                )}
              </div>
            );
          })}
          {lockedOut && (
            <Link
              href="/register"
              className="group absolute inset-y-0 right-0 z-10 flex flex-col items-center justify-center text-center rounded-md px-2"
              style={{ left: `${(FREE_DAYS / 7) * 100}%` }}
            >
              <span className="text-xl leading-none mb-1.5">🔒</span>
              <span className="bg-cast-orange group-hover:bg-bone-white text-deep-water text-[11px] sm:text-xs font-heading font-bold uppercase tracking-wider rounded px-2.5 py-1.5 transition-colors">
                Sign up free
              </span>
              <span className="text-pale-water text-[10px] sm:text-[11px] font-body mt-1.5 leading-tight drop-shadow">
                to unlock the full 7-day forecast
              </span>
            </Link>
          )}
        </div>
        {lockedOut ? (
          <p className="text-storm text-[10px] font-body mt-1.5">
            Free members see the full 7-day bite + weather outlook ·{" "}
            <Link href="/login" className="text-cast-orange hover:underline">already a member? Log in</Link>
          </p>
        ) : forecast && (
          <p className="text-storm text-[10px] font-body mt-1.5">
            Weather updates live every time the page loads · tap a day for detail
          </p>
        )}
      </div>

      {/* Sun + disclaimer */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-body">
        <span className="text-pale-water">☀️ Sunrise {fmtTime(today.sunrise)} · Sunset {fmtTime(today.sunset)}</span>
        {name && <span className="text-storm">{name}</span>}
      </div>
      <p className="text-storm text-[11px] font-body mt-3 leading-relaxed border-t border-surface-teal/40 pt-3">
        Combines solunar theory (moon &amp; sun position + moon phase) with live barometric pressure &amp; wind. A popular guide among anglers — not a guarantee. Weather data: Open-Meteo.
      </p>
    </div>
  );
}
