#!/usr/bin/env python3
"""Scrape DWS 'Unverified' near-real-time hydrology page for the Vaal system.

Writes out/vaal-live.json only (served as-is by Cloudflare Pages; NOT in public/, so no rebuild is triggered).
Run from the Home Server (dws.gov.za blocks GitHub datacenter IPs).
Exit 0 + "no change" if unchanged; exit 1 and leave the file untouched on failure.
"""
import json, re, sys, urllib.request, datetime, pathlib

URL = "https://www.dws.gov.za/hydrology/Unverified"
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "out" / "vaal-live.json"

# station name on DWS page -> key
WANTED = {
    "Vaal at Vaal Dam": "vaalDamCapacity",
    "Outflow from Vaal Dam": "vaalDamOutflow",
    "Vaal at Bloemhof Dam": "bloemhofCapacity",
    "Outflow from Bloemhof Dam": "bloemhofOutflow",
}

def fetch():
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (CastZone data bot)"})
    return urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "replace")

def main():
    try:
        h = fetch()
    except Exception as e:
        print(f"[vaal-live] fetch failed: {e}"); return 1
    found = {}
    for r in re.findall(r"<tr[^>]*>(.*?)</tr>", h, re.S):
        c = [re.sub(r"<[^>]+>", "", x).strip() for x in re.findall(r"<td[^>]*>(.*?)</td>", r, re.S)]
        if len(c) >= 5 and c[1] in WANTED:
            try:
                found[WANTED[c[1]]] = {"station": c[0], "time": c[2], "value": float(c[4])}
            except ValueError:
                pass
    need = {"vaalDamCapacity", "vaalDamOutflow", "bloemhofOutflow"}
    if not need <= found.keys():
        print(f"[vaal-live] page layout changed, missing {need - found.keys()}; file untouched"); return 1
    data = {
        "fetchedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "source": URL,
        **found,
    }
    OUT.write_text(json.dumps(data, indent=1) + "\n")
    print("[vaal-live] ok", {k: v["value"] for k, v in found.items()})
    return 0

sys.exit(main())
