// Solunar bite-time engine for CastZone.
//
// Computes sun/moon rise, set, transit (overhead) and anti-transit (underfoot)
// times, the moon phase, and a "bite likelihood" score + hourly curve based on
// Solunar Theory (major periods at moon overhead/underfoot, minor periods at
// moonrise/moonset, boosted around new & full moon).
//
// The astronomy formulas are the low-precision algorithms popularised by
// SunCalc (Vladimir Agafonkin, BSD-2) — accurate to a minute or two, which is
// plenty for fishing windows. No external dependencies, runs in the browser.
//
// NOTE: Solunar theory is a popular angler's heuristic, not exact science.
// We present it as guidance, never a guarantee.

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const E = RAD * 23.4397; // obliquity of the Earth

function toJulian(date: Date): number {
  return date.valueOf() / DAY_MS - 0.5 + J1970;
}
function toDays(date: Date): number {
  return toJulian(date) - J2000;
}

function rightAscension(l: number, b: number): number {
  return Math.atan2(Math.sin(l) * Math.cos(E) - Math.tan(b) * Math.sin(E), Math.cos(l));
}
function declination(l: number, b: number): number {
  return Math.asin(Math.sin(b) * Math.cos(E) + Math.cos(b) * Math.sin(E) * Math.sin(l));
}
function altitude(H: number, phi: number, dec: number): number {
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
}
function siderealTime(d: number, lw: number): number {
  return RAD * (280.16 + 360.9856235 * d) - lw;
}
function astroRefraction(h: number): number {
  if (h < 0) h = 0;
  return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179));
}

// --- sun ---
function solarMeanAnomaly(d: number): number {
  return RAD * (357.5291 + 0.98560028 * d);
}
function eclipticLongitude(M: number): number {
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = RAD * 102.9372;
  return M + C + P + Math.PI;
}
function sunCoords(d: number) {
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);
  return { dec: declination(L, 0), ra: rightAscension(L, 0) };
}

// --- moon ---
function moonCoords(d: number) {
  const L = RAD * (218.316 + 13.176396 * d);
  const M = RAD * (134.963 + 13.064993 * d);
  const F = RAD * (93.272 + 13.229350 * d);
  const l = L + RAD * 6.289 * Math.sin(M);
  const b = RAD * 5.128 * Math.sin(F);
  const dt = 385001 - 20905 * Math.cos(M);
  return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt };
}

function sunAltitude(date: Date, lat: number, lng: number): number {
  const lw = RAD * -lng;
  const phi = RAD * lat;
  const d = toDays(date);
  const c = sunCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  return altitude(H, phi, c.dec);
}

function moonAltitude(date: Date, lat: number, lng: number): number {
  const lw = RAD * -lng;
  const phi = RAD * lat;
  const d = toDays(date);
  const c = moonCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  const h = altitude(H, phi, c.dec);
  return h + astroRefraction(h);
}

export type MoonPhase = {
  fraction: number; // illuminated fraction 0..1
  phase: number; // 0 new -> 0.5 full -> 1 new
  name: string;
  emoji: string;
};

export function getMoonPhase(date: Date): MoonPhase {
  const d = toDays(date);
  const s = sunCoords(d);
  const m = moonCoords(d);
  const sdist = 149598000;
  const phi = Math.acos(
    Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra)
  );
  const inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi));
  const angle = Math.atan2(
    Math.cos(s.dec) * Math.sin(s.ra - m.ra),
    Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra)
  );
  const fraction = (1 + Math.cos(inc)) / 2;
  const phase = 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI;

  const phases: [number, string, string][] = [
    [0.0, "New Moon", "🌑"],
    [0.125, "Waxing Crescent", "🌒"],
    [0.25, "First Quarter", "🌓"],
    [0.375, "Waxing Gibbous", "🌔"],
    [0.5, "Full Moon", "🌕"],
    [0.625, "Waning Gibbous", "🌖"],
    [0.75, "Last Quarter", "🌗"],
    [0.875, "Waning Crescent", "🌘"],
  ];
  let best = phases[0];
  let bestD = 1;
  for (const p of phases) {
    let dd = Math.abs(phase - p[0]);
    dd = Math.min(dd, 1 - dd);
    if (dd < bestD) { bestD = dd; best = p; }
  }
  return { fraction, phase, name: best[1], emoji: best[2] };
}

// Scan a 24h local-day for events: returns minutes-from-midnight where altitude
// crosses targets (rise/set) and local extremes (transit/anti-transit).
type Events = { rise?: Date; set?: Date; transit?: Date; antitransit?: Date };

function scanEvents(
  dayStart: Date,
  lat: number,
  lng: number,
  altFn: (d: Date, la: number, ln: number) => number,
  riseTarget: number
): Events {
  const stepMin = 5;
  const steps = (24 * 60) / stepMin;
  let prevAlt = altFn(dayStart, lat, lng);
  let prevSlope = 0;
  let maxAlt = -Infinity, minAlt = Infinity;
  const ev: Events = {};

  for (let i = 1; i <= steps; i++) {
    const t = new Date(dayStart.getTime() + i * stepMin * 60000);
    const alt = altFn(t, lat, lng);

    // rise / set: crossing of riseTarget
    if (prevAlt < riseTarget && alt >= riseTarget && !ev.rise) {
      ev.rise = refineCross(t, stepMin, lat, lng, altFn, riseTarget, true);
    }
    if (prevAlt >= riseTarget && alt < riseTarget && !ev.set) {
      ev.set = refineCross(t, stepMin, lat, lng, altFn, riseTarget, false);
    }

    // transit (local max) / anti-transit (local min) via slope sign change
    const slope = alt - prevAlt;
    if (prevSlope > 0 && slope <= 0 && alt > maxAlt) {
      maxAlt = alt;
      ev.transit = new Date(t.getTime() - stepMin * 30000); // mid of step
    }
    if (prevSlope < 0 && slope >= 0 && alt < minAlt) {
      minAlt = alt;
      ev.antitransit = new Date(t.getTime() - stepMin * 30000);
    }
    prevSlope = slope;
    prevAlt = alt;
  }
  return ev;
}

function refineCross(
  after: Date, stepMin: number, lat: number, lng: number,
  altFn: (d: Date, la: number, ln: number) => number, target: number, rising: boolean
): Date {
  let lo = after.getTime() - stepMin * 60000;
  let hi = after.getTime();
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    const a = altFn(new Date(mid), lat, lng);
    const above = a >= target;
    if (above === rising) hi = mid; else lo = mid;
  }
  return new Date((lo + hi) / 2);
}

export type BitePeriod = { start: Date; end: Date; type: "major" | "minor"; label: string };

export type BiteDay = {
  date: Date;
  score: number; // 0..100 day rating
  rating: string; // Slow / Fair / Good / Excellent
  ratingColor: string; // hex
  moon: MoonPhase;
  sunrise?: Date;
  sunset?: Date;
  periods: BitePeriod[];
  hourly: number[]; // 48 values (every 30 min) 0..100 for the day curve
};

function bump(minutesNow: number, center: number, peak: number, sigmaMin: number): number {
  const dx = minutesNow - center;
  return peak * Math.exp(-(dx * dx) / (2 * sigmaMin * sigmaMin));
}

export function computeBiteDay(date: Date, lat: number, lng: number): BiteDay {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const moon = getMoonPhase(new Date(dayStart.getTime() + 12 * 3600000));

  // sun: standard rise/set altitude -0.833°
  const sunEv = scanEvents(dayStart, lat, lng, sunAltitude, RAD * -0.833);
  // moon: rise/set near horizon with parallax ~ +0.125°
  const moonEv = scanEvents(dayStart, lat, lng, moonAltitude, RAD * 0.125);

  const periods: BitePeriod[] = [];
  const minutesOf = (d?: Date) => (d ? (d.getTime() - dayStart.getTime()) / 60000 : null);

  const majorCenters: number[] = [];
  const minorCenters: number[] = [];

  if (moonEv.transit) {
    const m = minutesOf(moonEv.transit)!;
    majorCenters.push(m);
    periods.push({ start: new Date(moonEv.transit.getTime() - 60 * 60000), end: new Date(moonEv.transit.getTime() + 60 * 60000), type: "major", label: "Moon overhead" });
  }
  if (moonEv.antitransit) {
    const m = minutesOf(moonEv.antitransit)!;
    majorCenters.push(m);
    periods.push({ start: new Date(moonEv.antitransit.getTime() - 60 * 60000), end: new Date(moonEv.antitransit.getTime() + 60 * 60000), type: "major", label: "Moon underfoot" });
  }
  if (moonEv.rise) {
    minorCenters.push(minutesOf(moonEv.rise)!);
    periods.push({ start: new Date(moonEv.rise.getTime() - 30 * 60000), end: new Date(moonEv.rise.getTime() + 30 * 60000), type: "minor", label: "Moonrise" });
  }
  if (moonEv.set) {
    minorCenters.push(minutesOf(moonEv.set)!);
    periods.push({ start: new Date(moonEv.set.getTime() - 30 * 60000), end: new Date(moonEv.set.getTime() + 30 * 60000), type: "minor", label: "Moonset" });
  }

  const sunCenters: number[] = [];
  if (sunEv.rise) sunCenters.push(minutesOf(sunEv.rise)!);
  if (sunEv.set) sunCenters.push(minutesOf(sunEv.set)!);

  // moon phase boost: high near new (0) & full (0.5 of "phase"), low at quarters
  const phaseScore = Math.abs(moon.fraction - 0.5) * 2; // 1 at new/full, 0 at quarter
  const dayScale = 0.55 + 0.45 * phaseScore;

  // hourly curve every 30 min
  const hourly: number[] = [];
  for (let i = 0; i < 48; i++) {
    const m = i * 30;
    let v = 8; // baseline
    for (const c of majorCenters) v = Math.max(v, bump(m, c, 100, 75));
    for (const c of minorCenters) v = Math.max(v, bump(m, c, 62, 50));
    for (const c of sunCenters) v = Math.max(v, bump(m, c, 45, 55));
    v *= dayScale;
    hourly.push(Math.round(Math.max(0, Math.min(100, v))));
  }

  const score = Math.round(Math.max(0, Math.min(100, 38 + 57 * phaseScore)));
  let rating = "Slow", ratingColor = "#8a9a9a";
  if (score >= 80) { rating = "Excellent"; ratingColor = "#4ade80"; }
  else if (score >= 60) { rating = "Good"; ratingColor = "#a3e635"; }
  else if (score >= 42) { rating = "Fair"; ratingColor = "#facc15"; }
  else { rating = "Slow"; ratingColor = "#9aa5a5"; }

  // order periods chronologically
  periods.sort((a, b) => a.start.getTime() - b.start.getTime());

  return {
    date: dayStart,
    score,
    rating,
    ratingColor,
    moon,
    sunrise: sunEv.rise,
    sunset: sunEv.set,
    periods,
    hourly,
  };
}

// Compute solunar bite days for `n` consecutive days starting at `date`.
export function computeBiteDays(date: Date, n: number, lat: number, lng: number): BiteDay[] {
  const out: BiteDay[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + i, 12, 0, 0, 0);
    out.push(computeBiteDay(d, lat, lng));
  }
  return out;
}

export function ratingFor(score: number): { rating: string; color: string } {
  if (score >= 80) return { rating: "Excellent", color: "#4ade80" };
  if (score >= 60) return { rating: "Good", color: "#a3e635" };
  if (score >= 42) return { rating: "Fair", color: "#facc15" };
  return { rating: "Slow", color: "#9aa5a5" };
}

export function fmtTime(d?: Date): string {
  if (!d) return "—";
  return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
}
