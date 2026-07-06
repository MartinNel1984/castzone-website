# CastZone Deals Bot

Finds SA **fishing & camping** deals that are at least `MIN_DISCOUNT`% off and
queues them into the Supabase `deals` table as `status='pending'`. Martin
approves/rejects them on **/specials/review**; approved deals appear on
**/specials** and notify members.

Runs daily via `.github/workflows/deals-bot.yml` (07:00 SAST) and on demand from
the **Actions → Deals bot → Run workflow** button (where you can set the
discount % for that run).

## Setup (one-time)

Reuses the content-drip bot's two repo secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`  (service_role key — bypasses RLS to insert deals)

Also make sure `src/db/deals-schema.sql` has been run in Supabase (creates the
`deals` table). Until then the bot has nowhere to write.

### Residential proxy (required for blocked retailers)

Big SA retailers (Outdoor Warehouse etc.) sit behind Cloudflare and **403 any
datacenter IP** — so a plain GitHub Actions run can't read them (it works from a
home machine, just not the cloud). To fix, the bot routes retailer fetches
through **ScraperAPI** when a key is present:

1. Sign up free at scraperapi.com (trial = 5,000 credits).
2. Copy your API key.
3. Repo → Settings → Secrets and variables → Actions → New secret:
   `SCRAPER_API_KEY` = your key.
4. (Optional) If a site still blocks, add a repo *variable* (not secret)
   `SCRAPER_API_PARAMS` = `country_code=za` (SA IPs; costs more credits).

Without `SCRAPER_API_KEY` the bot fetches sites directly (fine locally, blocked
in the cloud). The run log prints `proxy=ON/off` so you can see which mode ran.

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
| Takealot | `takealot` (search API, Featured Deals filter) | ✅ live — deepest deals |
| Outdoor Warehouse | `cowhills` (products.json + marked_down filter) | ✅ live |
| Sportsmans Warehouse | Algolia backend | ⏳ needs an `algolia` adapter |
| Kingfisher / Campworld / Safari Outdoor | custom / redirects | ⏳ bespoke |
| Makro / Game / Cape Union Mart / Mr Price | SPA + bot-protected | ⏳ per-site work |

All fetches route through the ScraperAPI proxy (above) so datacenter-IP blocks
don't matter.

## Volume cap

`MAX_NEW` (default 50) caps how many new deals a single run queues, keeping the
deepest discounts first so the review page never floods. Raise/lower via env.

## Testing locally

```bash
DRY_RUN=1 MIN_DISCOUNT=30 python3 deals-bot/fetch_deals.py   # find + print, no writes
```

De-dupes on `external_id` (`<source>:<product-id>`), so a product is never
queued twice — including ones you've already rejected.
