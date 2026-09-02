#!/usr/bin/env python3
"""
CastZone WhatsApp group teaser — Angler Safety / Bite Times days.

Part of the same daily rotation as deals-bot/notify_deals.py's specials
teaser (see scripts/whatsapp_rotation.py for the weekday → topic map). Runs
every day; no-ops quietly on a "specials" day since that topic is sent from
notify_deals.py instead (it needs the Supabase deals data notify_deals.py
already fetches).

Angler Safety and Bite Times numbers come from `npx tsx scripts/*.ts`, which
import the site's own src/lib and src/data code directly — so the WhatsApp
text can never drift from what /conditions and /bite-times show.

Env:
  CALLMEBOT_API_KEY       (required — no key = skip WhatsApp)
  NOTIFY_WHATSAPP_NUMBER  (required — Martin's number; he pastes into the group)

Usage:
  python3 scripts/whatsapp_topics.py            # send today's topic (if not "specials")
  python3 scripts/whatsapp_topics.py --topic=bite   # force a topic, for testing
"""

import json
import os
import subprocess
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
from whatsapp_rotation import today_topic  # noqa: E402

REPO_ROOT = os.path.join(os.path.dirname(__file__), "..")
SITE = "https://castzone.co.za"

CALLMEBOT_API_KEY = os.environ.get("CALLMEBOT_API_KEY", "")
WHATSAPP_NUMBER = os.environ.get("NOTIFY_WHATSAPP_NUMBER", "")


def run_tsx(script_name: str) -> dict:
    out = subprocess.run(
        ["npx", "tsx", f"scripts/{script_name}"],
        cwd=REPO_ROOT, capture_output=True, text=True, timeout=60, check=True,
    )
    return json.loads(out.stdout.strip().splitlines()[-1])


def send_whatsapp(msg: str):
    if not (CALLMEBOT_API_KEY and WHATSAPP_NUMBER):
        print("No CallMeBot config — skipping WhatsApp.")
        return
    url = (f"https://api.callmebot.com/whatsapp.php?phone={WHATSAPP_NUMBER}"
           f"&text={urllib.parse.quote(msg)}&apikey={CALLMEBOT_API_KEY}")
    try:
        urllib.request.urlopen(url, timeout=30)
        print("WhatsApp sent.")
    except Exception as e:  # noqa: BLE001
        print(f"WhatsApp FAILED: {e}")


def build_safety_message() -> str | None:
    d = run_tsx("angler_safety_summary.ts")
    if d["season"] == "closed":
        gate_line = f"DWS flood-season reporting closed since {d['vaalNotice']['date'] if d['vaalNotice'] else 'winter'} (low/valve flow, no gate changes expected)."
    else:
        parts = []
        if d.get("vaalNotice"):
            parts.append(f"Vaal Dam: {d['vaalNotice']['text']}")
        if d.get("bloemhofNotice"):
            parts.append(f"Bloemhof: {d['bloemhofNotice']['text']}")
        gate_line = " ".join(parts) if parts else "No recent gate notices."
    caution = ""
    if d["level"] == "danger":
        caution = " ⚠️ High-volume release — avoid all Vaal River banks."
    elif d["level"] == "caution":
        caution = " ⚠️ Release in progress — stronger current than normal downstream of Parys."
    return (
        f"🌊 CastZone Angler Safety — Vaal River (dam levels as of {d['dataUpdated']}): "
        f"Vaal Dam {d['vaalPct']}%, Bloemhof {d['bloemhofPct']}%, Gariep {d['gariepPct']}%. "
        f"{gate_line}{caution} Full dam levels: {SITE}/conditions"
    )


def build_bite_message() -> str:
    d = run_tsx("bite_score.ts")
    next_major = f" Next prime window {d['nextMajor']}." if d.get("nextMajor") else ""
    pressure = f" {d['pressureSummary']}." if d.get("pressureSummary") else ""
    return (
        f"🎣 CastZone Bite Forecast — Gauteng: {d['score']}% ({d['rating']}), {d['moon']}.{next_major}{pressure} "
        f"Check your spot: {SITE}/bite-times"
    )


def main():
    forced = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--topic=")), None)
    topic = forced or today_topic()

    if topic == "specials":
        print("Today's topic is specials — sent from deals-bot/notify_deals.py, nothing to do here.")
        return
    if topic == "safety":
        msg = build_safety_message()
    elif topic == "bite":
        msg = build_bite_message()
    else:
        sys.exit(f"Unknown topic: {topic}")

    print(msg)
    send_whatsapp(msg)


if __name__ == "__main__":
    main()
