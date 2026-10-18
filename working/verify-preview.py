#!/usr/bin/env python3
"""HTTP checks for Cloudflare Pages preview (no credentials)."""
from __future__ import annotations

import re
import sys
import urllib.request

BASE = "https://bitter-buffalo-art.pages.dev"
ETSY = "https://www.etsy.com/shop/BitterBuffaloArt"
PATHS = [
    "/",
    "/photography/",
    "/shop/",
    "/events/",
    "/contact/",
    "/custom/",
    "/tie-dye/",
    "/laser-art/",
    "/about/",
    "/sitemap.xml",
    "/robots.txt",
    "/assets/images/events/booth-market.jpg",
    "/assets/images/events/booth-tiedye.jpg",
    "/assets/images/portfolio/02.jpg",
]


def get(url: str) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": "BitterBuffaloPreviewVerify/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, r.read()


def main() -> int:
    ok = True
    for path in PATHS:
        url = BASE + path
        try:
            status, body = get(url)
            print(f"OK {status} {len(body):6d} {url}")
            if path.endswith(".html") or path.endswith("/"):
                text = body.decode("utf-8", "replace")
                if path in ("/", "/photography/", "/shop/", "/events/", "/contact/") and ETSY not in text:
                    print("  WARN missing Etsy shop home link")
                    ok = False
                if path == "/events/" and "booth-market" not in text:
                    print("  FAIL events gallery missing booth-market")
                    ok = False
                if path == "/photography/":
                    n = len(re.findall(r"portfolio/\d+\.jpg", text))
                    print(f"  portfolio refs={n}")
                    if n < 33:
                        print("  FAIL expected 33 portfolio image refs")
                        ok = False
        except Exception as exc:
            print(f"FAIL {url} {exc}")
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
