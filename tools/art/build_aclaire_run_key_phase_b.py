"""Normalize an Aclaire running key pose for Phase B size review."""

from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "art/concept/2026-10-24_aclaire_run_key_source.png"
IDLE = ROOT / "art/previews/phase_a/2026-10-23_aclaire_seed_v4_256color_density2.png"
OUT = ROOT / "art/previews/phase_b"
OUT.mkdir(parents=True, exist_ok=True)

source = Image.open(SOURCE).convert("RGBA")
alpha = source.getchannel("A").point(lambda a: 255 if a >= 128 else 0)
bbox = alpha.getbbox()
assert bbox is not None
crop = source.crop(bbox)

# Keep the approved V4's near-full-height sprite scale. The wider running
# silhouette needs a 64x64 logical slot (128x128 physical), subject to review.
target_height = 124
target_width = round(crop.width * target_height / crop.height)
assert target_width <= 128, (target_width, target_height)
render = crop.resize((target_width, target_height), Image.Resampling.LANCZOS)
frame = Image.new("RGBA", (128, 128))
frame.alpha_composite(render, ((128 - target_width) // 2, 128 - target_height))
alpha = frame.getchannel("A").point(lambda a: 255 if a >= 128 else 0)

rgb = Image.new("RGB", frame.size, "#ffffff")
rgb.paste(frame, mask=alpha)
reduced = rgb.quantize(colors=256, method=Image.Quantize.MEDIANCUT,
                       dither=Image.Dither.NONE).convert("RGB")
reduced.putalpha(alpha)
reduced.save(OUT / "2026-10-24_aclaire_run_key_64x64_density2.png")

idle = Image.open(IDLE).convert("RGBA")
board = Image.new("RGBA", (700, 360), "#344058")
draw = ImageDraw.Draw(board)
draw.text((24, 18), "Aclaire V4 idle / proposed run key", fill="white")
board.alpha_composite(idle.resize((192, 256), Image.Resampling.NEAREST), (60, 55))
board.alpha_composite(reduced.resize((256, 256), Image.Resampling.NEAREST), (340, 55))
draw.text((78, 321), "idle 48x64 logical", fill="white")
draw.text((382, 321), "run 64x64 logical", fill="white")
board.save(OUT / "2026-10-24_aclaire_run_key_scale_review.png")

screen = Image.new("RGBA", (640, 360), "#293747")
draw = ImageDraw.Draw(screen)
draw.text((16, 16), "640x360 / run frame width proposal", fill="white")
draw.line((0, 286, 639, 286), fill="#7b7896")
screen.alpha_composite(idle.resize((48, 64), Image.Resampling.LANCZOS), (170, 222))
screen.alpha_composite(reduced.resize((64, 64), Image.Resampling.LANCZOS), (412, 222))
draw.text((168, 303), "idle", fill="white")
draw.text((412, 303), "run key", fill="white")
screen.save(OUT / "2026-10-24_aclaire_run_key_640x360.png")

colors = len({pixel[:3] for pixel in reduced.get_flattened_data() if pixel[3]})
assert reduced.size == (128, 128)
assert set(reduced.getchannel("A").get_flattened_data()) <= {0, 255}
assert colors <= 256
print(f"Run key: {reduced.size}, bbox={reduced.getbbox()}, colors={colors}")
