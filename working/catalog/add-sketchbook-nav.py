from pathlib import Path

pages = {
    "cloudflare-pages/index.html": ("/", "/"),
    "cloudflare-pages/shop/index.html": ("../", "../"),
    "cloudflare-pages/tie-dye/index.html": ("../", "../"),
    "cloudflare-pages/custom/index.html": ("../", "../"),
    "cloudflare-pages/events/index.html": ("../", "../"),
    "cloudflare-pages/about/index.html": ("../", "../"),
    "cloudflare-pages/contact/index.html": ("../", "../"),
}
for name, (nav_prefix, foot_prefix) in pages.items():
    path = Path(name)
    text = path.read_text(encoding="utf-8")
    photo = f'<a href="{nav_prefix}photography/" class="nav-link'
    if "sketchbook/" not in text:
        needle = None
        for line in text.splitlines():
            if "photography/" in line and "nav-link" in line:
                needle = line
                break
        if not needle:
            raise SystemExit(f"no photography nav in {name}")
        insert = needle + "\n" + needle.replace("photography/", "sketchbook/").replace("Photography", "Sketchbook").replace(' is-active" aria-current="page"', '"').replace(" is-active", "")
        # The replacement above may duplicate classes badly if the photography link is active.
        text = text.replace(needle, insert, 1)
        footer = f'<li><a href="{foot_prefix}photography/">Photography</a></li>'
        if footer in text:
            text = text.replace(footer, footer + f'\n          <li><a href="{foot_prefix}sketchbook/">Sketchbook</a></li>', 1)
        path.write_text(text, encoding="utf-8")
        print("nav", name)
    else:
        print("already", name)
