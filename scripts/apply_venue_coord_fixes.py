"""One-off: apply src/db/venue-coordinate-fixes.sql via Supabase PostgREST.

Parses the reviewed SQL file (update venues set lat = X, lng = Y where slug = 'Z';)
and PATCHes each venue row using the service-role key. Idempotent — safe to re-run.
"""
import json
import os
import re
import sys
import urllib.request

URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_KEY"]
SQL = "src/db/venue-coordinate-fixes.sql"

pat = re.compile(
    r"update venues set lat = (-?\d+\.\d+), lng = (-?\d+\.\d+) where slug = '([a-z0-9-]+)';"
)
fixes = pat.findall(open(SQL).read())
if not fixes:
    sys.exit("no fixes parsed from " + SQL)
print(f"{len(fixes)} fixes parsed")

failed = 0
for lat, lng, slug in fixes:
    req = urllib.request.Request(
        f"{URL}/rest/v1/venues?slug=eq.{slug}",
        data=json.dumps({"lat": float(lat), "lng": float(lng)}).encode(),
        method="PATCH",
        headers={
            "apikey": KEY,
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    try:
        rows = json.load(urllib.request.urlopen(req, timeout=30))
        if len(rows) == 1:
            print(f"OK   {slug:26s} -> {lat}, {lng}")
        else:
            print(f"WARN {slug:26s} matched {len(rows)} rows")
            failed += 1
    except Exception as e:  # noqa: BLE001
        print(f"FAIL {slug}: {e}")
        failed += 1

sys.exit(1 if failed else 0)
