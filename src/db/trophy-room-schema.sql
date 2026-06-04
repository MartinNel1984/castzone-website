-- ============================================================
-- CastZone Phase 3: Trophy Room
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Catches table
create table if not exists catches (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references profiles(id) on delete cascade,
  category    text        not null check (category in ('carp', 'bass', 'saltwater')),
  species     text        not null,
  weight_kg   numeric(6,3) not null check (weight_kg > 0),
  catch_date  date        not null,
  venue       text,
  notes       text,
  image_url   text,
  approved    boolean     not null default false,
  approved_at timestamptz,
  created_at  timestamptz not null default now()
);

-- 2. Auto-set approved_at the moment Martin flips approved = true in Supabase dashboard
create or replace function set_catch_approved_at()
returns trigger language plpgsql as $$
begin
  if new.approved = true and old.approved = false then
    new.approved_at := now();
  end if;
  return new;
end;
$$;

create trigger catch_approved_trigger
before update on catches
for each row execute function set_catch_approved_at();

-- 3. RLS
alter table catches enable row level security;

-- Approved catches are public; members can see their own pending submissions
create policy "catches_select"
  on catches for select
  using (approved = true or auth.uid() = user_id);

-- Only authenticated members can submit
create policy "catches_insert"
  on catches for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select on catches to anon, authenticated;
grant insert on catches to authenticated;

-- ============================================================
-- 4. Storage bucket for trophy photos
-- Do this manually in the Supabase Dashboard:
--   Storage → New bucket → Name: "catch-images" → toggle Public ON → Create
-- Then run the two policies below.
-- ============================================================

create policy "catch_images_insert"
  on storage.objects for insert
  with check (bucket_id = 'catch-images' and auth.role() = 'authenticated');

create policy "catch_images_select"
  on storage.objects for select
  using (bucket_id = 'catch-images');
