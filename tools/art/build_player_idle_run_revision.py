"""Pixel-preserving V4 head rig and calm, planted breathing revision.

Original approved studies remain untouched. Reuse the approved head at 1:1
instead of fitting the entire run silhouette separately for every pose.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/previews/phase_b/2026-10-24_idle_run_revision'
SEED = ROOT / 'art/previews/phase_a/2026-10-23_aclaire_seed_v4_256color_density2.png'


def build():
    seed = Image.open(SEED).convert('RGBA')
    blink_source = Image.open(ROOT / 'art/concept/2026-10-24_aclaire_blink_revision_source.png').convert('RGBA')
    bounds = blink_source.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()
    aligned_blink = Image.new('RGBA', seed.size)
    aligned_blink.alpha_composite(blink_source.crop(bounds).resize((68, 124), Image.Resampling.NEAREST), (13, 4))
    # Bring across only the generated eyelids. Head, eyebrows, mouth and hair
    # retain the approved seed pixels; no whole-face redraw drift.
    eye_mask = Image.new('L', seed.size)
    draw = ImageDraw.Draw(eye_mask)
    draw.polygon([(47, 41), (54, 40), (58, 43), (58, 50), (54, 52), (47, 51), (46, 46)], fill=255)
    draw.polygon([(62, 44), (67, 43), (70, 46), (70, 52), (66, 54), (61, 52), (60, 48)], fill=255)
    blink_seed = seed.copy()
    blink_seed.paste(aligned_blink, (0, 0), eye_mask)
    # Remove the extra black brow produced above the closed left eyelid.
    # Keep the curved dark eyelid itself (y=46+) intact.
    clean = ImageDraw.Draw(blink_seed)
    clean.rectangle((50, 41, 57, 42), fill=(252, 225, 201, 255))
    (OUT / 'idle').mkdir(parents=True, exist_ok=True)
    # One smooth inhale/exhale cycle: upper body moves together, no x sway,
    # no isolated head deformation, and the feet never move.
    for i, offset in enumerate((0, 0, 1, 1, 1, 0)):
        pose = blink_seed if i == 3 else seed
        frame = pose.copy()
        if offset:
            frame = Image.new('RGBA', seed.size)
            frame.paste(pose.crop((0, 0, 96, 90)), (0, 1))
            frame.paste(pose.crop((0, 91, 96, 128)), (0, 91))
        frame.save(OUT / 'idle' / f'{i+1:02}.png')
if __name__ == '__main__':
    build()
