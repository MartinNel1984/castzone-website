#!/usr/bin/env python3
"""
Scrapes DWS gate notices from mobi.reservoir.org.za/dws-comms/
and writes the result to src/data/gateNotices.json.

Runs daily via .github/workflows/update-gate-notices.yml.
If the page is unreachable the existing JSON is left untouched.
"""

import json
import re
import sys
import urllib.request
import ssl
from pathlib import Path
from datetime import datetime

URL = "https://mobi.reservoir.org.za/dws-comms/"
OUT = Path(__file__).parent.parent / "src" / "data" / "gateNotices.json"

# Which words in a paragraph text identify each dam
DAM_PATTERNS = {
    "vaal":     re.compile(r"vaal dam", re.IGNORECASE),
    "bloemhof": re.compile(r"bloemhof dam", re.IGNORECASE),
    "barrage":  re.compile(r"\bbarrage\b", re.IGNORECASE),
}

# Normalise "Tue 19 May 2026" → "19 May 2026"
DATE_CLEAN = re.compile(r"^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+", re.IGNORECASE)


def detect_dam(text: str) -> str | None:
    for dam, pat in DAM_PATTERNS.items():
        if pat.search(text):
            return dam
    return None


def clean_text(raw: str) -> str:
    # Strip the "For Vaal Dam, the recommendation today is to " preamble
    text = re.sub(
        r"^For (?:Vaal Dam|Bloemhof Dam|the Barrage|the Vaal Barrage),\s*"
        r"(?:the recommendation today is to\s*|in-line with[^,]+,\s*)?",
        "",
        raw.strip(),
        flags=re.IGNORECASE,
    )
    # Capitalise first letter
    return text[:1].upper() + text[1:] if text else raw.strip()


def parse_notices(html: str) -> list[dict]:
    """
    The page structure is:
      <h3>Tue 19 May 2026</h3>
      <p>For Vaal Dam …</p>
      <p>For Bloemhof Dam …</p>
      <h3>Wed 17 May 2026</h3>
      …
    """
    # Strip tags we don't need
    html = re.sub(r"<(?:br|hr)\s*/?>", "\n", html, flags=re.IGNORECASE)

    h3_blocks = re.split(r"<h3[^>]*>", html)
    notices: list[dict] = []
    latest_date: str | None = None

    for block in h3_blocks[1:]:  # skip content before first <h3>
        # Extract date from the h3 content (before </h3>)
        h3_match = re.match(r"([^<]+)</h3>(.*)", block, re.DOTALL)
        if not h3_match:
            continue

        raw_date = DATE_CLEAN.sub("", h3_match.group(1).strip())
        body = h3_match.group(2)

        # Track the most-recent date for the "latest" flag
        if latest_date is None:
            latest_date = raw_date

        # Extract all <p> contents in this block
        paragraphs = re.findall(r"<p[^>]*>(.*?)</p>", body, re.DOTALL | re.IGNORECASE)
        for para in paragraphs:
            # Strip inner tags
            text_raw = re.sub(r"<[^>]+>", "", para).strip()
            if not text_raw:
                continue

            dam = detect_dam(text_raw)
            if dam is None:
                continue  # skip non-dam paragraphs (navigation, cookies, etc.)

            notice: dict = {
                "date": raw_date,
                "dam": dam,
                "text": clean_text(text_raw),
            }
            if raw_date == latest_date:
                notice["latest"] = True

            notices.append(notice)

    return notices


def main() -> int:
    ctx = ssl._create_unverified_context()
    try:
        req = urllib.request.Request(URL, headers={"User-Agent": "CastZone/1.0 (+https://castzone.co.za)"})
        with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as exc:
        print(f"[gate-notices] Fetch failed: {exc}", file=sys.stderr)
        return 1

    notices = parse_notices(html)
    if not notices:
        print("[gate-notices] No notices parsed — page structure may have changed.", file=sys.stderr)
        return 1

    # Load existing file to compare
    existing: list = []
    if OUT.exists():
        try:
            existing = json.loads(OUT.read_text())
        except Exception:
            pass

    if notices == existing:
        print(f"[gate-notices] No changes ({len(notices)} notices).")
        return 0

    OUT.write_text(json.dumps(notices, indent=2, ensure_ascii=False) + "\n")
    print(f"[gate-notices] Updated — {len(notices)} notices written to {OUT.name}.")
    if notices:
        print(f"  Latest: [{notices[0]['dam']}] {notices[0]['date']} — {notices[0]['text'][:80]}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
