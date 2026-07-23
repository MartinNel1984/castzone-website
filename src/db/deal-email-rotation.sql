-- Spread the daily Specials digest across members instead of emailing
-- everyone at once. A single burst to ~186 recipients is what triggered
-- Zoho's "unusual sending activity" lock (see deal-unsubscribe.sql sibling
-- notes) — even on Resend, sending the whole list in one shot every day is
-- unnecessary risk. Instead each member gets emailed roughly once every
-- ROTATION_DAYS days (default 10, ~19 members/day for ~186 members),
-- catching them up on everything approved since THEIR last email (or their
-- signup date if they've never been emailed) — nobody misses a deal, the
-- digest content is just personalized instead of identical for everyone.
-- Run in: Supabase Dashboard -> SQL Editor -> New Query. Idempotent.

alter table profiles add column if not exists last_deal_email_sent_at timestamptz;
