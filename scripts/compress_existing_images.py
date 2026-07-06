#!/usr/bin/env python3
"""
Shrink images already sitting in Supabase Storage.

New uploads are compressed client-side now (src/lib/imageCompress.ts), but
everything uploaded before that fix is still full-resolution camera photos
(5-8MB) across the catch-images, post-images and spot-images buckets — that's
what pushed the project from the 5GB included quota to 7.47GB.

This walks every object in those buckets, downloads it, resizes to a max
dimension and re-encodes as WebP, and — if smaller — re-uploads it to the
SAME path with upsert=true. The path/filename never changes, so every
existing image_url / image_urls value in the database keeps working
unmodified; only the bytes behind that URL get smaller.

Requires the Supabase SERVICE ROLE key (bypasses storage RLS) as an env var —
never put it in .env.local or commit it:

  export SUPABASE_SERVICE_ROLE_KEY="..."
  python scripts/compress_existing_images.py            # dry run, reports savings
  python scripts/compress_existing_images.py --apply     # actually rewrites objects
  python scripts/compress_existing_images.py --apply --bucket catch-images
"""

import argparse
import io
import os
import re
import sys
import time
import urllib.request
import urllib.error
import json

from PIL import Image

BUCKETS = ["catch-images", "post-images", "spot-images"]
MAX_DIMENSION = 1600
QUALITY = 80


def load_supabase_url() -> str:
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    with open(env_path) as f:
        for line in f:
            m = re.match(r"NEXT_PUBLIC_SUPABASE_URL=(.+)", line.strip())
            if m:
                return m.group(1).strip().strip('"')
    sys.exit("Could not find NEXT_PUBLIC_SUPABASE_URL in .env.local")


def api_request(url: str, key: str, method: str = "GET", data: bytes | None = None, headers: dict | None = None):
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    with urllib.request.urlopen(req) as resp:
        return resp.read(), resp.status


def list_objects(base_url: str, key: str, bucket: str, prefix: str = "") -> list[dict]:
    objects = []
    offset = 0
    limit = 1000
    while True:
        body = json.dumps({"prefix": prefix, "limit": limit, "offset": offset, "sortBy": {"column": "name", "order": "asc"}}).encode()
        data, _ = api_request(
            f"{base_url}/storage/v1/object/list/{bucket}",
            key,
            method="POST",
            data=body,
            headers={"Content-Type": "application/json"},
        )
        page = json.loads(data)
        if not page:
            break
        for entry in page:
            if entry.get("id") is None:
                # folder (storage paths are "{user_id}/filename") — recurse into it
                objects.extend(list_objects(base_url, key, bucket, f"{prefix}{entry['name']}/"))
            else:
                objects.append({"path": f"{prefix}{entry['name']}", "size": (entry.get("metadata") or {}).get("size", 0)})
        if len(page) < limit:
            break
        offset += limit
    return objects


def compress(data: bytes) -> bytes | None:
    try:
        img = Image.open(io.BytesIO(data))
        img = img.convert("RGB") if img.mode in ("P", "RGBA") else img
    except Exception as e:
        print(f"    skip (unreadable image: {e})")
        return None
    w, h = img.size
    scale = min(1.0, MAX_DIMENSION / max(w, h))
    if scale < 1.0:
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, format="WEBP", quality=QUALITY)
    return out.getvalue()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Actually rewrite objects (default is dry-run)")
    parser.add_argument("--bucket", choices=BUCKETS, help="Limit to one bucket")
    args = parser.parse_args()

    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        sys.exit("Set SUPABASE_SERVICE_ROLE_KEY in your shell first (don't paste it anywhere else).")
    base_url = load_supabase_url()

    buckets = [args.bucket] if args.bucket else BUCKETS
    total_before = 0
    total_after = 0
    total_objects = 0

    for bucket in buckets:
        print(f"\n=== {bucket} ===")
        objects = list_objects(base_url, key, bucket)
        print(f"{len(objects)} objects found")
        for obj in objects:
            path = obj["path"]
            before_size = obj["size"]
            try:
                data, _ = api_request(f"{base_url}/storage/v1/object/{bucket}/{path}", key)
            except urllib.error.HTTPError as e:
                print(f"  {path}: download failed ({e.code})")
                continue

            compressed = compress(data)
            if compressed is None:
                continue
            after_size = len(compressed)

            if after_size >= before_size:
                print(f"  {path}: already optimal ({before_size}B)")
                continue

            total_objects += 1
            total_before += before_size
            total_after += after_size
            pct = 100 * (1 - after_size / before_size)
            print(f"  {path}: {before_size:,}B -> {after_size:,}B (-{pct:.0f}%)")

            if args.apply:
                try:
                    api_request(
                        f"{base_url}/storage/v1/object/{bucket}/{path}",
                        key,
                        method="PUT",
                        data=compressed,
                        headers={"Content-Type": "image/webp", "x-upsert": "true"},
                    )
                except urllib.error.HTTPError as e:
                    print(f"    upload failed ({e.code}): {e.read().decode(errors='ignore')}")
                time.sleep(0.05)  # be gentle on the API

    print(f"\n{'Would shrink' if not args.apply else 'Shrunk'} {total_objects} objects: "
          f"{total_before/1_048_576:.1f}MB -> {total_after/1_048_576:.1f}MB "
          f"(saved {(total_before-total_after)/1_048_576:.1f}MB)")
    if not args.apply:
        print("Dry run only — re-run with --apply to actually rewrite storage objects.")


if __name__ == "__main__":
    main()
