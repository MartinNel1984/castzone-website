#!/usr/bin/env python3
"""
CastZone Specials — approval notifier.

Runs once a day. Emails a rotating slice of members (~1/ROTATION_DAYS of the
list) so the whole membership is never emailed in one burst — sending ~186
recipients at once via a single mailbox is what triggered Zoho's "unusual
sending activity" lock on 2026-07-11, -20 and -22. Each member's turn catches
them up on everything approved since THEIR last email (or their signup date,
if never emailed) — staggering sends never means missing a deal, it only
changes when someone finds out about it. Also sends a WhatsApp run summary to
Martin (via CallMeBot). The on-site 🔔 bell is handled separately by the
notify_new_deal() DB trigger.

Email goes over plain SMTP so it works with any free provider (Brevo, Mailjet,
MailerSend, Zoho, …) — just set the four SMTP_* secrets. No vendor lock-in.

Env:
  SUPABASE_URL            (required)
  SUPABASE_SERVICE_KEY    (required — deals RLS now requires a logged-in user,
                           so reads use the service key, same as member emails)
  SMTP_HOST               (e.g. smtp-relay.brevo.com — no host = skip email)
  SMTP_PORT               (optional, default 587 = STARTTLS; 465 = SSL)
  SMTP_USER               (SMTP login)
  SMTP_PASS               (SMTP key / password)
  MAIL_FROM               (optional, default 'CastZone Deals <deals@castzone.co.za>')
  ROTATION_DAYS           (optional, default 10 — each member is emailed on
                           1 day out of every N, deterministic per member id)
  CALLMEBOT_API_KEY       (optional)
  NOTIFY_WHATSAPP_NUMBER  (optional)
  STATE_FILE              (marker path; default .github/deal-notify-state.txt —
                           now only used for the WhatsApp "N new deals found"
                           run summary, not for gating member emails)
  DEALS_IN_EMAIL          (optional, default 8 — how many to show in the email)
"""

import hashlib
import json
import os
import smtplib
import ssl
import sys
import time
import urllib.parse
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, parseaddr
from datetime import datetime, timezone

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
MAIL_FROM = os.environ.get("MAIL_FROM") or "CastZone Deals <deals@castzone.co.za>"
CALLMEBOT_API_KEY = os.environ.get("CALLMEBOT_API_KEY", "")
WHATSAPP_NUMBER = os.environ.get("NOTIFY_WHATSAPP_NUMBER", "")
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


def build_email_html(deals, total_new):
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
    <p style="color:#6a7a79;font-size:12px;text-align:center;line-height:1.6;margin-top:24px">
      You're getting this because you're a CastZone member. Prices &amp; stock are set by the retailer and may change.<br>
      Don't want deal emails? <a href="mailto:unsubscribe@castzone.co.za?subject=unsubscribe" style="color:#8a9a9a">Unsubscribe</a>.
    </p>
  </div></body></html>"""


def send_email(items):
    """items: list of {"uid", "email", "deals", "total_new"} — uid may be None (test mode).
    Returns the list of uids that sent successfully, so callers can advance
    their last_deal_email_sent_at watermark (failed sends keep their old
    watermark so they're retried whole, next time this member is due)."""
    if not (SMTP_HOST and SMTP_USER and SMTP_PASS):
        print("No SMTP config — skipping email.")
        return []
    if not items:
        print("No recipients — skipping email.")
        return []
    from_name, from_addr = parseaddr(MAIL_FROM)
    unsub = "<mailto:unsubscribe@castzone.co.za?subject=unsubscribe>"

    ctx = ssl.create_default_context()
    if SMTP_PORT == 465:
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=30, context=ctx)
    else:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
        server.starttls(context=ctx)
    server.login(SMTP_USER, SMTP_PASS)

    sent = 0
    sent_uids = []
    try:
        for item in items:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"🔥 {item['total_new']} new fishing & camping specials on CastZone"
            msg["From"] = formataddr((from_name or "CastZone Deals", from_addr))
            msg["To"] = item["email"]
            msg["List-Unsubscribe"] = unsub
            msg.attach(MIMEText("New fishing & camping specials are live: "
                                f"{SITE}/specials", "plain"))
            msg.attach(MIMEText(build_email_html(item["deals"], item["total_new"]), "html"))
            try:
                server.sendmail(from_addr, [item["email"]], msg.as_string())
                sent += 1
                if item["uid"]:
                    sent_uids.append(item["uid"])
            except Exception as e:  # noqa: BLE001 — one bad address shouldn't stop the rest
                print(f"  send to {item['email']} failed: {e}")
            time.sleep(0.15)  # gentle pacing for free-tier rate limits
    finally:
        server.quit()
    print(f"Emailed {sent}/{len(items)} members via {SMTP_HOST}.")
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
        top = new_deals[0]
        msg = (f"🔥 CastZone: {len(new_deals)} new special{'s' if len(new_deals) != 1 else ''} went live. "
               f"Top: {top['title'][:60]} (-{top['discount_pct']}% at {top['retailer']}). "
               f"Today's email rotation: {emailed}/{len(cohort)} sent. {SITE}/specials")
        send_whatsapp(msg)
        latest = max(d["approved_at"] for d in new_deals)
        with open(STATE_FILE, "w") as f:
            f.write(latest)
        print(f"Marker advanced to {latest}")
    else:
        print("Nothing new to report.")


if __name__ == "__main__":
    main()
