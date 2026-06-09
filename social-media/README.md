# CastZone Social Media Automation

Automated Facebook + Instagram posting via GitHub Actions.

- **Weekly posts** (Wednesdays 08:00 SAST): branded tip card or catch spotlight from the Trophy Room
- **Monthly Reels** (first Friday 09:00 SAST): slideshow of top Trophy Room catches built with ffmpeg

---

## One-time setup

You need to do this once. It takes about 20 minutes.

### Step 1 — Connect Instagram to your Facebook Page

1. Open your CastZone Facebook Page.
2. Go to **Settings → Linked Accounts → Instagram**.
3. Connect your CastZone Instagram account (must be a **Business** or **Creator** account).
   - If it's a personal account: open the Instagram app → Settings → Account → Switch to Professional Account → Business.

### Step 2 — Create a Meta Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com) and log in with your personal Facebook account.
2. Click **My Apps → Create App**.
3. Select **Other** → **Business** as the app type.
4. Give it a name (e.g. "CastZone Social") and click **Create App**.
5. On the app dashboard, click **Add a Product** → find **Instagram Graph API** → click **Set Up**.

### Step 3 — Get your Page Access Token (permanent)

The Page Access Token never expires once generated correctly. Follow these steps exactly:

1. In your Meta Developer App, go to **Tools → Graph API Explorer**.
2. In the top-right, select your **CastZone app** from the dropdown.
3. Click **Generate Access Token** → log in → grant all permissions including:
   - `pages_show_list`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
4. You now have a **short-lived User Access Token** (expires in 1 hour). Copy it.
5. Open this URL in your browser (replace `YOUR_SHORT_TOKEN` and `YOUR_APP_ID` and `YOUR_APP_SECRET`):
   ```
   https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN
   ```
   - **App ID + App Secret**: in your Meta Developer App → **Settings → Basic**.
6. This returns a **long-lived User Access Token** (lasts 60 days, but you won't need to refresh it).
7. Now get a **permanent Page Access Token**. Open this URL (replace `YOUR_LONG_TOKEN`):
   ```
   https://graph.facebook.com/me/accounts?access_token=YOUR_LONG_TOKEN
   ```
8. Find your CastZone page in the response. Copy the `"access_token"` value for that page. **This token never expires.**

### Step 4 — Find your Page ID and Instagram User ID

**Facebook Page ID:**
- Open your Facebook Page → **Settings → Page Info** → scroll down to **Page ID** at the bottom.
- OR look at your page URL: `facebook.com/YOUR_PAGE_NAME` — the ID is in Page Settings.

**Instagram Business User ID:**
- Open this URL (replace `YOUR_PAGE_TOKEN` and `YOUR_PAGE_ID`):
  ```
  https://graph.facebook.com/v21.0/YOUR_PAGE_ID?fields=instagram_business_account&access_token=YOUR_PAGE_TOKEN
  ```
- Copy the `"id"` value from inside `instagram_business_account`.

### Step 5 — Add GitHub Secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**.

Add these 5 secrets:

| Secret name | Value |
|---|---|
| `FB_PAGE_ACCESS_TOKEN` | The permanent Page Access Token from Step 3 |
| `FB_PAGE_ID` | Your numeric Facebook Page ID |
| `IG_USER_ID` | Your Instagram Business Account User ID |
| `SUPABASE_URL` | Already set (same as content drip) |
| `SUPABASE_SERVICE_KEY` | Already set (same as content drip) |

`SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are already in your repo from the content drip — you don't need to add them again.

### Step 6 — Test it manually

1. Go to your GitHub repo → **Actions** tab.
2. Click **Weekly social posts** → **Run workflow** → **Run workflow**.
3. Watch the run. If it goes green, check your Facebook Page and Instagram.
4. If it fails, check the error output — most likely a missing or wrong secret.

---

## How it works

### Weekly posts (`post_social.py`)
- Cycles through `social-bank.json` (24 pre-written captions covering tips, venues, gear, seasons, CTAs)
- Checks Supabase for any new Trophy Room catch submitted this week
- If a new catch exists → uses the catch photo as the post image + adds a spotlight line
- If no new catch → generates a branded 1080×1080 tip card image using Pillow
- Posts to Facebook Page (always) and Instagram (always, using the image)
- Advances `social-state.json` and commits it back (same pattern as the forum drip)

### Monthly reels (`make_reel.py`)
- Pulls top 5 approved Trophy Room catches from the past 30 days (falls back to all-time if < 3)
- Downloads each catch photo
- Uses ffmpeg to build a 9:16 (1080×1920) slideshow — each catch displayed for 3.5 seconds with species/weight text overlay and fade transitions
- Uploads the MP4 to Supabase Storage (public `post-images` bucket, `social-reels/` folder)
- Posts to Instagram as a Reel (waits up to 5 minutes for Instagram to process the video)
- Posts to Facebook as a video post
- Deletes the temporary video from storage after Instagram has fetched it

---

## Customising the post bank

Edit `social-bank.json` freely:
- Delete any caption you don't like
- Add new items at the end
- Reorder to change what comes next
- The `next_index` in `social-state.json` always points to what posts next

**To restart from the beginning:** set `next_index` to `0` in `social-state.json`.

The bank currently has 24 items — that's 24 weeks (roughly 6 months) before it cycles back to post 1.

---

## Schedules

| Workflow | When | Cron |
|---|---|---|
| Weekly social posts | Every Wednesday 08:00 SAST | `0 6 * * 3` |
| Monthly highlight reel | First Friday of each month 09:00 SAST | `0 7 1-7 * 5` |
