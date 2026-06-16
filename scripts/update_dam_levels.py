#!/usr/bin/env python3
"""
Refreshes weekly dam-level numbers in src/data/waterConditions.ts from the
official DWS "Weekly State of Dams" pages (one per province).

Source: https://www.dws.gov.za/Hydrology/Weekly/ProvinceWeek.aspx?region=XX

This is a SURGICAL updater: it only rewrites the pct / lastWeek / lastYear
numbers (and the DATA_UPDATED date) for dams already listed in the file,
matched by name. It never adds, removes, renames or reorders dams, and it
never touches venueSlug — so the per-dam SEO pages, DAM_SLUGS and sitemap
stay stable.

Runs weekly via .github/workflows/update-dam-levels.yml.
If DWS is unreachable or nothing parses, the existing file is left untouched.

Usage:
  python scripts/update_dam_levels.py            # apply changes
  python scripts/update_dam_levels.py --dry-run  # report only, write nothing
"""

import re
import ssl
import sys
import urllib.request
from pathlib import Path

DATA = Path(__file__).parent.parent / "src" / "data" / "waterConditions.ts"

BASE = "https://www.dws.gov.za/Hydrology/Weekly/ProvinceWeek.aspx?region="
# DWS region codes for the 9 SA provinces
REGIONS = ["EC", "FS", "G", "KN", "LP", "M", "NC", "NW", "WC"]

UA = "CastZone/1.0 (+https://castzone.co.za)"

TAG = re.compile(r"<[^>]+>")
ROW = re.compile(r"<tr\b[^>]*>(.*?)</tr>", re.IGNORECASE | re.DOTALL)
CELL = re.compile(r"<td\b[^>]*>(.*?)</td>", re.IGNORECASE | re.DOTALL)
DATE = re.compile(r"on\s+(\d{4}-\d{2}-\d{2})")


def norm(name: str) -> str:
    """Normalise a dam name for matching: lowercase alphanumerics only."""
    return re.sub(r"[^a-z0-9]", "", name.lower())


def to_num(cell: str):
    """Parse a DWS value cell -> float, stripping the '#' latest-available marker."""
    txt = TAG.sub("", cell).strip().lstrip("#").strip()
    try:
        return float(txt)
    except ValueError:
        return None


def fetch(url: str, ctx) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_province(html: str) -> dict:
    """Return {norm_name: {'pct','lastWeek','lastYear','fsc','name'}} from one province page."""
    out: dict = {}
    for row_html in ROW.findall(html):
        cells = CELL.findall(row_html)
        if len(cells) < 8:
            continue
        name = TAG.sub("", cells[0]).strip()
        if not name or "total" in name.lower():
            continue
        fsc = to_num(cells[4])
        pct = to_num(cells[5])
        last_week = to_num(cells[6])
        last_year = to_num(cells[7])
        if pct is None:  # skip header / non-data rows
            continue
        out[norm(name)] = {
            "name": name,
            "fsc": fsc,
            "pct": pct,
            "lastWeek": last_week,
            "lastYear": last_year,
        }
    return out


def main() -> int:
    dry = "--dry-run" in sys.argv
    ctx = ssl._create_unverified_context()

    levels: dict = {}
    data_date: str | None = None
    for region in REGIONS:
        try:
            html = fetch(BASE + region, ctx)
        except Exception as exc:
            print(f"[dam-levels] Fetch failed for region {region}: {exc}", file=sys.stderr)
            continue
        if data_date is None:
            m = DATE.search(html)
            if m:
                data_date = m.group(1)
        prov = parse_province(html)
        print(f"[dam-levels] {region}: parsed {len(prov)} dams")
        levels.update(prov)

    if not levels:
        print("[dam-levels] No data parsed — DWS unreachable or layout changed. "
              "Leaving file untouched.", file=sys.stderr)
        return 1
    print(f"[dam-levels] Total {len(levels)} dams from DWS"
          + (f", data dated {data_date}" if data_date else ""))

    text = DATA.read_text()
    lines = text.splitlines(keepends=True)

    name_re = re.compile(r'name:\s*"([^"]+)"')
    matched, unmatched = 0, []
    changed_vals = 0

    for i, line in enumerate(lines):
        nm = name_re.search(line)
        if not nm or "pct:" not in line:
            continue
        key = norm(nm.group(1))
        rec = levels.get(key)
        if rec is None:
            unmatched.append(nm.group(1))
            continue
        matched += 1
        new_line = line
        for field in ("pct", "lastWeek", "lastYear"):
            val = rec[field]
            if val is None:
                continue
            num = f"{val:g}"
            new_line, n = re.subn(rf"(\b{field}:\s*)[\d.]+", rf"\g<1>{num}", new_line, count=1)
            if n:
                changed_vals += 1
        if new_line != line:
            lines[i] = new_line

    # Update the DATA_UPDATED const and the header comment date
    new_text = "".join(lines)
    if data_date:
        new_text, _ = re.subn(
            r'(export const DATA_UPDATED\s*=\s*")[\d-]+(")',
            rf"\g<1>{data_date}\g<2>", new_text, count=1)
        new_text, _ = re.subn(
            r"(// Last updated:\s*)[\d-]+", rf"\g<1>{data_date}", new_text, count=1)

    print(f"[dam-levels] Matched {matched} dams; {len(unmatched)} in file not found at DWS.")
    if unmatched:
        print("  Unmatched (left unchanged): " + ", ".join(unmatched))

    if new_text == text:
        print("[dam-levels] No changes (levels already current).")
        return 0

    if dry:
        print("[dam-levels] DRY RUN — no file written.")
        return 0

    DATA.write_text(new_text)
    print(f"[dam-levels] Updated {DATA.name} — {matched} dams refreshed"
          + (f", dated {data_date}." if data_date else "."))
    return 0


if __name__ == "__main__":
    sys.exit(main())
