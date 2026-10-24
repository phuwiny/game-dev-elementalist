"""Normalize selected Aclaire run key poses into an eight-frame motion study.

This preview explores timing and frame width. It is not a production animation:
the second stride still reuses passing and flight artwork.
"""

from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "art"
OUT = ART / "previews/phase_b"
FRAMES = OUT / "2026-10-24_aclaire_run_study"
FRAMES.mkdir(parents=True, exist_ok=True)

idle = Image.open(
    ART / "previews/phase_a/2026-10-23_aclaire_seed_v4_256color_density2.png"
).convert("RGBA")
colors = sorted({p[:3] for p in idle.get_flattened_data() if p[3]})
palette_rgb = Image.new("P", (1, 1))
flat = [channel for rgb in colors for channel in rgb]
palette_rgb.putpalette((flat + [255] * (768 - len(flat)))[:768])


def normalize(source_name: str, foot_gap: int = 0) -> Image.Image:
    source = Image.open(ART / "concept" / source_name).convert("RGBA")
    mask = source.getchannel("A").point(lambda a: 255 if a >= 128 else 0)
    bbox = mask.getbbox()
    assert bbox is not None
    crop = source.crop(bbox)
    scale = min(124 / crop.height, 124 / crop.width)
    width = round(crop.width * scale)
    height = round(crop.height * scale)
    render = crop.resize((width, height), Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (128, 128))
    frame.alpha_composite(render, ((128 - width) // 2, 128 - foot_gap - height))
    alpha = frame.getchannel("A").point(lambda a: 255 if a >= 128 else 0)
    rgb = Image.new("RGB", frame.size, "#ffffff")
    rgb.paste(frame, mask=alpha)
    indexed = rgb.quantize(palette=palette_rgb, dither=Image.Dither.NONE)
    result = indexed.convert("RGB")
    result.putalpha(alpha)
    return result


contact = Image.open(OUT / "2026-10-24_aclaire_run_key_64x64_density2.png").convert("RGBA")
compression = normalize("2026-10-24_aclaire_run_compression_source.png")
passing = normalize("2026-10-24_aclaire_run_passing_v2_source.png")
flight = normalize("2026-10-24_aclaire_run_flight_source.png", foot_gap=7)
contact_alt = normalize("2026-10-24_aclaire_run_contact_alt_source.png")


def shift_top(frame: Image.Image, dx: int) -> Image.Image:
    result = Image.new("RGBA", frame.size)
    src, dst = frame.load(), result.load()
    for y in range(128):
        offset = round(dx * max(0, (95 - y) / 95))
        for x in range(128):
            sx = x - offset
            if 0 <= sx < 128:
                dst[x, y] = src[sx, y]
    return result


frames = [contact, compression, passing, flight,
          contact_alt, shift_top(compression, 1),
          shift_top(passing, 1), shift_top(flight, 1)]
for index, frame in enumerate(frames, 1):
    assert frame.size == (128, 128)
    assert set(frame.getchannel("A").get_flattened_data()) <= {0, 255}
    frame.save(FRAMES / f"{index:02}.png")

strip = Image.new("RGBA", (128 * 8, 128))
for index, frame in enumerate(frames):
    strip.alpha_composite(frame, (index * 128, 0))
strip.save(OUT / "2026-10-24_aclaire_run_study_strip.png")

board = Image.new("RGBA", (1024, 620), "#344058")
draw = ImageDraw.Draw(board)
draw.text((16, 12), "RUN MOTION STUDY / 64x64 logical / second stride needs redraw", fill="white")
for index, frame in enumerate(frames):
    x = (index % 4) * 256
    y = 32 + (index // 4) * 290
    board.alpha_composite(frame.resize((256, 256), Image.Resampling.NEAREST), (x, y))
    draw.text((x + 120, y + 259), f"{index + 1:02}", fill="white")
board.save(OUT / "2026-10-24_aclaire_run_study_x2.png")

frames[0].save(OUT / "2026-10-24_aclaire_run_study_motion.png", save_all=True,
               append_images=frames[1:], duration=[83] * 8, loop=0,
               disposal=2, blend=0)

print("run study:", [(f.getbbox(), len({p[:3] for p in f.get_flattened_data() if p[3]})) for f in frames])
