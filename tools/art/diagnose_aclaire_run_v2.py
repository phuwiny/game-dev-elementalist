"""Measure visible anchor and scale drift in the V2 run preview."""

from pathlib import Path
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
FRAME_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "art/previews/phase_b/2026-10-24_aclaire_run_v2_study"


def mean(points):
    return (round(sum(x for x, _ in points) / len(points), 1),
            round(sum(y for _, y in points) / len(points), 1)) if points else None


data = []
for n in range(1, 9):
    image = Image.open(FRAME_DIR / f"{n:02}.png").convert("RGBA")
    all_points = []
    hair = []
    eyes = []
    for y in range(128):
        for x in range(128):
            r, g, b, a = image.getpixel((x, y))
            if not a:
                continue
            all_points.append((x, y))
            if y < 65 and r > 150 and g > 45 and b < 115 and r > g + 32:
                hair.append((x, y))
            if 27 <= y <= 69 and 38 <= x <= 103 and b > r + 25 and b > g + 8:
                eyes.append((x, y))
    bbox = image.getbbox()
    head_width = max((x for x, _ in hair), default=0) - min((x for x, _ in hair), default=0) + 1
    row = {
        "frame": n,
        "bbox": bbox,
        "opaque_area": len(all_points),
        "opaque_center": mean(all_points),
        "hair_center": mean(hair),
        "hair_width": head_width,
        "eye_center": mean(eyes),
        "eye_bbox": (min(x for x, _ in eyes), min(y for _, y in eyes),
                     max(x for x, _ in eyes) + 1, max(y for _, y in eyes) + 1) if eyes else None,
        "eye_area": len(eyes),
    }
    data.append(row)
    print(row)

print("adjacent hair center jumps:")
for first, second in zip(data, data[1:] + data[:1]):
    a, b = first["hair_center"], second["hair_center"]
    if a and b:
        print(f"{first['frame']}->{second['frame']}: ({b[0]-a[0]:+.1f}, {b[1]-a[1]:+.1f})")
