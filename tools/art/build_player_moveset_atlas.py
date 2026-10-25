"""Pack the seven approved V4 moveset actions without changing existing frames."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

from build_player_moveset_motion_review import build as build_motion
from pack_atlas import pack

ROOT = Path(__file__).resolve().parents[2]
FRAMES = ROOT / 'art/frames/player'
ATLAS = ROOT / 'public/assets/sprites/player/player'
ANIMS = ROOT / 'public/assets/animations.json'
KEY_REVIEW = ROOT / 'art/previews/phase_b/2026-10-25_moveset_key_review'
MOTION_REVIEW = ROOT / 'art/previews/phase_b/2026-10-25_moveset_motion'
ANIMATIONS = {
    'double_jump': (4, 14, 0, KEY_REVIEW),
    'cast': (4, 12, 0, KEY_REVIEW),
    'dash': (3, 16, 0, KEY_REVIEW),
    'glide': (4, 10, -1, KEY_REVIEW),
    'ground_slam': (5, 14, 0, MOTION_REVIEW),
    'hurt': (2, 10, 0, MOTION_REVIEW),
    'dead': (6, 10, 0, MOTION_REVIEW),
}


def build() -> None:
    build_motion()
    baseline = {path.name: path.read_bytes() for path in FRAMES.glob('*.png')
                if not path.stem.startswith(tuple(f'{name}_' for name in ANIMATIONS))}
    if len(baseline) != 31:
        raise ValueError(f'Expected 31 approved player frames, found {len(baseline)}')
    for action, (count, _, _, source) in ANIMATIONS.items():
        for index in range(count):
            name = f'{action}_{index:03}.png'
            image = Image.open(source / name).convert('RGBA')
            if image.size != (96, 128):
                raise ValueError(f'Wrong frame size: {name}')
            image.save(FRAMES / name)
    if any((FRAMES / name).read_bytes() != data for name, data in baseline.items()):
        raise ValueError('An approved player frame changed')
    atlas = pack(FRAMES, ATLAS)
    if len(atlas['frames']) != 59:
        raise ValueError(f"Expected 59 player frames, got {len(atlas['frames'])}")
    data = json.loads(ANIMS.read_text(encoding='utf-8'))
    for action, (count, fps, repeat, _) in ANIMATIONS.items():
        data[f'player_{action}'] = {'atlas': 'player', 'prefix': action + '_',
                                    'frames': count, 'frameRate': fps, 'repeat': repeat}
    ANIMS.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f"Packed {len(atlas['frames'])} player frames: {atlas['meta']['size']}")


if __name__ == '__main__':
    build()
