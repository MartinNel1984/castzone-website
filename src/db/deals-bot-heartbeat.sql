-- Heartbeat row the deals bot writes to at the end of every real run on the
-- M2. Lets a GitHub Actions health check (which can't reach the M2 directly
-- — it's a home machine, no public endpoint) confirm the bot is actually
-- running on schedule, independent of whether any deals changed that run
-- (a quiet "0 new, 0 changed" run is normal and shouldn't look like an outage).
create table if not exists deals_bot_heartbeat (
  id int primary key default 1,
  last_run_at timestamptz not null default now(),
  constraint deals_bot_heartbeat_single_row check (id = 1)
);

insert into deals_bot_heartbeat (id, last_run_at)
values (1, now())
on conflict (id) do nothing;

-- No RLS policies needed: only ever written/read via the service-role key
-- (from the M2 and from GitHub Actions), which bypasses RLS entirely.
