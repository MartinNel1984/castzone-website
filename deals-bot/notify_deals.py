#!/usr/bin/env python3
"""
CastZone Specials — approval notifier.

Runs once a day. Emails a rotating slice of members (~1/ROTATION_DAYS of the
list) so the whole membership is never emailed in one burst — sending ~186
recipients at once via a single mailbox is what triggered Zoho's "unusual
sending activity" lock, and there's no reason to keep taking that risk even
after moving to Resend. Each member's turn catches them up on everything
approved since THEIR last email (or their signup date, if never emailed) —
staggering sends never means missing a deal, it only changes when someone
finds out about it. Also sends a WhatsApp run summary to Martin (via
CallMeBot). The on-site 🔔 bell is handled separately by the
notify_new_deal() DB trigger.

Email goes via Resend's HTTP API (batch endpoint, up to 100 recipients per
call). Switched off Zoho SMTP 2026-07-17 after Zoho locked the mailbox for
"unusual sending activity" and silently dropped 6 days of member digests.

Env:
  SUPABASE_URL            (required)
  SUPABASE_SERVICE_KEY    (required — deals RLS now requires a logged-in user,
                           so reads use the service key, same as member emails)
  RESEND_API_KEY          (required for email — no key = skip email)
  MAIL_FROM               (optional, default 'CastZone Deals <deals@castzone.co.za>' —
                           must be on a domain verified in Resend)
  ROTATION_DAYS           (optional, default 10 — each member is emailed on
                           1 day out of every N, deterministic per member id)
  CALLMEBOT_API_KEY       (optional)
  NOTIFY_WHATSAPP_NUMBER  (optional)
  WHATSAPP_GROUP_URL      (optional — adds a "Join the WhatsApp group" CTA to the
                           email footer; same invite link used on-site, see
                           NEXT_PUBLIC_WHATSAPP_GROUP_URL in the main site build)
  UNSUBSCRIBE_SECRET      (required for a working per-member unsubscribe link —
                           must match the secret in src/db/deal-unsubscribe.sql's
                           unsubscribe_deal_email() function, run once in Supabase)
  STATE_FILE              (marker path; default .github/deal-notify-state.txt —
                           now only used for the WhatsApp "N new deals found"
                           run summary, not for gating member emails)
  DEALS_IN_EMAIL          (optional, default 8 — how many to show in the email)
"""

import hashlib
import hmac
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from email.utils import formataddr, parseaddr
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from whatsapp_rotation import today_topic  # noqa: E402

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
MAIL_FROM = os.environ.get("MAIL_FROM") or "CastZone Deals <deals@castzone.co.za>"
CALLMEBOT_API_KEY = os.environ.get("CALLMEBOT_API_KEY", "")
WHATSAPP_NUMBER = os.environ.get("NOTIFY_WHATSAPP_NUMBER", "")
WHATSAPP_GROUP_URL = os.environ.get("WHATSAPP_GROUP_URL", "")
UNSUBSCRIBE_SECRET = os.environ.get("UNSUBSCRIBE_SECRET", "")
STATE_FILE = os.environ.get("STATE_FILE", ".github/deal-notify-state.txt")
DEALS_IN_EMAIL = int(os.environ.get("DEALS_IN_EMAIL", "8"))
ROTATION_DAYS = int(os.environ.get("ROTATION_DAYS", "10"))

SITE = "https://castzone.co.za"
_CTX = ssl.create_default_context()


def http(url, method="GET", headers=None, data=None, timeout=30):
    req = urllib.request.Request(url, method=method, headers=headers or {},
                                 data=json.dumps(data).encode() if data is not None else None)
    with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as resp:
        return resp.status, resp.read().decode("utf-8", "replace")


def fmt_price(n):
    if n is None:
        return None
    return "R" + f"{round(n):,}".replace(",", " ")


def get_new_approved(since_iso):
    q = urllib.parse.urlencode({
        "select": "title,retailer,category,original_price,sale_price,discount_pct,url,image_url,approved_at",
        "status": "eq.approved",
        "approved_at": f"gt.{since_iso}",
        "order": "discount_pct.desc",
    })
    _, body = http(f"{SUPABASE_URL}/rest/v1/deals?{q}",
                   headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"})
    return json.loads(body)


def get_recent_approved(limit=20):
    """Most-recent approved deals regardless of marker — used for test sends."""
    q = urllib.parse.urlencode({
        "select": "title,retailer,category,original_price,sale_price,discount_pct,url,image_url,approved_at",
        "status": "eq.approved",
        "order": "approved_at.desc",
        "limit": limit,
    })
    _, body = http(f"{SUPABASE_URL}/rest/v1/deals?{q}",
                   headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"})
    return json.loads(body)


def get_members():
    """All confirmed members (id, email, created_at) via the admin API, minus opt-outs."""
    members = []
    page = 1
    while page <= 50:
        _, body = http(
            f"{SUPABASE_URL}/auth/v1/admin/users?page={page}&per_page=200",
            headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"})
        data = json.loads(body)
        users = data.get("users", data if isinstance(data, list) else [])
        if not users:
            break
        for u in users:
            if u.get("email"):
                members.append((u["id"], u["email"], u.get("created_at")))
        if len(users) < 200:
            break
        page += 1

    opt_out = set()
    try:  # tolerate the column not existing yet
        q = urllib.parse.urlencode({"select": "id", "email_opt_out": "eq.true"})
        _, body = http(f"{SUPABASE_URL}/rest/v1/profiles?{q}",
                       headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"})
        opt_out = {r["id"] for r in json.loads(body)}
    except Exception:
        pass
    return [m for m in members if m[0] not in opt_out]


def rotation_bucket(user_id, n):
    """Deterministic 0..n-1 bucket for a member — stable across runs, no state needed."""
    return int(hashlib.md5(user_id.encode()).hexdigest(), 16) % n


def get_last_sent_map(uids):
    """profiles.last_deal_email_sent_at for a set of member ids, as {uid: iso_str_or_None}."""
    if not uids:
        return {}
    ids = ",".join(uids)
    q = urllib.parse.urlencode({"select": "id,last_deal_email_sent_at", "id": f"in.({ids})"})
    _, body = http(f"{SUPABASE_URL}/rest/v1/profiles?{q}",
                   headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"})
    return {r["id"]: r.get("last_deal_email_sent_at") for r in json.loads(body)}


def mark_emailed(uid, when_iso):
    http(f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{uid}",
         method="PATCH",
         headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
                  "Content-Type": "application/json", "Prefer": "return=minimal"},
         data={"last_deal_email_sent_at": when_iso})


def unsubscribe_link(user_id):
    if not (UNSUBSCRIBE_SECRET and user_id):
        return None
    sig = hmac.new(UNSUBSCRIBE_SECRET.encode(), user_id.encode(), hashlib.sha256).hexdigest()[:32]
    return f"{SITE}/unsubscribe?u={user_id}&t={sig}"


def build_email_html(deals, total_new, unsub_url):
    rows = []
    for d in deals[:DEALS_IN_EMAIL]:
        was = fmt_price(d.get("original_price"))
        now = fmt_price(d.get("sale_price"))
        pct = d.get("discount_pct")
        img = d.get("image_url") or ""
        price_line = (f'<span style="color:#8a9a9a;text-decoration:line-through;margin-right:8px">{was}</span>'
                      if was else "") + f'<span style="color:#f26522;font-weight:700;font-size:18px">{now}</span>'
        rows.append(f"""
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #22403f;vertical-align:top;width:88px">
          <a href="{d['url']}"><img src="{img}" width="72" height="72" style="border-radius:6px;object-fit:contain;background:#0f2423" alt=""></a>
        </td>
        <td style="padding:12px 0 12px 12px;border-bottom:1px solid #22403f;vertical-align:top">
          <div style="color:#8a9a9a;font-size:11px;text-transform:uppercase;letter-spacing:.05em">{d.get('retailer','')}</div>
          <a href="{d['url']}" style="color:#f9f7f4;font-weight:600;text-decoration:none;font-size:15px;line-height:1.3">{d.get('title','')}</a>
          <div style="margin-top:6px">{price_line}
            <span style="background:#f26522;color:#fff;font-size:12px;font-weight:700;padding:2px 7px;border-radius:20px;margin-left:6px">-{pct}%</span>
          </div>
        </td>
      </tr>""")
    more = ""
    if total_new > DEALS_IN_EMAIL:
        more = f'<p style="color:#8a9a9a;font-size:14px;text-align:center">…and {total_new - DEALS_IN_EMAIL} more on the site.</p>'
    whatsapp_cta = ""
    if WHATSAPP_GROUP_URL:
        whatsapp_cta = f"""
    <div style="background:#153029;border-radius:10px;padding:16px 20px;text-align:center;margin:0 0 22px">
      <p style="color:#f9f7f4;font-size:14px;font-weight:600;margin:0 0 10px">📲 Want deals the moment they drop?</p>
      <a href="{WHATSAPP_GROUP_URL}" style="background:#25D366;color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 18px;border-radius:8px;display:inline-block">Join the WhatsApp group →</a>
    </div>"""
    return f"""<!doctype html><html><body style="margin:0;background:#0f2423;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px 20px">
    <div style="text-align:center;padding:8px 0 20px">
      <span style="color:#f26522;font-size:30px;font-weight:800">C</span><span style="color:#f9f7f4;font-size:22px;font-weight:800;letter-spacing:3px">ASTZONE</span>
    </div>
    <h1 style="color:#f9f7f4;font-size:22px;text-align:center;margin:0 0 4px">🔥 New Specials just landed</h1>
    <p style="color:#a9bcbb;font-size:15px;text-align:center;margin:0 0 20px">Hand-picked SA fishing &amp; camping deals, all 40%+ off.</p>
    <table style="width:100%;border-collapse:collapse">{''.join(rows)}</table>
    {more}
    <div style="text-align:center;margin:26px 0">
      <a href="{SITE}/specials" style="background:#f26522;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:8px;display:inline-block">See all specials →</a>
    </div>
    {whatsapp_cta}
    <p style="color:#6a7a79;font-size:12px;text-align:center;line-height:1.6;margin-top:24px">
      You're getting this because you're a CastZone member. Prices &amp; stock are set by the retailer and may change.<br>
      Don't want deal emails? <a href="{unsub_url or 'mailto:unsubscribe@castzone.co.za?subject=unsubscribe'}" style="color:#8a9a9a">Unsubscribe</a> — your CastZone account stays active either way.
    </p>
  </div></body></html>"""


def send_email(items):
    """items: list of {"uid", "email", "deals", "total_new"} — uid may be None (test mode).
    Returns the list of uids whose batch sent successfully, so callers can advance
    their last_deal_email_sent_at watermark (failed batches keep their old watermark
    so they're retried whole, next time this member is due)."""
    if not RESEND_API_KEY:
        print("No RESEND_API_KEY — skipping email.")
        return []
    if not items:
        print("No recipients — skipping email.")
        return []
    text_footer = f"New fishing & camping specials are live: {SITE}/specials"
    from_name, from_addr = parseaddr(MAIL_FROM)
    from_header = formataddr((from_name or "CastZone Deals", from_addr))

    sent = 0
    sent_uids = []
    failed = []
    for i in range(0, len(items), 100):
        batch = items[i:i + 100]
        payload = []
        for item in batch:
            unsub_url = unsubscribe_link(item["uid"])
            headers = {"List-Unsubscribe-Post": "List-Unsubscribe=One-Click"} if unsub_url else {}
            headers["List-Unsubscribe"] = f"<{unsub_url}>" if unsub_url else "<mailto:unsubscribe@castzone.co.za?subject=unsubscribe>"
            payload.append({
                "from": from_header,
                "to": [item["email"]],
                "subject": f"🔥 {item['total_new']} new fishing & camping specials on CastZone",
                "html": build_email_html(item["deals"], item["total_new"], unsub_url),
                "text": text_footer,
                "headers": headers,
            })
        try:
            _, body = http(
                "https://api.resend.com/emails/batch",
                method="POST",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                data=payload,
            )
            result = json.loads(body)
            sent += len(result.get("data", []))
            sent_uids.extend(item["uid"] for item in batch if item["uid"])
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", "replace")
            print(f"  batch of {len(batch)} failed: {e.code} {err_body}")
            failed.extend(batch)
        except Exception as e:  # noqa: BLE001 — one bad batch shouldn't stop the rest
            print(f"  batch of {len(batch)} failed: {e}")
            failed.extend(batch)
        time.sleep(0.6)  # stay under Resend's default 2 req/sec rate limit
    print(f"Emailed {sent}/{len(items)} members via Resend.")
    if failed:
        print(f"  {len(failed)} recipients undelivered (see errors above).")
    return sent_uids


def send_whatsapp(msg):
    if not (CALLMEBOT_API_KEY and WHATSAPP_NUMBER):
        print("No CallMeBot config — skipping WhatsApp.")
        return
    url = (f"https://api.callmebot.com/whatsapp.php?phone={WHATSAPP_NUMBER}"
           f"&text={urllib.parse.quote(msg)}&apikey={CALLMEBOT_API_KEY}")
    try:
        http(url)
        print("WhatsApp sent.")
    except Exception as e:  # noqa: BLE001
        print(f"WhatsApp FAILED: {e}")


def main():
    if not SUPABASE_URL or not SERVICE_KEY:
        sys.exit("ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY required.")

    # TEST MODE: send only to one address, using recent approved deals,
    # without touching the marker, rotation watermark, or emailing members.
    test_to = os.environ.get("TEST_RECIPIENT", "").strip()
    if test_to:
        deals = get_recent_approved()
        print(f"TEST MODE → sending to {test_to} only; {len(deals)} recent approved deals")
        if not deals:
            print("No approved deals yet — approve one on /specials/review first.")
            return
        send_email([{"uid": None, "email": test_to, "deals": deals, "total_new": len(deals)}])
        print("Test send done. Marker NOT advanced, members NOT emailed.")
        return

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # --- Rotation: email today's slice of members, catching each one up on
    # everything approved since their own last email (or signup, if never
    # emailed before). Nobody is ever skipped — this only staggers *when*
    # each member hears about a deal, spread across ROTATION_DAYS.
    members = get_members()
    day_index = datetime.now(timezone.utc).toordinal() % ROTATION_DAYS
    cohort = [m for m in members if rotation_bucket(m[0], ROTATION_DAYS) == day_index]
    print(f"Rotation day {day_index + 1}/{ROTATION_DAYS}: {len(cohort)}/{len(members)} members due today")

    emailed = 0
    if cohort:
        last_sent = get_last_sent_map([m[0] for m in cohort])
        items = []
        for uid, email, created_at in cohort:
            since = last_sent.get(uid) or created_at
            deals = get_new_approved(since) if since else []
            if deals:
                items.append({"uid": uid, "email": email, "deals": deals, "total_new": len(deals)})
        print(f"  {len(items)}/{len(cohort)} have new deals to send")
        if items:
            sent_uids = set(send_email(items))
            for item in items:
                if item["uid"] in sent_uids:
                    latest = max(d["approved_at"] for d in item["deals"])
                    mark_emailed(item["uid"], latest)
            emailed = len(sent_uids)

    # --- WhatsApp run summary to Martin: global "N new deals approved" count,
    # independent of the rotation above (kept simple — one marker, one number).
    if not os.path.exists(STATE_FILE):
        os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
        with open(STATE_FILE, "w") as f:
            f.write(now_iso)
        print(f"Initialised marker to {now_iso} — no WhatsApp summary on first run.")
        return

    since = open(STATE_FILE).read().strip()
    new_deals = get_new_approved(since)
    print(f"Approved since {since}: {len(new_deals)}")
    if new_deals:
        # Group teaser only goes out on the WhatsApp rotation's "specials" day
        # (see scripts/whatsapp_rotation.py — angler safety / bite times take
        # the other days). The marker still advances every day regardless, so
        # a specials day always catches up on everything approved since the
        # last one, nothing is skipped.
        if today_topic() == "specials":
            top = new_deals[0]
            msg = (f"🔥 CastZone: {len(new_deals)} new special{'s' if len(new_deals) != 1 else ''} went live. "
                   f"Top: {top['title'][:60]} (-{top['discount_pct']}% at {top['retailer']}). "
                   f"Today's email rotation: {emailed}/{len(cohort)} sent. {SITE}/specials")
            send_whatsapp(msg)
        else:
            print(f"  Not a specials day ({today_topic()}) — WhatsApp teaser skipped, marker still advances.")
        latest = max(d["approved_at"] for d in new_deals)
        with open(STATE_FILE, "w") as f:
            f.write(latest)
        print(f"Marker advanced to {latest}")
    else:
        print("Nothing new to report.")


if __name__ == "__main__":
    main()
