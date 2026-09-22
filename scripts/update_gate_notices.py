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
# Current (2026-09) in-season layout: one <article> per notice, an
# iconbox_content_title h3 with the date, an iconbox_content_container div
# with a <strong>Dam Name</strong> line followed by a <ul><li> notice list.
# (Replaces the pre-2026 legacy <h3>date</h3><p>notice</p> layout this
# theme used to emit — kept ARTICLE_RE separate so a future reformat is a
# one-regex fix rather than a rewrite.)
ARTICLE_RE = re.compile(
    r"<h3 class='iconbox_content_title '.*?>([^<]+)</h3></header>"
    r"<div class='iconbox_content_container '.*?>(.*?)</div></div><footer",
    re.DOTALL,
)


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
    """Flood-season parse: one notice per <article>, newest first as listed on the page."""
    notices = []
    for date_raw, content in ARTICLE_RE.findall(page):
        raw_date = DATE_CLEAN.sub("", date_raw.strip())
        if not LONG_DATE.search(raw_date):
            continue
        dam = detect_dam(content)
        if dam is None:
            continue
        items = re.findall(r"<li[^>]*>(.*?)</li>", content, re.DOTALL)
        if items:
            parts = [htmllib.unescape(re.sub(r"<[^>]+>", "", it)).strip() for it in items]
            text = " ".join(p.rstrip(".") + "." for p in parts if p)
        else:
            body = re.sub(r"<strong>.*?</strong>", "", content, flags=re.DOTALL)
            text = re.sub(r"\s+", " ", htmllib.unescape(re.sub(r"<[^>]+>", " ", body))).strip()
        if not text:
            continue
        notices.append({"date": raw_date, "dam": dam, "text": clean_text(text)})
    return notices


def merge_notices(existing: list, fresh: list) -> list:
    """Prepend genuinely-new notices onto the existing (newest-first) history,
    then flag the newest entry per dam as `latest` — never drop old entries."""
    existing_keys = {(n["date"], n["dam"], n["text"]) for n in existing}
    new_ones = [n for n in fresh if (n["date"], n["dam"], n["text"]) not in existing_keys]
    if not new_ones:
        return existing
    combined = new_ones + [{k: v for k, v in n.items() if k != "latest"} for n in existing]
    seen_dams = set()
    for n in combined:
        if n["dam"] not in seen_dams:
            n["latest"] = True
            seen_dams.add(n["dam"])
    return combined


def parse_status(text: str) -> dict | None:
    """Off-season banner: 'Attention … <date> … Season Reporting closed. Current Release dd-mm-yyyy.'"""
    if "season reporting closed" not in text.lower():
        return None
    # NB: deliberately no "checkedAt" timestamp — it would change daily and
    # trigger a needless rebuild/deploy. Only real DWS changes (season/asOf/
    # currentRelease) should produce a diff.
    status = {"season": "closed"}
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
        # Flood season: merge newly-scraped notices onto the existing history
        # (the page itself only ever shows the last couple of entries).
        existing = json.loads(NOTICES_OUT.read_text()) if NOTICES_OUT.exists() else []
        combined = merge_notices(existing, notices)
        changed = write_if_changed(NOTICES_OUT, combined)
        write_if_changed(STATUS_OUT, {"season": "open", "latest": combined[0]["date"]})
        print(f"[gate-notices] In-season: {len(notices)} notices on page, "
              f"{len(combined)} total in history "
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
