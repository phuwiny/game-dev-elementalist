"""Build a conservative six-frame idle study from the approved V4 seed.

This is a Phase B preview, not a production atlas. The approved first frame is
copied byte-for-byte; later frames use tiny integer-pixel motion so face and
costume never drift between generated drawings.
"""

from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "art/previews/phase_a/2026-10-23_aclaire_seed_v4_256color_density2.png"
OUT = ROOT / "art/previews/phase_b/2026-10-24_aclaire_idle"
OUT.mkdir(parents=True, exist_ok=True)

seed = Image.open(SEED).convert("RGBA")
assert seed.size == (96, 128)


def pose(top_x: int, top_y: int) -> Image.Image:
    """Bend only the upper silhouette by at most one physical pixel."""
    frame = Image.new("RGBA", seed.size)
    src = seed.load()
    dst = frame.load()
    for y in range(128):
        # Fade movement to zero above the boots, preserving a fixed foot anchor.
        weight = max(0.0, (97 - y) / 97)
        dx = round(top_x * weight)
        dy = round(top_y * weight)
        for x in range(96):
            sx, sy = x - dx, y - dy
            if 0 <= sx < 96 and 0 <= sy < 128:
                dst[x, y] = src[sx, sy]
    return frame


def blink(frame: Image.Image) -> Image.Image:
    """Replace the small eye clusters with curved dark lids over skin tone."""
    out = frame.copy()
    draw = ImageDraw.Draw(out)
    # Coordinates apply after the frame-4 upper-body shift of (0, 0).
    skin = (251, 220, 192, 255)
    shade = (235, 199, 176, 255)
    lid = (84, 46, 38, 255)
    lash = (31, 26, 29, 255)
    draw.polygon([(48, 41), (54, 40), (57, 43), (57, 49),
                  (54, 52), (48, 51), (46, 47)], fill=skin)
    draw.line([(47, 46), (49, 47), (52, 48), (55, 47), (57, 45)], fill=lid, width=2)
    draw.point((47, 45), fill=lash)
    draw.point((57, 44), fill=lash)
    draw.line([(49, 50), (54, 51)], fill=shade, width=1)

    draw.polygon([(62, 44), (66, 43), (70, 46), (70, 51),
                  (67, 53), (62, 52), (60, 49)], fill=skin)
    draw.line([(61, 48), (63, 49), (66, 50), (69, 49), (70, 47)], fill=lid, width=2)
    draw.point((60, 47), fill=lash)
    draw.point((70, 46), fill=lash)
    draw.line([(63, 52), (67, 53)], fill=shade, width=1)
    return out


frames = [
    seed.copy(),
    pose(1, -1),
    pose(1, 0),
    blink(pose(0, 0)),
    pose(-1, 0),
    pose(0, -1),
]

for i, frame in enumerate(frames, 1):
    assert frame.size == (96, 128)
    assert set(frame.getchannel("A").get_flattened_data()) <= {0, 255}
    frame.save(OUT / f"{i:02}.png")

strip = Image.new("RGBA", (96 * len(frames), 128))
for i, frame in enumerate(frames):
    strip.alpha_composite(frame, (i * 96, 0))
strip.save(OUT.parent / "2026-10-24_aclaire_idle_strip_preview.png")

board = Image.new("RGBA", (6 * 192, 320), "#344058")
for i, frame in enumerate(frames):
    board.alpha_composite(frame.resize((192, 256), Image.Resampling.NEAREST), (i * 192, 24))
    ImageDraw.Draw(board).text((i * 192 + 80, 288), f"{i + 1:02}", fill="white")
board.save(OUT.parent / "2026-10-24_aclaire_idle_x2_review.png")

screen = Image.new("RGBA", (640, 360), "#293747")
screen_draw = ImageDraw.Draw(screen)
screen_draw.text((16, 16), "Aclaire idle / density 2 / 640x360 display probe", fill="white")
screen_draw.line((0, 286, 639, 286), fill="#7b7896")
for x, frame, label in ((176, frames[0], "open"), (420, frames[3], "blink")):
    logical = frame.resize((48, 64), Image.Resampling.LANCZOS)
    screen.alpha_composite(logical, (x, 222))
    screen_draw.text((x, 302), label, fill="white")
screen.save(OUT.parent / "2026-10-24_aclaire_idle_640x360.png")

frames[0].save(
    OUT.parent / "2026-10-24_aclaire_idle_motion.png",
    save_all=True,
    append_images=frames[1:],
    duration=[125] * 6,
    loop=0,
    disposal=2,
    blend=0,
)

assert (OUT / "01.png").read_bytes() == SEED.read_bytes()
print(f"Saved {len(frames)} frames and previews to {OUT.parent}")
