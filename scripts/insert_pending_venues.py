#!/usr/bin/env python3
"""
Insert venues from content-onboard/pending_venues.json into Supabase `venues`.

Runs in GitHub Actions (insert-venues.yml) with the service-role key, because
RLS only allows anon SELECT — INSERT needs the service key (kept in GH Secrets,
never on a laptop). Idempotent: skips a venue whose slug already exists.

Env: SUPABASE_URL, SUPABASE_SERVICE_KEY
"""
import json, os, sys, urllib.request, urllib.error

URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_KEY"]
QUEUE = "content-onboard/pending_venues.json"

HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
}

def slug_exists(slug):
    req = urllib.request.Request(
        f"{URL}/rest/v1/venues?slug=eq.{slug}&select=slug", headers=HEADERS)
    return len(json.load(urllib.request.urlopen(req, timeout=30))) > 0

def insert(v):
    req = urllib.request.Request(
        f"{URL}/rest/v1/venues",
        data=json.dumps(v).encode(),
        method="POST",
        headers={**HEADERS, "Prefer": "return=representation"})
    return json.load(urllib.request.urlopen(req, timeout=30))

def main():
    venues = json.load(open(QUEUE))
    if not venues:
        print("Queue empty — nothing to insert."); return 0
    allowed = {"name","slug","province","type","species","lat","lng",
               "permit_required","permit_info","facilities",
               "contact_name","contact_phone","contact_email","website"}
    failed = 0
    for v in venues:
        slug = v["slug"]
        row = {k: v[k] for k in v if k in allowed}
        try:
            if slug_exists(slug):
                print(f"SKIP {slug} (already exists)"); continue
            insert(row)
            print(f"OK   inserted {slug}")
        except urllib.error.HTTPError as e:
            print(f"FAIL {slug}: {e.code} {e.read().decode()[:200]}"); failed += 1
        except Exception as e:  # noqa: BLE001
            print(f"FAIL {slug}: {e}"); failed += 1
    return 1 if failed else 0

if __name__ == "__main__":
    sys.exit(main())
