-- Restrict /specials deal data to signed-up members only.
-- Previously "approved" deals were readable by anon (public.deals grants select to anon, authenticated),
-- so anyone could fetch deal data directly via the Supabase REST/JS client without an account.
-- This tightens the RLS policy so anonymous (logged-out) visitors get zero rows; only
-- authenticated members (or admins) can read approved deals.

drop policy if exists "deals_select" on deals;
create policy "deals_select"
  on deals for select
  using ((status = 'approved' and auth.uid() is not null) or is_admin());
