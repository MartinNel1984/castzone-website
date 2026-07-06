-- Re-validation counter for deals (keeps the Specials page honest).
-- Run once in Supabase SQL Editor.
-- The daily bot re-checks each live deal against what's still on special;
-- a deal that's gone gets stale_checks bumped and is auto-removed after a
-- couple of misses. Still-valid deals stay (and get their price refreshed).

alter table deals add column if not exists stale_checks int not null default 0;
