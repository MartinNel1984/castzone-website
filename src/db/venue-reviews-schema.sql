-- Venue reviews: members rate and review fishing venues.
-- Run once in the Supabase SQL editor.

create table if not exists venue_reviews (
  id          uuid primary key default gen_random_uuid(),
  venue_slug  text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  rating      int  not null check (rating between 1 and 5),
  body        text,
  created_at  timestamptz not null default now(),
  unique (user_id, venue_slug)
);

alter table venue_reviews enable row level security;

create policy "public read"  on venue_reviews for select using (true);
create policy "own insert"   on venue_reviews for insert with check (auth.uid() = user_id);
create policy "own update"   on venue_reviews for update using (auth.uid() = user_id);
create policy "own delete"   on venue_reviews for delete using (auth.uid() = user_id);
