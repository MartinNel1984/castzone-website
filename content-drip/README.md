# CastZone weekly content drip

Keeps the forum looking alive by posting **one grounded thread + a few replies
every week**, automatically. Content is pre-written and reviewable (no AI runs
at post time, so nothing can silently break).

## How it works

1. **`bank.json`** holds ~24 ready-to-go threads (≈6 months at one a week),
   each with 2–3 replies, written by the existing seed members.
2. **`state.json`** remembers which one is next.
3. Every **Saturday 06:00 (SA time)** the GitHub Action
   (`.github/workflows/content-drip.yml`) posts the next item into Supabase
   with fresh "now" timestamps, then ticks the pointer forward.

The thread shows as started ~a day ago with replies trickling in up to now, so
it looks naturally active near the top of the forum.

## What only you (Martin) need to do — one time

The Action needs two **GitHub secrets** so it can write to Supabase.

> ⚠️ Use a **freshly rotated** Supabase service-role key. The old one was
> exposed during seeding and should be rotated anyway. Rotate it in
> Supabase → Project Settings → API → "Reset"/roll the `service_role` key,
> then paste the **new** value below. Nothing else uses the old one.

1. Go to **github.com/MartinNel1984/castzone-website → Settings → Secrets and
   variables → Actions → New repository secret**.
2. Add secret **`SUPABASE_URL`** =
   `https://zohgnpogjtjnozyweutg.supabase.co`
3. Add secret **`SUPABASE_SERVICE_KEY`** = your **new** service-role key.

That's it. The drip starts on the next Saturday. To test it immediately:
**Actions tab → "Weekly content drip" → Run workflow**. Watch the run, then
check the forum — a new thread should appear.

## Reviewing / editing the content

`bank.json` is plain text — open it and **delete or edit any item you don't
like before it runs**. Items post top-to-bottom. `state.json`'s `next_index`
tells you how far it's got (e.g. `5` means items 0–4 are already live).

## When the bank runs low

When all items are posted, the weekly run goes green but prints a warning
("bank exhausted"). Ask Claude to **refill `bank.json`** with a fresh batch
(and optionally reset `next_index` to `0`). The seed members and categories
are reused, so a refill is quick.

## Notes

- Seed members use `@seed.castzone.co.za` emails, so this content stays fully
  filterable/removable and separate from real members.
- As real members start posting, **dial this down** — edit the cron to run
  fortnightly/monthly, or stop it (Actions → … → Disable workflow). The drip is
  a cold-start crutch, not a permanent fixture.
- Light volume (1 thread/week) is deliberate — keeps it organic and avoids
  Google "scaled content" concerns.
