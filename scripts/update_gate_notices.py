#!/usr/bin/env python3
"""
Scrapes DWS gate notices from mobi.reservoir.org.za/dws-comms/.

Two modes, because the DWS feed is seasonal:
  • Flood season (≈Oct–May): a dated list of gate operations →
    written to src/data/gateNotices.json (array of {date,dam,text,latest}).
  • Off season (≈May–Oct): DWS closes flood-season reporting; the page only
    shows an "Attention … Season Reporting closed" banner + a current-release
    date. We DON'T wipe the historical notice list — we just record the
    seasonal status in src/data/gateStatus.json so the site can show an
    accurate (non-alarmist) message.

Tag-agnostic: parses the page's plain text, so it survives the WordPress
theme re-wrapping words in extra tags (which is what silently broke the old
parser). Network/parse failures are non-fatal — existing files are left as-is.

Runs daily via .github/workflows/update-conditions.yml.
"""

import html as htmllib  # aliased: local vars named `html` shadow the module otherwise
import json
import re
import ssl
import sys
import urllib.request
from datetime import date, datetime
from pathlib import Path

URL = "https://mobi.reservoir.org.za/dws-comms/"
DATA_DIR = Path(__file__).parent.parent / "src" / "data"
NOTICES_OUT = DATA_DIR / "gateNotices.json"
STATUS_OUT = DATA_DIR / "gateStatus.json"

DAM_PATTERNS = {
    "vaal":     re.compile(r"vaal dam", re.IGNORECASE),
    "bloemhof": re.compile(r"bloemhof dam", re.IGNORECASE),
    "barrage":  re.compile(r"\bbarrage\b", re.IGNORECASE),
}
DATE_CLEAN = re.compile(r"^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+", re.IGNORECASE)
# "19 May 2026" inside arbitrary text
LONG_DATE = re.compile(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})")
# "Current Release 13-06-2026."
REL_DATE = re.compile(r"Current Release\s+(\d{1,2})-(\d{1,2})-(\d{4})", re.IGNORECASE)


def detect_dam(text: str):
    for dam, pat in DAM_PATTERNS.items():
        if pat.search(text):
            return dam
    return None


def clean_text(raw: str) -> str:
    text = re.sub(
        r"^For (?:Vaal Dam|Bloemhof Dam|the Barrage|the Vaal Barrage),\s*"
        r"(?:the recommendation today is to\s*|in-line with[^,]+,\s*)?",
        "", raw.strip(), flags=re.IGNORECASE)
    return text[:1].upper() + text[1:] if text else raw.strip()


def plain_text(page: str) -> str:
    page = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", page, flags=re.S | re.I)
    text = htmllib.unescape(re.sub(r"<[^>]+>", " ", page))
    return re.sub(r"[ \t]+", " ", text)


def parse_inseason(page: str) -> list:
    """Best-effort flood-season parse: the legacy <h3>date</h3><p>notice</p> layout."""
    page = re.sub(r"<(?:br|hr)\s*/?>", "\n", page, flags=re.IGNORECASE)
    notices, latest_date = [], None
    for block in re.split(r"<h3[^>]*>", page)[1:]:
        m = re.match(r"([^<]+)</h3>(.*)", block, re.DOTALL)
        if not m:
            continue
        raw_date = DATE_CLEAN.sub("", m.group(1).strip())
        if not LONG_DATE.search(raw_date):
            continue
        if latest_date is None:
            latest_date = raw_date
        for para in re.findall(r"<p[^>]*>(.*?)</p>", m.group(2), re.DOTALL | re.IGNORECASE):
            txt = htmllib.unescape(re.sub(r"<[^>]+>", "", para).strip())
            dam = detect_dam(txt)
            if not txt or dam is None:
                continue
            n = {"date": raw_date, "dam": dam, "text": clean_text(txt)}
            if raw_date == latest_date:
                n["latest"] = True
            notices.append(n)
    return notices


def parse_status(text: str) -> dict | None:
    """Off-season banner: 'Attention … <date> … Season Reporting closed. Current Release dd-mm-yyyy.'"""
    if "season reporting closed" not in text.lower():
        return None
    status = {"season": "closed", "checkedAt": date.today().isoformat()}
    # Attention date — the long date nearest the "Attention" banner
    seg = text
    a = re.search(r"Attention", text, re.IGNORECASE)
    if a:
        seg = text[a.start():a.start() + 200]
    dm = LONG_DATE.search(seg)
    if dm:
        status["asOf"] = f"{int(dm.group(1))} {dm.group(2)} {dm.group(3)}"
    rm = REL_DATE.search(text)
    if rm:
        status["currentRelease"] = f"{rm.group(3)}-{int(rm.group(2)):02d}-{int(rm.group(1)):02d}"
    return status


def write_if_changed(path: Path, obj) -> bool:
    new = json.dumps(obj, indent=2, ensure_ascii=False) + "\n"
    if path.exists() and path.read_text() == new:
        return False
    path.write_text(new)
    return True


def main() -> int:
    ctx = ssl._create_unverified_context()
    try:
        req = urllib.request.Request(URL, headers={"User-Agent": "CastZone/1.0 (+https://castzone.co.za)"})
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            page = resp.read().decode("utf-8", errors="replace")
    except Exception as exc:
        print(f"[gate-notices] Fetch failed (site unreachable?): {exc}", file=sys.stderr)
        return 0  # non-fatal — leave existing files untouched

    text = plain_text(page)
    notices = parse_inseason(page)
    status = parse_status(text)

    if notices:
        # Flood season: refresh the dated notice list.
        changed = write_if_changed(NOTICES_OUT, notices)
        write_if_changed(STATUS_OUT, {"season": "open", "checkedAt": date.today().isoformat(),
                                      "latest": notices[0]["date"]})
        print(f"[gate-notices] In-season: {len(notices)} notices "
              + ("(updated)." if changed else "(no change)."))
        return 0

    if status:
        # Off season: keep the historical notice list; record the seasonal status.
        changed = write_if_changed(STATUS_OUT, status)
        print(f"[gate-notices] Off-season — reporting closed as of "
              f"{status.get('asOf','?')}, current release {status.get('currentRelease','?')} "
              + ("(status updated)." if changed else "(no change)."))
        return 0

    # Neither parsed: layout likely changed mid-season — fail loud (don't corrupt data).
    print("[gate-notices] Could not parse notices OR seasonal status — "
          "page layout may have changed. Left existing files untouched.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
