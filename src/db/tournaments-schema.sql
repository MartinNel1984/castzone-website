-- Tournaments table
create table if not exists tournaments (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  discipline       text not null default 'general',
  organizer        text,
  province         text,
  venue_name       text,
  start_date       date not null,
  end_date         date,
  registration_url text,
  description      text,
  contact_info     text,
  created_at       timestamptz default now()
);

alter table tournaments enable row level security;

create policy "tournaments are publicly readable"
  on tournaments for select using (true);

-- Seed: a handful of real SA tournaments to get you started.
-- Update dates/details in Supabase Studio as needed.
insert into tournaments (title, discipline, organizer, province, venue_name, start_date, end_date, description) values
(
  'FOSAF National Fly Fishing Championships',
  'fly', 'FOSAF', 'KwaZulu-Natal', 'Kamberg',
  '2026-07-10', '2026-07-12',
  'Annual national fly fishing championship held at the iconic Kamberg trout waters in the Drakensberg foothills.'
),
(
  'Carp SA National Championships',
  'specimen', 'Carp SA', 'Gauteng', 'Vaal Dam',
  '2026-08-07', '2026-08-09',
  '48-hour format. Pairs and singles categories open to all Carp SA registered members.'
),
(
  'SABAA Eastern Cape Bass Classic',
  'bass', 'SABAA', 'Eastern Cape', 'Bonza Bay',
  '2026-08-28', '2026-08-30',
  'Regional bass tournament open to Eastern Cape SABAA members. Shore and boat divisions.'
),
(
  'SA Shore Angling National Championship',
  'saltwater', 'SASAA', 'Western Cape', 'Yzerfontein',
  '2026-09-11', '2026-09-13',
  'National shore angling championship open to all registered SASAA members. All saltwater species scored.'
),
(
  'SABAA National Bass Championship',
  'bass', 'SABAA', 'Gauteng', 'Vaal Dam',
  '2026-10-09', '2026-10-11',
  'The premier bass fishing event in South Africa. Open to all registered SABAA members. Boat division only.'
),
(
  'SABAA Opening Bass Tournament',
  'bass', 'SABAA', 'North West', 'Hartbeespoort Dam',
  '2026-03-14', '2026-03-15',
  'Season opener tournament on Hartbeespoort Dam.'
);
