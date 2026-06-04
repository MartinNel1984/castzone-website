-- ============================================================
-- CastZone: Venues / The Map
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create table if not exists venues (
  id              uuid not null default gen_random_uuid() primary key,
  name            text not null,
  slug            text unique not null,
  province        text not null,
  type            text not null,   -- dam | river | estuary | saltwater
  species         text[] not null default '{}',
  lat             double precision not null,
  lng             double precision not null,
  permit_required boolean not null default false,
  permit_info     text,
  facilities      text[] not null default '{}',
  created_at      timestamptz not null default now()
);

alter table venues enable row level security;
create policy "venues_read" on venues for select using (true);

-- ── Seed data: 27 SA fishing venues ─────────────────────────

insert into venues (name, slug, province, type, species, lat, lng, permit_required, permit_info, facilities) values

-- Gauteng
('Vaal Dam',             'vaal-dam',             'Gauteng',       'dam',      ARRAY['Bass','Carp','Barbel','Yellowfish'],   -26.900, 28.100, false, null,                                            ARRAY['Boat ramp','Parking','Shops nearby']),
('Rietvlei Dam',         'rietvlei-dam',         'Gauteng',       'dam',      ARRAY['Specimen Carp','Bass','Barbel'],        -25.877, 28.317, true,  'Day permits from Rietvlei Nature Reserve.',    ARRAY['Parking','Toilets','Day permits on site']),
('Hartbeespoort Dam',    'hartbeespoort-dam',     'Gauteng',       'dam',      ARRAY['Bass','Carp','Tilapia'],                -25.751, 27.866, false, null,                                            ARRAY['Boat ramp','Parking','Shops nearby']),
('Bronkhorstspruit Dam', 'bronkhorstspruit-dam',  'Gauteng',       'dam',      ARRAY['Bass','Carp'],                          -25.817, 28.767, false, null,                                            ARRAY['Parking']),
('Roodeplaat Dam',       'roodeplaat-dam',        'Gauteng',       'dam',      ARRAY['Bass','Carp','Tilapia'],                -25.633, 28.383, false, null,                                            ARRAY['Boat ramp','Parking']),

-- Western Cape
('Theewaterskloof Dam',  'theewaterskloof-dam',   'Western Cape',  'dam',      ARRAY['Bass','Carp','Bluegill'],               -34.020, 19.250, false, null,                                            ARRAY['Parking']),
('Voëlvlei Dam',         'voelvlei-dam',          'Western Cape',  'dam',      ARRAY['Bass'],                                 -33.417, 18.917, false, null,                                            ARRAY['Parking']),
('Kalk Bay Harbour',     'kalk-bay-harbour',      'Western Cape',  'saltwater',ARRAY['Snoek','Yellowtail','Hottentot','Carpenter'], -34.130, 18.438, false, null,                                   ARRAY['Parking','Toilets']),
('Gansbaai Harbour',     'gansbaai-harbour',      'Western Cape',  'saltwater',ARRAY['Yellowtail','Snoek','Kabeljou'],        -34.583, 19.350, false, null,                                            ARRAY['Boat ramp','Parking']),
('Wilderness Lagoon',    'wilderness-lagoon',     'Western Cape',  'estuary',  ARRAY['Leervis','Spotted Grunter','Flathead Mullet'], -33.990, 22.590, false, null,                                ARRAY['Parking','Braai facilities']),

-- KwaZulu-Natal
('Midmar Dam',           'midmar-dam',            'KwaZulu-Natal', 'dam',      ARRAY['Bass','Carp','Trout'],                  -29.517, 30.150, true,  'Day permits at the main gate.',                ARRAY['Boat ramp','Parking','Camping','Toilets']),
('Albert Falls Dam',     'albert-falls-dam',      'KwaZulu-Natal', 'dam',      ARRAY['Bass','Carp'],                          -29.433, 30.383, false, null,                                            ARRAY['Parking']),
('Bluff Pier',           'bluff-pier',            'KwaZulu-Natal', 'saltwater',ARRAY['Shad','Kob','Springer','Garrick'],      -29.940, 31.010, false, null,                                            ARRAY['Parking']),
('St Lucia Estuary',     'st-lucia-estuary',      'KwaZulu-Natal', 'estuary',  ARRAY['Kob','Giant Perch','Garfish','Grunter'], -28.383, 32.417, true,  'Fishing within iSimangaliso Wetland Park — check current regulations.', ARRAY['Boat ramp','Parking','Camping']),
('Chaka''s Rock',        'chakas-rock',           'KwaZulu-Natal', 'saltwater',ARRAY['Shad','Blacktail','Kob','Bream'],       -29.467, 31.233, false, null,                                            ARRAY['Parking']),

-- Limpopo
('Nandoni Dam',          'nandoni-dam',           'Limpopo',       'dam',      ARRAY['Tigerfish','Tilapia','Vundu','Catfish'], -22.950, 30.317, false, null,                                            ARRAY['Boat ramp','Parking']),
('Tzaneen Dam',          'tzaneen-dam',           'Limpopo',       'dam',      ARRAY['Bass','Tilapia','Catfish'],             -23.817, 30.150, false, null,                                            ARRAY['Parking']),

-- Mpumalanga
('Loskop Dam',           'loskop-dam',            'Mpumalanga',    'dam',      ARRAY['Tigerfish','Bass','Carp','Yellowfish'], -25.450, 29.317, true,  'Permits from Loskop Dam Nature Reserve.',      ARRAY['Boat ramp','Camping','Parking','Toilets']),
('Witbank Dam',          'witbank-dam',           'Mpumalanga',    'dam',      ARRAY['Bass','Carp'],                          -25.883, 29.217, false, null,                                            ARRAY['Parking']),

-- North West
('Vaalkop Dam',          'vaalkop-dam',           'North West',    'dam',      ARRAY['Bass','Carp'],                          -25.417, 27.433, false, null,                                            ARRAY['Parking']),
('Klipvoor Dam',         'klipvoor-dam',          'North West',    'dam',      ARRAY['Bass','Carp'],                          -25.350, 27.550, false, null,                                            ARRAY['Parking']),

-- Free State
('Gariep Dam',           'gariep-dam',            'Free State',    'dam',      ARRAY['Yellowfish','Bass','Carp','Barbel'],    -30.567, 25.517, false, null,                                            ARRAY['Boat ramp','Camping','Parking','Toilets']),
('Sterkfontein Dam',     'sterkfontein-dam',      'Free State',    'dam',      ARRAY['Trout','Yellowfish','Bass'],            -28.350, 29.083, true,  'Permit required — contact the resort.',        ARRAY['Parking','Camping']),

-- Eastern Cape
('Nahoon Dam',           'nahoon-dam',            'Eastern Cape',  'dam',      ARRAY['Bass'],                                 -32.917, 27.917, false, null,                                            ARRAY['Parking']),
('Kowie River (Port Alfred)', 'kowie-river',      'Eastern Cape',  'estuary',  ARRAY['Kob','Leervis','Spotted Grunter','Garfish'], -33.583, 26.917, false, null,                                   ARRAY['Boat ramp','Parking']),

-- Northern Cape
('Vanderkloof Dam',      'vanderkloof-dam',       'Northern Cape', 'dam',      ARRAY['Yellowfish','Bass','Carp','Barbel'],    -30.067, 24.733, false, null,                                            ARRAY['Boat ramp','Camping','Parking']),
('Boegoeberg Dam',       'boegoeberg-dam',        'Northern Cape', 'dam',      ARRAY['Yellowfish','Carp'],                    -28.917, 21.867, false, null,                                            ARRAY['Parking'])

on conflict (slug) do nothing;
