// DWS Hydrological data — updated manually each Monday after DWS publishes.
// Source: https://www.dws.gov.za/Hydrology/Weekly/Province.aspx
// Gate notices: auto-updated daily by .github/workflows/update-gate-notices.yml
// Last updated: 2026-06-01 (dams) · see gateNotices.json for gate notice date

import gateNoticesData from "./gateNotices.json";

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

// ─── Gauteng — 5 dams ────────────────────────────────────────────────────
export const GP_DAMS: DamLevel[] = [
  { name: "Bon Accord Dam",       river: "Apies River",            fsc:   4.4, pct: 104.5, lastWeek: 105.1, lastYear: 106.6, province: "Gauteng" },
  { name: "Bronkhorstspruit Dam", river: "Bronkhorstspruit River", fsc:  57.0, pct: 100.9, lastWeek: 101.4, lastYear: 102.3, province: "Gauteng", venueSlug: "bronkhorstspruit-dam" },
  { name: "Klipdrift Dam",        river: "Loopspruit River",       fsc:  13.4, pct: 102.9, lastWeek: 102.9, lastYear: 102.2, province: "Gauteng" },
  { name: "Rietvlei Dam",         river: "Hennops River",          fsc:  12.3, pct: 100.2, lastWeek: 100.5, lastYear: 100.5, province: "Gauteng", venueSlug: "rietvlei-dam" },
  { name: "Roodeplaat Dam",       river: "Pienaars River",         fsc:  41.2, pct: 100.6, lastWeek: 100.6, lastYear: 100.5, province: "Gauteng", venueSlug: "roodeplaat-dam" },
];

// ─── KwaZulu-Natal — 19 dams ─────────────────────────────────────────────
export const KZN_DAMS: DamLevel[] = [
  { name: "Albert Falls Dam",  river: "Mgeni River",       fsc:  285.7, pct:  96.5, lastWeek:  97.5, lastYear: 102.7, province: "KwaZulu-Natal", venueSlug: "albert-falls-dam" },
  { name: "Bivane Dam",        river: "Bivane River",      fsc:  114.1, pct:  99.7, lastWeek:  99.7, lastYear: 101.1, province: "KwaZulu-Natal" },
  { name: "Craigie Burn Dam",  river: "Mnyamvubu River",   fsc:   22.5, pct:  99.1, lastWeek:  99.3, lastYear: 100.4, province: "KwaZulu-Natal" },
  { name: "Driel Barrage Dam", river: "Tugela River",      fsc:    8.7, pct:  90.3, lastWeek:  90.3, lastYear:  91.8, province: "KwaZulu-Natal" },
  { name: "Goedertrouw Dam",   river: "Mhlatuze River",    fsc:  301.3, pct:  97.3, lastWeek:  97.6, lastYear: 100.4, province: "KwaZulu-Natal" },
  { name: "Hazelmere Dam",     river: "Mdloti River",      fsc:   37.2, pct:  95.5, lastWeek:  96.3, lastYear: 102.2, province: "KwaZulu-Natal" },
  { name: "Hluhluwe Dam",      river: "Hluhluwe River",    fsc:   25.9, pct:  93.1, lastWeek:  93.9, lastYear: 100.7, province: "KwaZulu-Natal" },
  { name: "Inanda Dam",        river: "Mgeni River",       fsc:  237.5, pct: 100.9, lastWeek: 100.8, lastYear: 101.6, province: "KwaZulu-Natal", venueSlug: "inanda-dam" },
  { name: "Klipfontein Dam",   river: "Wit Mfolozi River", fsc:   18.1, pct:  99.3, lastWeek:  99.7, lastYear: 100.5, province: "KwaZulu-Natal" },
  { name: "Mearns Dam",        river: "Mooi River",        fsc:    5.2, pct:  54.6, lastWeek:  47.1, lastYear: 101.6, province: "KwaZulu-Natal" },
  { name: "Midmar Dam",        river: "Mgeni River",       fsc:  235.5, pct:  95.2, lastWeek:  95.8, lastYear:  99.2, province: "KwaZulu-Natal", venueSlug: "midmar-dam" },
  { name: "Nagle Dam",         river: "Mgeni River",       fsc:   23.3, pct:  95.9, lastWeek:  93.8, lastYear:  99.9, province: "KwaZulu-Natal" },
  { name: "Ntshingwayo Dam",   river: "Ngagane River",     fsc:  194.6, pct:  74.2, lastWeek:  74.7, lastYear:  95.1, province: "KwaZulu-Natal" },
  { name: "Pongolapoort Dam",  river: "Phongolo River",    fsc: 2395.3, pct:  85.6, lastWeek:  85.8, lastYear:  95.1, province: "KwaZulu-Natal" },
  { name: "Spioenkop Dam",     river: "Tugela River",      fsc:  270.7, pct: 100.0, lastWeek: 100.0, lastYear: 100.3, province: "KwaZulu-Natal" },
  { name: "Spring Grove Dam",  river: "Mooi River",        fsc:  139.3, pct:  97.5, lastWeek:  99.0, lastYear: 100.4, province: "KwaZulu-Natal" },
  { name: "Wagendrift Dam",    river: "Boesmans River",    fsc:   55.9, pct: 100.2, lastWeek: 100.5, lastYear: 100.9, province: "KwaZulu-Natal" },
  { name: "Woodstock Dam",     river: "Tugela River",      fsc:  355.5, pct:  93.5, lastWeek:  94.9, lastYear:  97.7, province: "KwaZulu-Natal" },
  { name: "Zaaihoek Dam",      river: "Slang River",       fsc:  184.3, pct: 100.5, lastWeek: 100.5, lastYear: 100.5, province: "KwaZulu-Natal" },
];

// ─── Limpopo — 29 dams ───────────────────────────────────────────────────
export const LP_DAMS: DamLevel[] = [
  { name: "Albasini Dam",        river: "Luvuvhu River",                   fsc:  28.2, pct:  94.7, lastWeek:  93.9, lastYear:  99.3, province: "Limpopo" },
  { name: "Dap Naude Dam",       river: "Broederstroom River",             fsc:   2.0, pct:  92.1, lastWeek:  94.7, lastYear:  90.5, province: "Limpopo" },
  { name: "De Hoop Dam",         river: "Steelpoort River",                fsc: 348.7, pct: 100.7, lastWeek: 100.7, lastYear: 100.5, province: "Limpopo" },
  { name: "Doorndraai Dam",      river: "Sterk River",                     fsc:  45.0, pct:  99.2, lastWeek:  99.4, lastYear: 100.5, province: "Limpopo" },
  { name: "Ebenezer Dam",        river: "Groot-Letaba River",              fsc:  69.2, pct: 100.6, lastWeek: 100.7, lastYear: 100.3, province: "Limpopo", venueSlug: "ebenezer-dam" },
  { name: "Flag Boshielo Dam",   river: "Olifants River",                  fsc: 185.2, pct: 102.8, lastWeek: 103.2, lastYear: 102.8, province: "Limpopo" },
  { name: "Glen Alpine Dam",     river: "Mogalakwena River",               fsc:  18.9, pct: 103.5, lastWeek: 104.2, lastYear: 102.6, province: "Limpopo" },
  { name: "Hans Merensky Dam",   river: "Ramadiepa River",                 fsc:   1.3, pct: 103.1, lastWeek: 103.5, lastYear: 101.9, province: "Limpopo" },
  { name: "Houtrivier Dam",      river: "Hout River",                      fsc:   6.7, pct:  96.9, lastWeek:  97.3, lastYear:  95.5, province: "Limpopo" },
  { name: "Klaserie Dam",        river: "Klaserie River",                  fsc:   5.7, pct: 101.5, lastWeek: 101.9, lastYear: 100.5, province: "Limpopo" },
  { name: "Luphephe Dam",        river: "Luphephe River",                  fsc:  14.0, pct: 101.2, lastWeek: 101.6, lastYear:  72.2, province: "Limpopo" },
  { name: "Magoebaskloof Dam",   river: "Politsi River",                   fsc:   4.9, pct: 100.9, lastWeek: 101.0, lastYear: 100.5, province: "Limpopo" },
  { name: "Middel-Letaba Dam",   river: "Middel-Letaba River",             fsc: 172.0, pct: 100.0, lastWeek: 100.0, lastYear:   7.5, province: "Limpopo" },
  { name: "Modjadji Dam",        river: "Molototsi River",                 fsc:   7.2, pct: 100.5, lastWeek: 100.5, lastYear:  39.3, province: "Limpopo" },
  { name: "Mokolo Dam",          river: "Mokolo River",                    fsc: 145.8, pct: 102.3, lastWeek: 102.3, lastYear: 102.3, province: "Limpopo" },
  { name: "Mutshedzi Dam",       river: "Mutshedzi River",                 fsc:   2.4, pct: 107.2, lastWeek: 107.2, lastYear:  94.6, province: "Limpopo" },
  { name: "Nandoni Dam",         river: "Levhuvhu River",                  fsc: 166.2, pct: 102.1, lastWeek: 102.7, lastYear:  99.5, province: "Limpopo", venueSlug: "nandoni-dam" },
  { name: "Nsami Dam",           river: "Nsama River",                     fsc:  21.9, pct:  97.7, lastWeek:  98.4, lastYear:  85.8, province: "Limpopo" },
  { name: "Nwanedzi Dam",        river: "Nwanedzi River",                  fsc:   5.2, pct: 100.9, lastWeek: 101.2, lastYear:  26.3, province: "Limpopo" },
  { name: "Nzhelele Dam",        river: "Nzhelele River",                  fsc:  51.3, pct: 101.5, lastWeek: 101.6, lastYear:  98.9, province: "Limpopo" },
  { name: "Rust De Winter Dam",  river: "Elands River",                    fsc:  28.2, pct: 101.2, lastWeek: 101.2, lastYear: 101.5, province: "Limpopo" },
  { name: "Thabina Dam",         river: "Thabina River",                   fsc:   3.5, pct: 100.0, lastWeek: 100.0, lastYear: 100.0, province: "Limpopo" },
  { name: "Tonteldoos Dam",      river: "Tonteldoos River",                fsc:   0.2, pct: 100.8, lastWeek: 100.8, lastYear: 100.6, province: "Limpopo" },
  { name: "Tours Dam",           river: "Ngwabitsi River",                 fsc:   6.1, pct: 100.4, lastWeek: 100.4, lastYear:  99.5, province: "Limpopo" },
  { name: "Tzaneen Dam",         river: "Groot-Letaba River",              fsc: 114.3, pct:  99.8, lastWeek: 100.3, lastYear:  89.9, province: "Limpopo", venueSlug: "tzaneen-dam" },
  { name: "Vergelegen Dam",      river: "Tributary of Politsi River",      fsc:   0.3, pct: 103.0, lastWeek: 102.6, lastYear: 100.0, province: "Limpopo" },
  { name: "Vlugkraal Dam",       river: "Vlugkraal River",                 fsc:   0.5, pct: 100.6, lastWeek: 100.6, lastYear: 100.5, province: "Limpopo" },
  { name: "Vondo Dam",           river: "Mutshindudi River",               fsc:  30.5, pct: 100.9, lastWeek: 101.2, lastYear: 100.4, province: "Limpopo" },
  { name: "Warmbad Dam",         river: "Buffelspruit River",              fsc:   0.6, pct: 102.8, lastWeek: 102.8, lastYear: 102.8, province: "Limpopo" },
];

// ─── Mpumalanga — 22 dams ────────────────────────────────────────────────
export const MP_DAMS: DamLevel[] = [
  { name: "Blyderivierpoort Dam", river: "Blyde River",          fsc:  54.4, pct: 100.9, lastWeek: 101.0, lastYear: 100.3, province: "Mpumalanga" },
  { name: "Buffelskloof Dam",     river: "Waterval River",        fsc:   5.3, pct: 100.5, lastWeek: 100.6, lastYear: 100.6, province: "Mpumalanga" },
  { name: "Da Gama Dam",          river: "White Waters River",    fsc:  13.6, pct: 100.3, lastWeek: 100.8, lastYear: 100.0, province: "Mpumalanga" },
  { name: "Driekoppies Dam",      river: "Lomati River",          fsc: 251.0, pct: 100.7, lastWeek: 100.8, lastYear:  93.8, province: "Mpumalanga" },
  { name: "Grootdraai Dam",       river: "Vaal River",            fsc: 349.8, pct:  99.9, lastWeek: 100.0, lastYear: 100.9, province: "Mpumalanga" },
  { name: "Heyshope Dam",         river: "Assegaai River",        fsc: 445.0, pct: 101.2, lastWeek: 101.4, lastYear: 100.2, province: "Mpumalanga" },
  { name: "Inyaka Dam",           river: "Marite River",          fsc: 123.7, pct: 100.1, lastWeek: 100.2, lastYear:  99.5, province: "Mpumalanga" },
  { name: "Jericho Dam",          river: "Mpama River",           fsc:  59.0, pct:  98.0, lastWeek:  98.7, lastYear: 103.2, province: "Mpumalanga" },
  { name: "Klipkopjes Dam",       river: "Wit River",             fsc:  11.8, pct: 100.2, lastWeek: 100.2, lastYear: 100.6, province: "Mpumalanga" },
  { name: "Kwena Dam",            river: "Krokodil River",        fsc: 158.7, pct: 100.7, lastWeek: 100.8, lastYear: 100.6, province: "Mpumalanga" },
  { name: "Longmere Dam",         river: "Wit River",             fsc:   4.3, pct: 101.3, lastWeek: 101.6, lastYear: 100.3, province: "Mpumalanga" },
  { name: "Loskop Dam",           river: "Olifants River",        fsc: 361.6, pct: 100.9, lastWeek: 101.0, lastYear: 100.3, province: "Mpumalanga", venueSlug: "loskop-dam" },
  { name: "Middelburg Dam",       river: "Little Olifants River", fsc:  48.1, pct:  97.7, lastWeek:  97.4, lastYear:  97.1, province: "Mpumalanga" },
  { name: "Morgenstond Dam",      river: "Ngwempisi River",       fsc: 100.0, pct:  99.6, lastWeek:  99.6, lastYear:  99.7, province: "Mpumalanga" },
  { name: "Nooitgedacht Dam",     river: "Komati River",          fsc:  78.4, pct: 100.3, lastWeek:  99.9, lastYear: 100.7, province: "Mpumalanga" },
  { name: "Ohrigstad Dam",        river: "Ohrigstad River",       fsc:  13.5, pct: 100.1, lastWeek: 100.1, lastYear:  78.5, province: "Mpumalanga" },
  { name: "Primkop Dam",          river: "Wit River",             fsc:   1.9, pct: 101.3, lastWeek: 101.5, lastYear: 100.0, province: "Mpumalanga" },
  { name: "Rhenosterkop Dam",     river: "Elands River",          fsc: 204.6, pct: 101.1, lastWeek: 101.1, lastYear: 100.9, province: "Mpumalanga" },
  { name: "Vygeboom Dam",         river: "Komati River",          fsc:  78.1, pct: 100.5, lastWeek: 100.6, lastYear: 100.6, province: "Mpumalanga" },
  { name: "Westoe Dam",           river: "Usutu River",           fsc:  60.1, pct:  75.7, lastWeek:  77.4, lastYear:  98.0, province: "Mpumalanga" },
  { name: "Witbank Dam",          river: "Olifants River",        fsc: 104.1, pct:  99.4, lastWeek:  99.4, lastYear: 101.1, province: "Mpumalanga", venueSlug: "witbank-dam" },
  { name: "Witklip Dam",          river: "Sand River",            fsc:  12.6, pct: 100.6, lastWeek: 100.6, lastYear: 100.2, province: "Mpumalanga" },
];

// ─── North West — 28 dams ────────────────────────────────────────────────
export const NW_DAMS: DamLevel[] = [
  { name: "Boskop Dam",           river: "Mooi River",          fsc:  20.0, pct: 103.2, lastWeek: 103.8, lastYear: 102.6, province: "North West" },
  { name: "Bospoort Dam",         river: "Hex River",           fsc:  15.8, pct: 102.2, lastWeek: 102.2, lastYear: 102.6, province: "North West" },
  { name: "Buffelspoort Dam",     river: "Sterkstroom River",   fsc:  10.2, pct: 100.8, lastWeek: 100.9, lastYear: 100.7, province: "North West" },
  { name: "Disaneng Dam",         river: "Molopo River",        fsc:  14.2, pct: 101.1, lastWeek: 101.3, lastYear: 101.0, province: "North West" },
  { name: "Elandskuil Dam",       river: "Swartleegte River",   fsc:   1.2, pct: 108.2, lastWeek: 108.6, lastYear: 106.9, province: "North West" },
  { name: "Hartbeespoort Dam",    river: "Krokodil River",      fsc: 185.8, pct:  99.2, lastWeek:  96.8, lastYear:  97.6, province: "North West", venueSlug: "hartbeespoort-dam" },
  { name: "Johan Neser Dam",      river: "Skoonspruit River",   fsc:   5.7, pct: 101.7, lastWeek: 101.7, lastYear: 101.7, province: "North West" },
  { name: "Klein-Maricopoort Dam",river: "Klein Marico River",  fsc:   7.3, pct: 101.7, lastWeek: 101.7, lastYear: 100.9, province: "North West" },
  { name: "Klerkskraal Dam",      river: "Mooi River",          fsc:   8.0, pct: 111.8, lastWeek: 111.8, lastYear: 105.6, province: "North West" },
  { name: "Klipvoor Dam",         river: "Pienaars River",      fsc:  40.8, pct: 101.7, lastWeek: 101.9, lastYear: 100.6, province: "North West", venueSlug: "klipvoor-dam" },
  { name: "Kosterrivier Dam",     river: "Koster River",        fsc:  12.5, pct: 102.5, lastWeek: 102.9, lastYear: 100.4, province: "North West" },
  { name: "Kromellenboog Dam",    river: "Klein Marico River",  fsc:   8.7, pct: 101.8, lastWeek: 101.0, lastYear: 101.1, province: "North West" },
  { name: "Lindleyspoort Dam",    river: "Elands River",        fsc:  14.3, pct: 100.6, lastWeek: 100.6, lastYear: 100.2, province: "North West" },
  { name: "Madikwe Dam",          river: "Tholwane River",      fsc:  16.0, pct: 110.6, lastWeek: 110.9, lastYear:  93.2, province: "North West" },
  { name: "Marico-Bosveld Dam",   river: "Groot-Marico River",  fsc:  27.0, pct: 101.7, lastWeek: 101.8, lastYear: 101.3, province: "North West" },
  { name: "Middelkraal Dam",      river: "Maretlwane River",    fsc:   0.8, pct: 100.0, lastWeek: 100.0, lastYear: 100.0, province: "North West" },
  { name: "Molatedi Dam",         river: "Groot-Marico River",  fsc: 200.8, pct: 110.3, lastWeek: 111.3, lastYear: 108.5, province: "North West" },
  { name: "Ngotwane Dam",         river: "Ngotwane River",      fsc:  19.1, pct:  93.3, lastWeek:  93.3, lastYear:  90.6, province: "North West" },
  { name: "Olifantsnek Dam",      river: "Hex River",           fsc:  13.7, pct: 101.3, lastWeek: 101.3, lastYear: 101.5, province: "North West" },
  { name: "Pella Dam",            river: "Lethlakane River",    fsc:   2.2, pct:  81.2, lastWeek:  82.3, lastYear:  66.9, province: "North West" },
  { name: "Potchefstroom Dam",    river: "Mooi River",          fsc:   2.1, pct: 104.6, lastWeek: 105.0, lastYear: 103.3, province: "North West" },
  { name: "Rietspruit Dam",       river: "Rietspruit River",    fsc:   7.3, pct: 101.9, lastWeek: 101.9, lastYear: 102.5, province: "North West" },
  { name: "Roodekopjes Dam",      river: "Krokodil River",      fsc:  96.4, pct: 103.6, lastWeek: 103.1, lastYear: 103.0, province: "North West", venueSlug: "roodekopjes-dam" },
  { name: "Sehujwane Dam",        river: "Sehujane River",      fsc:   3.7, pct: 100.8, lastWeek: 100.8, lastYear:  96.2, province: "North West" },
  { name: "Setumo Dam",           river: "Molopo River",        fsc:  20.8, pct:  99.8, lastWeek:  99.8, lastYear: 100.3, province: "North West" },
  { name: "Swartruggens Dam",     river: "Elands River",        fsc:   0.5, pct: 104.3, lastWeek: 104.3, lastYear: 103.1, province: "North West" },
  { name: "Taung Dam",            river: "Harts River",         fsc:  61.4, pct: 100.7, lastWeek:  99.8, lastYear:  96.7, province: "North West" },
  { name: "Vaalkop Dam",          river: "Elands River",        fsc:  51.4, pct: 103.5, lastWeek: 103.9, lastYear:  99.9, province: "North West", venueSlug: "vaalkop-dam" },
];

// ─── Eastern Cape — 43 dams ──────────────────────────────────────────────
export const EC_DAMS: DamLevel[] = [
  { name: "Belfort Dam",          river: "Mafube River",              fsc:   0.5, pct: 100.0, lastWeek: 100.0, lastYear: 100.0, province: "Eastern Cape" },
  { name: "Binfield Dam",         river: "Tyume River",               fsc:  36.8, pct:  95.7, lastWeek:  96.8, lastYear:  99.1, province: "Eastern Cape" },
  { name: "Boesmanskrantz Dam",   river: "Oxkraal River",             fsc:   4.9, pct:  69.2, lastWeek:  69.6, lastYear:  99.7, province: "Eastern Cape" },
  { name: "Bridle Drift Dam",     river: "Buffalo River",             fsc:  98.0, pct:  80.1, lastWeek:  81.3, lastYear: 102.1, province: "Eastern Cape" },
  { name: "Cata Dam",             river: "Cata River",                fsc:  12.1, pct:  80.6, lastWeek:  81.5, lastYear:  97.9, province: "Eastern Cape" },
  { name: "Corana Dam",           river: "Corana River",              fsc:   0.8, pct:  96.0, lastWeek:  96.0, lastYear:  98.3, province: "Eastern Cape" },
  { name: "Darlington Dam",       river: "Sondags River",             fsc: 179.9, pct:  50.7, lastWeek:  52.5, lastYear:  47.6, province: "Eastern Cape" },
  { name: "De Mistkraal Dam",     river: "Little Fish River",         fsc:   2.1, pct:  97.9, lastWeek:  98.6, lastYear: 101.5, province: "Eastern Cape" },
  { name: "Debe Dam",             river: "Debe River",                fsc:   6.4, pct:  45.4, lastWeek:  45.7, lastYear:  37.9, province: "Eastern Cape" },
  { name: "Doornrivier Dam",      river: "Doorn River",               fsc:  17.1, pct:  93.0, lastWeek:  93.2, lastYear:  89.7, province: "Eastern Cape" },
  { name: "Elandsdrift Dam",      river: "Great Fish River",          fsc:   3.6, pct:  54.9, lastWeek:  95.5, lastYear:  66.1, province: "Eastern Cape" },
  { name: "Glen Melville Dam",    river: "Fish River",                fsc:   6.3, pct:  89.0, lastWeek:  94.7, lastYear:  91.6, province: "Eastern Cape" },
  { name: "Grassridge Dam",       river: "Groot Brak River",          fsc:  44.5, pct:  71.4, lastWeek:  91.3, lastYear:  55.7, province: "Eastern Cape" },
  { name: "Groendal Dam",         river: "Swartkops River",           fsc:  11.7, pct: 100.9, lastWeek: 101.6, lastYear:  99.7, province: "Eastern Cape" },
  { name: "Gubu Dam",             river: "Gubu River",                fsc:   8.6, pct:  98.5, lastWeek:  98.7, lastYear: 100.4, province: "Eastern Cape" },
  { name: "Impofu Dam",           river: "Krom River",                fsc: 105.8, pct: 100.6, lastWeek: 100.9, lastYear:  52.1, province: "Eastern Cape" },
  { name: "Jozanashoek Dam",      river: "Sterkspruit River",         fsc:   9.5, pct: 100.6, lastWeek: 100.8, lastYear: 100.0, province: "Eastern Cape" },
  { name: "Katrivier Dam",        river: "Kat River",                 fsc:  24.9, pct: 100.2, lastWeek: 100.3, lastYear:  99.9, province: "Eastern Cape" },
  { name: "Kommandodrift Dam",    river: "Tarka River",               fsc:  56.0, pct:  92.3, lastWeek:  92.4, lastYear:  77.0, province: "Eastern Cape" },
  { name: "Kouga Dam",            river: "Kouga River",               fsc: 126.0, pct: 101.1, lastWeek: 101.5, lastYear:  78.4, province: "Eastern Cape" },
  { name: "Kromrivier Dam",       river: "Krom River",                fsc:  35.3, pct: 100.6, lastWeek: 101.0, lastYear:  79.6, province: "Eastern Cape" },
  { name: "Laing Dam",            river: "Buffalo River",             fsc:  19.0, pct: 100.0, lastWeek: 100.0, lastYear: 100.7, province: "Eastern Cape" },
  { name: "Lake Arthur Dam",      river: "Tarka River",               fsc:  11.3, pct:  55.5, lastWeek:  55.3, lastYear:  29.6, province: "Eastern Cape" },
  { name: "Loerie Dam",           river: "Loeriespruit River",        fsc:   3.1, pct: 101.4, lastWeek: 101.2, lastYear:  62.6, province: "Eastern Cape" },
  { name: "Lubisi Dam",           river: "Indwe River",               fsc: 113.6, pct:  66.9, lastWeek:  67.4, lastYear:  40.3, province: "Eastern Cape" },
  { name: "Mabeleni Dam",         river: "Mhlahlane River",           fsc:   2.1, pct: 100.0, lastWeek: 100.0, lastYear: 100.0, province: "Eastern Cape" },
  { name: "Macubeni Dam",         river: "Cacadu River",              fsc:   3.4, pct:  97.9, lastWeek:  99.6, lastYear:  98.7, province: "Eastern Cape" },
  { name: "Mlanga Dam",           river: "Mlanga River",              fsc:   1.6, pct:  75.3, lastWeek:  75.3, lastYear:  94.1, province: "Eastern Cape" },
  { name: "Mnyameni Dam",         river: "uMnyama River",             fsc:   1.9, pct:  98.0, lastWeek:  99.7, lastYear: 100.0, province: "Eastern Cape" },
  { name: "Nahoon Dam",           river: "Nahoon River",              fsc:  19.3, pct:  72.4, lastWeek:  73.4, lastYear:  98.8, province: "Eastern Cape", venueSlug: "nahoon-dam" },
  { name: "Ncora Dam",            river: "Tsomo River",               fsc: 144.9, pct:  97.3, lastWeek:  97.4, lastYear: 100.2, province: "Eastern Cape" },
  { name: "Nqadu Dam",            river: "Nqadu River",               fsc:   1.3, pct:  71.7, lastWeek:  71.7, lastYear:  91.1, province: "Eastern Cape" },
  { name: "Nqweba Dam",           river: "Sondags River",             fsc:  45.4, pct: 102.3, lastWeek: 102.4, lastYear:  83.6, province: "Eastern Cape" },
  { name: "Ntenetyana Dam",       river: "Ntenetyana River",          fsc:   1.7, pct:  92.0, lastWeek:  93.6, lastYear: 102.2, province: "Eastern Cape" },
  { name: "Nuwejaars Dam",        river: "Nuwejaarspruit River",      fsc:   4.6, pct:  98.6, lastWeek: 101.7, lastYear:  40.1, province: "Eastern Cape" },
  { name: "Oxkraal Dam",          river: "Oxkraal River",             fsc:  15.2, pct:  89.6, lastWeek:  89.9, lastYear:  79.9, province: "Eastern Cape" },
  { name: "Rooikrans Dam",        river: "Buffalo River",             fsc:   4.8, pct:  91.2, lastWeek:  96.7, lastYear:  99.2, province: "Eastern Cape" },
  { name: "Sandile Dam",          river: "Keiskamma River",           fsc:  29.7, pct: 100.0, lastWeek: 100.1, lastYear:  99.4, province: "Eastern Cape" },
  { name: "Tsojana Dam",          river: "Tsojana River",             fsc:  12.3, pct:  99.1, lastWeek:  99.1, lastYear:  99.7, province: "Eastern Cape" },
  { name: "Umtata Dam",           river: "Mtata River",               fsc: 244.7, pct:  98.6, lastWeek:  98.7, lastYear: 101.5, province: "Eastern Cape" },
  { name: "Waterdown Dam",        river: "Klipplaat River",           fsc:  37.5, pct: 100.0, lastWeek:  99.9, lastYear: 100.3, province: "Eastern Cape" },
  { name: "Wriggleswade Dam",     river: "Kubisi River",              fsc:  91.5, pct:  95.7, lastWeek:  95.8, lastYear: 100.5, province: "Eastern Cape" },
  { name: "Xonxa Dam",            river: "White Kei River",           fsc: 116.4, pct:  98.1, lastWeek:  98.3, lastYear:  98.8, province: "Eastern Cape" },
];

// ─── Northern Cape — 6 dams ──────────────────────────────────────────────
export const NC_DAMS: DamLevel[] = [
  { name: "Boegoeberg Dam",     river: "Orange River", fsc:  23.6, pct: 135.1, lastWeek: 146.7, lastYear: 106.6, province: "Northern Cape", venueSlug: "boegoeberg-dam" },
  { name: "Douglas Weir Dam",   river: "Vaal River",   fsc:  16.3, pct: 115.8, lastWeek: 125.1, lastYear: 115.7, province: "Northern Cape" },
  { name: "Karee Dam",          river: "Karee River",  fsc:   1.0, pct:  99.8, lastWeek: 100.3, lastYear:  42.5, province: "Northern Cape" },
  { name: "Leeubos Dam",        river: "Swartbas River",fsc:  1.0, pct:   0.0, lastWeek:   0.0, lastYear:   0.0, province: "Northern Cape" },
  { name: "Spitskop Dam",       river: "Harts River",  fsc:  57.9, pct: 107.6, lastWeek: 110.3, lastYear: 106.0, province: "Northern Cape" },
  { name: "Vaalharts Weir Dam", river: "Vaal River",   fsc:  50.7, pct:  83.7, lastWeek:  57.4, lastYear:  57.5, province: "Northern Cape" },
];

export const ALL_DAMS: DamLevel[] = [
  ...WC_DAMS, ...FS_DAMS, ...GP_DAMS, ...KZN_DAMS,
  ...LP_DAMS, ...MP_DAMS, ...NW_DAMS, ...EC_DAMS, ...NC_DAMS,
];

const _totalFSC = ALL_DAMS.reduce((a, d) => a + d.fsc, 0);
export const NATIONAL_AVG = +(ALL_DAMS.reduce((a, d) => a + d.fsc * d.pct, 0) / _totalFSC).toFixed(1);

// Slug → water level lookup used by the Leaflet map
export const VENUE_WATER_LEVELS: Record<string, { pct: number; lastYear: number; river: string }> =
  Object.fromEntries(
    ALL_DAMS
      .filter((d) => d.venueSlug)
      .map((d) => [d.venueSlug!, { pct: d.pct, lastYear: d.lastYear, river: d.river }])
  );

// ─── Vaal System gate notices ─────────────────────────────────────────────
// Auto-updated daily from mobi.reservoir.org.za/dws-comms/
// via .github/workflows/update-gate-notices.yml
export const GATE_NOTICES: GateNotice[] = gateNoticesData as GateNotice[];
