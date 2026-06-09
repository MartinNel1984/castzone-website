#!/usr/bin/env python3
"""
CastZone weekly social post — WhatsApp delivery edition.

Each Wednesday this script:
  1. Picks the next caption from social-bank.json
  2. Checks Supabase for a new Trophy Room catch this week (with photo)
  3. If found: uses the catch photo; if not: generates a branded tip card
  4. Uploads the image to Supabase Storage (public URL)
  5. Sends you a WhatsApp message with the ready-to-paste caption + image URL
  6. You open the image on your phone, save it, paste the caption, post to
     Instagram and Facebook manually — takes about 2 minutes.

Requires these GitHub repo secrets:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  MAKE_WEBHOOK_URL        (Make.com webhook URL — posts to Facebook + Instagram)
  CALLMEBOT_API_KEY       (already set — sends a brief WhatsApp confirmation)
  NOTIFY_WHATSAPP_NUMBER  (already set — same as health check)
"""

import json
import os
import sys
import textwrap
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
BANK_PATH  = os.path.join(HERE, "social-bank.json")
STATE_PATH = os.path.join(HERE, "social-state.json")

SUPABASE_URL     = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY      = os.environ.get("SUPABASE_SERVICE_KEY", "")
MAKE_WEBHOOK_URL = os.environ.get("MAKE_WEBHOOK_URL", "")
WA_PHONE         = os.environ.get("NOTIFY_WHATSAPP_NUMBER", "")
WA_APIKEY        = os.environ.get("CALLMEBOT_API_KEY", "")

BRAND_BG     = "#1a3a3a"
BRAND_ORANGE = "#f26522"

FONT_BOLD_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
FONT_REG_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def die(msg):
    print(f"::error::{msg}", file=sys.stderr)
    sys.exit(1)


def warn(msg):
    print(f"::warning::{msg}")


def supabase_get(path):
    url     = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {
        "apikey":        SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        die(f"Supabase GET {path} failed: {e.code} {e.read().decode()}")
    except Exception as e:
        die(f"Supabase GET {path} error: {e}")


def upload_to_storage(filepath, bucket, object_path, content_type):
    """Upload a file to a public Supabase Storage bucket. Returns public URL."""
    url     = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{object_path}"
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type":  content_type,
        "x-upsert":      "true",
    }
    with open(filepath, "rb") as f:
        data = f.read()
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            resp.read()
    except urllib.error.HTTPError as e:
        die(f"Storage upload failed: {e.code} {e.read().decode()}")
    return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{object_path}"


def call_make_webhook(caption, image_url):
    """POST caption + image_url to Make.com — it handles FB + IG posting."""
    payload = json.dumps({"caption": caption, "image_url": image_url}).encode()
    req = urllib.request.Request(
        MAKE_WEBHOOK_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp.read()
        print("Make.com webhook called — posting to Facebook + Instagram.")
    except Exception as e:
        die(f"Make.com webhook failed: {e}")


def send_whatsapp(message):
    """Send a brief WhatsApp confirmation via CallMeBot. Non-fatal if it fails."""
    encoded = urllib.parse.quote(message)
    url     = f"https://api.callmebot.com/whatsapp.php?phone={WA_PHONE}&text={encoded}&apikey={WA_APIKEY}"
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            resp.read()
        print("WhatsApp confirmation sent.")
    except Exception as e:
        warn(f"WhatsApp send failed (non-fatal): {e}")


# ---------------------------------------------------------------------------
# Branded tip card generation (Pillow)
# ---------------------------------------------------------------------------

def _load_font(paths, size):
    from PIL import ImageFont
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()


def generate_tip_card(caption_text, out_path="/tmp/castzone_card.jpg"):
    """Generate a 1080×1080 branded JPEG tip card."""
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        die("Pillow not installed — run: pip install pillow")

    def hex_rgb(h):
        h = h.lstrip("#")
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

    W, H = 1080, 1080
    img  = Image.new("RGB", (W, H), color=hex_rgb(BRAND_BG))
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, W, 18], fill=hex_rgb(BRAND_ORANGE))

    font_logo  = _load_font(FONT_BOLD_PATHS, 96)
    font_body  = _load_font(FONT_REG_PATHS, 50)
    font_small = _load_font(FONT_REG_PATHS, 36)

    draw.text((W // 2, 130), "CASTZONE", font=font_logo,
              fill=hex_rgb(BRAND_ORANGE), anchor="mm")
    draw.rectangle([W // 2 - 200, 188, W // 2 + 200, 194],
                   fill=hex_rgb(BRAND_ORANGE))

    lines  = textwrap.wrap(caption_text, width=28)
    line_h = 70
    y0     = max(250, (H - len(lines) * line_h) // 2)
    for i, line in enumerate(lines):
        draw.text((W // 2, y0 + i * line_h), line, font=font_body,
                  fill=(255, 255, 255), anchor="mm")

    draw.rectangle([0, H - 18, W, H], fill=hex_rgb(BRAND_ORANGE))
    draw.text((W // 2, H - 95), "Where South Africa Fishes",
              font=font_small, fill=(255, 255, 255), anchor="mm")
    draw.text((W // 2, H - 52), "castzone.co.za",
              font=font_small, fill=hex_rgb(BRAND_ORANGE), anchor="mm")

    img.save(out_path, "JPEG", quality=92)
    return out_path


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    for name, val in [
        ("SUPABASE_URL",         SUPABASE_URL),
        ("SUPABASE_SERVICE_KEY", SERVICE_KEY),
        ("MAKE_WEBHOOK_URL",     MAKE_WEBHOOK_URL),
    ]:
        if not val:
            die(f"{name} env var is not set.")

    # Load bank + state
    with open(BANK_PATH, encoding="utf-8") as f:
        bank = json.load(f)
    items = bank.get("items", [])
    if not items:
        die("social-bank.json has no items.")

    with open(STATE_PATH, encoding="utf-8") as f:
        state = json.load(f)
    idx  = state.get("next_index", 0) % len(items)
    item = items[idx]
    print(f"Post #{idx + 1} of {len(items)} ({item['type']}): {item['caption'][:60]}…")

    # Check for a fresh Trophy Room catch this week
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).date().isoformat()
    catches  = supabase_get(
        f"catches?approved=eq.true&image_url=not.is.null"
        f"&created_at=gte.{week_ago}T00:00:00Z"
        f"&order=weight_kg.desc&limit=1"
        f"&select=species,weight_kg,venue,image_url"
    )

    catch_image_url = None
    spotlight_line  = None
    if catches and catches[0].get("image_url"):
        c               = catches[0]
        catch_image_url = c["image_url"]
        spotlight_line  = f"New catch: {c['species']} - {c['weight_kg']} kg"
        if c.get("venue"):
            spotlight_line += f" @ {c['venue']}"
        print(f"Catch spotlight: {spotlight_line}")

    # Build full caption
    caption = item["caption"]
    if spotlight_line:
        caption = f"{spotlight_line}\n\n{caption}"
    full_caption = f"{caption}\n\n{item['hashtags']}"

    # Resolve image URL
    if catch_image_url:
        image_url = catch_image_url
        image_note = "Catch photo from Trophy Room"
    else:
        print("No fresh catch — generating branded tip card…")
        card_path = generate_tip_card(item["caption"])
        ts        = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        image_url = upload_to_storage(
            card_path, "post-images", f"social-cards/card_{ts}.jpg", "image/jpeg"
        )
        image_note = "Branded tip card"
    print(f"Image URL: {image_url}")

    # Post via Make.com (handles Facebook + Instagram automatically)
    call_make_webhook(full_caption, image_url)

    # Brief WhatsApp confirmation so you know it went through
    if WA_PHONE and WA_APIKEY:
        send_whatsapp(
            f"CastZone post #{idx + 1}/{len(items)} sent to Facebook + Instagram. "
            f"({item['type']})"
        )

    # Advance state
    state["next_index"] = (idx + 1) % len(items)
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
        f.write("\n")
    print(f"State advanced -> next_index={state['next_index']}.")


if __name__ == "__main__":
    main()
