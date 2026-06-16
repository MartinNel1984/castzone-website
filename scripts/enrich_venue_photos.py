#!/usr/bin/env python3
"""
Venue photo enrichment from Wikimedia Commons.

For every CastZone venue (pulled from Supabase by GPS) this finds freely-licensed
geotagged photos on Wikimedia Commons within a radius, keeps only the ones that
are LEGAL to republish (Creative Commons / public domain), and writes:

  content-onboard/venue-photos/manifest.json   structured results + attribution
  content-onboard/venue-photos/review.html     visual gallery to eyeball + pick
  content-onboard/venue-photos/<slug>/*.jpg    thumbnails (only with --download)

Nothing is published automatically — this is a REVIEW pipeline. Open review.html,
keep the good shots, and each photo already carries the exact credit line you must
show when you use it.

Why Wikimedia Commons: its API lets you search by coordinates, and every file
carries machine-readable license + author metadata, so we can filter to images
that are genuinely safe to reuse with attribution. (Famous dams are well covered;
the long tail still needs the community / your own camera.)

Usage:
  python scripts/enrich_venue_photos.py                 # all venues, manifest+gallery
  python scripts/enrich_venue_photos.py --slug vaal-dam # one venue
  python scripts/enrich_venue_photos.py --max-venues 10 # quick test
  python scripts/enrich_venue_photos.py --download       # also save thumbnails
  python scripts/enrich_venue_photos.py --radius 6000 --limit 12

Reads Supabase creds from .env.local (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY).
Read-only against Supabase and Commons. Polite: single-threaded, rate-limited,
honest User-Agent, respects API maxlag.
"""

import argparse
import json
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from html import unescape
from pathlib import Path


def _ssl_context() -> ssl.SSLContext:
    """Verified context via certifi; the macOS framework Python ships no CA
    bundle, so fall back to unverified (we only hit public read-only APIs)."""
    ctx = ssl.create_default_context()
    try:
        ctx.load_verify_locations(__import__("certifi").where())
    except Exception:  # noqa: BLE001
        ctx = ssl._create_unverified_context()
    return ctx


SSL_CTX = _ssl_context()

ROOT = Path(__file__).parent.parent
ENV = ROOT / ".env.local"
OUT_DIR = ROOT / "content-onboard" / "venue-photos"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
UA = "CastZone-enrichment/1.0 (+https://castzone.co.za; martin@roboticsleague.co.za)"

# Commons caps geosearch radius at 10 km.
MAX_RADIUS = 10000
# Polite pause between Commons requests (seconds).
PAUSE = 0.4

TAGS = re.compile(r"<[^>]+>")


def load_env() -> dict:
    """Parse KEY=VALUE lines from .env.local (ignores quotes/comments)."""
    env = {}
    if not ENV.exists():
        sys.exit(f"Missing {ENV} — need NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY")
    for line in ENV.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def http_json(url: str, headers: dict | None = None, retries: int = 3) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001 — be forgiving, retry
            if attempt == retries - 1:
                raise
            time.sleep(1.5 * (attempt + 1))
    return {}


def fetch_venues(env: dict) -> list[dict]:
    base = env.get("NEXT_PUBLIC_SUPABASE_URL")
    key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not base or not key:
        sys.exit("Supabase URL/anon key not found in .env.local")
    url = f"{base}/rest/v1/venues?select=name,slug,province,lat,lng&order=name.asc"
    rows = http_json(url, headers={"apikey": key, "Authorization": f"Bearer {key}"})
    return [
        r for r in rows
        if isinstance(r.get("lat"), (int, float)) and isinstance(r.get("lng"), (int, float))
    ]


def geosearch(lat: float, lng: float, radius: int, limit: int) -> list[dict]:
    """Geotagged File-namespace results near a point, with distance."""
    q = {
        "action": "query", "format": "json", "list": "geosearch",
        "gscoord": f"{lat}|{lng}", "gsradius": min(radius, MAX_RADIUS),
        "gslimit": limit, "gsnamespace": 6, "maxlag": 5,
    }
    data = http_json(f"{COMMONS_API}?{urllib.parse.urlencode(q)}")
    return data.get("query", {}).get("geosearch", [])


def imageinfo(titles: list[str]) -> dict:
    """Batch file metadata: url, thumb, mime, license + author (extmetadata)."""
    q = {
        "action": "query", "format": "json", "prop": "imageinfo",
        "iiprop": "url|mime|extmetadata", "iiurlwidth": 480,
        "titles": "|".join(titles), "maxlag": 5,
    }
    data = http_json(f"{COMMONS_API}?{urllib.parse.urlencode(q, safe='|')}")
    out = {}
    for page in data.get("query", {}).get("pages", {}).values():
        info = (page.get("imageinfo") or [None])[0]
        if info:
            out[page["title"]] = info
    return out


def clean(text: str | None) -> str:
    if not text:
        return ""
    return unescape(TAGS.sub("", text)).strip()


# License codes we consider safe to republish WITH attribution.
FREE_PREFIXES = ("cc-by", "cc0", "pd", "publicdomain", "public domain")
NONFREE_HINTS = ("fair use", "non-free", "nonfree", "copyright", "all rights")


def license_ok(meta: dict) -> tuple[bool, str, str, str]:
    """Return (is_free, short_name, license_url, author)."""
    ext = meta.get("extmetadata", {})
    code = (ext.get("License", {}).get("value") or "").lower()
    short = clean(ext.get("LicenseShortName", {}).get("value")) or code.upper()
    url = ext.get("LicenseUrl", {}).get("value", "")
    author = clean(ext.get("Artist", {}).get("value")) or clean(
        ext.get("Credit", {}).get("value")
    ) or "Unknown author"
    terms = (ext.get("UsageTerms", {}).get("value") or "").lower()
    blob = f"{code} {short.lower()} {terms}"
    if any(h in blob for h in NONFREE_HINTS) and not code.startswith("cc"):
        return False, short, url, author
    is_free = code.startswith(FREE_PREFIXES) or "creativecommons" in url or code in ("cc0",)
    return is_free, short, url, author


def attribution(author: str, short: str, page_url: str) -> str:
    return f'Photo: {author} / Wikimedia Commons ({short}) — {page_url}'


def process_venue(v: dict, radius: int, limit: int) -> dict:
    found = geosearch(v["lat"], v["lng"], radius, limit)
    time.sleep(PAUSE)
    dist = {f["title"]: round(f.get("dist", 0)) for f in found}
    titles = [t for t in dist if t.lower().endswith((".jpg", ".jpeg", ".png"))]

    photos = []
    for i in range(0, len(titles), 40):  # batch
        meta = imageinfo(titles[i:i + 40])
        time.sleep(PAUSE)
        for title, info in meta.items():
            if not (info.get("mime") or "").startswith("image/"):
                continue
            is_free, short, lic_url, author = license_ok(info)
            if not is_free:
                continue
            page_url = f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
            photos.append({
                "title": title[5:],  # drop "File:"
                "distance_m": dist.get(title),
                "thumb": info.get("thumburl"),
                "full": info.get("url"),
                "license": short,
                "license_url": lic_url,
                "author": author,
                "page": page_url,
                "credit": attribution(author, short, page_url),
            })
    photos.sort(key=lambda p: p["distance_m"] if p["distance_m"] is not None else 1e9)
    return {
        "slug": v["slug"], "name": v["name"], "province": v.get("province"),
        "lat": v["lat"], "lng": v["lng"],
        "found": len(found), "kept": len(photos), "photos": photos,
    }


def download_thumbs(results: list[dict]):
    for r in results:
        if not r["photos"]:
            continue
        d = OUT_DIR / r["slug"]
        d.mkdir(parents=True, exist_ok=True)
        for n, p in enumerate(r["photos"], 1):
            if not p["thumb"]:
                continue
            dest = d / f"{n:02d}.jpg"
            if dest.exists():
                continue
            try:
                req = urllib.request.Request(p["thumb"], headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as resp:
                    dest.write_bytes(resp.read())
                p["local"] = str(dest.relative_to(ROOT))
                time.sleep(PAUSE)
            except Exception as e:  # noqa: BLE001
                print(f"  ! thumb failed {r['slug']} #{n}: {e}", file=sys.stderr)


def write_gallery(results: list[dict]):
    with_photos = [r for r in results if r["photos"]]
    total = sum(r["kept"] for r in results)
    cards = []
    for r in with_photos:
        tiles = "".join(
            f'''<figure>
  <a href="{p['full']}" target="_blank"><img loading="lazy" src="{p['thumb']}" alt=""></a>
  <figcaption><span class="d">{p['distance_m']}m</span>
    <span class="lic">{p['license']}</span><br>
    <small>{p['author']}</small><br>
    <a class="src" href="{p['page']}" target="_blank">Commons file ↗</a></figcaption>
</figure>''' for p in r["photos"]
        )
        cards.append(
            f'''<section><h2>{r['name']} <small>· {r.get('province') or ''} · {r['kept']} usable</small></h2>
<div class="grid">{tiles}</div></section>'''
        )
    html = f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CastZone — Venue Photo Review ({total} usable)</title>
<style>
 body{{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0b1220;color:#e8eef7;margin:0;padding:24px}}
 h1{{margin:0 0 6px}} .meta{{color:#93a4be;margin-bottom:24px;font-size:14px}}
 section{{margin-bottom:34px}} h2{{font-size:18px;border-bottom:1px solid #1e2c45;padding-bottom:6px}}
 h2 small{{color:#93a4be;font-weight:400;font-size:13px}}
 .grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-top:14px}}
 figure{{margin:0;background:#121b2e;border:1px solid #1e2c45;border-radius:10px;overflow:hidden}}
 figure img{{width:100%;height:150px;object-fit:cover;display:block}}
 figcaption{{padding:8px 10px;font-size:12px;color:#cfdcec}}
 .d{{color:#f26522;font-weight:600}} .lic{{float:right;color:#86efac}}
 .src{{color:#f26522;text-decoration:none}} small{{color:#93a4be}}
</style></head><body>
<h1>Venue Photo Review</h1>
<div class="meta">{total} usable (freely-licensed) photos across {len(with_photos)} venues.
Every shot below is safe to publish <b>with the credit line shown</b>. Click a thumb for full size.</div>
{''.join(cards) or '<p>No freely-licensed photos found. Try a larger --radius.</p>'}
</body></html>'''
    (OUT_DIR / "review.html").write_text(html, encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description="Enrich venues with Wikimedia Commons photos.")
    ap.add_argument("--radius", type=int, default=8000, help="search radius in metres (max 10000)")
    ap.add_argument("--limit", type=int, default=10, help="candidate files per venue")
    ap.add_argument("--slug", help="run a single venue by slug")
    ap.add_argument("--max-venues", type=int, help="cap venues processed (testing)")
    ap.add_argument("--download", action="store_true", help="also download thumbnails")
    args = ap.parse_args()

    env = load_env()
    venues = fetch_venues(env)
    if args.slug:
        venues = [v for v in venues if v["slug"] == args.slug]
        if not venues:
            sys.exit(f"No venue with slug '{args.slug}'")
    if args.max_venues:
        venues = venues[: args.max_venues]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Scanning {len(venues)} venues (radius {min(args.radius, MAX_RADIUS)}m)…\n")

    results, hits = [], 0
    for i, v in enumerate(venues, 1):
        try:
            r = process_venue(v, args.radius, args.limit)
        except Exception as e:  # noqa: BLE001 — one bad venue shouldn't kill the run
            print(f"[{i}/{len(venues)}] {v['slug']}: ERROR {e}", file=sys.stderr)
            continue
        results.append(r)
        if r["kept"]:
            hits += 1
            print(f"[{i}/{len(venues)}] {v['name']}: {r['kept']} usable / {r['found']} found")
        else:
            print(f"[{i}/{len(venues)}] {v['name']}: —")

    if args.download:
        print("\nDownloading thumbnails…")
        download_thumbs(results)

    manifest = {
        "generated": time.strftime("%Y-%m-%d %H:%M"),
        "radius_m": min(args.radius, MAX_RADIUS),
        "venues_scanned": len(results),
        "venues_with_photos": hits,
        "total_usable_photos": sum(r["kept"] for r in results),
        "source": "Wikimedia Commons (geosearch + imageinfo); CC/PD only",
        "results": results,
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    write_gallery(results)

    print(f"\n✓ {manifest['total_usable_photos']} usable photos across {hits}/{len(results)} venues")
    print(f"  manifest : {OUT_DIR / 'manifest.json'}")
    print(f"  gallery  : {OUT_DIR / 'review.html'}  ← open this to review")


if __name__ == "__main__":
    main()
