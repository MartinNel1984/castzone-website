# WhatsApp Specials Group — Design

## Goal
Give CastZone members a WhatsApp channel for deal alerts, alternative to the
email digest, without building a full messaging system.

## Decision
Use a single shared WhatsApp Group with an invite link, not individual
messages via the WhatsApp Business API.

**Why not the Business API:** requires Meta Business verification, per-member
phone number collection, and pre-approved message templates. Also can't post
into a group automatically — it only sends 1:1 messages — so it wouldn't have
saved the manual-posting step anyway.

**Why not an unofficial bot (Baileys etc.):** real risk of the sending number
getting banned by WhatsApp at any volume.

**Trade-off accepted:** posting deals into the group is manual — Martin pastes
a short teaser + link whenever he approves a batch. This mirrors the existing
email digest's teaser style and keeps full deal details behind the click, so
the group drives traffic to `/specials` instead of replacing it.

## Implementation

- **Group link**: `NEXT_PUBLIC_WHATSAPP_GROUP_URL` env var (public, not a
  secret — it's just a link). Placeholder until Martin creates the group and
  supplies the real invite URL.
- **Post-signup CTA**: `src/app/register/page.tsx` — a second button in the
  existing "You're In!" success panel, alongside "Go to the Forum", linking to
  the group URL (opens in a new tab).
- **`/specials` banner**: `src/app/specials/SpecialsContent.tsx` — a slim
  banner after the page header, before the filter tabs, visible to every
  visitor (new and existing members).
- **No database changes.** No phone numbers collected or stored.

## Not building now
- Automated group posting — no official API supports it for groups.
- Reusing the existing per-run CallMeBot WhatsApp ping (to Martin's own phone)
  as ready-to-copy group text — flagged as a cheap future improvement, not
  required for v1.
