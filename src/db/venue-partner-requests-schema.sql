create table if not exists venue_partner_requests (
  id           uuid        default gen_random_uuid() primary key,
  created_at   timestamptz default now(),
  venue_name   text        not null,
  contact_name text        not null,
  phone        text        not null,
  email        text        not null,
  province     text        not null,
  venue_type   text        not null,
  description  text,
  gps          text,
  status       text        default 'pending'
);

alter table venue_partner_requests enable row level security;

-- Anyone can submit (no auth required — venue owners are not members)
create policy "Anyone can submit a partner request"
  on venue_partner_requests for insert
  with check (true);

-- No select policy = only service role can read (view leads in Supabase Studio)
