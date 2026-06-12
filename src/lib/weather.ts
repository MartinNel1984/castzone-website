// Live conditions from Open-Meteo (free, no API key, CORS-enabled) used to
// sharpen the solunar bite score. Barometric pressure TREND is the big one for
// fish: falling pressure ahead of a front = aggressive feeding; rising pressure
// after a front = slow. We also factor strong wind.

export type Conditions = {
  pressure: number; // hPa now
  pressure3hAgo: number;
  trend3h: number; // hPa change over last 3h (negative = falling)
  windKmh: number;
  tempC: number;
  modifier: number; // -15..+15 added to the solunar score
  trendIcon: string;
  summary: string;
};

export type DayForecast = {
  date: string; // YYYY-MM-DD (location's timezone)
  emoji: string;
  label: string;
  tMax: number; // °C
  tMin: number; // °C
  rainPct: number; // max precipitation probability for the day, 0-100
  windMax: number; // km/h
};

// WMO weather interpretation codes → display
function wmoIcon(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: "☀️", label: "Clear" };
  if (code === 1) return { emoji: "🌤️", label: "Mostly clear" };
  if (code === 2) return { emoji: "⛅", label: "Partly cloudy" };
  if (code === 3) return { emoji: "☁️", label: "Overcast" };
  if (code === 45 || code === 48) return { emoji: "🌫️", label: "Fog" };
  if (code >= 51 && code <= 57) return { emoji: "🌦️", label: "Drizzle" };
  if (code >= 61 && code <= 67) return { emoji: "🌧️", label: "Rain" };
  if (code >= 71 && code <= 77) return { emoji: "🌨️", label: "Snow" };
  if (code >= 80 && code <= 82) return { emoji: "🌧️", label: "Showers" };
  if (code >= 95) return { emoji: "⛈️", label: "Thunderstorm" };
  return { emoji: "🌥️", label: "Cloudy" };
}

// 7-day daily forecast. Fetched live in the visitor's browser, so it is always
// current — no scheduled refresh needed.
export async function fetchForecast(lat: number, lng: number): Promise<DayForecast[] | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
      `&forecast_days=7&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const d = data?.daily;
    const dates: string[] = d?.time ?? [];
    if (dates.length === 0) return null;
    return dates.map((date, i) => {
      const { emoji, label } = wmoIcon(d.weather_code?.[i] ?? -1);
      return {
        date,
        emoji,
        label,
        tMax: Math.round(d.temperature_2m_max?.[i] ?? 0),
        tMin: Math.round(d.temperature_2m_min?.[i] ?? 0),
        rainPct: Math.round(d.precipitation_probability_max?.[i] ?? 0),
        windMax: Math.round(d.wind_speed_10m_max?.[i] ?? 0),
      };
    });
  } catch {
    return null;
  }
}

export async function fetchConditions(lat: number, lng: number): Promise<Conditions | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&hourly=pressure_msl,wind_speed_10m,temperature_2m` +
      `&past_days=1&forecast_days=1&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const times: string[] = data?.hourly?.time ?? [];
    const pres: number[] = data?.hourly?.pressure_msl ?? [];
    const wind: number[] = data?.hourly?.wind_speed_10m ?? [];
    const temp: number[] = data?.hourly?.temperature_2m ?? [];
    if (times.length === 0 || pres.length === 0) return null;

    // find index nearest to "now" (Open-Meteo times are in the location's tz, no offset suffix)
    const now = new Date();
    const pad = (x: number) => String(x).padStart(2, "0");
    const nowKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`;
    let idx = times.indexOf(nowKey);
    if (idx === -1) {
      // fallback: last non-null pressure reading
      idx = pres.length - 1;
      while (idx > 0 && pres[idx] == null) idx--;
    }
    const i3 = Math.max(0, idx - 3);
    const pNow = pres[idx];
    const pPrev = pres[i3];
    const trend = +(pNow - pPrev).toFixed(1);
    const windKmh = Math.round(wind[idx] ?? 0);
    const tempC = Math.round(temp[idx] ?? 0);

    // pressure trend -> modifier
    let pMod = 0;
    let trendIcon = "▬";
    let trendWord = "steady";
    if (trend <= -2) { pMod = 13; trendIcon = "🔻"; trendWord = "falling fast"; }
    else if (trend <= -0.7) { pMod = 7; trendIcon = "🔻"; trendWord = "falling"; }
    else if (trend < 0.7) { pMod = 0; trendIcon = "▬"; trendWord = "steady"; }
    else if (trend < 2) { pMod = -6; trendIcon = "🔺"; trendWord = "rising"; }
    else { pMod = -10; trendIcon = "🔺"; trendWord = "rising fast"; }

    // very high stable pressure tends to slow the bite
    if (Math.abs(trend) < 0.7 && pNow >= 1025) pMod -= 3;

    // strong wind penalty
    let wMod = 0;
    if (windKmh >= 35) wMod = -5;
    else if (windKmh >= 25) wMod = -2;

    const modifier = Math.max(-15, Math.min(15, pMod + wMod));

    const summary =
      `Pressure ${trendWord} (${Math.round(pPrev)}→${Math.round(pNow)} hPa)` +
      (windKmh >= 25 ? ` · windy ${windKmh} km/h` : ` · wind ${windKmh} km/h`);

    return { pressure: pNow, pressure3hAgo: pPrev, trend3h: trend, windKmh, tempC, modifier, trendIcon, summary };
  } catch {
    return null;
  }
}
