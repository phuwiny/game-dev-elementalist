"""Prepare three V4 sword-combo key poses for visual review, outside the game atlas."""
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image, ImageDraw
from build_player_movement_atlas import eye_center, indexed

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/previews/phase_b/2026-10-25_attack_keys'
SOURCES = {
    'attack_1': ROOT / 'art/concept/2026-10-25_aclaire_attack_1_key_source_v2.png',
    'attack_2': ROOT / 'art/concept/2026-10-25_aclaire_attack_2_key_source.png',
    'attack_3': ROOT / 'art/concept/2026-10-25_aclaire_attack_3_key_source.png',
}
FRAME = (192, 128)
EYE_X = 105  # Same +9 physical px offset from bottom-center as approved idle.
TIP_LIMIT = 176  # Body center 96 + 40 logical px at density 2.


def key_frame(path: Path) -> tuple[Image.Image, dict]:
    source = Image.open(path).convert('RGBA')
    mask = source.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
    box = mask.getbbox()
    eye = eye_center(source)
    scale = .985 * min(120 / (box[3] - box[1]),
                      (TIP_LIMIT - EYE_X) / (box[2] - eye[0]))
    if path == SOURCES['attack_3']:
        # The generated finisher reads larger than the first two poses.
        # Reduce it uniformly while keeping the planted sole on the baseline.
        scale *= .90
    cropped = source.crop(box)
    size = (round(cropped.width * scale), round(cropped.height * scale))
    image = indexed(cropped.resize(size, Image.Resampling.NEAREST))
    resized_eye = eye_center(image)
    x = round(EYE_X - resized_eye[0])
    y = FRAME[1] - image.getbbox()[3]
    if x < 0 or x + image.width > FRAME[0] or y < 0:
        raise ValueError(f'Key pose would clip: {path.name}, {(x,y)}, {size}')
    frame = Image.new('RGBA', FRAME)
    frame.alpha_composite(image, (x, y))
    bounds = frame.getbbox()
    if bounds[2] > TIP_LIMIT:
        raise ValueError(f'Sword reach exceeds 40 logical px: {path.name}, {bounds}')
    return frame, {'source': path.name, 'frame': FRAME, 'bounds': bounds,
                   'eye': eye_center(frame), 'sole_row': bounds[3] - 1,
                   'right_reach_logical': (bounds[2] - 96) / 2,
                   'scale_from_source': round(scale, 4),
                   'opaque_colors': len({p[:3] for p in frame.get_flattened_data() if p[3]})}


def build() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    keys = {}
    metrics = {}
    for name, path in SOURCES.items():
        keys[name], metrics[name] = key_frame(path)
        keys[name].save(OUT / f'{name}_key.png')

    background = '#2b2440'
    board = Image.new('RGBA', (640, 360), background)
    draw = ImageDraw.Draw(board)
    draw.text((18, 15), 'ACLAIRE V4 / SWORD COMBO KEY POSES', fill='#f2efe6')
    draw.text((18, 31), '640 x 360 / density 2 / logical size preview', fill='#b4b2c9')
    idle = Image.open(ROOT / 'art/frames/player/idle_000.png').convert('RGBA')
    idle = idle.resize((48, 64), Image.Resampling.NEAREST)
    board.alpha_composite(idle, (40, 137))
    draw.text((42, 211), 'approved idle', fill='#f2efe6')
    for i, (name, title) in enumerate(zip(keys, ('horizontal', 'rising', 'heavy down'))):
        x = 150 + i * 157
        logical = keys[name].resize((96, 64), Image.Resampling.NEAREST)
        board.alpha_composite(logical, (x, 137))
        draw.line((x + 48, 127, x + 48, 205), fill='#48c9a0', width=1)
        draw.text((x + 7, 211), f'{name} / {title}', fill='#f2efe6')
    draw.line((20, 201, 625, 201), fill='#48c9a0', width=1)
    draw.text((18, 268), 'Key pose review only. Sword FX and in-between frames are pending.', fill='#b4b2c9')
    draw.text((18, 284), 'Production atlas and animations are unchanged.', fill='#b4b2c9')
    board.convert('RGB').save(OUT / '2026-10-25_aclaire_attack_keys_640x360.png')

    zoom = Image.new('RGB', (1040, 350), background)
    pen = ImageDraw.Draw(zoom)
    pen.text((15, 10), 'ACLAIRE V4 / ATTACK KEYS / PHYSICAL 192 x 128', fill='#f2efe6')
    for i, name in enumerate(keys):
        x = 35 + i * 310
        enlarged = keys[name].resize((384, 256), Image.Resampling.NEAREST)
        zoom.paste(enlarged, (x, 38), enlarged)
        pen.text((x + 80, 305), name, fill='#f2efe6')
    zoom.save(OUT / '2026-10-25_aclaire_attack_keys_x2.png')
    (OUT / '2026-10-25_aclaire_attack_key_metrics.json').write_text(
        json.dumps(metrics, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(json.dumps(metrics, indent=2))


if __name__ == '__main__':
    build()
