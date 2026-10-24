"""Stabilize the Aclaire V2 run study with a measured face anchor.

V2's independently generated poses were normalized by canvas height only.
That allowed the face to swing nearly 14 physical pixels between adjacent
frames and made the passing frames' heads visibly smaller. V3 keeps V2 intact
and applies integer translation, a small passing-only proportion correction,
and a deliberate vertical run bob.
"""

from pathlib import Path
from PIL import Image, ImageDraw
import json

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "art/previews/phase_b"
SOURCE = OUT / "2026-10-24_aclaire_run_v2_study"
FRAMES = OUT / "2026-10-24_aclaire_run_v3_study"
FRAMES.mkdir(parents=True, exist_ok=True)

# Rounded blue-eye centers measured in the immutable V2 physical frames.
EYE_X = [83, 93, 79, 86, 81, 93, 79, 90]
TARGET_EYE_X = 84
Y_OFFSETS = [0, 0, -2, 0, 0, 0, -2, 4]


def move(frame: Image.Image, dx: int, dy: int) -> Image.Image:
    shifted = Image.new("RGBA", frame.size)
    shifted.alpha_composite(frame, (dx, dy))
    return shifted


def reshape_passing(frame: Image.Image) -> Image.Image:
    """Enlarge the passing pose's head/torso 12%, fit legs to 128px."""
    out = Image.new("RGBA", frame.size)
    src, dst = frame.load(), out.load()
    upper_src_end = 66
    upper_dst_end = 4 + round((upper_src_end - 4) * 1.12)
    leg_scale = (127 - upper_dst_end) / (127 - upper_src_end)
    for y in range(128):
        sy = (4 + (y - 4) / 1.12 if y <= upper_dst_end else
              upper_src_end + (y - upper_dst_end) / leg_scale)
        sx_scale = (1.12 if y <= upper_dst_end else
                    1.12 - 0.12 * (y - upper_dst_end) / (127 - upper_dst_end))
        for x in range(128):
            sx = 84 + (x - 84) / sx_scale
            ix, iy = round(sx), round(sy)
            if 0 <= ix < 128 and 0 <= iy < 128:
                dst[x, y] = src[ix, iy]
    return out


frames = []
for index in range(8):
    original = Image.open(SOURCE / f"{index + 1:02}.png").convert("RGBA")
    aligned = move(original, TARGET_EYE_X - EYE_X[index], 0)
    if index in (2, 6):
        aligned = reshape_passing(aligned)
    aligned = move(aligned, 0, Y_OFFSETS[index])
    assert aligned.size == (128, 128)
    assert set(aligned.getchannel("A").get_flattened_data()) <= {0, 255}
    aligned.save(FRAMES / f"{index + 1:02}.png")
    frames.append(aligned)


def eye_center(frame: Image.Image) -> tuple[float, float]:
    eye_pixels = []
    for y in range(27, 70):
        for x in range(38, 104):
            r, g, b, a = frame.getpixel((x, y))
            if a and b > r + 25 and b > g + 8:
                eye_pixels.append((x, y))
    assert eye_pixels
    return (round(sum(x for x, _ in eye_pixels) / len(eye_pixels), 1),
            round(sum(y for _, y in eye_pixels) / len(eye_pixels), 1))


old_frames = [Image.open(SOURCE / f"{index + 1:02}.png").convert("RGBA")
              for index in range(8)]
old_eyes = [eye_center(frame) for frame in old_frames]
new_eyes = [eye_center(frame) for frame in frames]
old_horizontal_range = round(max(x for x, _ in old_eyes) - min(x for x, _ in old_eyes), 1)
new_horizontal_range = round(max(x for x, _ in new_eyes) - min(x for x, _ in new_eyes), 1)
assert new_horizontal_range <= 2 and new_horizontal_range < old_horizontal_range

v4 = Image.open(ROOT / "art/previews/phase_a/2026-10-23_aclaire_seed_v4_256color_density2.png").convert("RGBA")
v4_colors = {p[:3] for p in v4.get_flattened_data() if p[3]}
color_counts = []
for frame in frames:
    used = {p[:3] for p in frame.get_flattened_data() if p[3]}
    assert used <= v4_colors
    color_counts.append(len(used))

metrics = {
    "frame_size_physical": [128, 128],
    "logical_frame_size": [64, 64],
    "frame_count": 8,
    "fps_approx": 12,
    "v2_eye_centers": old_eyes,
    "v3_eye_centers": new_eyes,
    "v2_horizontal_eye_range_px": old_horizontal_range,
    "v3_horizontal_eye_range_px": new_horizontal_range,
    "opaque_color_counts": color_counts,
    "palette_source": "approved Aclaire V4 seed",
    "alpha_values": [0, 255],
}
(ROOT / "art/reports/2026-10-24_aclaire_run_v3_metrics.json").write_text(
    json.dumps(metrics, indent=2) + "\n", encoding="utf-8", newline="\n"
)

strip = Image.new("RGBA", (8 * 128, 128))
for index, frame in enumerate(frames):
    strip.alpha_composite(frame, (index * 128, 0))
strip.save(OUT / "2026-10-24_aclaire_run_v3_study_strip.png")

board = Image.new("RGBA", (1024, 620), "#344058")
draw = ImageDraw.Draw(board)
draw.text((16, 12), "RUN V3 / face anchor + passing proportion / 64x64 logical", fill="white")
for index, frame in enumerate(frames):
    x, y = (index % 4) * 256, 32 + (index // 4) * 290
    board.alpha_composite(frame.resize((256, 256), Image.Resampling.NEAREST), (x, y))
    draw.text((x + 120, y + 259), f"{index + 1:02}", fill="white")
board.save(OUT / "2026-10-24_aclaire_run_v3_study_x2.png")

comparison = Image.new("RGBA", (1024, 320), "#344058")
cmp_draw = ImageDraw.Draw(comparison)
cmp_draw.text((12, 8), "V2 / unaligned", fill="white")
cmp_draw.text((12, 164), "V3 / face-anchored", fill="white")
for index, frame in enumerate(frames):
    old = old_frames[index]
    comparison.alpha_composite(old, (index * 128, 28))
    comparison.alpha_composite(frame, (index * 128, 184))
comparison.save(OUT / "2026-10-24_aclaire_run_v2_v3_comparison.png")

frames[0].save(OUT / "2026-10-24_aclaire_run_v3_study_motion.png",
               save_all=True, append_images=frames[1:], duration=[83] * 8,
               loop=0, disposal=2, blend=0)
logical_frames = [frame.resize((64, 64), Image.Resampling.LANCZOS) for frame in frames]
logical_frames[0].save(OUT / "2026-10-24_aclaire_run_v3_study_logical_motion.png",
                       save_all=True, append_images=logical_frames[1:],
                       duration=[83] * 8, loop=0, disposal=2, blend=0)

screen = Image.new("RGBA", (640, 360), "#293747")
draw = ImageDraw.Draw(screen)
draw.text((16, 16), "Aclaire run V3 / 640x360 / static size probe", fill="white")
draw.line((0, 286, 639, 286), fill="#7b7896")
for x, index in ((122, 0), (242, 2), (362, 4), (482, 6)):
    screen.alpha_composite(logical_frames[index], (x, 222))
    draw.text((x + 22, 302), f"{index + 1:02}", fill="white")
screen.save(OUT / "2026-10-24_aclaire_run_v3_study_640x360.png")

print("Saved eight aligned V3 physical frames and comparison previews")
