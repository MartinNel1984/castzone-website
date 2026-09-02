"""
Shared weekday → topic map for the CastZone WhatsApp group teaser.

One topic per day so the group doesn't get every message every day — see
deals-bot/notify_deals.py (specials) and scripts/whatsapp_topics.py (angler
safety / bite times). All three read this same map so the schedule only
lives in one place.
"""

from datetime import datetime, timezone, timedelta

SAST = timezone(timedelta(hours=2))

# Monday=0 .. Sunday=6
TOPIC_FOR_WEEKDAY = {
    0: "specials",  # Mon
    1: "safety",    # Tue
    2: "bite",      # Wed
    3: "specials",  # Thu
    4: "safety",    # Fri
    5: "bite",      # Sat
    6: "specials",  # Sun
}


def today_topic() -> str:
    return TOPIC_FOR_WEEKDAY[datetime.now(SAST).weekday()]
