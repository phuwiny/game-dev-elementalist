"""Build a two-frame jump-up review from the approved V4 pose."""

from pathlib import Path
from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "art"
OUT = ART / "previews/phase_b"
FRAMES = OUT / "2026-10-24_aclaire_jump_up_v4_study"
FRAMES.mkdir(parents=True, exist_ok=True)

seed = Image.open(OUT / "2026-10-24_aclaire_jump_up_key_v4_48x64_density2.png").convert("RGBA")
sheet = Image.open(ART / "concept/2026-10-24_aclaire_jump_up_two_frame_source.png").convert("RGBA")
assert sheet.width % 2 == 0
right = sheet.crop((sheet.width // 2, 0, sheet.width, sheet.height))
mask = right.getchannel("A").point(lambda value: 255 if value >= 128 else 0)
bbox = mask.getbbox()
assert bbox is not None
right = right.crop(bbox)

colors = sorted({pixel[:3] for pixel in seed.get_flattened_data() if pixel[3]})
palette = Image.new("P", (1, 1))
flat = [channel for color in colors for channel in color]
palette.putpalette((flat + [255] * (768 - len(flat)))[:768])

factor = min(90 / right.width, 120 / right.height)
size = (round(right.width * factor), round(right.height * factor))
scaled = right.resize(size, Image.Resampling.LANCZOS)
second = Image.new("RGBA", (96, 128))
second.alpha_composite(scaled, ((96 - size[0]) // 2, 4))
alpha = second.getchannel("A").point(lambda value: 255 if value >= 128 else 0)
rgb = Image.new("RGB", second.size, "#ffffff")
rgb.paste(second, mask=alpha)
second = rgb.quantize(palette=palette, dither=Image.Dither.NONE).convert("RGB")
second.putalpha(alpha)


def eye_center(frame: Image.Image) -> tuple[int, int]:
    points = []
    for y in range(20, 70):
        for x in range(35, 90):
            r, g, b, a = frame.getpixel((x, y))
            if a and b > r + 25 and b > g + 8:
                points.append((x, y))
    assert points
    return (round(sum(x for x, _ in points) / len(points)),
            round(sum(y for _, y in points) / len(points)))


first_eye = eye_center(seed)
second_eye = eye_center(second)
dx = first_eye[0] - second_eye[0]
dy = first_eye[1] - second_eye[1] - 2  # deliberate two-pixel ascent
aligned = Image.new("RGBA", (96, 128))
aligned.alpha_composite(second, (dx, dy))
second = aligned

frames = [seed, second]
assert ImageChops.difference(frames[0], seed).getbbox() is None
for index, frame in enumerate(frames, 1):
    assert frame.size == (96, 128)
    assert set(frame.getchannel("A").get_flattened_data()) <= {0, 255}
    assert {pixel[:3] for pixel in frame.get_flattened_data() if pixel[3]} <= set(colors)
    frame.save(FRAMES / f"{index:02}.png")

strip = Image.new("RGBA", (192, 128))
strip.alpha_composite(seed, (0, 0))
strip.alpha_composite(second, (96, 0))
strip.save(OUT / "2026-10-24_aclaire_jump_up_v4_study_strip.png")

board = Image.new("RGBA", (768, 550), "#344058")
draw = ImageDraw.Draw(board)
draw.text((20, 10), "ACLAIRE / jump_up 2-frame study / 48x64 logical / 10 fps", fill="white")
for index, frame in enumerate(frames):
    board.alpha_composite(frame.resize((384, 512), Image.Resampling.NEAREST), (index * 384, 30))
    draw.text((index * 384 + 170, 535), f"{index + 1:02}", fill="white")
board.save(OUT / "2026-10-24_aclaire_jump_up_v4_study_x4.png")

seed.save(OUT / "2026-10-24_aclaire_jump_up_v4_study_motion.png", save_all=True,
          append_images=[second], duration=[100, 100], loop=0, disposal=2, blend=0)
logical = [frame.resize((48, 64), Image.Resampling.LANCZOS) for frame in frames]
logical[0].save(OUT / "2026-10-24_aclaire_jump_up_v4_study_logical_motion.png",
                save_all=True, append_images=[logical[1]], duration=[100, 100],
                loop=0, disposal=2, blend=0)

screen = Image.new("RGBA", (640, 360), "#293747")
screen_draw = ImageDraw.Draw(screen)
screen_draw.text((16, 16), "Aclaire jump_up study / 640x360 / 10 fps", fill="white")
screen_draw.line((0, 286, 639, 286), fill="#7b7896")
for index, frame in enumerate(logical):
    x = 255 + index * 120
    screen.alpha_composite(frame, (x, 190 - 4 * index))
    screen_draw.text((x + 14, 298), f"{index + 1:02}", fill="white")
screen.save(OUT / "2026-10-24_aclaire_jump_up_v4_study_640x360.png")

print("eyes", first_eye, second_eye, eye_center(second), "second bbox", second.getbbox(), "scale", factor)
