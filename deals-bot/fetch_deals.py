#!/usr/bin/env python3
"""
CastZone Specials — deal-finder bot.

Scans curated SA fishing/camping retailers for products at least MIN_DISCOUNT%
off and drops the qualifying ones into the `deals` table as status='pending'
for Martin to approve on /specials/review.

Runs as a GitHub Action (see .github/workflows/deals-bot.yml). Uses the same
Supabase service-key secret as the content-drip bot, so nothing new to add.

Design notes:
  * stdlib only (urllib) — no pip install, nothing to break.
  * One "adapter" per retailer platform. Adding a retailer = one RETAILERS entry
    (+ a new adapter fn only if it's a platform we don't handle yet).
  * Every retailer runs in a try/except so one broken site never fails the run.
  * De-dupes on `external_id` so the same product is never queued twice
    (across ALL statuses — an already-rejected deal won't come back as pending).
  * Sets expires_at so stale promos auto-drop off /specials.

Env:
  SUPABASE_URL          (required)
  SUPABASE_SERVICE_KEY  (required — service_role, bypasses RLS)
  MIN_DISCOUNT          (optional, default 50)
  EXPIRE_DAYS           (optional, default 21)
  DRY_RUN               (optional, "1" = find + print but don't write)
"""

import json
import os
import ssl
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

# ----------------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------------

MIN_DISCOUNT = int(os.environ.get("MIN_DISCOUNT", "50"))
EXPIRE_DAYS = int(os.environ.get("EXPIRE_DAYS", "21"))
MAX_NEW = int(os.environ.get("MAX_NEW", "50"))  # cap new deals queued per run
BACKFILL_MAX = int(os.environ.get("BACKFILL_MAX", "150"))  # existing deals to re-host per run
KEEP_FLOOR = int(os.environ.get("KEEP_FLOOR", "30"))  # keep a live deal while still >= this %
STALE_GRACE = int(os.environ.get("STALE_GRACE", "2"))  # consecutive misses before auto-removing
# Deals at/above BOTH thresholds auto-publish (skip review); everything else
# stays pending. 0 pct = auto-approve disabled.
AUTO_APPROVE_PCT = int(os.environ.get("AUTO_APPROVE_PCT", "0"))
AUTO_APPROVE_MIN_PRICE = float(os.environ.get("AUTO_APPROVE_MIN_PRICE", "300"))
DRY_RUN = os.environ.get("DRY_RUN") == "1"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# WhatsApp run notification (CallMeBot) — reuses the same shared credentials
# as Martin's other site health checks. Optional: skipped if unset.
CALLMEBOT_API_KEY = os.environ.get("CALLMEBOT_API_KEY", "")
NOTIFY_WHATSAPP_NUMBER = os.environ.get("NOTIFY_WHATSAPP_NUMBER", "")

# Optional residential-proxy so retailer fetches aren't blocked from cloud IPs.
# When SCRAPER_API_KEY is set, retailer requests route through ScraperAPI
# (https://api.scraperapi.com/?api_key=..&url=..). Left empty locally so a
# normal machine fetches sites directly (its home IP isn't blocked).
SCRAPER_API_KEY = os.environ.get("SCRAPER_API_KEY", "")
# Extra ScraperAPI params to tune if a site still blocks, e.g.
# "country_code=za" (SA IPs) or "country_code=za&premium=true". Costs more
# credits, so default is empty (standard rotating IPs).
SCRAPER_API_PARAMS = os.environ.get("SCRAPER_API_PARAMS", "")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

# Curated SA retailers. `platform` picks the adapter below.
# To add a retailer on a platform we already support, just add an entry.
RETAILERS = [
    {
        "source": "outdoor-warehouse",
        "name": "Outdoor Warehouse",
        "platform": "cowhills",
        "base": "https://www.outdoorwarehouse.co.za",
    },
    {
        "source": "takealot",
        "name": "Takealot",
        "platform": "takealot",
        # searched under the "Featured Deals" filter; terms scope it to our niche
        "terms": ["fishing", "fishing rod", "fishing reel", "fishing tackle",
                  "camping", "tent", "camping chair", "cooler box",
                  "sleeping bag", "gazebo", "camping stove"],
    },
    # Sportsmans Warehouse runs an Algolia backend (different adapter) — TODO.
    {
        "source": "mias-angling",
        "name": "Mia's Angling",
        "platform": "shopify",
        "base": "https://miasangling.co.za",
    },
]

# ----------------------------------------------------------------------------
# Fishing / camping classifier
# ----------------------------------------------------------------------------

FISHING_KW = [
    "fishing", "angler", "angling", "rod ", " rod", "reel", "tackle", "lure",
    "bait", "hook", "sinker", "trace", "fly fishing", "spinning", "baitcast",
    "fish finder", "fishfinder", "livewell", "gaff", "landing net", "braid",
    "fluorocarbon", "carp", " bass", "saltwater", "spinner", "jig", "swivel",
    "kayak", "paddle ski", "float tube", "downrigger",
]
CAMPING_KW = [
    "camp", "tent", "sleeping bag", "sleeping mat", "mattress", "stretcher",
    "cooler", "cooler box", "cool box", "gazebo", "awning", "camp chair",
    "camp table", "gas stove", "stove", "braai", "lantern", "torch",
    "flashlight", "headlamp", "head lamp", "flask", "hydration", "hiking",
    "backpack", "trail", "bivvy", "tarp", "groundsheet", "jerry can",
    "water container", "gazebo", "swag", "rooftop tent", "power station",
]


def classify(title, category_titles):
    """Return 'fishing' | 'camping' | None."""
    hay = (title + " " + " ".join(category_titles)).lower()
    for kw in FISHING_KW:
        if kw in hay:
            return "fishing"
    for kw in CAMPING_KW:
        if kw in hay:
            return "camping"
    return None


# ----------------------------------------------------------------------------
# HTTP helper
# ----------------------------------------------------------------------------

_CTX = ssl.create_default_context()


def get_json(url, referer=None, tries=3):
    last = None
    headers = {
        "User-Agent": UA,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-ZA,en-GB;q=0.9,en;q=0.8",
        "Accept-Encoding": "identity",
        "Connection": "keep-alive",
        "sec-ch-ua": '"Chromium";v="126", "Not.A/Brand";v="24", "Google Chrome";v="126"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "X-Requested-With": "XMLHttpRequest",
    }
    if referer:
        headers["Referer"] = referer

    fetch_url = url
    timeout = 30
    if SCRAPER_API_KEY:
        qs = urllib.parse.urlencode({"api_key": SCRAPER_API_KEY, "url": url})
        if SCRAPER_API_PARAMS:
            qs += "&" + SCRAPER_API_PARAMS
        fetch_url = "https://api.scraperapi.com/?" + qs
        timeout = 75  # proxied fetches are slower

    for attempt in range(tries):
        try:
            req = urllib.request.Request(fetch_url, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as resp:
                raw = resp.read().decode("utf-8", "replace")
            return json.loads(raw)
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise last


def fetch_bytes(url, referer=None, tries=2):
    """Download raw image bytes directly (no proxy). Unlike the retailer
    product-listing APIs, these CDN image URLs are NOT datacenter-IP-blocked
    — verified with a direct unproxied fetch — so routing them through
    ScraperAPI would only burn credits for nothing."""
    headers = {
        "User-Agent": UA,
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    }
    if referer:
        headers["Referer"] = referer

    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30, context=_CTX) as resp:
                return resp.read(), (resp.headers.get("Content-Type") or "image/jpeg")
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.0 * (attempt + 1))
    raise last


def rehost_image(image_url, external_id):
    """Download a retailer product image once and re-host it in Supabase
    Storage (bucket 'deal-images'), returning our own public URL. Retailer
    CDNs (Takealot, Cloudinary) 503 when hotlinked cross-site from a real
    browser, so linking to them directly leaves /specials with broken images.
    Returns None on any failure (site falls back to a category icon)."""
    if not image_url:
        return None
    try:
        data, content_type = fetch_bytes(image_url)
        # A flaky fetch can occasionally hand back mangled bytes (seen once:
        # valid-looking response, garbage content) — a magic-byte check catches
        # it before a broken file gets stored, instead of silently going live.
        is_jpeg = data[:2] == b"\xff\xd8"
        is_png = data[:8] == b"\x89PNG\r\n\x1a\n"
        is_webp = data[:4] == b"RIFF" and data[8:12] == b"WEBP"
        if not (is_jpeg or is_png or is_webp):
            raise ValueError(f"downloaded bytes are not a valid JPEG/PNG/WebP ({len(data)} bytes)")
        ext = "png" if is_png else "webp" if is_webp else "jpg"
        path = f'{external_id.replace(":", "_").replace("/", "_")}.{ext}'
        url = f"{SUPABASE_URL}/storage/v1/object/deal-images/{path}"
        req = urllib.request.Request(url, data=data, method="POST", headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": content_type,
            "x-upsert": "true",
        })
        with urllib.request.urlopen(req, timeout=30, context=_CTX):
            pass
        return f"{SUPABASE_URL}/storage/v1/object/public/deal-images/{path}"
    except Exception as e:  # noqa: BLE001 — a broken image never fails the run
        print(f"    ! image rehost failed for {external_id}: {e}")
        return None


def to_float(v):
    if v is None:
        return None
    try:
        return float(str(v).replace("R", "").replace(" ", "").replace(",", ""))
    except (ValueError, TypeError):
        return None


# ----------------------------------------------------------------------------
# Adapters — each yields normalised deal dicts
# ----------------------------------------------------------------------------

def adapter_cowhills(r):
    """Outdoor Warehouse style. products.json with a marked_down (on-promo)
    filter; was_price = original, promo_price = sale price."""
    base = r["base"]
    # filters[marked_down][0]=0 == "On promotion"
    qs = "limit=250&" + urllib.parse.urlencode({"filters[marked_down][0]": 0})
    deals = []
    total = None
    for page in range(1, 40):  # hard safety cap
        url = f"{base}/products.json?{qs}&page={page}"
        data = get_json(url, referer=f"{base}/")
        results = (data.get("results") or {}).get("results") or []
        if total is None:
            th = (data.get("paginationMeta") or {}).get("total_hits") or {}
            total = th.get("value") if isinstance(th, dict) else th
        if not results:
            break
        for item in results:
            p = item.get("result") or {}
            was = to_float(p.get("was_price"))
            promo = to_float(p.get("promo_price"))
            if not (was and promo and was > promo):
                continue
            pct = round((was - promo) / was * 100)
            cats = [c.get("title") if isinstance(c, dict) else c
                    for c in (p.get("categories") or [])]
            cats = [c for c in cats if c]
            deals.append({
                "external_id": f'{r["source"]}:{p.get("id")}',
                "title": (p.get("title") or "").strip()[:200],
                "retailer": r["name"],
                "original_price": round(was, 2),
                "sale_price": round(promo, 2),
                "discount_pct": pct,
                "url": p.get("url") or base,
                "image_url": _cowhills_image(p),
                "source": r["source"],
                "_category_titles": cats,
            })
        if total and page * 24 >= total:
            break
        time.sleep(0.4)  # be polite
    return deals


def _cowhills_image(p):
    for img in (p.get("images") or []):
        if isinstance(img, dict) and img.get("cdn_path"):
            return img["cdn_path"]
    pi = p.get("primary_image")
    if isinstance(pi, dict) and pi.get("cdn_path"):
        return pi["cdn_path"]
    return None


def adapter_takealot(r):
    """Takealot search API filtered to Featured Deals. buybox_summary gives
    listing_price (was) + prices (now); when there's no was-price we fall back
    to a firm 'N%' saving string (skip vague 'Up to N%' to avoid overstating)."""
    import re
    api = "https://api.takealot.com/rest/v-1-11-0/searches/products,filters,facets,sort_options"
    deals = []
    for term in r.get("terms", []):
        start = 0
        for _ in range(3):  # up to 3 pages (150 items) per term
            qs = urllib.parse.urlencode({
                "qsearch": term, "rows": 50, "start": start,
                "filter": "DealType:Featured Deals",
            })
            data = get_json(f"{api}?{qs}", referer="https://www.takealot.com/")
            results = (((data.get("sections") or {}).get("products") or {})
                       .get("results") or [])
            if not results:
                break
            for item in results:
                pv = item.get("product_views") or {}
                bb = pv.get("buybox_summary") or {}
                core = pv.get("core") or {}
                # core.id is the productline id (the real PLID Takealot routes by);
                # buybox.product_id is a different offer id that 404s in the URL.
                plid = core.get("id")
                if not plid:
                    continue
                now = (bb.get("prices") or [None])[0]
                was = bb.get("listing_price")
                pct = None
                if was and now and was > now:
                    pct = round((was - now) / was * 100)
                else:
                    m = re.fullmatch(r"(\d+)%", str(bb.get("saving") or "").strip())
                    if m:  # firm % only, not "Up to N%"
                        pct = int(m.group(1))
                if pct is None or not now:
                    continue
                imgs = (pv.get("gallery") or {}).get("images") or []
                img = imgs[0].replace("{size}", "pdpxl") if imgs else None
                deals.append({
                    "external_id": f"takealot:{plid}",
                    "title": (core.get("title") or "").strip()[:200],
                    "retailer": r["name"],
                    "original_price": round(was, 2) if was else None,
                    "sale_price": round(now, 2),
                    "discount_pct": pct,
                    "url": f'https://www.takealot.com/{core.get("slug")}/PLID{plid}',
                    "image_url": img,
                    "source": r["source"],
                    "_category_titles": [term],
                })
            start += 50
            time.sleep(0.4)
    return deals


def adapter_shopify(r):
    """Generic Shopify storefront adapter. The public products.json endpoint
    exposes compare_at_price (was) vs price (now) per variant natively — no
    HTML scraping, no bot-protection seen on this platform. Picks each
    product's best-discounted variant."""
    base = r["base"]
    deals = []
    for page in range(1, 20):  # hard safety cap
        url = f"{base}/products.json?limit=250&page={page}"
        data = get_json(url, referer=f"{base}/")
        products = data.get("products") or []
        if not products:
            break
        for p in products:
            best = None
            for v in p.get("variants") or []:
                price = to_float(v.get("price"))
                compare = to_float(v.get("compare_at_price"))
                if not (price and compare and compare > price):
                    continue
                pct = round((compare - price) / compare * 100)
                if best is None or pct > best[0]:
                    best = (pct, price, compare, v)
            if not best:
                continue
            pct, price, compare, v = best
            images = p.get("images") or []
            img = images[0].get("src") if images else None
            if not img:
                feat = v.get("featured_image")
                if isinstance(feat, dict):
                    img = feat.get("src")
            tags = p.get("tags") or []
            if isinstance(tags, str):
                tags = [t.strip() for t in tags.split(",") if t.strip()]
            product_type = p.get("product_type") or ""
            cats = tags + ([product_type] if product_type else [])
            deals.append({
                "external_id": f'{r["source"]}:{v.get("id")}',
                "title": (p.get("title") or "").strip()[:200],
                "retailer": r["name"],
                "original_price": round(compare, 2),
                "sale_price": round(price, 2),
                "discount_pct": pct,
                "url": f'{base}/products/{p.get("handle")}',
                "image_url": img,
                "source": r["source"],
                "_category_titles": cats,
            })
        time.sleep(0.4)  # be polite
    return deals


ADAPTERS = {
    "cowhills": adapter_cowhills,
    "takealot": adapter_takealot,
    "shopify": adapter_shopify,
}


# ----------------------------------------------------------------------------
# Supabase
# ----------------------------------------------------------------------------

def sb_headers(extra=None):
    h = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        h.update(extra)
    return h


def existing_external_ids():
    """All external_ids already in the table (any status) so we never re-queue."""
    ids = set()
    step = 1000
    offset = 0
    while True:
        url = f"{SUPABASE_URL}/rest/v1/deals?select=external_id"
        req = urllib.request.Request(url, headers=sb_headers({
            "Range-Unit": "items",
            "Range": f"{offset}-{offset + step - 1}",
        }))
        with urllib.request.urlopen(req, timeout=30, context=_CTX) as resp:
            rows = json.loads(resp.read().decode())
        for row in rows:
            if row.get("external_id"):
                ids.add(row["external_id"])
        if len(rows) < step:
            break
        offset += step
    return ids


def insert_deals(rows):
    url = f"{SUPABASE_URL}/rest/v1/deals?on_conflict=external_id"
    body = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=body, method="POST", headers=sb_headers({
        "Prefer": "return=minimal,resolution=ignore-duplicates",
    }))
    with urllib.request.urlopen(req, timeout=60, context=_CTX) as resp:
        return resp.status


def patch_deal(deal_id, patch):
    url = f"{SUPABASE_URL}/rest/v1/deals?id=eq.{deal_id}"
    req = urllib.request.Request(url, data=json.dumps(patch).encode(), method="PATCH",
                                 headers=sb_headers({"Prefer": "return=minimal"}))
    with urllib.request.urlopen(req, timeout=30, context=_CTX) as resp:
        return resp.status


def revalidate(current_map, sources_ok):
    """Re-check every live/pending deal against what's on promo right now.
    Still on special -> keep + refresh price. Gone (or discount collapsed) ->
    age it, and auto-expire after STALE_GRACE consecutive misses. Only touches
    deals whose retailer fetched healthily this run (never mass-expire on a
    blocked/failed fetch)."""
    url = (f"{SUPABASE_URL}/rest/v1/deals?select=id,external_id,source,discount_pct,"
           f"sale_price,stale_checks&status=in.(pending,approved)")
    req = urllib.request.Request(url, headers=sb_headers())
    with urllib.request.urlopen(req, timeout=30, context=_CTX) as resp:
        rows = json.loads(resp.read().decode())

    refreshed = aged = expired = 0
    for row in rows:
        if row.get("source") not in sources_ok:
            continue  # couldn't check this retailer this run — leave it be
        cur = current_map.get(row["external_id"])
        if cur and cur["discount_pct"] >= KEEP_FLOOR:
            patch = {}
            if cur["sale_price"] != row.get("sale_price") or cur["discount_pct"] != row.get("discount_pct"):
                patch.update(sale_price=cur["sale_price"], discount_pct=cur["discount_pct"],
                             original_price=cur["original_price"])
            if row.get("stale_checks"):
                patch["stale_checks"] = 0
            if patch:
                patch_deal(row["id"], patch)
                refreshed += 1
        else:
            n = (row.get("stale_checks") or 0) + 1
            if n >= STALE_GRACE:
                patch_deal(row["id"], {"status": "rejected", "stale_checks": n})
                expired += 1
            else:
                patch_deal(row["id"], {"stale_checks": n})
                aged += 1
    print(f"Re-validation: {refreshed} refreshed, {aged} aging, {expired} auto-removed.")


def notify_whatsapp(text):
    if not CALLMEBOT_API_KEY or not NOTIFY_WHATSAPP_NUMBER:
        return
    qs = urllib.parse.urlencode({
        "phone": NOTIFY_WHATSAPP_NUMBER,
        "text": text,
        "apikey": CALLMEBOT_API_KEY,
    })
    url = f"https://api.callmebot.com/whatsapp.php?{qs}"
    try:
        with urllib.request.urlopen(url, timeout=20) as resp:
            resp.read()
    except Exception as e:  # noqa: BLE001 — a failed notification must never fail the run
        print(f"  ! WhatsApp notify failed: {e}")


def backfill_images():
    """One-time-per-deal migration: any live/pending row still pointing at a
    retailer CDN (hotlinked, 503s in-browser) gets its image re-hosted to our
    own Storage. Capped per run so a big backlog doesn't blow the run time."""
    marker = f"{SUPABASE_URL}/storage/v1/object/public/deal-images/"
    url = (f"{SUPABASE_URL}/rest/v1/deals?select=id,external_id,image_url"
           f"&status=in.(pending,approved)&image_url=not.is.null"
           f"&image_url=not.like.{urllib.parse.quote(marker + '*')}"
           f"&limit={BACKFILL_MAX}")
    req = urllib.request.Request(url, headers=sb_headers())
    with urllib.request.urlopen(req, timeout=30, context=_CTX) as resp:
        rows = json.loads(resp.read().decode())

    done = 0
    for row in rows:
        new_url = rehost_image(row["image_url"], row["external_id"])
        patch_deal(row["id"], {"image_url": new_url})
        done += 1
    if rows:
        print(f"Backfilled images for {done}/{len(rows)} existing deals.")


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def main():
    if not DRY_RUN and (not SUPABASE_URL or not SUPABASE_KEY):
        sys.exit("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY are required.")

    print(f"CastZone deals bot — min discount {MIN_DISCOUNT}%, "
          f"expire {EXPIRE_DAYS}d, dry_run={DRY_RUN}, "
          f"proxy={'ON' if SCRAPER_API_KEY else 'off'}"
          f"{' (' + SCRAPER_API_PARAMS + ')' if SCRAPER_API_PARAMS else ''}")

    seen = set() if DRY_RUN else existing_external_ids()
    print(f"Already in table: {len(seen)} deals")

    now_iso = datetime.now(timezone.utc).isoformat()
    expires = (datetime.now(timezone.utc) + timedelta(days=EXPIRE_DAYS)).isoformat()
    auto_approved = 0
    to_insert = []
    batch_seen = set()
    current_map = {}   # external_id -> current {sale_price, discount_pct, original_price}
    sources_ok = set() # retailers that returned a healthy list this run (safe to re-validate)

    for r in RETAILERS:
        adapter = ADAPTERS.get(r["platform"])
        if not adapter:
            print(f"  ! {r['name']}: no adapter for platform '{r['platform']}' — skipped")
            continue
        try:
            found = adapter(r)
        except Exception as e:  # noqa: BLE001 — never let one site break the run
            print(f"  ! {r['name']}: FAILED ({e}) — skipped")
            continue

        # Snapshot everything currently on promo (any discount) for re-validation.
        for d in found:
            current_map[d["external_id"]] = {
                "sale_price": d["sale_price"],
                "discount_pct": d["discount_pct"],
                "original_price": d.get("original_price"),
            }
        if len(found) > 5:  # a healthy fetch — safe to expire this source's dead deals
            sources_ok.add(r["source"])

        qualifying = new = 0
        for d in found:
            cats = d.pop("_category_titles", [])
            if d["discount_pct"] < MIN_DISCOUNT:
                continue
            cat = classify(d["title"], cats)
            if not cat:
                continue  # not fishing/camping — skip
            qualifying += 1
            if d["external_id"] in seen or d["external_id"] in batch_seen:
                continue
            d["category"] = cat
            if (AUTO_APPROVE_PCT and d["discount_pct"] >= AUTO_APPROVE_PCT
                    and (d["sale_price"] or 0) >= AUTO_APPROVE_MIN_PRICE):
                d["status"] = "approved"
                d["approved_at"] = now_iso
                auto_approved += 1
            else:
                d["status"] = "pending"
                d["approved_at"] = None  # keep keys uniform for PostgREST batch insert
            d["expires_at"] = expires
            to_insert.append(d)
            batch_seen.add(d["external_id"])
            new += 1
        print(f"  · {r['name']}: {len(found)} on promo, "
              f"{qualifying} are >= {MIN_DISCOUNT}% fishing/camping, {new} new")

    # Keep the deepest discounts first; cap per run so review stays manageable.
    to_insert.sort(key=lambda x: -x["discount_pct"])
    if len(to_insert) > MAX_NEW:
        print(f"\nFound {len(to_insert)} new; capping to the top {MAX_NEW} by discount.")
        to_insert = to_insert[:MAX_NEW]

    auto_kept = sum(1 for d in to_insert if d.get("status") == "approved")
    print(f"\nTotal new deals to queue: {len(to_insert)} "
          f"({auto_kept} auto-approved ≥{AUTO_APPROVE_PCT}%/R{AUTO_APPROVE_MIN_PRICE:.0f}, "
          f"{len(to_insert) - auto_kept} to review)")

    if not DRY_RUN:
        rehosted = 0
        for d in to_insert:
            src_url = d.get("image_url")
            new_url = rehost_image(src_url, d["external_id"])
            if new_url:
                d["image_url"] = new_url
                rehosted += 1
            # else: leave d["image_url"] as the original retailer link (not
            # None) so the next run's backfill_images() retries it — a first
            # attempt can fail transiently (e.g. hit a Cloudflare challenge
            # page instead of the real image); wiping to None here stranded
            # those deals with no picture forever, since backfill explicitly
            # skips rows where image_url is null.
        print(f"Re-hosted {rehosted}/{len(to_insert)} product images.")

    if DRY_RUN:
        for d in sorted(to_insert, key=lambda x: -x["discount_pct"])[:20]:
            was = f"R{d['original_price']:.0f}->" if d["original_price"] else ""
            print(f"  -{d['discount_pct']}%  {d['category']:7} "
                  f"{was}R{d['sale_price']:.0f}  {d['title'][:50]}")
        return

    if to_insert:
        status = insert_deals(to_insert)
        print(f"Inserted (HTTP {status}). Review them at /specials/review")
    else:
        print("Nothing new to queue this run.")

    # Keep the live page honest: drop deals no longer on special.
    if sources_ok:
        revalidate(current_map, sources_ok)
    else:
        print("Re-validation skipped — no retailer returned a healthy list this run.")

    backfill_images()

    to_review = len(to_insert) - auto_kept
    when = datetime.now().strftime("%H:%M")
    notify_whatsapp(
        f"CastZone deals bot ran {when} — {len(to_insert)} new deals queued "
        f"({auto_kept} auto-approved, {to_review} awaiting your review at /specials/review)"
    )


if __name__ == "__main__":
    main()
