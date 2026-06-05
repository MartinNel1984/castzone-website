// DWS Hydrological data — updated manually each Monday after DWS publishes.
// Source: https://www.dws.gov.za/Hydrology/Weekly/Province.aspx
// Gate notices: https://mobi.reservoir.org.za/dws-comms/
// Last updated: 2026-06-01 (dams) · 2026-05-19 (gate notices)

export type DamLevel = {
  name: string;
  river: string;
  fsc: number;      // Full Storage Capacity in million m³
  pct: number;      // This week %
  lastWeek: number;
  lastYear: number;
  province: string;
  venueSlug?: string;
};

export type GateNotice = {
  date: string;
  dam: "vaal" | "bloemhof" | "barrage";
  text: string;
  latest?: boolean;
};

export const DATA_UPDATED = "2026-06-01";
export const NATIONAL_AVG = 94.4;

// ─── Western Cape — 44 dams ───────────────────────────────────────────────
export const WC_DAMS: DamLevel[] = [
  { name: "Theewaterskloof Dam",  river: "Riviersonderend River",            fsc: 479.3, pct: 73.3,  lastWeek: 72.2,  lastYear: 60.4,  province: "Western Cape", venueSlug: "theewaterskloof-dam" },
  { name: "Brandvlei Dam",         river: "Lower Brandvlei River",            fsc: 286.1, pct: 45.7,  lastWeek: 45.0,  lastYear: 43.6,  province: "Western Cape", venueSlug: "brandvlei-dam" },
  { name: "Kwaggaskloof Dam",      river: "Doorn River",                      fsc: 169.5, pct: 45.1,  lastWeek: 44.4,  lastYear: 43.1,  province: "Western Cape" },
  { name: "Voelvlei Dam",          river: "Voelvlei River",                   fsc: 158.6, pct: 59.6,  lastWeek: 59.1,  lastYear: 58.3,  province: "Western Cape", venueSlug: "voelvlei-dam" },
  { name: "Berg River Dam",        river: "Berg River",                       fsc: 127.1, pct: 75.9,  lastWeek: 77.1,  lastYear: 67.2,  province: "Western Cape" },
  { name: "Clanwilliam Dam",       river: "Olifants River",                   fsc: 122.5, pct: 81.9,  lastWeek: 82.4,  lastYear: 28.0,  province: "Western Cape", venueSlug: "clanwilliam-dam" },
  { name: "Wemmershoek Dam",       river: "Wemmers River",                    fsc:  58.8, pct: 96.7,  lastWeek: 95.3,  lastYear: 53.2,  province: "Western Cape", venueSlug: "wemmershoek-dam" },
  { name: "Stompdrift Dam",        river: "Olifants River",                   fsc:  46.3, pct: 101.7, lastWeek: 103.9, lastYear: 77.2,  province: "Western Cape" },
  { name: "Floriskraal Dam",       river: "Buffels River",                    fsc:  46.7, pct: 101.0, lastWeek: 101.6, lastYear: 55.7,  province: "Western Cape" },
  { name: "Kammanassie Dam",       river: "Kammanassie River",                fsc:  34.4, pct: 101.7, lastWeek: 102.6, lastYear: 78.6,  province: "Western Cape" },
  { name: "Gamkapoort Dam",        river: "Gamka River",                      fsc:  35.8, pct: 102.5, lastWeek: 107.3, lastYear: 55.4,  province: "Western Cape" },
  { name: "Eikenhof Dam",          river: "Palmiet River",                    fsc:  28.9, pct: 101.3, lastWeek: 102.1, lastYear: 45.3,  province: "Western Cape" },
  { name: "Steenbras-Upper Dam",   river: "Steenbras River",                  fsc:  31.9, pct:  81.2, lastWeek:  79.7, lastYear: 88.9,  province: "Western Cape" },
  { name: "Steenbras-Lower Dam",   river: "Steenbras River",                  fsc:  33.9, pct:  50.7, lastWeek:  51.4, lastYear: 40.3,  province: "Western Cape" },
  { name: "Wolwedans Dam",         river: "Groot Brak River",                 fsc:  24.7, pct: 100.3, lastWeek: 100.4, lastYear: 99.2,  province: "Western Cape", venueSlug: "wolwedans-dam" },
  { name: "Garden Route Dam",      river: "Swart River",                      fsc:  12.5, pct:  90.2, lastWeek:  90.5, lastYear: 91.2,  province: "Western Cape" },
  { name: "Elandskloof Dam",       river: "Elands River",                     fsc:  11.0, pct:  93.0, lastWeek:  93.6, lastYear: 30.8,  province: "Western Cape" },
  { name: "Lakenvallei Dam",       river: "Sanddrifskloof River",             fsc:  10.5, pct: 100.1, lastWeek: 100.1, lastYear: 91.5,  province: "Western Cape" },
  { name: "Keerom Dam",            river: "Nuy River",                        fsc:   9.8, pct:  88.4, lastWeek:  88.4, lastYear: 84.3,  province: "Western Cape" },
  { name: "Korentepoort Dam",      river: "Korinte River",                    fsc:   8.1, pct:  60.8, lastWeek:  60.3, lastYear: 94.8,  province: "Western Cape" },
  { name: "Hartebeestkuil Dam",    river: "Hartenbos River",                  fsc:   7.2, pct:  55.5, lastWeek:  55.5, lastYear: 70.4,  province: "Western Cape" },
  { name: "Roode Els Berg Dam",    river: "Sanddrifskloof River",             fsc:   7.8, pct:  97.6, lastWeek:  96.7, lastYear: 26.6,  province: "Western Cape" },
  { name: "Duiwenhoks Dam",        river: "Duiwenhoks River",                 fsc:   6.2, pct: 100.2, lastWeek: 100.3, lastYear: 100.1, province: "Western Cape" },
  { name: "De Bos Dam",            river: "Onrus River",                      fsc:   5.8, pct:  95.3, lastWeek:  94.4, lastYear: 73.0,  province: "Western Cape" },
  { name: "Misverstand Dam",       river: "Berg River",                       fsc:   5.7, pct: 114.1, lastWeek: 115.9, lastYear: 113.5, province: "Western Cape" },
  { name: "Buffeljags Dam",        river: "Buffeljags River",                 fsc:   4.6, pct: 100.8, lastWeek: 101.1, lastYear: 100.7, province: "Western Cape" },
  { name: "Haarlem Dam",           river: "Groot River",                      fsc:   4.7, pct: 100.4, lastWeek: 101.5, lastYear: 70.4,  province: "Western Cape" },
  { name: "Klipheuwel Dam",        river: "Tributary — Hartenbos River",      fsc:   4.5, pct:  20.5, lastWeek:  20.8, lastYear: 29.9,  province: "Western Cape" },
  { name: "Bellair Dam",           river: "Brak River",                       fsc:   4.3, pct:  92.5, lastWeek:  92.5, lastYear: 85.2,  province: "Western Cape" },
  { name: "Oukloof Dam",           river: "Cordiers River",                   fsc:   4.3, pct: 100.4, lastWeek: 101.0, lastYear: 89.1,  province: "Western Cape" },
  { name: "Calitzdorp Dam",        river: "Nels River",                       fsc:   4.9, pct: 100.3, lastWeek: 100.4, lastYear: 61.4,  province: "Western Cape" },
  { name: "Bulshoek Dam",          river: "Olifants River",                   fsc:   4.9, pct:  46.6, lastWeek:  93.7, lastYear: 82.9,  province: "Western Cape" },
  { name: "Stettynskloof Dam",     river: "Holsloot River",                   fsc:  14.8, pct: 100.0, lastWeek: 100.5, lastYear: 42.1,  province: "Western Cape" },
  { name: "Ceres Dam",             river: "Koekedou River",                   fsc:  17.3, pct:  62.0, lastWeek:  62.0, lastYear: 56.3,  province: "Western Cape" },
  { name: "Poortjieskloof Dam",    river: "Groot River",                      fsc:   9.8, pct:  96.0, lastWeek:  95.3, lastYear: 81.3,  province: "Western Cape" },
  { name: "Roodefontein Dam",      river: "Piesang River",                    fsc:   2.0, pct:  99.5, lastWeek: 100.0, lastYear: 59.0,  province: "Western Cape" },
  { name: "Prinsrivier Dam",       river: "Prins River",                      fsc:   2.3, pct:  98.3, lastWeek:  98.3, lastYear: 44.4,  province: "Western Cape" },
  { name: "Klipberg Dam",          river: "Konings River",                    fsc:   2.0, pct:  82.6, lastWeek:  81.3, lastYear: 53.4,  province: "Western Cape" },
  { name: "Miertjieskraal Dam",    river: "Brand River",                      fsc:   1.5, pct:  99.8, lastWeek:  99.8, lastYear: 63.8,  province: "Western Cape" },
  { name: "Gamka Dam",             river: "Gamka River",                      fsc:   1.8, pct: 100.3, lastWeek: 100.8, lastYear: 50.3,  province: "Western Cape" },
  { name: "Ernest Robertson Dam",  river: "Groot Brak River",                 fsc:   0.5, pct: 100.0, lastWeek: 100.0, lastYear: 84.4,  province: "Western Cape" },
  { name: "Pietersfontein Dam",    river: "Pietersfontein River",             fsc:   2.0, pct: 100.3, lastWeek: 100.5, lastYear: 79.6,  province: "Western Cape" },
  { name: "Leeugamka Dam",         river: "Leeu River",                       fsc:  13.5, pct: 100.3, lastWeek: 101.3, lastYear: 50.8,  province: "Western Cape" },
  { name: "Tierkloof Dam",         river: "Trib. — Seweweekspoort River",     fsc:   0.1, pct: 100.0, lastWeek: 100.0, lastYear: 93.5,  province: "Western Cape" },
];

// ─── Free State — 21 dams ────────────────────────────────────────────────
export const FS_DAMS: DamLevel[] = [
  { name: "Vaal Dam",          river: "Vaal River",             fsc: 2561.0, pct: 106.1, lastWeek: 107.3, lastYear: 108.3, province: "Free State", venueSlug: "vaal-dam" },
  { name: "Gariep Dam",        river: "Orange River",           fsc: 4903.5, pct:  99.6, lastWeek: 102.3, lastYear:  99.2, province: "Free State", venueSlug: "gariep-dam" },
  { name: "Vanderkloof Dam",   river: "Orange River",           fsc: 3137.0, pct: 101.9, lastWeek: 105.4, lastYear:  99.7, province: "Free State", venueSlug: "vanderkloof-dam" },
  { name: "Sterkfontein Dam",  river: "Nuwejaarspruit River",   fsc: 2617.0, pct:  99.4, lastWeek:  99.4, lastYear:  99.7, province: "Free State", venueSlug: "sterkfontein-dam" },
  { name: "Bloemhof Dam",      river: "Vaal River",             fsc: 1243.0, pct: 104.6, lastWeek: 104.1, lastYear: 102.1, province: "Free State", venueSlug: "bloemhof-dam" },
  { name: "Kalkfontein Dam",   river: "Riet River",             fsc:  325.2, pct: 102.7, lastWeek: 103.0, lastYear: 102.0, province: "Free State", venueSlug: "kalkfontein-dam" },
  { name: "Erfenis Dam",       river: "Groot-Vet River",        fsc:  213.8, pct: 100.5, lastWeek: 100.6, lastYear:  99.3, province: "Free State", venueSlug: "erfenis-dam" },
  { name: "Allemanskraal Dam", river: "Sand River",             fsc:  172.5, pct: 100.3, lastWeek: 100.6, lastYear:  99.1, province: "Free State", venueSlug: "allemanskraal-dam" },
  { name: "Knellpoort Dam",    river: "Rietspruit River",       fsc:  130.2, pct: 100.0, lastWeek: 100.3, lastYear:  99.9, province: "Free State" },
  { name: "Rustfontein Dam",   river: "Modder River",           fsc:   72.2, pct:  99.5, lastWeek:  99.8, lastYear:  68.3, province: "Free State" },
  { name: "Krugersdrift Dam",  river: "Modder River",           fsc:   71.5, pct: 100.5, lastWeek: 101.3, lastYear: 100.6, province: "Free State" },
  { name: "Koppies Dam",       river: "Renoster River",         fsc:   42.4, pct: 100.7, lastWeek: 101.0, lastYear: 101.7, province: "Free State", venueSlug: "koppies-dam" },
  { name: "Tierpoort Dam",     river: "Tierpoort River",        fsc:   34.0, pct: 100.5, lastWeek: 101.0, lastYear: 100.9, province: "Free State" },
  { name: "Vaalrivier Barrage",river: "Vaal River",             fsc:   53.7, pct:  99.5, lastWeek:  95.6, lastYear:  96.8, province: "Free State", venueSlug: "vaal-barrage" },
  { name: "Groothoek Dam",     river: "Kgabanyane River",       fsc:   12.0, pct:  98.5, lastWeek:  98.5, lastYear:  57.9, province: "Free State" },
  { name: "Saulspoort Dam",    river: "Liebenbergsvlei River",  fsc:   15.1, pct:  98.9, lastWeek: 101.5, lastYear: 107.7, province: "Free State" },
  { name: "Fika-Patso Dam",    river: "Namahadi River",         fsc:   29.5, pct:  96.7, lastWeek:  98.0, lastYear:  96.4, province: "Free State" },
  { name: "Metsi-Matsho Dam",  river: "Metsi-Matsho River",     fsc:    4.4, pct:  98.3, lastWeek:  99.4, lastYear:  97.6, province: "Free State" },
  { name: "Armenia Dam",       river: "Leeu River",             fsc:   13.3, pct: 100.0, lastWeek: 100.3, lastYear: 100.3, province: "Free State" },
  { name: "Egmont Dam",        river: "Witspruit River",        fsc:    9.1, pct: 101.1, lastWeek: 101.7, lastYear: 100.4, province: "Free State" },
  { name: "Welbedacht Dam",    river: "Caledon River",          fsc:    5.5, pct:  95.1, lastWeek: 100.0, lastYear: 117.2, province: "Free State" },
];

export const ALL_DAMS: DamLevel[] = [...WC_DAMS, ...FS_DAMS];

// Slug → water level lookup used by the Leaflet map
export const VENUE_WATER_LEVELS: Record<string, { pct: number; lastYear: number; river: string }> =
  Object.fromEntries(
    ALL_DAMS
      .filter((d) => d.venueSlug)
      .map((d) => [d.venueSlug!, { pct: d.pct, lastYear: d.lastYear, river: d.river }])
  );

// ─── Vaal System gate notices ─────────────────────────────────────────────
// Source: DWS Flood Monitoring & Forecasting via mobi.reservoir.org.za/dws-comms/
export const GATE_NOTICES: GateNotice[] = [
  { date: "19 May 2026", dam: "vaal",     latest: true, text: "Season Reporting closed. Close the one (1) gate at 12:00." },
  { date: "19 May 2026", dam: "bloemhof", latest: true, text: "Maintain the discharge at 250 m³/s." },
  { date: "17 May 2026", dam: "vaal",     text: "Keep one (1) gate open." },
  { date: "17 May 2026", dam: "bloemhof", text: "Reduce the discharge to 250 m³/s at 10:00." },
  { date: "12 May 2026", dam: "vaal",     text: "Keep one (1) gate open." },
  { date: "12 May 2026", dam: "bloemhof", text: "Reduce the discharge to 700 m³/s at 10:00." },
  { date: "9 May 2026",  dam: "vaal",     text: "Keep one (1) gate open." },
  { date: "9 May 2026",  dam: "bloemhof", text: "Keep the discharge at 900 m³/s." },
  { date: "8 May 2026",  dam: "vaal",     text: "Open one (1) gate at 09:00." },
  { date: "8 May 2026",  dam: "bloemhof", text: "Maintain the discharge at 900 m³/s." },
  { date: "10 Mar 2026", dam: "vaal",     text: "Close all valves and open one (1) gate." },
  { date: "10 Mar 2026", dam: "bloemhof", text: "Increase the discharge to 150 m³/s at 10:00." },
  { date: "20 Feb 2026", dam: "vaal",     text: "River valves closed 8:00–16:00 from 23–27 Feb 2026 for mechanical maintenance." },
  { date: "7 Feb 2026",  dam: "vaal",     text: "Operate on valve discharge only." },
  { date: "7 Feb 2026",  dam: "bloemhof", text: "Maintain the discharge at 50 m³/s." },
  { date: "19 Jan 2026", dam: "vaal",     text: "Close the last gate at 10:00 and operate on valve discharge only." },
  { date: "30 Nov 2025", dam: "barrage",  text: "Switching from free flow to controlled releases from 14:00 today." },
  { date: "29 Nov 2025", dam: "vaal",     text: "Keep 10 gates open." },
  { date: "27 Nov 2025", dam: "vaal",     text: "Open 3 gates — Gate 8 at 10:00; Gate 9 at 12:00; Gate 10 at 14:00." },
  { date: "26 Nov 2025", dam: "vaal",     text: "Open 4 gates — Gate 4 at 10:00; Gate 5 at 11:00; Gate 6 at 12:00; Gate 7 at 13:00." },
  { date: "17 Nov 2025", dam: "vaal",     text: "Close all valves. Open sluice gates — Gate 1 at 09:00, Gate 2 at 10:00, Gate 3 at 11:00, Gate 4 at 12:00, Gate 5 at 13:00." },
];
