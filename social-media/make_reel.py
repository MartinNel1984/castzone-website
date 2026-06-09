#!/usr/bin/env python3
"""
CastZone monthly highlight reel.

Fetches the top 5 approved Trophy Room catches from the past 30 days (falls
back to all-time top catches if fewer than 3 exist this month), builds a
9:16 MP4 slideshow with ffmpeg, uploads it to Supabase Storage so Instagram
can fetch it, then publishes as an Instagram Reel + a Facebook video post.

Requirements (installed by the GitHub Actions workflow):
  ffmpeg     — video encoding (sudo apt-get install -y ffmpeg)
  Pillow     — optional, not used here (ffmpeg handles all graphics)

Requires these GitHub repo secrets:
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  FB_PAGE_ACCESS_TOKEN
  FB_PAGE_ID
  IG_USER_ID             (leave blank to skip IG — will still post to Facebook)
"""

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_KEY", "")
PAGE_TOKEN   = os.environ.get("FB_PAGE_ACCESS_TOKEN", "")
PAGE_ID      = os.environ.get("FB_PAGE_ID", "")
IG_USER_ID   = os.environ.get("IG_USER_ID", "")

GRAPH_BASE = "https://graph.facebook.com/v21.0"
WORK_DIR   = Path("/tmp/castzone_reel")

REEL_W = 1080
REEL_H = 1920
CLIP_DURATION    = 3.5   # seconds each catch is shown
FADE_DURATION    = 0.35  # in/out fade per clip

# Font paths tried in order (first one found is used)
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
        die(f"Supabase GET {path}: {e.code} {e.read().decode()}")
    except Exception as e:
        die(f"Supabase GET {path}: {e}")


def graph_post(path, params):
    params["access_token"] = PAGE_TOKEN
    data = urllib.parse.urlencode(params).encode()
    req  = urllib.request.Request(f"{GRAPH_BASE}/{path}", data=data, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        die(f"Graph POST {path}: {e.code} {e.read().decode()}")
    except Exception as e:
        die(f"Graph POST {path}: {e}")


def graph_get(path, params=None):
    p  = dict(params or {})
    p["access_token"] = PAGE_TOKEN
    qs = urllib.parse.urlencode(p)
    req = urllib.request.Request(f"{GRAPH_BASE}/{path}?{qs}")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        die(f"Graph GET {path}: {e.code} {e.read().decode()}")
    except Exception as e:
        die(f"Graph GET {path}: {e}")


def download_image(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "CastZoneSocialBot/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            with open(dest, "wb") as f:
                f.write(resp.read())
    except Exception as e:
        die(f"Image download failed ({url}): {e}")


def upload_to_storage(filepath, bucket, object_path, content_type):
    """Upload a file to Supabase Storage, return its public URL."""
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


def delete_from_storage(bucket, object_path):
    """Best-effort delete of a storage object (keeps storage tidy)."""
    url     = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{object_path}"
    headers = {"Authorization": f"Bearer {SERVICE_KEY}"}
    req     = urllib.request.Request(url, headers=headers, method="DELETE")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp.read()
        print(f"  Cleaned up storage: {object_path}")
    except Exception as e:
        warn(f"Storage cleanup failed (non-fatal): {e}")


# ---------------------------------------------------------------------------
# Video segment generation
# ---------------------------------------------------------------------------

def _find_font():
    for p in FONT_BOLD_PATHS:
        if os.path.exists(p):
            return p
    return ""


def _drawtext_filter(line1, line2, font_path):
    """Return an ffmpeg drawtext filter string for two text lines at the bottom."""
    def esc(s):
        # Escape characters special to ffmpeg filter strings
        return (s.replace("\\", "\\\\")
                  .replace("'",  "\\'")
                  .replace(":",  "\\:")
                  .replace("[",  "\\[")
                  .replace("]",  "\\]"))

    font_opt = f":fontfile={font_path}" if font_path else ""
    l1, l2   = esc(str(line1)), esc(str(line2))

    dt1 = (
        f"drawtext=text='{l1}'{font_opt}"
        f":fontsize=84:fontcolor=white"
        f":x=(w-tw)/2:y=h-290"
        f":box=1:boxcolor=black@0.55:boxborderw=18"
    )
    dt2 = (
        f"drawtext=text='{l2}'{font_opt}"
        f":fontsize=62:fontcolor=white@0.9"
        f":x=(w-tw)/2:y=h-185"
        f":box=1:boxcolor=black@0.55:boxborderw=14"
    )
    return f"{dt1},{dt2}"


def make_segment(img_path, seg_path, catch, idx, font_path):
    """Build one 1080x1920 video segment for a single catch."""
    line1 = catch["species"]
    line2 = f"{catch['weight_kg']} kg"
    if catch.get("venue"):
        line2 += f"  •  {catch['venue']}"

    fade_out_start = CLIP_DURATION - FADE_DURATION
    drawtext       = _drawtext_filter(line1, line2, font_path)

    vf = (
        f"scale={REEL_W}:{REEL_H}:force_original_aspect_ratio=increase,"
        f"crop={REEL_W}:{REEL_H},"
        f"{drawtext},"
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
        die(f"ffmpeg failed on segment {idx} ({line1})")
    print(f"  Segment {idx}: {line1} {line2}")


def concat_segments(seg_paths, out_path):
    """Concatenate all segments into one MP4."""
    inputs    = []
    for p in seg_paths:
        inputs += ["-i", str(p)]
    n          = len(seg_paths)
    filter_str = "".join(f"[{i}:v]" for i in range(n)) + f"concat=n={n}:v=1:a=0[vout]"

    cmd = [
        "ffmpeg", "-y",
        *inputs,
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
    """Add a silent AAC track so the file passes Instagram's codec check."""
    cmd = [
        "ffmpeg", "-y",
        "-i", str(in_path),
        "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
        "-c:v", "copy", "-c:a", "aac", "-shortest",
        str(out_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        warn(f"Silent audio step failed (non-fatal) — continuing with video-only: {result.stderr[-500:]}")
        return False
    return True


# ---------------------------------------------------------------------------
# Instagram helpers
# ---------------------------------------------------------------------------

def ig_wait_for_container(container_id, max_wait=300):
    """Poll IG container status every 15 s until FINISHED or timeout."""
    deadline = time.time() + max_wait
    while time.time() < deadline:
        data   = graph_get(container_id, {"fields": "status_code"})
        status = data.get("status_code", "UNKNOWN")
        print(f"  IG container status: {status}")
        if status == "FINISHED":
            return True
        if status in ("ERROR", "EXPIRED"):
            die(f"IG container {container_id} failed with status: {status}")
        time.sleep(15)
    warn(f"IG container not ready after {max_wait}s — skipping IG publish.")
    return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    for name, val in [
        ("SUPABASE_URL",         SUPABASE_URL),
        ("SUPABASE_SERVICE_KEY", SERVICE_KEY),
        ("FB_PAGE_ACCESS_TOKEN", PAGE_TOKEN),
        ("FB_PAGE_ID",           PAGE_ID),
    ]:
        if not val:
            die(f"{name} is not set.")

    if not IG_USER_ID:
        warn("IG_USER_ID is not set — will post to Facebook only.")

    WORK_DIR.mkdir(parents=True, exist_ok=True)
    font_path = _find_font()
    if not font_path:
        warn("No bold font found — text overlays will use ffmpeg default.")

    # -----------------------------------------------------------------------
    # Fetch catches
    # -----------------------------------------------------------------------
    month_ago = (datetime.now(timezone.utc) - timedelta(days=30)).date().isoformat()
    catches   = supabase_get(
        f"catches?approved=eq.true&image_url=not.is.null"
        f"&created_at=gte.{month_ago}T00:00:00Z"
        f"&order=weight_kg.desc&limit=5"
        f"&select=species,weight_kg,venue,image_url,category"
    )

    if len(catches) < 3:
        warn(f"Only {len(catches)} catch(es) this month — using all-time top catches.")
        catches = supabase_get(
            "catches?approved=eq.true&image_url=not.is.null"
            "&order=weight_kg.desc&limit=5"
            "&select=species,weight_kg,venue,image_url,category"
        )

    if not catches:
        warn("No approved catches with photos found. Skipping reel this month.")
        return

    print(f"Building reel from {len(catches)} catch(es)…")

    # -----------------------------------------------------------------------
    # Download images + build segments
    # -----------------------------------------------------------------------
    seg_paths = []
    for i, catch in enumerate(catches):
        img_path = WORK_DIR / f"catch_{i}.jpg"
        seg_path = WORK_DIR / f"seg_{i}.mp4"
        print(f"Downloading image {i+1}/{len(catches)}…")
        download_image(catch["image_url"], img_path)
        make_segment(img_path, seg_path, catch, i, font_path)
        seg_paths.append(seg_path)

    # -----------------------------------------------------------------------
    # Concatenate + add audio
    # -----------------------------------------------------------------------
    reel_raw   = WORK_DIR / "reel_raw.mp4"
    reel_final = WORK_DIR / "reel.mp4"
    concat_segments(seg_paths, reel_raw)

    has_audio = add_silent_audio(reel_raw, reel_final)
    if not has_audio:
        reel_final = reel_raw

    # -----------------------------------------------------------------------
    # Upload to Supabase Storage (IG needs a public HTTPS URL to fetch from)
    # -----------------------------------------------------------------------
    ts             = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    storage_object = f"social-reels/reel_{ts}.mp4"
    print(f"Uploading reel to Supabase Storage ({storage_object})…")
    video_url = upload_to_storage(reel_final, "post-images", storage_object, "video/mp4")
    print(f"  Public URL: {video_url}")

    # -----------------------------------------------------------------------
    # Build caption
    # -----------------------------------------------------------------------
    top     = catches[0]
    top_txt = f"{top['species']} · {top['weight_kg']} kg"
    if top.get("venue"):
        top_txt += f" @ {top['venue']}"

    caption = (
        f"🎣 Monthly Catch Highlights — CastZone Trophy Room\n\n"
        f"Top catch this month: {top_txt} 🏆\n\n"
        f"Think you can beat it? Submit YOUR best catch at castzone.co.za "
        f"and claim your spot on the all-time leaderboard.\n\n"
        f"#CastZone #WhereSouthAfricaFishes #TrophyFish #SouthAfricaFishing "
        f"#SAanglers #FishingHighlights #BassLife #CarpFishing #SaltwaterFishing "
        f"#PBFish #FishingReels #AnglingSA"
    )

    # -----------------------------------------------------------------------
    # Instagram Reel
    # -----------------------------------------------------------------------
    if IG_USER_ID:
        print("Creating Instagram Reel container…")
        container = graph_post(f"{IG_USER_ID}/media", {
            "media_type":    "REELS",
            "video_url":     video_url,
            "caption":       caption,
            "share_to_feed": "true",
        })
        container_id = container.get("id")
        if not container_id:
            die(f"IG returned no container ID: {container}")
        print(f"  Container ID: {container_id}")

        if ig_wait_for_container(container_id, max_wait=300):
            print("Publishing Instagram Reel…")
            pub = graph_post(f"{IG_USER_ID}/media_publish",
                             {"creation_id": container_id})
            print(f"  Instagram Reel published: {pub.get('id', 'unknown')}")
    else:
        print("Skipping Instagram (IG_USER_ID not set).")

    # -----------------------------------------------------------------------
    # Facebook video post
    # -----------------------------------------------------------------------
    print("Posting video to Facebook…")
    fb = graph_post(f"{PAGE_ID}/videos", {
        "file_url":    video_url,
        "description": caption,
    })
    print(f"  Facebook video post ID: {fb.get('id', 'unknown')}")

    # -----------------------------------------------------------------------
    # Clean up the uploaded video from storage
    # Instagram has already ingested it by this point; no need to keep it.
    # -----------------------------------------------------------------------
    delete_from_storage("post-images", storage_object)

    print("Monthly reel complete.")


if __name__ == "__main__":
    main()
