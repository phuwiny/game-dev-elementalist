"""Add the approved sword-combo animations to the existing V4 player atlas."""
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image
from build_player_attack_motion_review import build as build_motion, COUNT, OUT
from pack_atlas import pack

ROOT = Path(__file__).resolve().parents[2]
FRAMES = ROOT / 'art/frames/player'
ATLAS = ROOT / 'public/assets/sprites/player/player'
ANIMS = ROOT / 'public/assets/animations.json'


def build() -> None:
    build_motion()
    baseline = {p.name: p.read_bytes() for p in FRAMES.glob('*.png')
                if not p.stem.startswith(('attack_1_', 'attack_2_', 'attack_3_'))}
    if len(baseline) != 18:
        raise ValueError(f'Expected 18 approved movement frames, got {len(baseline)}')
    for action, count in COUNT.items():
        for i in range(count):
            name = f'{action}_{i:03}.png'
            image = Image.open(OUT / name).convert('RGBA')
            if image.size != (192,128):
                raise ValueError(f'Wrong frame size: {name}')
            image.save(FRAMES / name)
    if any((FRAMES/name).read_bytes() != data for name,data in baseline.items()):
        raise ValueError('An approved movement frame changed')
    atlas = pack(FRAMES, ATLAS)
    if len(atlas['frames']) != 31:
        raise ValueError(f"Expected 31 player frames, got {len(atlas['frames'])}")
    data = json.loads(ANIMS.read_text(encoding='utf-8'))
    for action, count in COUNT.items():
        data[f'player_{action}'] = {'atlas': 'player', 'prefix': action+'_',
                                    'frames': count, 'frameRate': 16, 'repeat': 0}
    ANIMS.write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(f"Packed {len(atlas['frames'])} player frames: {atlas['meta']['size']}")


if __name__ == '__main__':
    build()
