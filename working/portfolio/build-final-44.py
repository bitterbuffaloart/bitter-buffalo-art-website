"""Build the photograph manifest and web derivatives.

Positions 1–44 stay in place. Positions 45–50 are added after them.
Photograph 51 is a comparison only and is not published.
Originals are measured and never overwritten. Web JPEGs are separate files.
A reduced source is not treated as a high-resolution print master.
"""
import json
import re
import shutil
from pathlib import Path

from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None

ROOT = Path(r"C:\Users\bitte\bitter-buffalo-website-etsy-update-2026-10-17")
MANIFEST = ROOT / "working" / "portfolio" / "photography-manifest.json"
OUT = ROOT / "cloudflare-pages" / "assets" / "images" / "portfolio"
THUMBS = OUT / "thumbs"
LARGE = OUT / "large"
ARCHIVE = OUT / "archive"
REDIRECTS = ROOT / "cloudflare-pages" / "_redirects"
PORTFOLIO = Path(r"C:\Users\bitte\OneDrive\Desktop\Portfiolo")
ETSY = Path(r"C:\Users\bitte\OneDrive\Desktop\Portfolio for Etsy")
FULL = Path(r"C:\Users\bitte\Documents\Codex\2026-10-12\c-users-bitte-onedrive-desktop-portfiolo\outputs\Edited_Portfolio_Catalog\Full_Resolution")

RESERVED = {
    "DSC_9146.jpg",
    "DSC_0050 - Copy.jpg",
    "DSC_4241 copy.jpg",
    "DSC_9829-2.jpg",
    "DSC_5584.jpg",
    "FB_IMG_1590547546151(1).jpg",
    "DSC_6748 copy.jpg",
    "DSC_6752 copy.jpg",
    "DSC_7794-Edit-Edit - Copy.jpg",
    "DSC_7785-Edit-Edit.jpg",
}

STORIES = {
    1: ("Stormborn Grand Tetons", "Snow-covered peaks rise through layers of cloud while the valley rests in deep shadow. Light breaks across the mountain faces, revealing sharp ridges before the weather draws another veil. The Tetons carry a wild presence here: immense, restless, and worth standing still for."),
    2: ("When the Mountains Hold Their Breath", "The Maroon Bells meet their reflection beneath a restless sky. Gold threads through the wooded slopes, and the lake holds the mountains almost without a ripple. Along the rocky shore, the whole scene seems to pause long enough for you to catch your breath with it."),
    3: ("The Long Way Through", "Blue water makes a sweeping turn around a massive wall of stone. Sunlit rock and canyon shadow give the bend its depth, drawing the eye around the curve and out of sight. Some paths become remarkable because they refuse to run straight."),
    4: ("Fire Beneath the Arch", "The sun breaks beneath Mesa Arch, lighting its underside with a fierce orange glow. Weathered stone frames the distant country while a starburst cuts across the horizon. For this brief moment, the desert seems to hold a flame beneath its roof."),
    5: ("The Canyon Keeps Moving", "The Virgin River winds through Zion beneath red cliffs edged with warm light. Trees fill the canyon floor while smooth water slips around scattered stones. The cliffs command your attention, but the river leads you through the photograph, bend by bend."),
    6: ("Twice the Fire", "Warm clouds stretch above the mountain skyline and return in the still water below. Snow, dark trees, and bright sky settle into a near mirror image. The reflection gives the light another place to live, doubling the feeling of a moment that cannot last."),
    7: ("Gold Beyond the Ridge", "Rough stone anchors the foreground while golden woodland rolls toward a distant horizon. Clouds cast moving patches of shade across the broad country. From this rocky perch, autumn feels almost boundless—one bright stretch of land opening into the next."),
    8: ("A Thousand Edges of Light", "A low sun reaches across a crowded landscape of rock towers and narrow shadows. Warm light catches the upper edges while the hollows remain cool and deep. The wide view invites a slow look: every ridge holds another shape, another line, another small discovery."),
    9: ("The Exchange Still Stands", "Weathered lettering stretches across a wooden storefront beneath the mountains. Windows, doors, and worn boards give the building a character that polished surfaces cannot imitate. It stands beside the road with its name still visible and its history written into the grain."),
    10: ("Small Life, Wide Silence", "A small bird balances on a post in an almost empty white world. A fine horizontal line gives the eye a place to rest, and the bird gives the silence a pulse. Sometimes the smallest presence is enough to fill the frame."),
    11: ("Crowned in Timber", "A bull elk stands among pale grasses and dark tree trunks, his antlers spreading through the woodland like bare branches. The muted forest colors bring his heavy shoulders and watchful profile forward. Strength feels quiet here, settled into its own surroundings."),
    12: ("Learning the Steep Way", "An adult mountain goat stands above a small kid on a broken slope of rock. White coats catch the light against the gray stone, making their footing feel even more remarkable. The little one has a steep world to learn and company along the way."),
    13: ("Carried by the Open Sky", "Two sandhill cranes stretch their wings across a clear blue sky. Their long necks point forward while the feather tips fan into delicate shapes. For a moment, the photograph holds the effortless-looking balance of bodies built for distance."),
    14: ("Born to Roam", "A rust-colored bison calf stands among sage and grass, surrounded by the heavy shapes of the herd. Small legs, watchful eyes, and a whole stretch of wild country ahead. The next generation is already finding its footing."),
    15: ("Iron at Rest", "An old tractor rests in the grass beneath a textured sky. Black and white draws attention to worn metal, heavy tires, and the stubborn geometry of a working machine. Its engine is quiet, but its presence still belongs to the land around it."),
    16: ("Let the Water Speak", "Water folds over a broad rock ledge in pale ribbons, gathering and falling again between warm-colored stones. Green growth softens the edges of the scene. The steady movement gives the eye somewhere to settle and the mind permission to wander."),
    17: ("The Night Writes Back", "Long trails of starlight cross the sky above a snow-covered basin and dark mountain slopes. The ground appears still while the exposure turns the passing night into visible lines. Time leaves its handwriting overhead."),
    18: ("Where Stone Holds the Stars", "A jagged tower of weathered rock stands beneath a sky written in circles. Blue and white star trails sweep around its crown, turning passing time into something visible. There is a wild kind of peace here—the feeling of planting your feet on solid ground while the whole universe keeps turning."),
    19: ("Winter Keeps the Keys", "Small wooden cabins stand beneath snow-laden trees, their dark walls breaking through the white. The monochrome view brings out rooflines, trunks, and the quiet spaces between buildings. Winter gathers the whole settlement into a slower rhythm."),
    20: ("A Little Color Against the Storm", "A yellow house and its weathered neighbors face the road beneath heavy clouds. Bright paint, pale fencing, and old wood hold their own against the dark sky. The scene has the familiar stubbornness of a mountain town waiting out another change in the weather."),
    21: ("Into the Mist", "Elk emerge from a pale meadow where the distance dissolves into mist. One lowers its head to feed while another stands farther back, softened by the haze. The photograph asks for a quieter kind of attention, letting the animals appear gradually as you look."),
    22: ("What the Water Remembers", "The skeletal remains of old machinery stretch above still water, their shapes repeated in the reflection. Autumn color rises behind the weathered framework. Hard angles and bright leaves share the surface, bringing the marks of industry and the surrounding landscape into one frame."),
    23: ("Fuel for the Long Way Home", "An old mountain gas station fills the frame with timber, signs, and roadside character. Forested slopes rise behind the roof, placing this small stop firmly in its country. It carries the feeling of a place where the journey slows down for a while."),
    24: ("Gold Beneath the Wild", "Warm light reaches across the trees and brush, catching the hillside in gold. Beyond the still water, Mount Sneffels and the surrounding skyline rise in blue shadow beneath soft clouds. This is country that makes you stop without deciding to, then stay a little longer."),
    25: ("A Roof Beneath the Fire", "A small cabin rests at the edge of a meadow while fiery clouds stretch over the forest. Its simple roof and dark doorway give the eye an anchor beneath the dramatic sky. The building feels small, sheltered, and completely at home in the clearing."),
    26: ("Iron Remembers", "Locomotive 495 fills the frame with rivets, pipes, and heavy steel beneath a sweeping sky. Light catches the face of the engine and the worn surfaces around it. Even at rest, the machine carries the visual weight of work, distance, and determination."),
    27: ("The Last Stop Is Quiet", "A weathered caboose rests among pale winter grass and bare trees. Faded boards and touches of red trace the shape of a carriage built to travel. Here it stands still, with the small details of its surface finally given time to be seen."),
    28: ("Rooted Beneath Giants", "The barn glows warmly beneath a skyline of sharp, snowy summits. Low buildings and an uneven fence bring the scene down to human scale. Hand-built shelter and towering mountains meet in a view that feels both welcoming and immense."),
    29: ("Room for the Sky", "A small wooden chapel stands beneath a broad, cloud-streaked sky. Weathered boards and a simple tower rise from open ground, with distant mountains along the horizon. The space around the building becomes part of the photograph, leaving room for stillness and reflection."),
    30: ("The Hills Come Alive in Gold", "Yellow wildflowers spread across rolling green country beneath a long mountain skyline. Bands of cloud and light give the distant slopes their shape. The wide frame holds the abundance of a brief flowering season, stretching far beyond any single blossom."),
    31: ("A Small Flame of Violet", "A violet iris opens against a dark, softened background. Curved petals catch the light while narrow green leaves rise around it. Seen this closely, a small flower becomes a whole landscape of color, texture, and delicate edges."),
    32: ("What the Storm Left Glowing", "Warm light breaks across a valley layered with autumn trees and dark ridges. Clouds still gather overhead, making each bright patch of land feel newly revealed. Gold and shadow lead the eye toward the mountains in a scene that keeps unfolding the longer you look."),
    33: ("Main Street, Still Standing", "Weathered storefronts line a broad, quiet road beneath the mountains. Their uneven colors, old signs, and timber faces give each building its own voice. Together they make a street with enough character to hold your attention long after the passing moment."),
    34: ("Where Winter Meets Wildflowers", "Purple lupines rise through the foreground while yellow flowers mark the rolling ground beyond. Snow still holds the high peaks beneath a clouded sky. Two seasons meet in one view, with the bright insistence of new growth spreading below the cold ridgeline."),
    35: ("Cold Water, Wild Blood", "A bull elk steps through blue water, his antlers rising above a dark reflection. Ripples spread from his legs and break the smooth surface around him. The direct view gives the encounter a powerful stillness, held between one step and the next."),
    36: ("The Wild Holds Its Own", "A calf nurses beneath its mother while she turns her head toward the surrounding meadow. Warm light catches their coats and the dry seed heads around them. The scene holds a quieter side of wild life: nourishment, closeness, and a watchful pause."),
    37: ("The Gold That Stayed", "An old mining structure stands beside broad slopes of exposed earth, surrounded by golden trees. The forest brings color to a landscape visibly shaped by work. The photograph lets those two histories sit together—the ground that was disturbed and the leaves that return each autumn."),
    38: ("Take the Golden Way", "A paved path bends through golden trees toward a rugged mountain skyline. Long shadows cross the surface, and the curve carries the eye beyond what can be seen. It is an invitation to keep going, slowly enough to notice the color along the way."),
    39: ("Westbound After Dark", "Union Station glows in red, violet, and blue beneath dramatic clouds. The illuminated clock and bright lettering rise over people moving through the plaza. Stone architecture and electric color meet in a city scene with the restless feeling of departures, arrivals, and somewhere still to go."),
    40: ("Growing Gold from Stone", "Orange and yellow leaves flare against a slope of broken gray rock. Slender trunks rise through rough ground, turning an unlikely patch of hillside into a celebration of color. Life finds room, then makes something beautiful of it."),
    41: ("Still Standing, Still Flowing", "A white cascade spills beside the old wooden structure and spreads into a shaded pool. Sunlight reveals the grain of the boards and the sharp angles of the rock. The building holds still while the river carries the scene forward."),
    42: ("The Night Keeps Watch", "Stars gather above the dark forest while light picks out weathered boards and a pale ribbon of falling water. The structure takes on a quieter presence after dark. Above the river's movement, the sky opens wide."),
    43: ("Embers Above the Desert", "Red towers rise from a shadowed valley while distant snow-covered peaks catch a soft, fiery glow. Long bands of cloud stretch overhead. For a moment, desert stone and winter snow share the same warmth."),
    44: ("When the Work Was Done", "An old hay rake rests beside a fence beneath an enormous blue sky. Curved teeth and open wheels stand against a meadow reaching toward wooded hills. The machinery has gone quiet; the land still gives the eye somewhere to travel."),
    45: ("Where the Mountains Catch Fire", "The last light sets the clouds ablaze above a rugged mountain skyline. Gold spills across the autumn forest while the valley settles into shadow. For a few fleeting moments, the mountains seem to hold the fire of the sky before surrendering it to the night."),
    46: ("The River Knows the Way", "The river winds between towering stone and darkening woodland, carrying the last light through the canyon. Ancient cliffs rise above its quiet current, their weathered faces catching the warmth of the sun. The mountains stand their ground, but the water has always known the way forward."),
    47: ("Where the Canyon Opens", "Deep within the red sandstone, water spills past a weathered ladder into a narrow pool. The canyon walls tower overhead, carved and polished by countless seasons of moving water. Here, the journey is written in stone, and the next passage waits beyond the falling water."),
    48: ("Where Silence Has Antlers", "Two elk stand against a pale and nearly empty sky, their dark silhouettes rising from the grassy hillside. One lowers its head while the other's antlers reach into the open air. Nothing in the scene needs to move for the wildness of the moment to be felt."),
    49: ("Little Flame in the Meadow", "A young fox sits among grasses and scattered purple flowers, its bright eyes watching from the edge of the woodland. Soft light finds the little hunter while the forest fades into shadow. In a world of towering mountains and powerful wildlife, sometimes the smallest creature carries the greatest wonder."),
    50: ("The Long Fall Home", "Cold mountain water descends through a narrow passage of granite, gathering into a clear pool among weathered stones. Pine trees hold their places above the falls while the current continues its long journey downstream. Stone may shape the path, but water always finds its way home."),
}
SKETCH_STORY = "Color folds into color in a mirrored world of electric yellow, green, violet, and fire. Shapes emerge, divide, and return to the center, creating a vision that seems to change with every glance. What first appears as chaos becomes a dance of reflection, symmetry, and possibility."

SOURCES = {
    5: Path(r"K:\2015\Bryce Canyon 2015-10-12\DSC_2475-HDR-Pano-2-Edit.tif"),
    14: FULL / "DSC_2637.JPG",
    18: ETSY / "18 - DSC_9535-Edit-2 copy.jpg",
    24: ETSY / "24 - DSC_0240_1-Edit-Edit copy.jpg",
    34: PORTFOLIO / "DSC_2476.jpg",
    35: PORTFOLIO / "DSC_9655.jpg",
    36: PORTFOLIO / "DSC_9886.jpg",
    37: PORTFOLIO / "DJI_0188.jpg",
    38: PORTFOLIO / "DSC_0218 - Copy.jpg",
    39: FULL / "DSC_4664-Edit.jpg",
    40: PORTFOLIO / "DSC_4316.jpg",
    41: Path(r"K:\2014\Fall\2014-09-23\DSC_7867-Edit.tif"),
    42: PORTFOLIO / "DSC_7977 copy.jpg",
    43: PORTFOLIO / "DSC_6015.jpg",
    44: PORTFOLIO / "DSC_9389.jpg",
    45: PORTFOLIO / "DSC_0604.jpg",
    46: PORTFOLIO / "DSC_5269.jpg",
    47: PORTFOLIO / "DSC_5424-Edit-Edit-2.jpg",
    48: PORTFOLIO / "DSC_9301.jpg",
    49: PORTFOLIO / "FB_IMG_1590634206449.jpg",
    50: PORTFOLIO / "untitled-1-6.jpg",
}
SKETCH_SOURCE = PORTFOLIO / "Untitled-art.jpg"
SKETCH_OUT = ROOT / "cloudflare-pages" / "assets" / "images" / "sketchbook"
DISPLAYED = 50


def slug(title, number):
    if number == 1:
        return "grand-tetons"
    text = title.lower().replace("'", "").replace("’", "")
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def permanent_id(number):
    if number == 14:
        return "bb-photo-45"
    # bb-photo-45 is the bison at position 14. New positions get the next free ids.
    added = {
        45: "bb-photo-46",
        46: "bb-photo-47",
        47: "bb-photo-48",
        48: "bb-photo-49",
        49: "bb-photo-50",
        50: "bb-photo-51",
    }
    return added.get(number, f"bb-photo-{number:02d}")


def measure(path):
    with Image.open(path) as image:
        oriented = ImageOps.exif_transpose(image)
        if oriented.mode != "RGB":
            oriented = oriented.convert("RGB")
        return oriented


def write_fit(image, path, edge, quality):
    copy = image.copy()
    before = copy.width / copy.height
    copy.thumbnail((edge, edge), Image.Resampling.LANCZOS)
    after = copy.width / copy.height
    if abs(after - before) / before > 0.015:
        raise SystemExit(f"aspect changed for {path.name}")
    if copy.width > image.width or copy.height > image.height:
        raise SystemExit(f"upscale refused for {path.name}")
    path.parent.mkdir(parents=True, exist_ok=True)
    copy.save(path, "JPEG", quality=quality, optimize=True)
    return copy.width, copy.height


def sketchbook_record(current):
    if not SKETCH_SOURCE.is_file():
        raise SystemExit(f"missing sketchbook source {SKETCH_SOURCE.name}")
    image = measure(SKETCH_SOURCE)
    previous = next((item for item in current.get("sketchbook") or [] if item.get("id") == "bb-sketch-01"), None)
    files_ready = all((SKETCH_OUT / name).is_file() for name in (
        "the-color-between-worlds.jpg",
        "thumbs/the-color-between-worlds.jpg",
        "large/the-color-between-worlds.jpg",
    ))
    unchanged = (
        previous is not None
        and previous.get("sourcePath") == str(SKETCH_SOURCE)
        and (image.width, image.height) == (previous.get("sourceWidth"), previous.get("sourceHeight"))
        and files_ready
    )
    if unchanged:
        display_w = previous["displayWidth"]
        display_h = previous["displayHeight"]
        thumb_w = previous["thumbnailWidth"]
        thumb_h = previous["thumbnailHeight"]
        large_w = previous["enlargedWidth"]
        large_h = previous["enlargedHeight"]
    else:
        display_w, display_h = write_fit(image, SKETCH_OUT / "the-color-between-worlds.jpg", 1600, 86)
        thumb_w, thumb_h = write_fit(image, SKETCH_OUT / "thumbs" / "the-color-between-worlds.jpg", 480, 80)
        large_w, large_h = write_fit(image, SKETCH_OUT / "large" / "the-color-between-worlds.jpg", 2400, 88)
    return {
        "id": "bb-sketch-01",
        "title": "The Color Between Worlds",
        "story": SKETCH_STORY,
        "category": "Sketchbook/Digital Art",
        "sourcePath": str(SKETCH_SOURCE),
        "sourceFilename": SKETCH_SOURCE.name,
        "sourceWidth": image.width,
        "sourceHeight": image.height,
        "display": "/assets/images/sketchbook/the-color-between-worlds.jpg",
        "displayWidth": display_w,
        "displayHeight": display_h,
        "thumbnail": "/assets/images/sketchbook/thumbs/the-color-between-worlds.jpg",
        "thumbnailWidth": thumb_w,
        "thumbnailHeight": thumb_h,
        "enlarged": "/assets/images/sketchbook/large/the-color-between-worlds.jpg",
        "enlargedWidth": large_w,
        "enlargedHeight": large_h,
        "printMasterIsWebJpeg": False,
    }


def main():
    if set(STORIES) != set(range(1, DISPLAYED + 1)):
        raise SystemExit(f"stories must be positions 1 through {DISPLAYED}")
    for number, (_title, story) in STORIES.items():
        if not story.strip():
            raise SystemExit(f"story missing for #{number}")
    current = json.loads(MANIFEST.read_text(encoding="utf-8"))
    by_number = {item["portfolioNumber"]: item for item in current["photographs"]}
    archived = current.get("archived") or []
    horse = next((item for item in archived if item.get("permanentId") == "bb-photo-14"), None)
    if horse is None:
        horse = dict(by_number[14])
        if Path(horse["sourcePath"]).name.lower().find("horse") < 0 and "Horse" not in horse["title"]:
            raise SystemExit("position 14 is not the horse record that must be archived")
        ARCHIVE.mkdir(parents=True, exist_ok=True)
        for folder, name in ((OUT, "14.jpg"), (THUMBS, "14.jpg"), (LARGE, "14.jpg")):
            source = folder / name
            if not source.is_file():
                raise SystemExit(f"missing horse web file {source}")
            shutil.copy2(source, ARCHIVE / f"horse-bb-photo-14-{folder.name if folder != OUT else 'display'}.jpg")
    else:
        horse = dict(horse)
        if "horse" not in Path(horse["sourcePath"]).name.lower() and "Horse" not in horse.get("title", ""):
            raise SystemExit("archived horse record is missing")
        if not (ARCHIVE / "horse-bb-photo-14-display.jpg").is_file():
            raise SystemExit("archived horse web file is missing")
    if not Path(horse["sourcePath"]).is_file():
        raise SystemExit("horse source file is missing; it must stay archived, not deleted")

    photographs = []
    redirects = []
    for number in range(1, DISPLAYED + 1):
        title, story = STORIES[number]
        if number in SOURCES:
            source = SOURCES[number]
            if not source.is_file():
                raise SystemExit(f"missing named source for #{number}: {source.name}")
            if source.name in RESERVED:
                raise SystemExit(f"reserved file attached to #{number}")
            previous = by_number.get(number)
            image = measure(source)
            unchanged = (
                previous is not None
                and previous.get("sourcePath") == str(source)
                and (image.width, image.height) == (previous["sourceWidth"], previous["sourceHeight"])
            )
            if unchanged:
                display_w = previous["displayWidth"]
                display_h = previous["displayHeight"]
                thumb_w = previous["thumbnailWidth"]
                thumb_h = previous["thumbnailHeight"]
                large_w = previous["enlargedWidth"]
                large_h = previous["enlargedHeight"]
            else:
                display_w, display_h = write_fit(image, OUT / f"{number:02d}.jpg", 1600, 86)
                thumb_w, thumb_h = write_fit(image, THUMBS / f"{number:02d}.jpg", 480, 80)
                large_w, large_h = write_fit(image, LARGE / f"{number:02d}.jpg", 2400, 88)
            source_path = str(source)
        else:
            previous = by_number[number]
            source = Path(previous["sourcePath"])
            if not source.is_file():
                raise SystemExit(f"existing source missing for #{number}: {source.name}")
            if source.name in RESERVED and number != 11:
                raise SystemExit(f"reserved file attached to #{number}")
            image = measure(source)
            if (image.width, image.height) != (previous["sourceWidth"], previous["sourceHeight"]):
                raise SystemExit(f"#{number} pixels changed without a named replacement")
            display_w = previous["displayWidth"]
            display_h = previous["displayHeight"]
            thumb_w = previous["thumbnailWidth"]
            thumb_h = previous["thumbnailHeight"]
            large_w = previous["enlargedWidth"]
            large_h = previous["enlargedHeight"]
            source_path = previous["sourcePath"]
        long_side = max(image.width, image.height)
        record = {
            "permanentId": permanent_id(number),
            "portfolioNumber": number,
            "title": title,
            "story": story,
            "sourcePath": source_path,
            "sourceFilename": Path(source_path).name,
            "sourceWidth": image.width,
            "sourceHeight": image.height,
            "aspectClass": round(image.width / image.height, 4),
            "display": f"/assets/images/portfolio/{number:02d}.jpg",
            "displayWidth": display_w,
            "displayHeight": display_h,
            "thumbnail": f"/assets/images/portfolio/thumbs/{number:02d}.jpg",
            "thumbnailWidth": thumb_w,
            "thumbnailHeight": thumb_h,
            "enlarged": f"/assets/images/portfolio/large/{number:02d}.jpg",
            "enlargedWidth": large_w,
            "enlargedHeight": large_h,
            "galleryReference": f"/photography/#portfolio-{number:02d}",
            "highResolutionMaster": "missing" if long_side < 3600 else "measured",
            "printMasterIsWebJpeg": False,
        }
        if number == 10:
            record["composition"] = "16:9 preserved. Do not crop to 3:2. No published price."
        if number == 24:
            record["location"] = "Dallas Divide / Mount Sneffels, Colorado."
        if number == 26:
            alternate = PORTFOLIO / "DSC_0375-HDR-Edit-bw.jpg"
            record["alternate"] = {
                "role": "black-and-white alternate, not a separate photograph",
                "sourceFilename": alternate.name,
                "present": alternate.is_file(),
            }
        if previous:
            record["previousTitle"] = previous["title"]
            old_slug = slug(previous["title"], number)
            new_slug = slug(title, number)
            if old_slug != new_slug:
                redirects.append((old_slug, new_slug))
        photographs.append(record)

    ids = [item["permanentId"] for item in photographs]
    if len(ids) != len(set(ids)) or "bb-photo-14" in ids or "bb-photo-45" not in ids:
        raise SystemExit("permanent ids are not stable")
    names = [Path(item["sourcePath"]).name for item in photographs]
    if len(names) != len(set(names)):
        raise SystemExit("duplicate source filename")
    if len(photographs) != DISPLAYED:
        raise SystemExit(f"expected {DISPLAYED} photographs")
    sketchbook = [sketchbook_record(current)]
    payload = {
        "displayed": DISPLAYED,
        "photographs": photographs,
        "archived": [{
            "permanentId": "bb-photo-14",
            "previousDisplayPosition": 14,
            "title": horse["title"],
            "sourcePath": horse["sourcePath"],
            "sourceFilename": Path(horse["sourcePath"]).name,
            "sourceWidth": horse["sourceWidth"],
            "sourceHeight": horse["sourceHeight"],
            "archivedWeb": "/assets/images/portfolio/archive/horse-bb-photo-14-display.jpg",
            "note": "Former horse display. The file is archived and was not deleted. It is not a displayed photograph.",
        }],
        "reservedExcluded": sorted(RESERVED),
        "coasters": current.get("coasters", []),
        "tieDye": current.get("tieDye", []),
        "sketchbook": sketchbook,
    }
    MANIFEST.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    lines = REDIRECTS.read_text(encoding="utf-8").splitlines()
    for old_slug, new_slug in redirects:
        rule = f"/photography/prints/{old_slug}/ /photography/prints/{new_slug}/ 301"
        if rule not in lines:
            lines.append(rule)
    REDIRECTS.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"photographs={len(photographs)} sketchbook={len(sketchbook)} redirects={len(redirects)} archived=bb-photo-14")


if __name__ == "__main__":
    main()
