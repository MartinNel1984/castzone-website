# CastZone — Security notes & known issues

_Last updated: 2026-06-19_

CastZone is a static export (`output: "export"`) with no server. Every DB/storage
call runs in the browser with the public **anon** key, so Supabase RLS + storage
policies + auth config are the entire security boundary.

## Applied: `src/db/security-fixes.sql` (2026-06-19)

Ran clean in the Supabase SQL editor (project `zohgnpogjtjnozyweutg`).

- **Fix 2 — `search_path` hardening on SECURITY DEFINER functions** — applied, good practice.
- **Fix 3 — stat-faking guard** (`protect_profile_stats` trigger on `public.profiles`)
  — applied and effective; `profiles` is a real, populated table. Freezes
  `member_level` + `post_count` for `authenticated`/`anon` writers.
- **Fix 1 — storage owner-scoped update/delete policies** — **INEFFECTIVE, see below.**

## KNOWN ISSUE #1 — cross-account storage delete (PARKED 2026-06-19)

**Status:** open, parked by owner decision. Impact bounded; revisit later.

**What:** A logged-in member can delete/overwrite *another* member's uploaded
files (avatars / spot-images / listing-images). Confirmed by live API test:
two throwaway accounts, account B successfully deleted account A's `spot-images`
file (`{"message":"Successfully deleted"}`).

**Why the SQL fix didn't take:** This project uses Supabase's newer **S3-backed
storage engine**. Object/bucket metadata is **not** in the classic
`storage.objects` / `storage.buckets` tables — those are empty even to a
`bypassrls` role, while uploads via the API succeed. So Fix 1's RLS policies on
`storage.objects` govern nothing here. (Verified: `public.profiles` = 8 rows in
the same SQL editor session, so it IS the live DB — the storage tables really
are unused for this engine.)

**Correct fix (next time):** the real storage permissions live in the
**dashboard → Storage → each bucket → Policies**, not in SQL. Need to inspect
those bucket policies and scope delete/update to the file owner there, then
re-run the two-account test to confirm.

## KNOWN ISSUE #2 — open, auto-confirming signup (TO TIGHTEN)

**Status:** owner wants to tighten.

**What:** `GET /auth/v1/settings` shows `disable_signup: false` and
`mailer_autoconfirm: true`. Anyone can create an instantly-active authenticated
account with no email verification (confirmed: a test signup returned a working
`access_token` immediately). This is a spam/abuse vector and is what makes
Issue #1 reachable by the public.

**Fix:** Dashboard → Authentication → Sign In / Providers → Email → enable
**"Confirm email"** (turns off auto-confirm). This requires reliable email
delivery — pair with **custom SMTP** (CastZone already has a Zoho mailbox) since
Supabase's built-in mailer is heavily rate-limited and not for production.

## Test artifacts to clean up

Two throwaway auth users were created during testing — delete from
**Authentication → Users**:
- `cz-sectest-a@example.com`
- `cz-sectest-b@example.com`
