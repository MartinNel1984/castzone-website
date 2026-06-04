-- ============================================================
-- CastZone Phase 2: Photo Uploads Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add image_urls column to posts table
alter table posts add column if not exists image_urls text[] not null default '{}';

-- 2. Storage RLS policies for post-images bucket
--    (Create the bucket manually in the Dashboard first: Storage → New bucket → "post-images" → Public ON)

create policy "post_images_insert"
  on storage.objects for insert
  with check (bucket_id = 'post-images' and auth.role() = 'authenticated');

create policy "post_images_select"
  on storage.objects for select
  using (bucket_id = 'post-images');
