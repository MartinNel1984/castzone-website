# AirTents-inspired redesign pass — design

Context: following an audit of airtents.co.za (Chris's site), 5 UI patterns were flagged as worth reusing (see Martin's memory: `reference-airtents-design-patterns.md`). Pattern 3 (floating quote drawer) already shipped as the venue "Trip shortlist" drawer. This design covers the remaining 4, adapted to CastZone's existing brand rather than copied literally.

## 1. Homepage hero — rotating catch-photo backdrop + slide dots

- Keep existing hero copy, CTAs, and the "Vaal River — Live Reading" data panel (`src/app/page.tsx:194-265`) unchanged — that data-first identity is the point, not something to replace with stock photography.
- Add a background photo layer behind the hero: crossfading rotation of ~5 real approved Trophy Room catch photos (`catches` table, `image_url`, `approved = true`, most recent/highest-weight), dimmed under a dark gradient for text contrast.
- Slide-progress dots (bottom-right of hero), one per photo, auto-advance ~5s, click to jump — CastZone-styled (mono font, cast-orange), not a scroll-linked carousel like AirTents.
- Caption per photo: species + venue (e.g. "14.2kg Largemouth Bass — Gariep Dam").
- Degrades gracefully to today's plain hero if no catches load.

## 2. Venue-page testimonials — "Real Catches Here"

- New section on `VenueContent.tsx`, between location/map block and Forum Threads.
- Query `catches` where `venue` exact-matches `venue.name` and `approved = true`, ordered by recency, limit ~6. (Free-text field, no FK — acceptable v1 limitation, no migration.)
- Card: photo, species + weight, angler username, relative time — same visual language as existing Trophy Room cards.
- Empty state: no dead section — one line "Be the first to log a catch here" linking to `/catches/submit` pre-filled with venue name.

## 3. Dual-CTA row on venue pages

- New row right after the province line, before the map: two `Button` primitives, side by side (stack on mobile).
  - "🎣 Ask the Community" (solid) → existing `newThreadUrl`.
  - "📍 Get Directions" (line) → existing `gpsUrl`.
- Existing "Add to Trip" toggle chip stays where it is (lightweight bookmark, not a page-level CTA).
- Existing "Open in Maps" block and "+ Start one" forum link lower on the page stay as-is.

## 4. Performance safeguards + Lighthouse pass

- Hero photos via `next/image`, only first photo `priority`/eager, rest lazy, `sizes` prop set.
- Crossfade via opacity on stacked `<img>`s, not `src` swap.
- Rotation interval cleared on unmount, paused on `document.visibilityState !== "visible"`.
- After implementation: `lighthouse_audit` (mobile + desktop) on `/`, `/venues`, a venue detail page — before/after comparison, fix whatever it actually flags.

## Build order

Hero → testimonials → dual-CTA → measure/fix. Verify each in-browser via chrome-devtools MCP before moving to the next, same process used for the shortlist drawer.
