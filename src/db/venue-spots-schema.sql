-- ============================================================
-- CastZone: Venue Spots ("Add a spot")
-- Angler-contributed fishing spots - the exact bank/pen where you set up
-- your rod, with a photo, GPS captured on-site, and a casting tip.
-- This is what makes The Map "show where you actually fish from".
--
-- STEP 1: Create the storage bucket first:
--   Storage -> New bucket -> Name: "spot-images" -> toggle Public ON -> Create
-- STEP 2: Run this whole file in the Supabase SQL editor. Idempotent
--   (safe to re-run - every statement uses "if not exists" / "or replace").
--
-- Contents:
--   1. venue_spots    the spots themselves
--   2. spot_confirms  "I've fished here too" - powers the confirms count
--   3. spot_flags     member reports of dodgy / wrong / unsafe spots
--   4. triggers       keep confirms count + updated_at in sync
--   5. RLS + storage  who can read / write what
-- ============================================================


-- 1. The spots ----------------------------------------------
create table if not exists venue_spots (
  id          uuid primary key default gen_random_uuid(),
  venue_slug  text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,                 -- e.g. "The North Wall"
  access      text,                          -- bank / wall / jetty / boat / float-tube / rocks
  tip         text,                          -- where and how to cast
  species     text[] not null default '{}',
  lat         double precision,              -- GPS captured at the spot
  lng         double precision,
  accuracy_m  double precision,              -- GPS accuracy in metres if known
  image_url   text not null,
  confirms    int  not null default 0,       -- kept in sync by trigger (section 4)
  flags       int  not null default 0,       -- kept in sync by trigger (section 4)
  approved    boolean not null default true, -- flip default to false to pre-moderate
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists venue_spots_slug_idx on venue_spots (venue_slug, created_at desc);
create index if not exists venue_spots_user_idx on venue_spots (user_id);
-- Fast "spots with a pin" lookups (for showing pins on the venue map).
create index if not exists venue_spots_geo_idx on venue_spots (venue_slug)
  where lat is not null and lng is not null;


-- 2. Confirms - "I've fished this spot too" -----------------
-- One row per (user, spot). The primary key stops a member confirming the same
-- spot twice; a trigger rolls the live count onto venue_spots.confirms.
create table if not exists spot_confirms (
  spot_id     uuid not null references venue_spots(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (spot_id, user_id)
);

create index if not exists spot_confirms_user_idx on spot_confirms (user_id);


-- 3. Flags - moderation / abuse reports ---------------------
-- Members flag a spot that's wrong, spammy, off-location or unsafe. One row per
-- (user, spot). When a spot collects flags you can review and unapprove it.
create table if not exists spot_flags (
  spot_id     uuid not null references venue_spots(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  reason      text,                          -- "wrong location", "not fishing", "spam"...
  created_at  timestamptz not null default now(),
  primary key (spot_id, user_id)
);


-- 4. Triggers - keep the cached counts and updated_at honest -
-- Storing confirms/flags as columns on venue_spots keeps reads cheap (no join
-- to count every time); these triggers keep those columns exactly correct.

create or replace function venue_spots_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_venue_spots_updated_at on venue_spots;
create trigger trg_venue_spots_updated_at
  before update on venue_spots
  for each row execute function venue_spots_touch_updated_at();

create or replace function spot_confirms_sync()
returns trigger language plpgsql as $$
declare
  target uuid := coalesce(new.spot_id, old.spot_id);
begin
  update venue_spots
     set confirms = (select count(*) from spot_confirms where spot_id = target)
   where id = target;
  return null;
end $$;

drop trigger if exists trg_spot_confirms_sync on spot_confirms;
create trigger trg_spot_confirms_sync
  after insert or delete on spot_confirms
  for each row execute function spot_confirms_sync();

create or replace function spot_flags_sync()
returns trigger language plpgsql as $$
declare
  target uuid := coalesce(new.spot_id, old.spot_id);
begin
  update venue_spots
     set flags = (select count(*) from spot_flags where spot_id = target)
   where id = target;
  return null;
end $$;

drop trigger if exists trg_spot_flags_sync on spot_flags;
create trigger trg_spot_flags_sync
  after insert or delete on spot_flags
  for each row execute function spot_flags_sync();


-- 5a. Row-level security: venue_spots -----------------------
alter table venue_spots enable row level security;

-- Public sees only approved spots; an author always sees their own.
drop policy if exists "spots public read" on venue_spots;
create policy "spots public read" on venue_spots
  for select using (approved or auth.uid() = user_id);

drop policy if exists "spots own insert" on venue_spots;
create policy "spots own insert" on venue_spots
  for insert with check (auth.uid() = user_id);

drop policy if exists "spots own update" on venue_spots;
create policy "spots own update" on venue_spots
  for update using (auth.uid() = user_id);

drop policy if exists "spots own delete" on venue_spots;
create policy "spots own delete" on venue_spots
  for delete using (auth.uid() = user_id);


-- 5b. RLS: confirms (any signed-in member, only their own row) -
alter table spot_confirms enable row level security;

drop policy if exists "confirms public read" on spot_confirms;
create policy "confirms public read" on spot_confirms for select using (true);

drop policy if exists "confirms own insert" on spot_confirms;
create policy "confirms own insert" on spot_confirms
  for insert with check (auth.uid() = user_id);

drop policy if exists "confirms own delete" on spot_confirms;
create policy "confirms own delete" on spot_confirms
  for delete using (auth.uid() = user_id);


-- 5c. RLS: flags (a member sees/raises only their own flag) -
alter table spot_flags enable row level security;

drop policy if exists "flags own read" on spot_flags;
create policy "flags own read" on spot_flags
  for select using (auth.uid() = user_id);

drop policy if exists "flags own insert" on spot_flags;
create policy "flags own insert" on spot_flags
  for insert with check (auth.uid() = user_id);

drop policy if exists "flags own delete" on spot_flags;
create policy "flags own delete" on spot_flags
  for delete using (auth.uid() = user_id);


-- 5d. Storage policies for the "spot-images" bucket ---------
drop policy if exists "spot_images_insert" on storage.objects;
create policy "spot_images_insert" on storage.objects
  for insert with check (bucket_id = 'spot-images' and auth.role() = 'authenticated');

drop policy if exists "spot_images_select" on storage.objects;
create policy "spot_images_select" on storage.objects
  for select using (bucket_id = 'spot-images');

drop policy if exists "spot_images_update" on storage.objects;
create policy "spot_images_update" on storage.objects
  for update using (bucket_id = 'spot-images' and auth.role() = 'authenticated');

drop policy if exists "spot_images_delete" on storage.objects;
create policy "spot_images_delete" on storage.objects
  for delete using (bucket_id = 'spot-images' and auth.role() = 'authenticated');
