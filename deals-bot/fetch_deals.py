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
DRY_RUN = os.environ.get("DRY_RUN") == "1"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

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
    # Sportsmans Warehouse runs an Algolia backend (different adapter) — TODO.
    # Takealot / Makro / Game / Cape Union Mart / Mr Price are bot-protected
    # SPAs; best sourced via affiliate product feeds — see README.
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


def get_json(url, tries=3):
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": UA,
                "Accept": "application/json, text/plain, */*",
            })
            with urllib.request.urlopen(req, timeout=30, context=_CTX) as resp:
                raw = resp.read().decode("utf-8", "replace")
            return json.loads(raw)
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise last


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
        data = get_json(url)
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


ADAPTERS = {
    "cowhills": adapter_cowhills,
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


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def main():
    if not DRY_RUN and (not SUPABASE_URL or not SUPABASE_KEY):
        sys.exit("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY are required.")

    print(f"CastZone deals bot — min discount {MIN_DISCOUNT}%, "
          f"expire {EXPIRE_DAYS}d, dry_run={DRY_RUN}")

    seen = set() if DRY_RUN else existing_external_ids()
    print(f"Already in table: {len(seen)} deals")

    expires = (datetime.now(timezone.utc) + timedelta(days=EXPIRE_DAYS)).isoformat()
    to_insert = []
    batch_seen = set()

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
            d["status"] = "pending"
            d["expires_at"] = expires
            to_insert.append(d)
            batch_seen.add(d["external_id"])
            new += 1
        print(f"  · {r['name']}: {len(found)} on promo, "
              f"{qualifying} are >= {MIN_DISCOUNT}% fishing/camping, {new} new")

    print(f"\nTotal new deals to queue: {len(to_insert)}")
    if DRY_RUN:
        for d in sorted(to_insert, key=lambda x: -x["discount_pct"])[:20]:
            print(f"  -{d['discount_pct']}%  {d['category']:7} "
                  f"R{d['original_price']:.0f}->R{d['sale_price']:.0f}  {d['title'][:50]}")
        return

    if to_insert:
        status = insert_deals(to_insert)
        print(f"Inserted (HTTP {status}). Review them at /specials/review")
    else:
        print("Nothing new to queue this run.")


if __name__ == "__main__":
    main()
