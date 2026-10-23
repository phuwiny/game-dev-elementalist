"""Normalize the Aclaire jump-up key for Phase B visual review."""

from pathlib import Path
import argparse
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "art"
OUT = ART / "previews/phase_b"
parser = argparse.ArgumentParser()
parser.add_argument("--version", choices=("v1", "v2"), default="v1")
args = parser.parse_args()
suffix = "" if args.version == "v1" else "_v2"
SOURCE = ART / f"concept/2026-10-24_aclaire_jump_up_key{suffix}_source.png"
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

key_path = OUT / f"2026-10-24_aclaire_jump_up_key{suffix}_48x64_density2.png"
frame.save(key_path)

review = Image.new("RGBA", (504, 284), "#344058")
draw = ImageDraw.Draw(review)
review_title = ("ACLAIRE / jump_up key / 48x64 logical" if args.version == "v1"
                else "ACLAIRE / jump_up key v2 / 48x64 logical")
draw.text((16, 10), review_title, fill="white")
review.alpha_composite(seed.resize((192, 256), Image.Resampling.NEAREST), (40, 24))
review.alpha_composite(frame.resize((192, 256), Image.Resampling.NEAREST), (272, 24))
draw.text((98, 267), "V4 idle", fill="white")
draw.text((333, 267), "jump_up", fill="white")
review.save(OUT / f"2026-10-24_aclaire_jump_up_key{suffix}_x2_review.png")

if args.version == "v2":
    previous = Image.open(OUT / "2026-10-24_aclaire_jump_up_key_48x64_density2.png").convert("RGBA")
    comparison = Image.new("RGBA", (768, 552), "#344058")
    cmp_draw = ImageDraw.Draw(comparison)
    cmp_draw.text((24, 12), "JUMP-UP SWORD AXIS / V1 vs V2 / 4x nearest", fill="white")
    comparison.alpha_composite(previous.resize((384, 512), Image.Resampling.NEAREST), (0, 28))
    comparison.alpha_composite(frame.resize((384, 512), Image.Resampling.NEAREST), (384, 28))
    cmp_draw.text((170, 534), "V1", fill="white")
    cmp_draw.text((554, 534), "V2", fill="white")
    comparison.save(OUT / "2026-10-24_aclaire_jump_up_key_v1_v2_comparison.png")

screen = Image.new("RGBA", (640, 360), "#293747")
screen_draw = ImageDraw.Draw(screen)
screen_title = ("Aclaire jump_up / 640x360 display size" if args.version == "v1"
                else "Aclaire jump_up v2 / 640x360 display size")
screen_draw.text((16, 16), screen_title, fill="white")
screen_draw.line((0, 286, 639, 286), fill="#7b7896")
screen.alpha_composite(seed.resize((48, 64), Image.Resampling.LANCZOS), (220, 210))
screen.alpha_composite(frame.resize((48, 64), Image.Resampling.LANCZOS), (370, 174))
screen_draw.text((222, 298), "V4 idle", fill="white")
screen_draw.text((370, 298), "jump_up", fill="white")
screen.save(OUT / f"2026-10-24_aclaire_jump_up_key{suffix}_640x360.png")

assert frame.size == (96, 128)
assert set(frame.getchannel("A").get_flattened_data()) <= {0, 255}
used = {pixel[:3] for pixel in frame.get_flattened_data() if pixel[3]}
assert used <= set(colors)
print("jump_up key", frame.getbbox(), len(used), "colors")
