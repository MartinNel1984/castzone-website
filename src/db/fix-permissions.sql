-- ============================================================
-- CastZone — Permission Fix
-- Paste this into Supabase SQL Editor and click Run
-- ============================================================

-- Allow Supabase's auth system to insert profiles (needed for the trigger)
grant usage on schema public to supabase_auth_admin;
grant insert on public.profiles to supabase_auth_admin;

-- Allow authenticated users to insert their own profile (app-level fallback)
create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = id);
