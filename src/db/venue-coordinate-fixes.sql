-- Venue coordinate corrections — generated 2026-06-11, NOT YET APPLIED.
-- While building the depth maps, geocoding showed many dam markers sit far from
-- the actual dam (worst: Kwena 105 km, Mokolo 84 km, Allemanskraal 63 km).
-- Corrected coords come from OSM/Nominatim + manual lookup, and each was verified
-- to fall inside the dam's real water footprint (GLOBathy/HydroLAKES raster).
-- Review, then run in Supabase Studio SQL editor. Re-check the map afterwards.

update venues set lat = -23.1031, lng = 30.0967 where slug = 'albasini-dam';  -- was -23.04, 30.02 (11 km off)
update venues set lat = -28.3028, lng = 27.2615 where slug = 'allemanskraal-dam';  -- was -27.8167, 26.9333 (63 km off)
update venues set lat = -24.5500, lng = 30.8000 where slug = 'blyderivierpoort-dam';  -- was -24.63, 30.81 (9 km off)
update venues set lat = -26.5486, lng = 27.1193 where slug = 'boskop-dam';  -- was -26.71, 27.08 (18 km off)
update venues set lat = -25.9152, lng = 28.6908 where slug = 'bronkhorstspruit-dam';  -- was -25.817, 28.767 (13 km off)
update venues set lat = -33.2061, lng = 25.1486 where slug = 'darlington-dam';  -- was -33, 24.64 (52 km off)
update venues set lat = -24.8418, lng = 29.4355 where slug = 'flag-boshielo-dam';  -- was -24.71, 29.13 (34 km off)
update venues set lat = -30.6329, lng = 25.8194 where slug = 'gariep-dam';  -- was -30.567, 25.517 (30 km off)
update venues set lat = -28.7700, lng = 31.4650 where slug = 'goedertrouw-dam';  -- was -28.51, 31.55 (30 km off)
update venues set lat = -27.0332, lng = 30.4857 where slug = 'heyshope-dam';  -- was -27.25, 30.66 (30 km off)
update venues set lat = -34.0300, lng = 24.6900 where slug = 'impofu-dam';  -- was -33.87, 23.97 (69 km off)
update venues set lat = -29.5051, lng = 25.2440 where slug = 'kalkfontein-dam';  -- was -29.35, 25.0167 (28 km off)
update venues set lat = -25.1315, lng = 27.8091 where slug = 'klipvoor-dam';  -- was -25.35, 27.55 (36 km off)
update venues set lat = -27.2435, lng = 27.6810 where slug = 'koppies-dam';  -- was -27.2333, 27.5667 (11 km off)
update venues set lat = -33.7003, lng = 24.4600 where slug = 'kouga-dam';  -- was -33.63, 23.87 (55 km off)
update venues set lat = -25.3557, lng = 30.3810 where slug = 'kwena-dam';  -- was -25.38, 31.43 (105 km off)
update venues set lat = -24.0124, lng = 27.7708 where slug = 'mokolo-dam';  -- was -23.28, 27.97 (84 km off)
update venues set lat = -24.8700, lng = 26.4533 where slug = 'molatedi-dam';  -- was -25.27, 26.02 (62 km off)
update venues set lat = -32.9041, lng = 27.8029 where slug = 'nahoon-dam';  -- was -32.917, 27.917 (11 km off)
update venues set lat = -22.9900, lng = 30.5602 where slug = 'nandoni-dam';  -- was -22.95, 30.317 (25 km off)
update venues set lat = -31.7651, lng = 27.6535 where slug = 'ncora-dam';  -- was -31.97, 27.63 (23 km off)
update venues set lat = -27.9456, lng = 29.9464 where slug = 'ntshingwayo-dam';  -- was -28.02, 29.99 (9 km off)
update venues set lat = -22.7461, lng = 30.0967 where slug = 'nzhelele-dam';  -- was -22.89, 30.49 (43 km off)
update venues set lat = -27.3995, lng = 31.9539 where slug = 'pongolapoort-dam';  -- was -27.4, 32.07 (11 km off)
update venues set lat = -28.6835, lng = 29.5053 where slug = 'spioenkop-dam';  -- was -28.71, 29.71 (20 km off)
update venues set lat = -28.0766, lng = 24.5547 where slug = 'spitskop-dam';  -- was -27.79, 24.31 (40 km off)
update venues set lat = -28.4637, lng = 29.0281 where slug = 'sterkfontein-dam';  -- was -28.35, 29.083 (14 km off)
update venues set lat = -31.5400, lng = 28.7500 where slug = 'umtata-dam';  -- was -31.55, 28.55 (19 km off)
update venues set lat = -25.3409, lng = 27.4837 where slug = 'vaalkop-dam';  -- was -25.417, 27.433 (10 km off)
update venues set lat = -29.9929, lng = 24.7314 where slug = 'vanderkloof-dam';  -- was -30.067, 24.733 (8 km off)
update venues set lat = -33.3697, lng = 19.0424 where slug = 'voelvlei-dam';  -- was -33.417, 18.917 (13 km off)
update venues set lat = -25.9387, lng = 29.2770 where slug = 'witbank-dam';  -- was -25.883, 29.217 (9 km off)
update venues set lat = -34.0009, lng = 22.2096 where slug = 'wolwedans-dam';  -- was -33.9933, 22.4333 (21 km off)
update venues set lat = -28.7432, lng = 29.2039 where slug = 'woodstock-dam';  -- was -28.73, 29.55 (34 km off)
update venues set lat = -32.5846, lng = 27.5649 where slug = 'wriggleswade-dam';  -- was -32.12, 27.5 (52 km off)
update venues set lat = -26.888699, lng = 27.369475 where slug = 'dimalachite-river-lodge';
