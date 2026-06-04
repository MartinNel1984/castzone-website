-- ============================================================
-- CastZone: Add bio to profiles
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

alter table profiles add column if not exists bio text;

-- Allow members to update their own bio
create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
