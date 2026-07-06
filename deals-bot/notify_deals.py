#!/usr/bin/env python3
"""
CastZone Specials — approval notifier.

Runs a few times a day. Finds deals APPROVED since the last run (marker file)
and, if there are any, sends:
  * an email digest to members (via Resend) — only if RESEND_API_KEY is set
  * a WhatsApp summary to Martin (via CallMeBot)

The on-site 🔔 bell is already handled by the notify_new_deal() DB trigger, so
this only adds email + WhatsApp.

Env:
  SUPABASE_URL            (required)
  SUPABASE_ANON_KEY       (required — approved deals are anon-readable)
  SUPABASE_SERVICE_KEY    (needed for member emails via the admin API)
  RESEND_API_KEY          (optional — no key = skip email, still WhatsApps)
  MAIL_FROM               (optional, default 'CastZone Deals <deals@castzone.co.za>')
  CALLMEBOT_API_KEY       (optional)
  NOTIFY_WHATSAPP_NUMBER  (optional)
  STATE_FILE              (marker path; default .github/deal-notify-state.txt)
  DEALS_IN_EMAIL          (optional, default 8 — how many to show in the email)
"""

import json
import os
import ssl
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
MAIL_FROM = os.environ.get("MAIL_FROM", "CastZone Deals <deals@castzone.co.za>")
CALLMEBOT_API_KEY = os.environ.get("CALLMEBOT_API_KEY", "")
WHATSAPP_NUMBER = os.environ.get("NOTIFY_WHATSAPP_NUMBER", "")
STATE_FILE = os.environ.get("STATE_FILE", ".github/deal-notify-state.txt")
DEALS_IN_EMAIL = int(os.environ.get("DEALS_IN_EMAIL", "8"))

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
                   headers={"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"})
    return json.loads(body)


def get_member_emails():
    """All confirmed member emails via the admin API, minus opt-outs."""
    emails = []
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
                emails.append((u["id"], u["email"]))
        if len(users) < 200:
            break
        page += 1

    opt_out = set()
    try:  # tolerate the column not existing yet
        q = urllib.parse.urlencode({"select": "id", "email_opt_out": "eq.true"})
        _, body = http(f"{SUPABASE_URL}/rest/v1/profiles?{q}",
                       headers={"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"})
        opt_out = {r["id"] for r in json.loads(body)}
    except Exception:
        pass
    return [e for (uid, e) in emails if uid not in opt_out]


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


def send_email(recipients, deals, total_new):
    if not RESEND_API_KEY:
        print("No RESEND_API_KEY — skipping email.")
        return
    if not recipients:
        print("No recipients — skipping email.")
        return
    html = build_email_html(deals, total_new)
    subject = f"🔥 {total_new} new fishing & camping specials on CastZone"
    # Resend batch: one personalised email per member (no shared To: leakage), max 100/call.
    headers = {"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"}
    unsub = "<mailto:unsubscribe@castzone.co.za?subject=unsubscribe>"
    sent = 0
    for i in range(0, len(recipients), 100):
        chunk = recipients[i:i + 100]
        batch = [{
            "from": MAIL_FROM, "to": [addr], "subject": subject, "html": html,
            "headers": {"List-Unsubscribe": unsub},
        } for addr in chunk]
        try:
            status, body = http("https://api.resend.com/emails/batch", method="POST",
                                 headers=headers, data=batch, timeout=60)
            print(f"  Resend batch {i//100+1}: HTTP {status}")
            sent += len(chunk)
        except Exception as e:  # noqa: BLE001
            print(f"  Resend batch {i//100+1} FAILED: {e}")
    print(f"Emailed ~{sent} members.")


def send_whatsapp(total_new, top):
    if not (CALLMEBOT_API_KEY and WHATSAPP_NUMBER):
        print("No CallMeBot config — skipping WhatsApp.")
        return
    msg = (f"🔥 CastZone: {total_new} new special{'s' if total_new != 1 else ''} went live. "
           f"Top: {top['title'][:60]} (-{top['discount_pct']}% at {top['retailer']}). {SITE}/specials")
    url = (f"https://api.callmebot.com/whatsapp.php?phone={WHATSAPP_NUMBER}"
           f"&text={urllib.parse.quote(msg)}&apikey={CALLMEBOT_API_KEY}")
    try:
        http(url)
        print("WhatsApp sent.")
    except Exception as e:  # noqa: BLE001
        print(f"WhatsApp FAILED: {e}")


def main():
    if not SUPABASE_URL or not ANON_KEY:
        sys.exit("ERROR: SUPABASE_URL and SUPABASE_ANON_KEY required.")

    if not os.path.exists(STATE_FILE):
        os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        with open(STATE_FILE, "w") as f:
            f.write(now)
        print(f"Initialised marker to {now} — no notification on first run.")
        return

    since = open(STATE_FILE).read().strip()
    deals = get_new_approved(since)
    print(f"Approved since {since}: {len(deals)}")
    if not deals:
        print("Nothing new to notify.")
        return

    total_new = len(deals)
    recipients = get_member_emails() if SERVICE_KEY else []
    print(f"Recipients: {len(recipients)}")
    send_email(recipients, deals, total_new)
    send_whatsapp(total_new, deals[0])

    latest = max(d["approved_at"] for d in deals)
    with open(STATE_FILE, "w") as f:
        f.write(latest)
    print(f"Marker advanced to {latest}")


if __name__ == "__main__":
    main()
