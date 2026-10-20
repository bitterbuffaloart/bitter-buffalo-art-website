import json
from pathlib import Path

root = Path("cloudflare-pages/assets/images/portfolio")
payload = json.loads(Path("working/portfolio/photography-manifest.json").read_text(encoding="utf-8"))
print("restored", payload["restored"], "photos", len(payload["photographs"]), "coasters", len(payload["coasters"]))
issues = 0
for item in payload["photographs"]:
    display_ratio = item["displayWidth"] / item["displayHeight"]
    source_ratio = item["sourceWidth"] / item["sourceHeight"]
    thumb_ratio = item["thumbnailWidth"] / item["thumbnailHeight"]
    large_ratio = item["enlargedWidth"] / item["enlargedHeight"]
    flags = []
    for name, ratio in (("display", display_ratio), ("thumb", thumb_ratio), ("large", large_ratio)):
        if abs(ratio - source_ratio) / source_ratio > 0.015:
            flags.append(name)
    if item["exportError"]:
        flags.append(item["exportError"])
    number = item["portfolioNumber"]
    display = root / f"{number:02d}.jpg"
    thumb = root / "thumbs" / f"{number:02d}.jpg"
    large = root / "large" / f"{number:02d}.jpg"
    missing = [name for name, path in (("display", display), ("thumb", thumb), ("large", large)) if not path.exists()]
    if flags or missing:
        issues += 1
        print(number, item["title"], flags, missing, "recovered", item["recoveredThisRun"])
print("issue_count", issues)
for coaster in payload["coasters"]:
    print(coaster["code"], coaster["displayWidth"], coaster["displayHeight"], coaster["listingIdFromFolder"])
