#!/usr/bin/env python3
"""
CastZone weekly social post.

Posts one caption from social-media/social-bank.json to:
  - Facebook Page (always, with a branded tip card image)
  - Instagram Business (with tip card, or catch spotlight if a new catch exists)

Logic:
  1. Pick the next caption from the bank (cycles when exhausted)
  2. Check Supabase for any catch approved in the last 7 days with a photo
  3. If found: use the catch photo + prepend a catch-spotlight line to the caption
  4. If not: generate a branded 1080x1080 tip card using Pillow, upload to Supabase
  5. Post to Facebook Page with the image + full caption
  6. Post to Instagram: create media container, wait for FINISHED, publish

Requires these GitHub repo secrets:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  FB_PAGE_ACCESS_TOKEN   permanent Page Access Token (see social-media/README.md)
  FB_PAGE_ID             numeric Facebook Page ID
  IG_USER_ID             Instagram Business Account User ID (leave blank to skip IG)
"""

import json
import os
import sys
import textwrap
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
BANK_PATH = os.path.join(HERE, "social-bank.json")
STATE_PATH = os.path.join(HERE, "social-state.json")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_KEY", "")
PAGE_TOKEN   = os.environ.get("FB_PAGE_ACCESS_TOKEN", "")
PAGE_ID      = os.environ.get("FB_PAGE_ID", "")
IG_USER_ID   = os.environ.get("IG_USER_ID", "")  # optional — skip IG if blank

GRAPH_BASE = "https://graph.facebook.com/v21.0"

BRAND_BG      = "#1a3a3a"
BRAND_ORANGE  = "#f26522"

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
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {
        "apikey": SERVICE_KEY,
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


def graph_post(path, params):
    """POST to Meta Graph API with URL-encoded body. Returns parsed JSON."""
    params["access_token"] = PAGE_TOKEN
    data = urllib.parse.urlencode(params).encode()
    url  = f"{GRAPH_BASE}/{path}"
    req  = urllib.request.Request(url, data=data, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        die(f"Graph POST {path} failed: {e.code} — {body}")
    except Exception as e:
        die(f"Graph POST {path} error: {e}")


def graph_get(path, params=None):
    """GET from Meta Graph API. Returns parsed JSON."""
    p  = dict(params or {})
    p["access_token"] = PAGE_TOKEN
    qs = urllib.parse.urlencode(p)
    req = urllib.request.Request(f"{GRAPH_BASE}/{path}?{qs}")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        die(f"Graph GET {path} failed: {e.code} {e.read().decode()}")
    except Exception as e:
        die(f"Graph GET {path} error: {e}")


def upload_to_storage(filepath, bucket, object_path, content_type):
    """Upload a file to a Supabase Storage public bucket. Returns public URL."""
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{object_path}"
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",
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


# ---------------------------------------------------------------------------
# Branded tip card generation (Pillow)
# ---------------------------------------------------------------------------

def _load_font(paths, size):
    """Try each font path in order; fall back to Pillow's built-in default."""
    from PIL import ImageFont
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()


def generate_tip_card(caption_text, out_path="/tmp/castzone_card.jpg"):
    """
    Generate a 1080x1080 branded JPEG tip card.
    Deep-water background, Cast Orange accents, CASTZONE wordmark, caption text.
    """
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        die("Pillow not installed — run: pip install pillow")

    W, H = 1080, 1080

    def hex_to_rgb(h):
        h = h.lstrip("#")
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

    img  = Image.new("RGB", (W, H), color=hex_to_rgb(BRAND_BG))
    draw = ImageDraw.Draw(img)

    # Top accent bar
    draw.rectangle([0, 0, W, 18], fill=hex_to_rgb(BRAND_ORANGE))

    font_logo  = _load_font(FONT_BOLD_PATHS, 96)
    font_body  = _load_font(FONT_REG_PATHS, 50)
    font_small = _load_font(FONT_REG_PATHS, 36)

    # CASTZONE wordmark
    draw.text((W // 2, 130), "CASTZONE", font=font_logo,
              fill=hex_to_rgb(BRAND_ORANGE), anchor="mm")

    # Divider line
    draw.rectangle([W // 2 - 200, 188, W // 2 + 200, 194],
                   fill=hex_to_rgb(BRAND_ORANGE))

    # Caption body (word-wrap to ~28 chars per line)
    lines   = textwrap.wrap(caption_text, width=28)
    line_h  = 70
    total_h = len(lines) * line_h
    y0      = max(250, (H - total_h) // 2)
    for i, line in enumerate(lines):
        draw.text((W // 2, y0 + i * line_h), line, font=font_body,
                  fill=(255, 255, 255), anchor="mm")

    # Bottom accent bar
    draw.rectangle([0, H - 18, W, H], fill=hex_to_rgb(BRAND_ORANGE))

    # Tagline + URL
    draw.text((W // 2, H - 95), "Where South Africa Fishes",
              font=font_small, fill=(255, 255, 255), anchor="mm")
    draw.text((W // 2, H - 52), "castzone.co.za",
              font=font_small, fill=hex_to_rgb(BRAND_ORANGE), anchor="mm")

    img.save(out_path, "JPEG", quality=92)
    return out_path


# ---------------------------------------------------------------------------
# Instagram helpers
# ---------------------------------------------------------------------------

def ig_wait_for_container(container_id, max_wait=120):
    """Poll until the IG media container status is FINISHED. Returns True/False."""
    deadline = time.time() + max_wait
    while time.time() < deadline:
        data   = graph_get(container_id, {"fields": "status_code"})
        status = data.get("status_code", "UNKNOWN")
        print(f"  IG container status: {status}")
        if status == "FINISHED":
            return True
        if status in ("ERROR", "EXPIRED"):
            die(f"IG container {container_id} failed with status: {status}")
        time.sleep(10)
    warn(f"IG container not FINISHED after {max_wait}s — skipping IG publish this run.")
    return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # Validate required secrets
    for name, val in [
        ("SUPABASE_URL",         SUPABASE_URL),
        ("SUPABASE_SERVICE_KEY", SERVICE_KEY),
        ("FB_PAGE_ACCESS_TOKEN", PAGE_TOKEN),
        ("FB_PAGE_ID",           PAGE_ID),
    ]:
        if not val:
            die(f"{name} env var is not set. Add it as a GitHub repo secret.")

    if not IG_USER_ID:
        warn("IG_USER_ID is not set — will post to Facebook only.")

    # -----------------------------------------------------------------------
    # Load bank + advance state
    # -----------------------------------------------------------------------
    with open(BANK_PATH, encoding="utf-8") as f:
        bank  = json.load(f)
    items = bank.get("items", [])
    if not items:
        die("social-bank.json has no items.")

    with open(STATE_PATH, encoding="utf-8") as f:
        state = json.load(f)
    idx  = state.get("next_index", 0) % len(items)
    item = items[idx]
    print(f"Post #{idx} ({item['type']}): {item['caption'][:60]}…")

    # -----------------------------------------------------------------------
    # Check for a fresh Trophy Room catch this week
    # -----------------------------------------------------------------------
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).date().isoformat()
    catches  = supabase_get(
        f"catches?approved=eq.true&image_url=not.is.null"
        f"&created_at=gte.{week_ago}T00:00:00Z"
        f"&order=weight_kg.desc&limit=1"
        f"&select=species,weight_kg,venue,image_url"
    )

    catch_image_url = None
    spotlight_line  = None
    if catches:
        c = catches[0]
        if c.get("image_url"):
            catch_image_url = c["image_url"]
            spotlight_line  = f"🎣 New catch: {c['species']} · {c['weight_kg']} kg"
            if c.get("venue"):
                spotlight_line += f" @ {c['venue']}"
            print(f"Catch spotlight found: {spotlight_line}")

    # -----------------------------------------------------------------------
    # Build full caption
    # -----------------------------------------------------------------------
    caption = item["caption"]
    if spotlight_line:
        caption = f"{spotlight_line}\n\n{caption}"
    full_caption = f"{caption}\n\n{item['hashtags']}"

    # -----------------------------------------------------------------------
    # Resolve the image to use
    # -----------------------------------------------------------------------
    if catch_image_url:
        image_url = catch_image_url
        print("Using catch photo as post image.")
    else:
        # Generate a branded tip card and upload to Supabase Storage
        print("No fresh catch — generating branded tip card…")
        card_path = generate_tip_card(item["caption"])
        ts        = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        image_url = upload_to_storage(
            card_path, "post-images", f"social-cards/card_{ts}.jpg", "image/jpeg"
        )
        print(f"  Card uploaded: {image_url}")

    # -----------------------------------------------------------------------
    # Facebook Page post
    # -----------------------------------------------------------------------
    print("Posting to Facebook…")
    fb_result = graph_post(f"{PAGE_ID}/photos", {
        "url":     image_url,
        "caption": full_caption,
    })
    fb_id = fb_result.get("post_id") or fb_result.get("id", "unknown")
    print(f"  Facebook post ID: {fb_id}")

    # -----------------------------------------------------------------------
    # Instagram post (skip if IG_USER_ID not configured)
    # -----------------------------------------------------------------------
    if IG_USER_ID:
        print("Creating Instagram media container…")
        container    = graph_post(f"{IG_USER_ID}/media", {
            "image_url": image_url,
            "caption":   full_caption,
        })
        container_id = container.get("id")
        if not container_id:
            die(f"IG media container returned no ID: {container}")
        print(f"  Container ID: {container_id}")

        if ig_wait_for_container(container_id):
            print("Publishing to Instagram…")
            pub_result = graph_post(f"{IG_USER_ID}/media_publish",
                                    {"creation_id": container_id})
            print(f"  Instagram post ID: {pub_result.get('id', 'unknown')}")
    else:
        print("Skipping Instagram (IG_USER_ID not set).")

    # -----------------------------------------------------------------------
    # Advance state.json (cycles back to 0 at end of bank)
    # -----------------------------------------------------------------------
    state["next_index"] = (idx + 1) % len(items)
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
        f.write("\n")
    print(f"State advanced → next_index={state['next_index']} of {len(items)}.")


if __name__ == "__main__":
    main()
