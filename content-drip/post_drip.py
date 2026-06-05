#!/usr/bin/env python3
"""
CastZone weekly content drip.

Posts the next item from content-drip/bank.json into Supabase as a forum
thread + its replies, authored by existing seed members. Designed to run in
GitHub Actions (which, unlike a Claude routine, has full outbound internet).

Reads two secrets from the environment:
  SUPABASE_URL          e.g. https://zohgnpogjtjnozyweutg.supabase.co
  SUPABASE_SERVICE_KEY  the service-role key (bypasses RLS so it can post as
                        seed members with back-dated timestamps)

It advances content-drip/state.json; the workflow commits that change back so
the next run posts the following item. When the bank is exhausted it prints a
GitHub warning (so the run stays green) telling Martin to refill it.
"""

import json
import os
import random
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
BANK_PATH = os.path.join(HERE, "bank.json")
STATE_PATH = os.path.join(HERE, "state.json")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def die(msg):
    print(f"::error::{msg}")
    sys.exit(1)


def warn(msg):
    print(f"::warning::{msg}")


def iso(dt):
    return dt.astimezone(timezone.utc).isoformat()


def api(method, path, body=None, prefer=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")
        die(f"Supabase {method} {path} failed: HTTP {e.code} {detail}")
    except Exception as e:  # noqa: BLE001
        die(f"Supabase {method} {path} errored: {e}")


def main():
    if not SUPABASE_URL or not SERVICE_KEY:
        die("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set (GitHub secrets).")

    with open(BANK_PATH, encoding="utf-8") as f:
        bank = json.load(f)
    items = bank.get("items", [])

    with open(STATE_PATH, encoding="utf-8") as f:
        state = json.load(f)
    idx = state.get("next_index", 0)

    if idx >= len(items):
        warn(
            f"Content drip bank exhausted ({len(items)} items all posted). "
            "Ask Claude to refill content-drip/bank.json, then reset "
            "state.json next_index if you want to start fresh. Nothing posted."
        )
        return

    item = items[idx]

    # Resolve category slug -> id and member username -> id.
    cats = api("GET", "categories?select=id,slug")
    cat_by_slug = {c["slug"]: c["id"] for c in cats}
    category_id = cat_by_slug.get(item["category"])
    if category_id is None:
        die(f"Unknown category '{item['category']}' in bank item {idx}.")

    needed = {item["author"]} | {r["author"] for r in item.get("replies", [])}
    in_list = ",".join(f'"{u}"' for u in needed)
    profs = api("GET", f"profiles?select=id,username&username=in.({in_list})")
    id_by_name = {p["username"]: p["id"] for p in profs}
    missing = [u for u in needed if u not in id_by_name]
    if missing:
        die(f"Bank item {idx} references unknown members: {missing}")

    now = datetime.now(timezone.utc)
    # Thread looks like it was started ~1 day ago, replies trickled in up to now.
    thread_started = now - timedelta(hours=random.randint(18, 40))

    thread_row = {
        "category_id": category_id,
        "author_id": id_by_name[item["author"]],
        "title": item["title"],
        "view_count": random.randint(18, 90),
        "created_at": iso(thread_started),
        "last_post_at": iso(thread_started),
    }
    created = api(
        "POST", "threads", body=thread_row, prefer="return=representation"
    )
    thread_id = created[0]["id"]
    print(f"Posted thread [{item['category']}] '{item['title']}' "
          f"by {item['author']} -> {thread_id}")

    # First post == the thread body.
    posts = [{
        "thread_id": thread_id,
        "author_id": id_by_name[item["author"]],
        "content": item["body"],
        "is_first_post": True,
        "created_at": iso(thread_started),
    }]

    # Replies: spread between the thread start and now, in order.
    replies = item.get("replies", [])
    span = (now - thread_started).total_seconds()
    for i, r in enumerate(replies, start=1):
        frac = i / (len(replies) + 1)
        jitter = random.uniform(-0.04, 0.04)
        offset = max(0.02, min(0.98, frac + jitter)) * span
        when = thread_started + timedelta(seconds=offset)
        posts.append({
            "thread_id": thread_id,
            "author_id": id_by_name[r["author"]],
            "content": r["body"],
            "is_first_post": False,
            "created_at": iso(when),
        })

    # Insert posts one at a time so the per-post trigger (reply_count,
    # last_post_at, profile/category post_count) fires correctly for each.
    for p in posts:
        api("POST", "posts", body=p, prefer="return=minimal")
    print(f"Posted first post + {len(replies)} replies.")

    state["next_index"] = idx + 1
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
        f.write("\n")
    print(f"Advanced state -> next_index={idx + 1} of {len(items)}.")


if __name__ == "__main__":
    main()
