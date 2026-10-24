"""Pack untrimmed RGBA frames deterministically into a Phaser JSON Hash atlas."""

from pathlib import Path
import argparse
import json
from PIL import Image


def pack(frames_dir: Path, output: Path, width: int = 1024) -> dict:
    paths = sorted(frames_dir.glob('*.png'))
    if not paths:
        raise ValueError(f'No frames in {frames_dir}')
    if not 1 <= width <= 2048:
        raise ValueError('Atlas width must be 1..2048')
    frames, placements = {}, []
    x = y = 2
    row_height = 0
    for path in paths:
        with Image.open(path) as source:
            if source.mode != 'RGBA':
                raise ValueError(f'{path}: expected RGBA')
            image = source.copy()
        w, h = image.size
        if w + 4 > width:
            raise ValueError(f'{path}: frame exceeds atlas width')
        if x + w + 2 > width:
            x, y, row_height = 2, y + row_height + 2, 0
        frames[path.stem] = {
            'frame': {'x': x, 'y': y, 'w': w, 'h': h},
            'rotated': False, 'trimmed': False,
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h},
            'sourceSize': {'w': w, 'h': h},
            'pivot': {'x': 0.5, 'y': 1.0},
        }
        placements.append((image, x, y))
        x += w + 2
        row_height = max(row_height, h)
    height = y + row_height + 2
    if height > 2048:
        raise ValueError('Atlas exceeds 2048px height')
    atlas = Image.new('RGBA', (width, height))
    for image, x, y in placements:
        atlas.paste(image, (x, y))
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output.with_suffix('.png'))
    data = {'frames': frames, 'meta': {
        'app': 'Elemental Spirit pack_atlas', 'version': '1',
        'image': output.with_suffix('.png').name, 'format': 'RGBA8888',
        'size': {'w': width, 'h': height}, 'scale': '1',
    }}
    output.with_suffix('.json').write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8', newline='\n')
    return data


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('frames_dir', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--width', type=int, default=1024)
    args = parser.parse_args()
    result = pack(args.frames_dir, args.output, args.width)
    print(f"Packed {len(result['frames'])} frames: {result['meta']['size']}")
