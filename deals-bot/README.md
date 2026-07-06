# CastZone Deals Bot

Finds SA **fishing & camping** deals that are at least `MIN_DISCOUNT`% off and
queues them into the Supabase `deals` table as `status='pending'`. Martin
approves/rejects them on **/specials/review**; approved deals appear on
**/specials** and notify members.

Runs daily via `.github/workflows/deals-bot.yml` (07:00 SAST) and on demand from
the **Actions → Deals bot → Run workflow** button (where you can set the
discount % for that run).

## Setup (one-time)

Nothing new to add if the content-drip bot already works — this reuses the same
two repo secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`  (service_role key — bypasses RLS to insert deals)

Also make sure `src/db/deals-schema.sql` has been run in Supabase (creates the
`deals` table). Until then the bot has nowhere to write.

## Tuning the discount threshold

The default is **40%**. Real-world note: mainstream SA outdoor retailers mostly
run 10–33% promos, so even a 40% floor stays sparse until genuine clearance or
until more retailers (via affiliate feeds) are added. To change it:

- **For one run:** Actions → Deals bot → *Run workflow* → set *Minimum discount %*.
- **Permanently:** edit `MIN_DISCOUNT` default in `deals-bot.yml`.

## Adding retailers

Each retailer is one entry in `RETAILERS` in `fetch_deals.py`, keyed by
`platform` → adapter:

| Retailer | Platform | Status |
|---|---|---|
| Outdoor Warehouse | `cowhills` (products.json + marked_down filter) | ✅ live |
| Sportsmans Warehouse | Algolia backend | ⏳ needs an `algolia` adapter |
| Kingfisher / Campworld / Safari Outdoor | custom / redirects | ⏳ bespoke |
| Takealot / Makro / Game / Cape Union Mart / Mr Price | SPA + bot-protected | best via **affiliate product feeds** |

Affiliate feeds are the robust way to add the big bot-protected retailers: they
hand over clean product data *with RRP + sale price*, are allowed, and pay
CastZone commission. Recommended next step for wider coverage.

## Testing locally

```bash
DRY_RUN=1 MIN_DISCOUNT=30 python3 deals-bot/fetch_deals.py   # find + print, no writes
```

De-dupes on `external_id` (`<source>:<product-id>`), so a product is never
queued twice — including ones you've already rejected.
