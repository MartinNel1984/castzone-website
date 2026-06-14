#!/usr/bin/env python3
"""
CastZone — ONE-COMMAND venue onboarding (for a venue that said "yes").

    python3 scripts/onboard.py <lead-number> [--lat L --lng L]

Does the whole pipeline automatically:
  1. Reads the venue from ~/Desktop/CastZone_Venue_Leads.xlsx, geocodes it
     (private venues often aren't on the map -> pass --lat/--lng from Google Maps).
  2. Queues it + triggers the GitHub Action that INSERTS it into Supabase
     (service key stays in GitHub Secrets — never touches this laptop).
  3. Waits for the insert, then adds the slug, builds the site locally, and
     pushes -> Cloudflare deploys. Prints the live URL.

Requires: the repo's git remote to carry a token with repo+workflow scope
(it does), npm, and openpyxl. Run from the repo root.
"""
import json, os, re, sys, time, subprocess, urllib.request, urllib.error, argparse
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
import onboard_venue as ov  # reuse get_venue / slugify / detect_species / geocode / add_slug

REPO_SLUG = "MartinNel1984/castzone-website"
QUEUE = "content-onboard/pending_venues.json"

def sh(cmd, **kw):
    return subprocess.run(cmd, shell=True, check=True, text=True, **kw)

def token():
    url = subprocess.check_output("git remote get-url origin", shell=True, text=True).strip()
    m = re.match(r"https://([^@]+)@", url)
    if not m: sys.exit("No token in git remote — can't dispatch the Action.")
    return m.group(1)

def api(method, path, tok, data=None):
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO_SLUG}{path}",
        data=json.dumps(data).encode() if data else None, method=method,
        headers={"Authorization": f"token {tok}", "Accept": "application/vnd.github+json"})
    r = urllib.request.urlopen(req, timeout=30)
    return r.status, (json.load(r) if r.status != 204 else None)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("num"); ap.add_argument("--lat", type=float); ap.add_argument("--lng", type=float)
    a = ap.parse_args()
    v = ov.get_venue(a.num)
    if not v: sys.exit(f"Venue #{a.num} not in leads sheet.")
    name, prov = str(v["venue"]), str(v["prov"])
    slug = ov.slugify(name)
    vt = (str(v["vtype"]) or "").lower()
    vtype = ("saltwater" if any(k in vt for k in ("charter","saltwater","deep sea"))
             else "river" if "river" in vt else "dam")
    species = ov.detect_species(f"{v['offered']} {v['vtype']}")
    if a.lat is not None and a.lng is not None:
        lat, lng = a.lat, a.lng
    else:
        print(f"Geocoding {name}…"); lat, lng = ov.geocode(name, prov)
        if lat is None: sys.exit("Geocode failed — re-run with --lat <n> --lng <n> from Google Maps.")
    blurb = (str(v["offered"]) if v["offered"] and str(v["offered"]) != "None"
             else f"{v['vtype']} in {prov}.")
    venue = {"name": name, "slug": slug, "province": prov, "type": vtype, "species": species,
             "lat": round(lat, 5), "lng": round(lng, 5), "permit_required": False,
             "permit_info": f"{blurb} Access by booking — contact the venue directly.",
             "facilities": []}
    print(f"\nOnboarding: {name}  ->  /venues/{slug}  ({vtype}, {', '.join(species)}, {lat:.4f},{lng:.4f})")

    # 1. queue + push
    json.dump([venue], open(QUEUE, "w"), indent=2)
    sh(f"git add {QUEUE} && git commit -q -m 'Queue venue: {name}' && git push -q origin main")

    # 2. dispatch insert Action
    tok = token()
    print("Triggering DB-insert Action…")
    api("POST", "/actions/workflows/insert-venues.yml/dispatches", tok, {"ref": "main"})
    time.sleep(6)
    # poll the latest run
    for _ in range(24):
        _, runs = api("GET", "/actions/workflows/insert-venues.yml/runs?per_page=1", tok)
        run = runs["workflow_runs"][0]
        if run["status"] == "completed":
            if run["conclusion"] != "success":
                sys.exit(f"Insert Action failed: {run['html_url']}")
            print("  DB insert OK."); break
        time.sleep(5)
    else:
        sys.exit("Insert Action timed out — check the Actions tab.")

    # 3. slug + build + deploy locally
    print("Patching slug:", ov.add_slug(slug))
    json.dump([], open(QUEUE, "w"))                      # clear queue
    print("Building…"); sh("npm run build > /tmp/cz_build.log 2>&1")
    sh(f"git add out src {QUEUE} && git commit -q -m 'Add venue: {name}' && git push -q origin main")
    print(f"\n✅ Done. Live shortly at: https://castzone.co.za/venues/{slug}")

if __name__ == "__main__":
    main()
