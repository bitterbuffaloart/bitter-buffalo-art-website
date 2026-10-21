"""One header and footer for every public page.

The whole-site generator in working/build-static-site.js is a second writer.
Do not run it. Stamp this header instead.
"""
import re
from pathlib import Path

ROOT = Path(r"C:\Users\bitte\bitter-buffalo-website-etsy-update-2026-10-17")
PUBLIC = ROOT / "cloudflare-pages"

NAV_ITEMS = (
    ("Home", "/"),
    ("Shop", "/shop/"),
    ("Tie-Dye", "/tie-dye/"),
    ("Photography", "/photography/"),
    ("Sketchbook", "/sketchbook/"),
    ("Laser Art", "/laser-art/"),
    ("Custom Art", "/custom/"),
    ("Events", "/events/"),
    ("About", "/about/"),
    ("Contact", "/contact/"),
)

FOOTER_NOTE = (
    "Fine-art photography prints are offered on this website. "
    "Handmade tie-dye and laser pieces are linked to an individual Etsy listing only when that listing is already verified. "
    "This website does not take payment."
)

NAV_RE = re.compile(
    r'<nav id="site-nav" class="site-nav" aria-label="Primary">.*?</nav>',
    re.S,
)
FOOTER_RE = re.compile(r'<footer class="site-footer">.*?</footer>', re.S)


def active_label(relative_path):
    rel = relative_path.as_posix()
    if rel == "index.html":
        return "Home"
    section = rel.split("/", 1)[0]
    return {
        "shop": "Shop",
        "tie-dye": "Tie-Dye",
        "photography": "Photography",
        "sketchbook": "Sketchbook",
        "laser-art": "Laser Art",
        "custom": "Custom Art",
        "events": "Events",
        "about": "About",
        "contact": "Contact",
    }.get(section, "")


def nav_html(active):
    lines = ['<nav id="site-nav" class="site-nav" aria-label="Primary">']
    for label, href in NAV_ITEMS:
        current = ' aria-current="page"' if label == active else ""
        klass = "nav-link is-active" if label == active else "nav-link"
        lines.append(f'        <a href="{href}" class="{klass}"{current}>{label}</a>')
    lines.append("      </nav>")
    return "\n".join(lines)


def footer_html():
    explore = "\n".join(
        [
            '          <li><a href="/">Home</a></li>',
            '          <li><a href="/shop/">Shop</a></li>',
            '          <li><a href="/photography/">Fine-Art Photography Prints</a></li>',
            '          <li><a href="/tie-dye/">Tie-Dye &amp; Wearable Art</a></li>',
            '          <li><a href="/laser-art/">Laser-Engraved Wood Art</a></li>',
            '          <li><a href="/sketchbook/">Sketchbook</a></li>',
            '          <li><a href="/events/">Events</a></li>',
            '          <li><a href="/about/">About</a></li>',
        ]
    )
    return f"""<footer class="site-footer">
    <div class="site-footer__land" aria-hidden="true">
      <picture>
        <source media="(max-width: 700px)" srcset="/assets/images/western-footer-mobile.svg" />
        <img src="/assets/images/western-footer-landscape.svg" alt="" width="1600" height="680" />
      </picture>
    </div>
    <div class="site-footer__grid">
      <div>
        <h2>Bitter Buffalo Art</h2>
        <p>Original art from the Colorado High Country—fine-art photography, hand-dyed textiles, laser woodwork, and the studio sketchbook from Breckenridge.</p>
      </div>
      <div>
        <h3>Explore</h3>
        <ul>
{explore}
        </ul>
      </div>
      <div>
        <h3>Work With Us</h3>
        <ul>
          <li><a href="/custom/">Custom Art</a></li>
          <li><a href="/contact/">Contact</a></li>
        </ul>
      </div>
    </div>
    <p class="site-footer__note">{FOOTER_NOTE}</p>
  </footer>"""


def stamp(html, active):
    nav, nav_count = NAV_RE.subn(nav_html(active), html, count=1)
    if nav_count != 1:
        raise SystemExit("missing site nav")
    footer, footer_count = FOOTER_RE.subn(footer_html(), nav, count=1)
    if footer_count != 1:
        raise SystemExit("missing site footer")
    return footer


def main():
    changed = 0
    for file in PUBLIC.rglob("*.html"):
        relative = file.relative_to(PUBLIC)
        updated = stamp(file.read_text(encoding="utf-8"), active_label(relative))
        if updated != file.read_text(encoding="utf-8"):
            file.write_text(updated, encoding="utf-8", newline="\n")
            changed += 1
    print(f"stamped {changed}")


if __name__ == "__main__":
    main()
