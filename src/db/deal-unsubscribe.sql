-- One-click unsubscribe from Specials deal emails (not the platform account).
-- Each digest email links to /unsubscribe?u=<user id>&t=<signature>. The
-- signature is an HMAC of the user id, so a link can only flip that one
-- user's email_opt_out flag and can't be guessed/forged from the id alone.
--
-- ⚠️ BEFORE RUNNING: replace REPLACE_WITH_SECRET below with a real random
-- secret (this repo is public on GitHub, so the secret must never be
-- committed — only pasted here in the Supabase SQL Editor). The same value
-- must also be set as the UNSUBSCRIBE_SECRET GitHub Actions secret used by
-- deals-bot/notify_deals.py to build the links. Run in: Supabase Dashboard
-- -> SQL Editor -> New Query. Idempotent (safe to re-run after rotating the
-- secret, but rotating it invalidates links already sent).

create extension if not exists pgcrypto;

create or replace function unsubscribe_deal_email(p_user uuid, p_sig text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  secret text := 'REPLACE_WITH_SECRET';
  expected text;
begin
  expected := encode(hmac(p_user::text, secret, 'sha256'), 'hex');
  if p_sig is null or left(expected, 32) <> p_sig then
    return false;
  end if;

  update profiles set email_opt_out = true where id = p_user;
  return found;
end;
$$;

revoke all on function unsubscribe_deal_email(uuid, text) from public;
grant execute on function unsubscribe_deal_email(uuid, text) to anon, authenticated;
