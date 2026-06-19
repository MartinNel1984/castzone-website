-- ============================================================
-- CastZone — Security fixes (2026-06-19 review)
-- Paste into Supabase SQL Editor → Run. Idempotent (safe to re-run).
--
-- This is a static site (output: "export") with no server, so every DB
-- call runs in the browser with the public anon key — RLS + storage
-- policies are the ENTIRE security boundary. These three fixes close the
-- gaps found in the review.
-- ============================================================


-- ------------------------------------------------------------
-- FIX 1 (MEDIUM) — Scope storage update/delete to the file OWNER.
--
-- The avatars / spot-images / listing-images buckets gated update &
-- delete on only "bucket + authenticated", never ownership. Since the
-- select policy lets anyone LIST a bucket and every user's UID is public
-- (profiles is world-readable), any logged-in member could enumerate and
-- delete/overwrite EVERY other member's photos. Pin these to the uploader
-- (storage.objects.owner = auth.uid()). Insert & select are unchanged.
-- (post-images and catch-images already have no update/delete policy.)
-- ------------------------------------------------------------

-- avatars
drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update"
  on storage.objects for update
  using (bucket_id = 'avatars' and owner = auth.uid());

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete"
  on storage.objects for delete
  using (bucket_id = 'avatars' and owner = auth.uid());

-- spot-images
drop policy if exists "spot_images_update" on storage.objects;
create policy "spot_images_update"
  on storage.objects for update
  using (bucket_id = 'spot-images' and owner = auth.uid());

drop policy if exists "spot_images_delete" on storage.objects;
create policy "spot_images_delete"
  on storage.objects for delete
  using (bucket_id = 'spot-images' and owner = auth.uid());

-- listing-images (delete only; it has no update policy)
drop policy if exists "listing_images_delete" on storage.objects;
create policy "listing_images_delete"
  on storage.objects for delete
  using (bucket_id = 'listing-images' and owner = auth.uid());


-- ------------------------------------------------------------
-- FIX 2 (LOW–MED) — Pin search_path on all SECURITY DEFINER functions.
--
-- These run with elevated (owner) privileges but had no fixed search_path
-- and reference some tables unqualified — the classic search-path-hijack
-- hardening gap. ALTER (not re-declare) so we don't touch the bodies.
-- Guarded so the migration never errors if a function isn't present.
-- ------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'handle_new_user()',
    'handle_new_post()',
    'handle_new_thread()',
    'notify_new_catch()',
    'notify_catch_comment()'
  ] loop
    if to_regprocedure('public.' || fn) is not null then
      execute format('alter function public.%s set search_path = public', fn);
    end if;
  end loop;
end $$;


-- ------------------------------------------------------------
-- FIX 3 (LOW) — Stop members faking their rank / post count.
--
-- profiles_update lets a member update their own row, and member_level +
-- post_count live on it — so a member could set themselves to the top tier
-- or inflate post_count. Those two columns are maintained ONLY by the
-- forum triggers (handle_new_post), which run as the table owner. A BEFORE
-- UPDATE trigger that keys off current_user lets the owner-context trigger
-- and the service role (dashboard) through, but freezes both columns for
-- ordinary logged-in members. NOT security definer — it must run as the
-- invoking role so current_user reflects who is really writing.
-- ------------------------------------------------------------
create or replace function protect_profile_stats()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.member_level := old.member_level;
    new.post_count   := old.post_count;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_stats on profiles;
create trigger protect_profile_stats
  before update on profiles
  for each row execute function protect_profile_stats();
