"""Build approved-key-locked V4 motion previews for the remaining player actions."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw

from build_player_movement_atlas import COLORS, eye_center, indexed
from build_player_moveset_key_review import build as build_keys

ROOT = Path(__file__).resolve().parents[2]
KEYS = ROOT / 'art/previews/phase_b/2026-10-25_moveset_key_review'
OUT = ROOT / 'art/previews/phase_b/2026-10-25_moveset_motion'
SOURCES = {
    'ground_slam': ROOT / 'art/concept/2026-10-25_aclaire_ground_slam_strip_source.png',
    'hurt': ROOT / 'art/concept/2026-10-25_aclaire_hurt_strip_source.png',
    'dead': ROOT / 'art/concept/2026-10-25_aclaire_dead_strip_source_v2.png',
}
CELLS = {'ground_slam': [(0, 0), (1, 0), (2, 0), (0, 1), (1, 1)],
         'hurt': [(0, 0), (1, 0)],
         'dead': [(0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (2, 1)]}
LAYOUT = {'ground_slam': (3, 2), 'hurt': (2, 1), 'dead': (3, 2)}
KEY_SLOT = {'ground_slam': 2, 'hurt': 1, 'dead': 5}
FPS = {'ground_slam': 14, 'hurt': 10, 'dead': 10}
SIZE = (96, 128)
PALETTE = set(COLORS)


def separate_by_nearest_cell(source: Image.Image, action: str) -> list[Image.Image]:
    """Separate spaced source figures even when adjacent rows overlap in y."""
    width, height = source.size
    columns, rows = LAYOUT[action]
    centers = [((column + .5) * width / columns, (row + .5) * height / rows)
               for column, row in CELLS[action]]
    alpha = source.getchannel('A').tobytes()
    masks = [bytearray(width * height) for _ in centers]
    for y in range(height):
        for x in range(width):
            offset = y * width + x
            if alpha[offset] < 200:
                continue
            best = min(range(len(centers)),
                       key=lambda i: (x - centers[i][0]) ** 2 + (y - centers[i][1]) ** 2)
            masks[best][offset] = 255
    cells = []
    for mask in masks:
        matte = Image.frombytes('L', source.size, bytes(mask))
        box = matte.getbbox()
        if not box:
            raise ValueError(f'Empty source pose in {action}')
        clean = source.copy()
        clean.putalpha(matte)
        cells.append(clean.crop(box))
    return cells


def normalize(cells: list[Image.Image], action: str) -> tuple[list[Image.Image], float]:
    scale = min(92 / max(image.width for image in cells),
                122 / max(image.height for image in cells))
    while True:
        resized = [indexed(image.resize((round(image.width * scale), round(image.height * scale)),
                                        Image.Resampling.NEAREST)) for image in cells]
        if action == 'dead':
            xs = [(SIZE[0] - image.width) // 2 for image in resized]
        else:
            eyes = [eye_center(image) for image in resized]
            if any(eye is None for eye in eyes):
                raise ValueError(f'Open eye missing in {action}')
            xs = [round(57 - eye[0]) for eye in eyes]
        if all(x >= 0 and x + image.width <= SIZE[0] for x, image in zip(xs, resized)):
            break
        scale *= .99
        if scale < .07:
            raise ValueError(f'{action} cannot fit frame with shared anchor')
    frames = []
    for image, x in zip(resized, xs):
        frame = Image.new('RGBA', SIZE)
        frame.alpha_composite(image, (x, SIZE[1] - image.height))
        frames.append(frame)
    return frames, scale


def keep_largest_component(frame: Image.Image) -> Image.Image:
    """Remove detached pixels borrowed from a neighboring source-grid cell."""
    width, height = frame.size
    alpha = frame.getchannel('A').tobytes()
    seen = bytearray(width * height)
    groups = []
    for start in range(width * height):
        if alpha[start] == 0 or seen[start]:
            continue
        pending = [start]
        seen[start] = 1
        group = []
        while pending:
            point = pending.pop()
            group.append(point)
            x, y = point % width, point // width
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < width and 0 <= ny < height:
                    neighbor = ny * width + nx
                    if alpha[neighbor] and not seen[neighbor]:
                        seen[neighbor] = 1
                        pending.append(neighbor)
        groups.append(group)
    if not groups:
        raise ValueError('Empty normalized frame')
    matte = bytearray(width * height)
    for point in max(groups, key=len):
        matte[point] = 255
    result = frame.copy()
    result.putalpha(Image.frombytes('L', frame.size, bytes(matte)))
    return result


def build() -> None:
    build_keys()
    OUT.mkdir(parents=True, exist_ok=True)
    metrics = {}
    for action, path in SOURCES.items():
        source = Image.open(path).convert('RGBA')
        frames, scale = normalize(separate_by_nearest_cell(source, action), action)
        if action == 'dead':
            frames = [keep_largest_component(frame) for frame in frames]
        key = Image.open(KEYS / f'{action}_key.png').convert('RGBA')
        frames[KEY_SLOT[action]] = key
        board = Image.new('RGB', (len(frames) * 212, 294), '#2b2440')
        pen = ImageDraw.Draw(board)
        gif = []
        measurements = []
        for index, frame in enumerate(frames):
            name = f'{action}_{index:03}'
            bounds = frame.getbbox()
            colors = {pixel[:3] for pixel in frame.get_flattened_data() if pixel[3]}
            if (frame.size != SIZE or bounds is None or bounds[3] != 128
                    or not colors <= PALETTE
                    or set(frame.getchannel('A').get_flattened_data()) - {0, 255}):
                raise ValueError(f'Invalid frame {name}: {bounds}')
            frame.save(OUT / f'{name}.png')
            measurements.append({'frame': name, 'bounds': bounds,
                                 'eye': eye_center(frame), 'colors': len(colors)})
            enlarged = frame.resize((192, 256), Image.Resampling.NEAREST)
            board.paste(enlarged, (index * 212 + 10, 8), enlarged)
            pen.line((index * 212 + 8, 266, index * 212 + 204, 266), fill='#48c9a0')
            pen.text((index * 212 + 16, 274), name, fill='#f2efe6')
            back = Image.new('RGBA', SIZE, '#2b2440')
            back.alpha_composite(frame)
            gif.append(back)
        board.save(OUT / f'{action}_strip_review.png')
        gif[0].save(OUT / f'{action}_motion.gif', save_all=True, append_images=gif[1:],
                    duration=[round(1000 / FPS[action])] * len(gif), loop=0, disposal=2)
        metrics[action] = {'source': str(path.relative_to(ROOT)).replace('\\', '/'),
                           'scale': scale, 'locked_key_index': KEY_SLOT[action],
                           'frames': measurements}
    (OUT / '2026-10-25_moveset_motion_metrics.json').write_text(
        json.dumps(metrics, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'Built {sum(len(item["frames"]) for item in metrics.values())} review frames in {OUT}')


if __name__ == '__main__':
    build()
