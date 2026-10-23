"""Normalize the Aclaire jump-up key for Phase B visual review."""

from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "art"
OUT = ART / "previews/phase_b"
SOURCE = ART / "concept/2026-10-24_aclaire_jump_up_key_source.png"
SEED = ART / "previews/phase_a/2026-10-23_aclaire_seed_v4_256color_density2.png"

source = Image.open(SOURCE).convert("RGBA")
seed = Image.open(SEED).convert("RGBA")
colors = sorted({pixel[:3] for pixel in seed.get_flattened_data() if pixel[3]})
palette = Image.new("P", (1, 1))
flat = [channel for color in colors for channel in color]
palette.putpalette((flat + [255] * (768 - len(flat)))[:768])

bbox = source.getchannel("A").point(lambda value: 255 if value >= 128 else 0).getbbox()
assert bbox is not None
crop = source.crop(bbox)
factor = min(92 / crop.width, 120 / crop.height)
size = (round(crop.width * factor), round(crop.height * factor))
scaled = crop.resize(size, Image.Resampling.LANCZOS)
frame = Image.new("RGBA", (96, 128))
frame.alpha_composite(scaled, ((96 - size[0]) // 2, (128 - size[1]) // 2))
alpha = frame.getchannel("A").point(lambda value: 255 if value >= 128 else 0)
rgb = Image.new("RGB", frame.size, "#ffffff")
rgb.paste(frame, mask=alpha)
indexed = rgb.quantize(palette=palette, dither=Image.Dither.NONE)
frame = indexed.convert("RGB")
frame.putalpha(alpha)

key_path = OUT / "2026-10-24_aclaire_jump_up_key_48x64_density2.png"
frame.save(key_path)

review = Image.new("RGBA", (504, 284), "#344058")
draw = ImageDraw.Draw(review)
draw.text((16, 10), "ACLAIRE / jump_up key / 48x64 logical", fill="white")
review.alpha_composite(seed.resize((192, 256), Image.Resampling.NEAREST), (40, 24))
review.alpha_composite(frame.resize((192, 256), Image.Resampling.NEAREST), (272, 24))
draw.text((98, 267), "V4 idle", fill="white")
draw.text((333, 267), "jump_up", fill="white")
review.save(OUT / "2026-10-24_aclaire_jump_up_key_x2_review.png")

screen = Image.new("RGBA", (640, 360), "#293747")
screen_draw = ImageDraw.Draw(screen)
screen_draw.text((16, 16), "Aclaire jump_up / 640x360 display size", fill="white")
screen_draw.line((0, 286, 639, 286), fill="#7b7896")
screen.alpha_composite(seed.resize((48, 64), Image.Resampling.LANCZOS), (220, 210))
screen.alpha_composite(frame.resize((48, 64), Image.Resampling.LANCZOS), (370, 174))
screen_draw.text((222, 298), "V4 idle", fill="white")
screen_draw.text((370, 298), "jump_up", fill="white")
screen.save(OUT / "2026-10-24_aclaire_jump_up_key_640x360.png")

assert frame.size == (96, 128)
assert set(frame.getchannel("A").get_flattened_data()) <= {0, 255}
used = {pixel[:3] for pixel in frame.get_flattened_data() if pixel[3]}
assert used <= set(colors)
print("jump_up key", frame.getbbox(), len(used), "colors")
