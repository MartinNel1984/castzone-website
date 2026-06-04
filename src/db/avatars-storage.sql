-- ============================================================
-- CastZone: Profile picture (avatar) storage
-- The profiles.avatar_url column and "update own profile" RLS already exist,
-- so only the storage bucket + its policies are needed.
--
-- STEP 1: Create the bucket first:
--   Storage → New bucket → Name: "avatars" → toggle Public ON → Create
-- STEP 2: Then run this SQL. Idempotent (safe to re-run).
-- ============================================================

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "avatars_select" on storage.objects;
create policy "avatars_select"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');
