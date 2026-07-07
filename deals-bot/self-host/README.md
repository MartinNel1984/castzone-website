# Self-hosting the deals bot on the M2 MacBook

Why: the retailer product-listing APIs (Takealot, Outdoor Warehouse) block
requests from cloud/datacenter IPs (GitHub Actions runners), which is why
the bot was routing through a paid ScraperAPI proxy. A home IP isn't
blocked, so running the exact same script from this Mac needs no proxy at
all — permanently removes the ScraperAPI credit problem.

## One-time setup (run these on the M2 MacBook)

```bash
# 1. Clone the repo (uses your own GitHub login/SSH key — not a shared token)
git clone https://github.com/MartinNel1984/castzone-website.git ~/castzone-website

# 2. Confirm Python 3 is available (macOS ships one; 3.9+ is fine, the
#    script is stdlib-only so no pip install needed)
python3 --version

# 3. Create the local secrets file (never committed — .env* is gitignored)
cp ~/castzone-website/deals-bot/self-host/.env.local.example \
   ~/castzone-website/deals-bot/.env.local
# then edit ~/castzone-website/deals-bot/.env.local and paste in
# SUPABASE_SERVICE_KEY (from Supabase dashboard > Project Settings > API,
# or the GitHub repo's Actions secrets). Do NOT paste it anywhere else.
open -e ~/castzone-website/deals-bot/.env.local

# 4. Test it manually once before scheduling anything
cd ~/castzone-website && set -a && source deals-bot/.env.local && set +a
DRY_RUN=1 MIN_DISCOUNT=50 python3 deals-bot/fetch_deals.py
# should print retailer results with no "FAILED" lines and no proxy — confirms
# the home IP isn't blocked.

# 5. Install the daily scheduled job (07:00 every day, matches the old cron)
cp ~/castzone-website/deals-bot/self-host/com.castzone.dealsbot.plist \
   ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.castzone.dealsbot.plist

# 6. Make sure the Mac actually wakes up for it — schedule an auto-wake a
#    few minutes before 07:00 (skip this if the Mac is never fully asleep,
#    e.g. always plugged in with the lid open):
sudo pmset repeat wakeorpoweron MTWRFSU 06:55:00
```

## Keeping it running

- Keep the Mac plugged in (System Settings > Battery/Energy > prevent sleep
  on power adapter, or `sudo pmset -c disablesleep 1` for good measure).
- Needs network access at run time — Wi-Fi reconnecting after wake is
  normally automatic, no static IP required (SUPABASE_URL is a hostname).
- Check `/tmp/castzone-dealsbot.log` after a run to confirm it worked.
- Test the launchd job on demand without waiting for 07:00:
  `launchctl start com.castzone.dealsbot`

## Once this is proven working for a few days

Tell me and I'll either disable the GitHub Actions `deals-bot.yml` cron (or
just remove the `SCRAPER_API_KEY` secret and leave the workflow as a harmless
no-op fallback in case the Mac is ever off).
