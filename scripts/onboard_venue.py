#!/usr/bin/env python3
"""
CastZone — onboard a venue that said "YES" to a free listing.

Usage:
    python3 scripts/onboard_venue.py <venue-number-from-leads-sheet> [--lat L --lng L]
    python3 scripts/onboard_venue.py 1
    python3 scripts/onboard_venue.py 1 --lat -25.8 --lng 28.3   (skip geocoding)

What it does (no service key needed locally):
  1. Pulls the venue's details from CastZone_Venue_Leads.xlsx (name, province, type, species, blurb).
  2. Geocodes lat/lng from the venue name+province via OpenStreetMap Nominatim (or use --lat/--lng).
  3. Prints a ready-to-paste Supabase INSERT (run it in Supabase Studio -> SQL Editor).
  4. AUTO-ADDS the slug to VENUE_SLUGS in src/app/venues/[slug]/page.tsx (sitemap imports it).
  5. Prints the 3 deploy commands to finish (build + commit + push).

After step 3 (paste+run SQL) and step 4 (auto-done), run the deploy commands it prints.
"""
import sys, os, re, json, ssl, urllib.parse, urllib.request, argparse
import openpyxl

REPO  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEADS = os.path.expanduser("~/Documents/CastZone/Outreach/CastZone_Venue_Leads.xlsx")
SLUGF = os.path.join(REPO, "src/app/venues/[slug]/page.tsx")
KEYS  = ['num','venue','prov','vtype','contact','email','phone','web','offered','status','notes','date']

def slugify(name):
    s = re.sub(r'\([^)]*\)', '', name).lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s

def detect_species(text):
    t = text.lower(); found=[]
    for kw,label in [("carp","Carp"),("bass","Bass"),("trout","Trout"),("tilapia","Tilapia"),
                     ("barbel","Barbel"),("yellow","Yellowfish"),("tiger","Tigerfish"),
                     ("kob","Kob"),("snoek","Snoek"),("tuna","Tuna"),("marlin","Marlin")]:
        if kw in t and label not in found: found.append(label)
    if "saltwater" in t or "deep sea" in t or "charter" in t:
        for l in ["Kob","Yellowtail","Snoek"]:
            if l not in found: found.append(l)
    return found or ["Mixed Angling"]

def geocode(name, province):
    q = urllib.parse.quote(f"{name}, {province}, South Africa")
    url = f"https://nominatim.openstreetmap.org/search?q={q}&format=json&limit=1"
    req = urllib.request.Request(url, headers={"User-Agent":"CastZone-onboard/1.0"})
    ctx = ssl.create_default_context()
    try: ctx.load_verify_locations(__import__("certifi").where())
    except Exception: ctx = ssl._create_unverified_context()
    with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
        data = json.load(r)
    if data:
        return float(data[0]["lat"]), float(data[0]["lon"])
    return None, None

def get_venue(num):
    wb = openpyxl.load_workbook(LEADS); ws = wb["CastZone Venue Leads"]
    for r in ws.iter_rows(min_row=4, values_only=True):
        d = dict(zip(KEYS, r))
        if str(d['num']) == str(num): return d
    return None

def add_slug(slug):
    src = open(SLUGF).read()
    if f'"{slug}"' in src:
        return "already-present"
    # insert just before the closing "];" of the VENUE_SLUGS array
    new = src.replace("\n];", f'\n  "{slug}", // onboarded\n];', 1)
    if new == src:
        return "FAILED-to-patch (check VENUE_SLUGS array manually)"
    open(SLUGF,"w").write(new)
    return "added"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("num"); ap.add_argument("--lat", type=float); ap.add_argument("--lng", type=float)
    a = ap.parse_args()
    v = get_venue(a.num)
    if not v: sys.exit(f"Venue #{a.num} not found in leads sheet.")

    name = str(v['venue']); prov = str(v['prov']); slug = slugify(name)
    vtype_raw = (str(v['vtype']) or "").lower()
    vtype = ("saltwater" if ("charter" in vtype_raw or "saltwater" in vtype_raw or "deep sea" in vtype_raw)
             else "river" if "river" in vtype_raw else "dam")
    species = detect_species(f"{v['offered']} {v['vtype']}")
    blurb = str(v['offered']) if v['offered'] and str(v['offered'])!="None" else f"{v['vtype']} in {prov}."

    if a.lat is not None and a.lng is not None:
        lat, lng = a.lat, a.lng; src_note="(manual)"
    else:
        print(f"Geocoding '{name}, {prov}'…")
        lat, lng = geocode(name, prov); src_note="(Nominatim — VERIFY on a map!)"
        if lat is None:
            sys.exit("Could not geocode. Re-run with --lat <n> --lng <n> (look up on Google Maps).")

    sp = "{" + ",".join(f'"{s}"' for s in species) + "}"
    sql = (f"insert into venues (name, slug, province, type, species, lat, lng, "
           f"permit_required, permit_info, facilities) values\n"
           f"('{name.replace(chr(39),chr(39)*2)}', '{slug}', '{prov}', '{vtype}', "
           f"'{sp}', {lat}, {lng}, false, "
           f"'Private venue — access by booking. Contact the venue directly.', '{{}}');")

    print("\n" + "="*64)
    print(f"  ONBOARD: {name}  ({prov})")
    print("="*64)
    print(f"  slug:     {slug}")
    print(f"  type:     {vtype}")
    print(f"  species:  {', '.join(species)}")
    print(f"  lat/lng:  {lat}, {lng}  {src_note}")
    print(f"  blurb:    {blurb[:70]}")
    print("\n--- STEP 1: paste this in Supabase Studio → SQL Editor → Run ---\n")
    print(sql)
    print("\n--- STEP 2: VENUE_SLUGS patch ---")
    print(f"  {add_slug(slug)}  →  src/app/venues/[slug]/page.tsx")
    print("\n--- STEP 3: deploy (run in repo) ---")
    print("  cd ~/Projects/castzone-website")
    print("  npm run build && git add -A out src && \\")
    print(f'    git commit -m "Add venue: {name}" && git push origin main')
    print("\n  (Cloudflare auto-deploys in ~60s. Verify: castzone.co.za/venues/"+slug+")")
    print("="*64)

if __name__ == "__main__":
    main()
