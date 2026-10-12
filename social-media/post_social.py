#!/usr/bin/env python3
"""
CastZone social post — direct Facebook edition.

Each Mon/Wed/Fri this script:
  1. Picks the next caption from social-bank.json
  2. Checks Supabase for a new Trophy Room catch this week (with photo)
  3. If found: uses the catch photo; if not: generates a branded tip card
  4. Uploads the image to Supabase Storage (public URL)
  5. Posts the image + caption straight to the CastZone Facebook Page via the
     Meta Graph API (no Make.com / third parties)
  6. Sends a brief WhatsApp confirmation with a link to the live post

If the Facebook secrets are not configured yet, it falls back to WhatsApping
the ready-to-paste caption + image URL so the post can be made manually —
and marks the run with a warning so the gap is visible.

Requires these GitHub repo secrets:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  FB_PAGE_ID              (numeric ID of the CastZone Facebook Page)
  FB_PAGE_ACCESS_TOKEN    (long-lived Page access token, pages_manage_posts)
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
FB_PAGE_ID       = os.environ.get("FB_PAGE_ID", "")
FB_PAGE_TOKEN    = os.environ.get("FB_PAGE_ACCESS_TOKEN", "")
WA_PHONE         = os.environ.get("NOTIFY_WHATSAPP_NUMBER", "")
WA_APIKEY        = os.environ.get("CALLMEBOT_API_KEY", "")

GRAPH_API = "https://graph.facebook.com/v23.0"

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
        "User-Agent":    "castzone-social-bot/1.0",
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
        "User-Agent":    "castzone-social-bot/1.0",
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


def post_to_facebook(caption, image_url):
    """Publish a photo post on the Facebook Page. Returns the post URL."""
    params = urllib.parse.urlencode({
        "url":          image_url,
        "caption":      caption,
        "access_token": FB_PAGE_TOKEN,
    }).encode()
    req = urllib.request.Request(
        f"{GRAPH_API}/{FB_PAGE_ID}/photos", data=params, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if WA_PHONE and WA_APIKEY:
            send_whatsapp(
                "CastZone Facebook post FAILED - check the GitHub Actions log "
                "(token may have expired)."
            )
        die(f"Facebook post failed: {e.code} {body}")
    except Exception as e:
        die(f"Facebook post error: {e}")

    post_id  = result.get("post_id") or result.get("id", "")
    post_url = f"https://www.facebook.com/{post_id}" if post_id else ""
    print(f"Posted to Facebook: {post_url or result}")
    return post_url


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

FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")


def _var_font(name, size, weight, opsz=None):
    """Load a bundled variable font at a given weight (and optical size)."""
    from PIL import ImageFont
    f = ImageFont.truetype(os.path.join(FONT_DIR, name), size)
    axes = f.get_variation_axes()
    vals = [weight] if len(axes) == 1 else [weight, opsz or min(72, max(6, size))]
    f.set_variation_by_axes(vals)
    return f


def _strip_emoji(text):
    import re
    text = re.sub(r"[\U00010000-\U0010ffff\u2600-\u27bf\ufe0f\u200d]", "", text)
    return re.sub(r"[ \t]+", " ", text).strip()


def _split_caption(caption):
    """Headline = first sentence; support = next sentence of the body."""
    import re
    clean = _strip_emoji(caption)
    paras = [p.strip() for p in clean.split("\n") if p.strip()]
    head = re.split(r"(?<=[.!?])\s", paras[0], maxsplit=1)[0].rstrip(".")
    support = ""
    if len(paras) > 1:
        support = re.split(r"(?<=[.!?])\s", paras[1])
        support = support[0] if len(support[0]) > 40 else " ".join(support[:2])
    return head, support


def _wrap_px(draw, text, font, max_w):
    lines, cur = [], ""
    for word in text.split():
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def _hex(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


W, H, PAD = 1080, 1080, 96


def _base_card(label):
    """Shared 1080x1080 canvas: teal gradient, contour lines, header row."""
    from PIL import Image, ImageDraw
    import math
    BG, BG2 = _hex(BRAND_BG), _hex("#1f4545")
    ORANGE, BONE = _hex(BRAND_ORANGE), _hex("#f9f7f4")

    img = Image.new("RGB", (W, H), BG)
    px = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        px.line([(0, y), (W, y)], fill=tuple(int(BG[i] + (BG2[i] - BG[i]) * t) for i in range(3)))

    over = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(over)
    cx, cy = W + 60, H + 40
    for k in range(1, 15):
        r = 70 * k
        pts = []
        for d in range(0, 361, 3):
            a = math.radians(d)
            wob = 1 + 0.07 * math.sin(3 * a + k * 0.6) + 0.04 * math.sin(5 * a + k)
            pts.append((cx + r * wob * math.cos(a), cy + r * wob * math.sin(a)))
        od.line(pts, fill=(168, 197, 197, 34 if k % 4 else 62), width=2)
    img.paste(over, (0, 0), over)
    draw = ImageDraw.Draw(img)

    f_mark = _var_font("Manrope.ttf", 34, 800)
    f_label = _var_font("Manrope.ttf", 26, 700)
    draw.rectangle([PAD, PAD + 4, PAD + 14, PAD + 36], fill=ORANGE)
    draw.text((PAD + 32, PAD + 20), "CASTZONE", font=f_mark, fill=BONE, anchor="lm")
    draw.text((W - PAD, PAD + 20), label, font=f_label, fill=ORANGE, anchor="rm")
    draw.line([(PAD, PAD + 70), (W - PAD, PAD + 70)], fill=(168, 197, 197, 70), width=1)
    return img, draw


def _footer(draw, right="castzone.co.za", left="Where South Africa Fishes"):
    f_foot = _var_font("Manrope.ttf", 28, 600)
    draw.text((PAD, H - PAD + 6), left, font=f_foot, fill=_hex("#a8c5c5"), anchor="ls")
    draw.text((W - PAD, H - PAD + 6), right, font=f_foot, fill=_hex(BRAND_ORANGE), anchor="rs")
    draw.rectangle([0, H - 14, W, H], fill=_hex(BRAND_ORANGE))


def generate_tip_card(caption_text, out_path="/tmp/castzone_card.jpg", label="FISHING TIP"):
    """Generate a 1080x1080 branded JPEG tip card (Manrope + Newsreader)."""
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        die("Pillow not installed - run: pip install pillow")

    ORANGE, BONE, PALE = _hex(BRAND_ORANGE), _hex("#f9f7f4"), _hex("#a8c5c5")
    img, draw = _base_card(label)

    # Headline: largest Newsreader size that fits in <= 5 lines
    head, support = _split_caption(caption_text)
    max_w = W - 2 * PAD
    for size in range(124, 60, -4):
        f_head = _var_font("Newsreader.ttf", size, 600, opsz=72)
        lines = _wrap_px(draw, head, f_head, max_w)
        if len(lines) <= 5 and (len(lines) * size * 1.12) <= 440:
            break
    line_h = int(size * 1.12)

    f_sup = _var_font("Manrope.ttf", 34, 500)
    sup_lines = _wrap_px(draw, support, f_sup, max_w - 40)[:3] if support else []
    if sup_lines and len(sup_lines) == 3 and draw.textlength(sup_lines[2], font=f_sup) > max_w - 120:
        sup_lines[2] = sup_lines[2].rstrip(",;: ") + "..."
    sup_h = len(sup_lines) * 50
    block_h = len(lines) * line_h + (60 + sup_h if sup_lines else 0)
    y = max(PAD + 110, (H - block_h) // 2 - 50)

    for ln in lines:
        draw.text((PAD, y), ln, font=f_head, fill=BONE, anchor="la")
        y += line_h
    if sup_lines:
        y += 28
        draw.rectangle([PAD, y, PAD + 90, y + 6], fill=ORANGE)
        y += 36
        for ln in sup_lines:
            draw.text((PAD, y), ln, font=f_sup, fill=PALE, anchor="la")
            y += 50

    _footer(draw)

    img.save(out_path, "JPEG", quality=94)
    return out_path


# ---------------------------------------------------------------------------
# Bite-times post (solunar engine shared with the website)
# ---------------------------------------------------------------------------
BITE_SPOT = (-26.88, 28.12, "Vaal River")   # CastZone's home water


def fetch_bite_days(start_date, n=2):
    """Run the site's own solunar engine (src/lib/solunar.ts) via Node."""
    import subprocess
    out = subprocess.run(
        ["node", os.path.join(HERE, "bite_data.mjs"),
         str(BITE_SPOT[0]), str(BITE_SPOT[1]), start_date, str(n)],
        capture_output=True, text=True, timeout=60,
        env={**os.environ, "TZ": "Africa/Johannesburg", "NODE_NO_WARNINGS": "1"},
    )
    if out.returncode != 0:
        raise RuntimeError(f"bite_data.mjs failed: {out.stderr[-300:]}")
    return json.loads(out.stdout)


def _rating_color(rating):
    return {"Excellent": "#4ade80", "Good": "#a3e635", "Fair": "#facc15"}.get(rating, "#a8c5c5")


def generate_bite_card(days, out_path="/tmp/castzone_bite.jpg"):
    img, draw = _base_card("BITE TIMES")
    BONE, PALE, ORANGE = _hex("#f9f7f4"), _hex("#a8c5c5"), _hex(BRAND_ORANGE)
    f_head = _var_font("Newsreader.ttf", 92, 600, opsz=72)
    f_sub = _var_font("Manrope.ttf", 30, 500)
    draw.text((PAD, 276), "Weekend bite times", font=f_head, fill=BONE, anchor="ls")
    draw.text((PAD, 332), f"{BITE_SPOT[2]}  |  moon: {days[0]['moon']}, {days[0]['illum']}% lit",
              font=f_sub, fill=PALE, anchor="ls")

    col_w, gap, top = (W - 2 * PAD - 40) // 2, 40, 372
    f_day = _var_font("Newsreader.ttf", 44, 600, opsz=48)
    f_rate = _var_font("Manrope.ttf", 30, 800)
    f_lab = _var_font("Manrope.ttf", 22, 700)
    f_time = _var_font("Manrope.ttf", 34, 700)
    f_small = _var_font("Manrope.ttf", 26, 500)
    for i, d in enumerate(days[:2]):
        x = PAD + i * (col_w + gap)
        draw.rounded_rectangle([x, top, x + col_w, top + 540], radius=22,
                               fill=(14, 40, 40), outline=(168, 197, 197, 60), width=2)
        pad = 32
        draw.text((x + pad, top + 62), d["date"].split(",")[0], font=f_day, fill=BONE, anchor="ls")
        draw.text((x + pad, top + 100), d["date"].split(", ")[1], font=f_small, fill=PALE, anchor="ls")
        draw.text((x + col_w - pad, top + 62), d["rating"].upper(), font=f_rate,
                  fill=_hex(_rating_color(d["rating"])), anchor="rs")
        draw.text((x + col_w - pad, top + 100), f"{d['score']}/100", font=f_small, fill=PALE, anchor="rs")
        draw.line([(x + pad, top + 130), (x + col_w - pad, top + 130)], fill=(168, 197, 197, 60), width=1)
        y = top + 176
        for kind, name, color in (("major", "BEST (MAJOR)", ORANGE), ("minor", "GOOD (MINOR)", PALE)):
            draw.text((x + pad, y), name, font=f_lab, fill=color, anchor="ls")
            y += 14
            for p in [p for p in d["periods"] if p["type"] == kind]:
                y += 44
                draw.text((x + pad, y), f"{p['start']} - {p['end']}", font=f_time, fill=BONE, anchor="ls")
            y += 40
        draw.text((x + pad, top + 540 - 28), f"Sunrise {d['sunrise']}   Sunset {d['sunset']}",
                  font=f_small, fill=PALE, anchor="ls")
    _footer(draw, right="castzone.co.za/bite-times", left="Solunar guide, not a guarantee")
    img.save(out_path, "JPEG", quality=94)
    return out_path


def bite_caption(days):
    lines = [f"Weekend bite times for the {BITE_SPOT[2]}:", ""]
    for d in days[:2]:
        lines.append(f"{d['date']}: {d['rating']} ({d['score']}/100)")
        for p in d["periods"]:
            lines.append(f"  {'Major' if p['type'] == 'major' else 'Minor'}: {p['start']} - {p['end']}")
        lines.append("")
    lines.append("Pick any venue in South Africa and get its bite times: castzone.co.za/bite-times")
    return "\n".join(lines)


BITE_HASHTAGS = "#CastZone #BiteTimes #Solunar #BassFishing #SAanglers #VaalRiver #FishingSA"


# ---------------------------------------------------------------------------
# Specials post (approved deals from the /specials page)
# ---------------------------------------------------------------------------
def fetch_image_bytes(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "CastZoneBot/1.0"}), timeout=30) as r:
            return r.read()
    except Exception:
        import subprocess
        return subprocess.run(["curl", "-sL", "-m", "30", url], capture_output=True, timeout=40).stdout


def pick_special(posted_ids):
    now = datetime.now(timezone.utc).isoformat()
    rows = supabase_get(
        "deals?status=eq.approved&image_url=not.is.null"
        f"&or=(expires_at.is.null,expires_at.gt.{urllib.parse.quote(now)})"
        "&order=discount_pct.desc&limit=20"
        "&select=id,title,retailer,original_price,sale_price,discount_pct,url,image_url,category"
    ) or []
    fresh = [r for r in rows if r["id"] not in posted_ids]
    return fresh[0] if fresh else None


def _rand(v):
    return "R" + f"{round(float(v)):,}".replace(",", " ")


def generate_special_card(deal, out_path="/tmp/castzone_special.jpg"):
    import io
    from PIL import Image, ImageDraw, ImageOps
    img, draw = _base_card("SPECIAL")
    BONE, PALE, ORANGE = _hex("#f9f7f4"), _hex("#a8c5c5"), _hex(BRAND_ORANGE)

    # Product photo on a bone panel
    px, py, pw, ph = PAD, 210, W - 2 * PAD, 400
    panel = Image.new("RGB", (pw, ph), BONE)
    try:
        prod = Image.open(io.BytesIO(fetch_image_bytes(deal["image_url"]))).convert("RGBA")
        prod = ImageOps.contain(prod, (pw - 60, ph - 50))
        bgp = Image.new("RGBA", prod.size, (249, 247, 244, 255))
        panel.paste(Image.alpha_composite(bgp, prod).convert("RGB"), ((pw - prod.width) // 2, (ph - prod.height) // 2))
    except Exception as e:
        warn(f"Could not load product image: {e}")
    mask = Image.new("L", (pw, ph), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, pw, ph], radius=22, fill=255)
    img.paste(panel, (px, py), mask)

    # Discount badge
    f_badge = _var_font("Manrope.ttf", 44, 800)
    bw = int(draw.textlength(f"-{int(deal['discount_pct'])}%", font=f_badge)) + 56
    draw.rounded_rectangle([px + pw - bw - 24, py + 24, px + pw - 24, py + 96], radius=36, fill=ORANGE)
    draw.text((px + pw - 24 - bw // 2, py + 60), f"-{int(deal['discount_pct'])}%", font=f_badge, fill=BONE, anchor="mm")

    # Retailer + title
    f_ret = _var_font("Manrope.ttf", 26, 700)
    draw.text((PAD, 664), deal["retailer"].upper(), font=f_ret, fill=ORANGE, anchor="ls")
    title = _strip_emoji(deal["title"])
    max_w = W - 2 * PAD
    for size in range(58, 36, -2):
        f_t = _var_font("Newsreader.ttf", size, 600, opsz=60)
        lines = _wrap_px(draw, title, f_t, max_w)
        if len(lines) <= 2:
            break
    if len(lines) > 2:
        lines = lines[:2]
        lines[1] = lines[1].rstrip(" ,;:-") + "..."
    y = 738
    for ln in lines:
        draw.text((PAD, y), ln, font=f_t, fill=BONE, anchor="ls")
        y += int(size * 1.15)

    # Prices
    f_now = _var_font("Manrope.ttf", 76, 800)
    f_was = _var_font("Manrope.ttf", 34, 500)
    now_txt = _rand(deal["sale_price"])
    draw.text((PAD, 905), now_txt, font=f_now, fill=BONE, anchor="ls")
    wx = PAD + int(draw.textlength(now_txt, font=f_now)) + 28
    was_txt = "was " + _rand(deal["original_price"])
    draw.text((wx, 905), was_txt, font=f_was, fill=PALE, anchor="ls")
    wl = int(draw.textlength(was_txt, font=f_was))
    sx = wx + int(draw.textlength("was ", font=f_was))
    draw.line([(sx, 893), (wx + wl, 893)], fill=PALE, width=2)
    _footer(draw, right="castzone.co.za/specials", left="Fishing and camping deals")
    img.save(out_path, "JPEG", quality=94)
    return out_path


def special_caption(deal):
    return (
        f"{deal['title']}\n\n"
        f"{deal['retailer']}: {_rand(deal['sale_price'])} (was {_rand(deal['original_price'])}, "
        f"{int(deal['discount_pct'])}% off)\n\n"
        f"Get the deal: {deal['url']}\n"
        "More fishing and camping specials: castzone.co.za/specials\n\n"
        "Prices checked when posted and may change. Third-party retailer link."
    )


SPECIAL_HASHTAGS = "#CastZone #FishingDeals #CampingDeals #SAanglers #OutdoorSA"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    for name, val in [
        ("SUPABASE_URL",         SUPABASE_URL),
        ("SUPABASE_SERVICE_KEY", SERVICE_KEY),
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

    # Schedule: Mon = tip/catch from the bank, Wed = a special (if one is
    # approved), Fri = weekend bite times. FORCE_KIND=bank|special|bite to test.
    sast = datetime.now(timezone(timedelta(hours=2)))
    kind = os.environ.get("FORCE_KIND") or {2: "special", 4: "bite"}.get(sast.weekday(), "bank")
    posted_deals = state.setdefault("posted_deals", [])
    deal = None
    if kind == "special":
        deal = pick_special(posted_deals)
        if not deal:
            print("No approved, unposted special - using a bank post instead.")
            kind = "bank"
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    if kind == "bite":
        start = (sast + timedelta(days=(5 - sast.weekday()) % 7)).date().isoformat()  # coming Saturday
        days = fetch_bite_days(start, 2)
        full_caption = f"{bite_caption(days)}\n\n{BITE_HASHTAGS}"
        image_url = upload_to_storage(generate_bite_card(days), "post-images",
                                      f"social-cards/bite_{ts}.jpg", "image/jpeg")
        label = "bite times"
    elif kind == "special":
        full_caption = f"{special_caption(deal)}\n\n{SPECIAL_HASHTAGS}"
        image_url = upload_to_storage(generate_special_card(deal), "post-images",
                                      f"social-cards/special_{ts}.jpg", "image/jpeg")
        posted_deals.append(deal["id"])
        label = "special"
    else:
        label = item["type"]
        print(f"Post #{idx + 1} of {len(items)} ({item['type']}): {item['caption'][:60]}...")
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
        caption = item["caption"]
        if spotlight_line:
            caption = f"{spotlight_line}\n\n{caption}"
        full_caption = f"{caption}\n\n{item['hashtags']}"
        if catch_image_url:
            image_url = catch_image_url
        else:
            image_url = upload_to_storage(generate_tip_card(item["caption"]), "post-images",
                                          f"social-cards/card_{ts}.jpg", "image/jpeg")
    print(f"Post kind: {kind}. Image URL: {image_url}")

    # Post to Facebook directly, or fall back to manual-post WhatsApp
    if FB_PAGE_ID and FB_PAGE_TOKEN:
        post_url = post_to_facebook(full_caption, image_url)
        if WA_PHONE and WA_APIKEY:
            send_whatsapp(
                f"CastZone {label} post is live on Facebook: {post_url}"
            )
    else:
        warn(
            "FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN not set — Facebook posting "
            "skipped. Sending manual-post WhatsApp instead."
        )
        if WA_PHONE and WA_APIKEY:
            send_whatsapp(
                f"CastZone {label} post ready (Facebook "
                f"auto-post not set up yet). Image: {image_url} -- Caption: "
                f"{full_caption[:600]}"
            )

    # Advance state (bank index only moves when a bank post was used)
    if kind == "bank":
        state["next_index"] = (idx + 1) % len(items)
    state["posted_deals"] = posted_deals[-200:]
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
        f.write("\n")
    print("State saved.")


if __name__ == "__main__":
    main()
