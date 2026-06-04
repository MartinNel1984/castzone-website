-- ============================================================
-- CastZone Phase 4: Tackle Box (buy/sell classifieds)
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Idempotent: safe to run more than once.
--
-- BLOCK A = table + RLS + policies (run this first).
-- BLOCK B = storage policies (run AFTER creating the "listing-images" bucket).
-- ============================================================


-- ========================= BLOCK A =========================

-- 1. Listings table
create table if not exists listings (
  id            uuid        primary key default gen_random_uuid(),
  seller_id     uuid        not null references profiles(id) on delete cascade,
  title         text        not null check (char_length(title) between 3 and 120),
  description   text        not null check (char_length(description) between 1 and 4000),
  price         numeric(10,2) not null check (price >= 0),
  category      text        not null check (category in
                  ('rods-reels','terminal-tackle','boats','accessories','carp-specimen','other')),
  condition     text        not null check (condition in ('new','like-new','good','fair')),
  province      text        not null,
  contact_phone text        not null,
  image_urls    text[]      not null default '{}',
  status        text        not null default 'active' check (status in ('active','sold')),
  created_at    timestamptz not null default now()
);

create index if not exists listings_status_created_idx on listings (status, created_at desc);
create index if not exists listings_category_idx        on listings (category);
create index if not exists listings_seller_idx          on listings (seller_id);

-- 2. RLS
alter table listings enable row level security;

drop policy if exists "listings_select" on listings;
create policy "listings_select"
  on listings for select
  using (status = 'active' or auth.uid() = seller_id);

drop policy if exists "listings_insert" on listings;
create policy "listings_insert"
  on listings for insert
  to authenticated
  with check (auth.uid() = seller_id);

drop policy if exists "listings_update" on listings;
create policy "listings_update"
  on listings for update
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

drop policy if exists "listings_delete" on listings;
create policy "listings_delete"
  on listings for delete
  to authenticated
  using (auth.uid() = seller_id);

grant select on listings to anon, authenticated;
grant insert, update, delete on listings to authenticated;


-- ========================= BLOCK B =========================
-- Run this ONLY after you have created the public bucket "listing-images"
-- (Storage → New bucket → name: listing-images → Public ON → Create).

drop policy if exists "listing_images_insert" on storage.objects;
create policy "listing_images_insert"
  on storage.objects for insert
  with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');

drop policy if exists "listing_images_select" on storage.objects;
create policy "listing_images_select"
  on storage.objects for select
  using (bucket_id = 'listing-images');

drop policy if exists "listing_images_delete" on storage.objects;
create policy "listing_images_delete"
  on storage.objects for delete
  using (bucket_id = 'listing-images' and auth.role() = 'authenticated');
