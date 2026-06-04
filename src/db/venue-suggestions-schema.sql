-- ============================================================
-- CastZone: Venue Suggestions
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create table if not exists venue_suggestions (
  id           uuid not null default gen_random_uuid() primary key,
  name         text not null,
  province     text not null,
  type         text not null,
  gps          text,
  notes        text,
  submitted_by text,
  created_at   timestamptz not null default now()
);

alter table venue_suggestions enable row level security;

-- Anyone (including non-logged-in visitors) can submit a suggestion
create policy "suggestions_insert" on venue_suggestions
  for insert with check (true);

-- Only the service role (Supabase dashboard) can read suggestions
-- Martin reviews them directly in the Supabase Table Editor
