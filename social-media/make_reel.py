#!/usr/bin/env python3
"""
CastZone monthly highlight reel — WhatsApp delivery edition.

On the first Friday of each month this script:
  1. Fetches the top 5 approved Trophy Room catches (past 30 days, or all-time)
  2. Downloads each catch photo
  3. Uses ffmpeg to build a 9:16 MP4 slideshow with species/weight overlays
  4. Uploads the MP4 to Supabase Storage (public URL — kept, not deleted)
  5. Sends you a WhatsApp message with the ready-to-paste caption + download link
  6. You download the MP4 to your phone and post it as an Instagram Reel + Facebook video.

Requirements (installed by the GitHub Actions workflow):
  ffmpeg  (sudo apt-get install -y ffmpeg)
  pillow  (pip install pillow — not used here but installed by the same step)

Requires these GitHub repo secrets:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  CALLMEBOT_API_KEY       (already set — same as health check)
  NOTIFY_WHATSAPP_NUMBER  (already set — same as health check)
"""

import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_KEY", "")
WA_PHONE     = os.environ.get("NOTIFY_WHATSAPP_NUMBER", "")
WA_APIKEY    = os.environ.get("CALLMEBOT_API_KEY", "")

WORK_DIR = Path("/tmp/castzone_reel")

REEL_W        = 1080
REEL_H        = 1920
CLIP_DURATION = 3.5
FADE_DURATION = 0.35

FONT_BOLD_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def die(msg):
    print(f"::error::{msg}", file=sys.stderr)
    sys.exit(1)


def warn(msg):
    print(f"::warning::{msg}")


def supabase_get(path):
    url     = f"{SUPABASE_URL}/rest/v1/{path}"
    headers = {
        "apikey":        SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        die(f"Supabase {path}: {e.code} {e.read().decode()}")
    except Exception as e:
        die(f"Supabase {path}: {e}")


def upload_to_storage(filepath, bucket, object_path, content_type):
    """Upload file to Supabase Storage public bucket. Returns public URL."""
    url     = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{object_path}"
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type":  content_type,
        "x-upsert":      "true",
    }
    with open(filepath, "rb") as f:
        data = f.read()
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            resp.read()
    except urllib.error.HTTPError as e:
        die(f"Storage upload failed: {e.code} {e.read().decode()}")
    return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{object_path}"


def download_image(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "CastZoneBot/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            with open(dest, "wb") as f:
                f.write(resp.read())
    except Exception as e:
        die(f"Image download failed ({url}): {e}")


def send_whatsapp(message):
    """Send a WhatsApp message via CallMeBot. Non-fatal if it fails."""
    encoded = urllib.parse.quote(message)
    url     = f"https://api.callmebot.com/whatsapp.php?phone={WA_PHONE}&text={encoded}&apikey={WA_APIKEY}"
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            resp.read()
        print("WhatsApp sent.")
    except Exception as e:
        warn(f"WhatsApp send failed (non-fatal): {e}")


# ---------------------------------------------------------------------------
# Video generation
# ---------------------------------------------------------------------------

def _find_font():
    for p in FONT_BOLD_PATHS:
        if os.path.exists(p):
            return p
    return ""


def _drawtext(line1, line2, font_path):
    def esc(s):
        return (str(s).replace("\\", "\\\\")
                      .replace("'",  "\\'")
                      .replace(":",  "\\:")
                      .replace("[",  "\\[")
                      .replace("]",  "\\]"))
    ff  = f":fontfile={font_path}" if font_path else ""
    l1, l2 = esc(line1), esc(line2)
    dt1 = (f"drawtext=text='{l1}'{ff}"
           f":fontsize=84:fontcolor=white"
           f":x=(w-tw)/2:y=h-290"
           f":box=1:boxcolor=black@0.55:boxborderw=18")
    dt2 = (f"drawtext=text='{l2}'{ff}"
           f":fontsize=62:fontcolor=white@0.9"
           f":x=(w-tw)/2:y=h-185"
           f":box=1:boxcolor=black@0.55:boxborderw=14")
    return f"{dt1},{dt2}"


def make_segment(img_path, seg_path, catch, idx, font_path):
    line1 = catch["species"]
    line2 = f"{catch['weight_kg']} kg"
    if catch.get("venue"):
        line2 += f"  -  {catch['venue']}"

    fade_out_start = CLIP_DURATION - FADE_DURATION
    vf = (
        f"scale={REEL_W}:{REEL_H}:force_original_aspect_ratio=increase,"
        f"crop={REEL_W}:{REEL_H},"
        f"{_drawtext(line1, line2, font_path)},"
        f"fade=in:st=0:d={FADE_DURATION},"
        f"fade=out:st={fade_out_start}:d={FADE_DURATION}"
    )
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-t", str(CLIP_DURATION),
        "-i", str(img_path),
        "-vf", vf,
        "-r", "30",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast",
        str(seg_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr[-3000:], file=sys.stderr)
        die(f"ffmpeg failed on segment {idx}")
    print(f"  Segment {idx}: {line1} {line2}")


def concat_segments(seg_paths, out_path):
    inputs     = []
    for p in seg_paths:
        inputs += ["-i", str(p)]
    n          = len(seg_paths)
    filter_str = "".join(f"[{i}:v]" for i in range(n)) + f"concat=n={n}:v=1:a=0[vout]"
    cmd = [
        "ffmpeg", "-y", *inputs,
        "-filter_complex", filter_str,
        "-map", "[vout]",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast",
        str(out_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr[-3000:], file=sys.stderr)
        die("ffmpeg concat failed")
    size_mb = os.path.getsize(out_path) / 1024 / 1024
    print(f"Reel created: {out_path} ({size_mb:.1f} MB, {n} clips)")


def add_silent_audio(in_path, out_path):
    cmd = [
        "ffmpeg", "-y",
        "-i", str(in_path),
        "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
        "-c:v", "copy", "-c:a", "aac", "-shortest",
        str(out_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        warn(f"Silent audio step skipped (non-fatal): {result.stderr[-300:]}")
        return False
    return True


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    for name, val in [
        ("SUPABASE_URL",           SUPABASE_URL),
        ("SUPABASE_SERVICE_KEY",   SERVICE_KEY),
        ("CALLMEBOT_API_KEY",      WA_APIKEY),
        ("NOTIFY_WHATSAPP_NUMBER", WA_PHONE),
    ]:
        if not val:
            die(f"{name} is not set.")

    WORK_DIR.mkdir(parents=True, exist_ok=True)
    font_path = _find_font()

    # Fetch catches — prefer last 30 days, fall back to all-time
    month_ago = (datetime.now(timezone.utc) - timedelta(days=30)).date().isoformat()
    catches   = supabase_get(
        f"catches?approved=eq.true&image_url=not.is.null"
        f"&created_at=gte.{month_ago}T00:00:00Z"
        f"&order=weight_kg.desc&limit=5"
        f"&select=species,weight_kg,venue,image_url,category"
    )
    if len(catches) < 3:
        warn(f"Only {len(catches)} recent catch(es) — using all-time top catches.")
        catches = supabase_get(
            "catches?approved=eq.true&image_url=not.is.null"
            "&order=weight_kg.desc&limit=5"
            "&select=species,weight_kg,venue,image_url,category"
        )
    if not catches:
        warn("No approved catches with photos found. Skipping reel this month.")
        return

    print(f"Building reel from {len(catches)} catch(es)…")

    # Download images + build segments
    seg_paths = []
    for i, catch in enumerate(catches):
        img_path = WORK_DIR / f"catch_{i}.jpg"
        seg_path = WORK_DIR / f"seg_{i}.mp4"
        print(f"Downloading image {i + 1}/{len(catches)}…")
        download_image(catch["image_url"], img_path)
        make_segment(img_path, seg_path, catch, i, font_path)
        seg_paths.append(seg_path)

    # Concat + add audio
    reel_raw   = WORK_DIR / "reel_raw.mp4"
    reel_final = WORK_DIR / "reel.mp4"
    concat_segments(seg_paths, reel_raw)
    if not add_silent_audio(reel_raw, reel_final):
        reel_final = reel_raw

    # Upload to Supabase Storage — kept in storage so you can download it
    ts             = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    storage_object = f"social-reels/reel_{ts}.mp4"
    print(f"Uploading reel ({storage_object})…")
    video_url = upload_to_storage(reel_final, "post-images", storage_object, "video/mp4")
    print(f"  Public URL: {video_url}")

    # Build caption
    top     = catches[0]
    top_txt = f"{top['species']} - {top['weight_kg']} kg"
    if top.get("venue"):
        top_txt += f" @ {top['venue']}"

    caption = (
        f"Monthly Catch Highlights - CastZone Trophy Room\n\n"
        f"Top catch this month: {top_txt}\n\n"
        f"Think you can beat it? Submit your best catch at castzone.co.za "
        f"and claim your spot on the all-time leaderboard.\n\n"
        f"#CastZone #WhereSouthAfricaFishes #TrophyFish #SouthAfricaFishing "
        f"#SAanglers #FishingHighlights #BassLife #CarpFishing #SaltwaterFishing "
        f"#PBFish #AnglingSA"
    )

    # Send WhatsApp
    month_name = datetime.now().strftime("%B %Y")
    wa_msg = (
        f"CastZone - {month_name} Reel ready!\n\n"
        f"--- CAPTION (copy this) ---\n"
        f"{caption}\n"
        f"--- END ---\n\n"
        f"DOWNLOAD MP4:\n"
        f"{video_url}\n\n"
        f"Save the MP4 to your phone, then post as an Instagram Reel + Facebook video.\n"
        f"(You can delete it from Supabase Storage after posting)"
    )
    send_whatsapp(wa_msg)

    print("Monthly reel complete.")


if __name__ == "__main__":
    main()
