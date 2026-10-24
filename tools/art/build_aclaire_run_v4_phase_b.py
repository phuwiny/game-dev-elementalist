"""Build an alternate-leg run-cycle review from newly redrawn key poses."""

from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "art"
CONCEPT = ART / "concept"
OUT = ART / "previews" / "phase_b"
FRAME_DIR = OUT / "2026-10-24_aclaire_run_v4_redraw"
FRAME_DIR.mkdir(parents=True, exist_ok=True)

SHEET = Image.open(CONCEPT / "2026-10-24_aclaire_run_v4_four_pose_source.png").convert("RGBA")
PLANTED = Image.open(CONCEPT / "2026-10-24_aclaire_run_v4_planted_source.png").convert("RGBA")
OPPOSITE = Image.open(CONCEPT / "2026-10-24_aclaire_run_v4_opposite_source.png").convert("RGBA")
SEED = Image.open(ART / "previews/phase_a/2026-10-23_aclaire_seed_v4_256color_density2.png").convert("RGBA")
colors = sorted({pixel[:3] for pixel in SEED.get_flattened_data() if pixel[3]})
palette = Image.new("P", (1, 1))
flat_palette = [channel for color in colors for channel in color]
palette.putpalette((flat_palette + [255] * (768 - len(flat_palette)))[:768])


def crop_visible(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").point(lambda value: 255 if value >= 128 else 0).getbbox()
    assert bbox is not None
    return image.crop(bbox)


def normalize(source: Image.Image) -> Image.Image:
    source = crop_visible(source)
    factor = min(122 / source.height, 124 / source.width)
    size = (round(source.width * factor), round(source.height * factor))
    scaled = source.resize(size, Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (128, 128))
    frame.alpha_composite(scaled, ((128 - size[0]) // 2, 126 - size[1]))
    alpha = frame.getchannel("A").point(lambda value: 255 if value >= 128 else 0)
    rgb = Image.new("RGB", frame.size, "#ffffff")
    rgb.paste(frame, mask=alpha)
    indexed = rgb.quantize(palette=palette, dither=Image.Dither.NONE)
    result = indexed.convert("RGB")
    result.putalpha(alpha)
    return result


# The sheet is drawn as a 2 x 2 board. Its lower row repeats the same leg
# silhouettes, so only the two upper keys are used alongside newly redrawn
# left/right planted keys.
half_w, half_h = SHEET.width // 2, SHEET.height // 2
WIDE = SHEET.crop((0, 0, half_w, half_h))
RECOIL = SHEET.crop((half_w, 0, SHEET.width, half_h))

# Planted A: right boot on the ground, left boot drawn back.
# Opposite B: left boot on the ground, right boot lifted forward.
sources = [PLANTED, RECOIL, OPPOSITE, WIDE]
frames = [normalize(source) for source in sources]


def eye_center(frame: Image.Image) -> tuple[int, int]:
    pixels = []
    for y in range(15, 70):
        for x in range(35, 110):
            r, g, b, a = frame.getpixel((x, y))
            if a and b > r + 25 and b > g + 8:
                pixels.append((x, y))
    assert pixels
    return round(sum(x for x, _ in pixels) / len(pixels)), round(sum(y for _, y in pixels) / len(pixels))


target_eye_x = 72
aligned = []
for frame in frames:
    ex, ey = eye_center(frame)
    corrected = Image.new("RGBA", (128, 128))
    corrected.alpha_composite(frame, (target_eye_x - ex, 0))
    aligned.append(corrected)
frames = aligned
print("eye centers", [eye_center(frame) for frame in frames])

for index, frame in enumerate(frames, 1):
    assert frame.size == (128, 128)
    assert set(frame.getchannel("A").get_flattened_data()) <= {0, 255}
    frame.save(FRAME_DIR / f"{index:02}.png")

strip = Image.new("RGBA", (128 * len(frames), 128))
for index, frame in enumerate(frames):
    strip.alpha_composite(frame, (index * 128, 0))
strip.save(OUT / "2026-10-24_aclaire_run_v4_redraw_strip.png")

board = Image.new("RGBA", (1024, 310), "#344058")
draw = ImageDraw.Draw(board)
draw.text((14, 8), "ACLAIRE / RUN V4 REDRAW / 4 keys / 8 fps", fill="white")
for index, frame in enumerate(frames):
    board.alpha_composite(frame.resize((256, 256), Image.Resampling.NEAREST), (index * 256, 32))
    draw.text((index * 256 + 120, 290), f"{index + 1:02}", fill="white")
board.save(OUT / "2026-10-24_aclaire_run_v4_redraw_x2.png")

frames[0].save(
    OUT / "2026-10-24_aclaire_run_v4_redraw_motion.png",
    save_all=True,
    append_images=frames[1:],
    duration=[125] * len(frames),
    loop=0,
    disposal=2,
    blend=0,
)
logical = [frame.resize((64, 64), Image.Resampling.LANCZOS) for frame in frames]
logical[0].save(
    OUT / "2026-10-24_aclaire_run_v4_redraw_logical_motion.png",
    save_all=True,
    append_images=logical[1:],
    duration=[125] * len(frames),
    loop=0,
    disposal=2,
    blend=0,
)

screen = Image.new("RGBA", (640, 360), "#293747")
screen_draw = ImageDraw.Draw(screen)
screen_draw.text((16, 16), "Aclaire run V4 redraw / 640x360 / 8 fps", fill="white")
screen_draw.line((0, 286, 639, 286), fill="#7b7896")
for index, frame in enumerate(logical):
    x = 90 + index * 120
    screen.alpha_composite(frame, (x, 222))
    screen_draw.text((x + 23, 302), f"{index + 1:02}", fill="white")
screen.save(OUT / "2026-10-24_aclaire_run_v4_redraw_640x360.png")

print("frames", len(frames), "source sheet", SHEET.size)
