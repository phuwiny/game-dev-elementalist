"""Normalize four V4 moveset studies for key-pose review; do not repack the atlas."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw

from build_player_movement_atlas import COLORS, eye_center, indexed

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/previews/phase_b/2026-10-25_moveset_key_review'
SOURCES = {
    'double_jump': ROOT / 'art/concept/2026-10-25_aclaire_double_jump_source_v2.png',
    'cast': ROOT / 'art/concept/2026-10-25_aclaire_cast_source_v3.png',
    'dash': ROOT / 'art/concept/2026-10-25_aclaire_dash_source_v3.png',
    'glide': ROOT / 'art/concept/2026-10-25_aclaire_glide_source.png',
}
LAYOUT = {'double_jump': (2, 2), 'cast': (2, 2), 'dash': (3, 1), 'glide': (2, 2)}
FPS = {'double_jump': 14, 'cast': 12, 'dash': 16, 'glide': 10}
KEY_INDEX = {'double_jump': 1, 'cast': 2, 'dash': 1, 'glide': 0}
SINGLE_KEYS = {
    'ground_slam': ROOT / 'art/concept/2026-10-25_aclaire_ground_slam_key_source.png',
    'hurt': ROOT / 'art/concept/2026-10-25_aclaire_hurt_key_source.png',
    'dead': ROOT / 'art/concept/2026-10-25_aclaire_dead_key_source.png',
}
SIZE = (96, 128)
PALETTE = set(COLORS)


def split_at_clear_gap(alpha: Image.Image, target: int, vertical: bool) -> int:
    """Locate an empty strip near the expected grid division."""
    dimension = alpha.width if vertical else alpha.height
    radius = max(45, dimension // 8)
    start, end = max(1, target - radius), min(dimension - 1, target + radius)
    runs = []
    run_start = None
    for index in range(start, end):
        strip = (index, 0, index + 1, alpha.height) if vertical else (
            0, index, alpha.width, index + 1)
        if alpha.crop(strip).getbbox() is None:
            if run_start is None:
                run_start = index
        elif run_start is not None:
            runs.append((run_start, index - 1))
            run_start = None
    if run_start is not None:
        runs.append((run_start, end - 1))
    if not runs:
        raise ValueError(f'No transparent split near {target}')
    best = min(runs, key=lambda pair: abs((pair[0] + pair[1]) / 2 - target))
    return round((best[0] + best[1]) / 2)


def separate(source: Image.Image, columns: int, rows: int) -> list[Image.Image]:
    opaque = source.getchannel('A').point(lambda value: 255 if value >= 200 else 0)
    xs = [0]
    ys = [0]
    for i in range(1, columns):
        xs.append(split_at_clear_gap(opaque, round(source.width * i / columns), True))
    for i in range(1, rows):
        ys.append(split_at_clear_gap(opaque, round(source.height * i / rows), False))
    xs.append(source.width)
    ys.append(source.height)
    cells = []
    for row in range(rows):
        for column in range(columns):
            cell = source.crop((xs[column], ys[row], xs[column + 1], ys[row + 1]))
            alpha = cell.getchannel('A').point(lambda value: 255 if value >= 200 else 0)
            bounds = alpha.getbbox()
            if not bounds:
                raise ValueError(f'Empty source cell {row},{column}')
            clean = Image.new('RGBA', cell.size)
            clean.paste(cell, mask=alpha)
            clean.putalpha(alpha)
            cells.append(clean.crop(bounds))
    return cells


def normalize(cells: list[Image.Image]) -> tuple[list[Image.Image], float, float]:
    max_width = max(image.width for image in cells)
    max_height = max(image.height for image in cells)
    scale = min(92 / max_width, 122 / max_height)
    while True:
        resized = [indexed(image.resize((round(image.width * scale), round(image.height * scale)),
                                        Image.Resampling.NEAREST)) for image in cells]
        eyes = [eye_center(image) for image in resized]
        if any(eye is None for eye in eyes):
            raise ValueError('Could not locate blue eye in one source pose')
        lower = max(eye[0] for eye in eyes)
        upper = min(SIZE[0] - image.width + eye[0] for image, eye in zip(resized, eyes))
        if lower <= 57 <= upper:
            break
        scale *= .99
        if scale < .1:
            raise ValueError('No shared face anchor fits 96-pixel frame')
    target_eye = 57
    frames = []
    for image, eye in zip(resized, eyes):
        x = round(target_eye - eye[0])
        y = SIZE[1] - image.height
        if x < 0 or x + image.width > SIZE[0] or y < 0:
            raise ValueError(f'Pose clips frame: {(x, y)}, {image.size}')
        frame = Image.new('RGBA', SIZE)
        frame.alpha_composite(image, (x, y))
        frames.append(frame)
    return frames, scale, target_eye


def normalize_key(path: Path, action: str) -> tuple[Image.Image, float]:
    source = Image.open(path).convert('RGBA')
    alpha = source.getchannel('A').point(lambda value: 255 if value >= 200 else 0)
    bounds = alpha.getbbox()
    if not bounds:
        raise ValueError(f'Empty source key: {action}')
    clean = Image.new('RGBA', source.size)
    clean.paste(source, mask=alpha)
    clean.putalpha(alpha)
    cropped = clean.crop(bounds)
    scale = min(92 / cropped.width, 122 / cropped.height)
    while True:
        resized = indexed(cropped.resize((round(cropped.width * scale),
                                          round(cropped.height * scale)), Image.Resampling.NEAREST))
        eye = eye_center(resized)
        if action == 'dead':
            x = (SIZE[0] - resized.width) // 2
        elif eye is None:
            raise ValueError(f'Missing open eye in key: {action}')
        else:
            x = round(57 - eye[0])
        if x >= 0 and x + resized.width <= SIZE[0]:
            break
        scale *= .99
        if scale < .08:
            raise ValueError(f'Key pose cannot fit frame: {action}')
    frame = Image.new('RGBA', SIZE)
    frame.alpha_composite(resized, (x, SIZE[1] - resized.height))
    colors = {pixel[:3] for pixel in frame.get_flattened_data() if pixel[3]}
    if not colors <= PALETTE or set(frame.getchannel('A').get_flattened_data()) - {0, 255}:
        raise ValueError(f'Invalid key palette or alpha: {action}')
    return frame, scale


def build() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    result = {}
    key_frames = {}
    for action, path in SOURCES.items():
        source = Image.open(path).convert('RGBA')
        frames, scale, target_eye = normalize(separate(source, *LAYOUT[action]))
        result[action] = {'source': str(path.relative_to(ROOT)).replace('\\', '/'),
                          'scale': scale, 'target_eye_x': target_eye, 'frames': []}
        board = Image.new('RGB', (len(frames) * 212, 294), '#2b2440')
        pen = ImageDraw.Draw(board)
        gif = []
        for index, frame in enumerate(frames):
            name = f'{action}_{index:03}'
            frame.save(OUT / f'{name}.png')
            colors = {pixel[:3] for pixel in frame.get_flattened_data() if pixel[3]}
            if frame.size != SIZE or not colors <= PALETTE or set(frame.getchannel('A').get_flattened_data()) - {0, 255}:
                raise ValueError(f'Invalid review frame: {name}')
            result[action]['frames'].append({'name': name, 'bounds': frame.getbbox(),
                                             'eye': eye_center(frame), 'colors': len(colors)})
            enlarged = frame.resize((192, 256), Image.Resampling.NEAREST)
            board.paste(enlarged, (index * 212 + 10, 8), enlarged)
            pen.line((index * 212 + 8, 266, index * 212 + 204, 266), fill='#48c9a0')
            pen.text((index * 212 + 16, 274), name, fill='#f2efe6')
            backdrop = Image.new('RGBA', SIZE, '#2b2440')
            backdrop.alpha_composite(frame)
            gif.append(backdrop)
        board.save(OUT / f'{action}_strip_review.png')
        gif[0].save(OUT / f'{action}_motion.gif', save_all=True, append_images=gif[1:],
                    duration=[round(1000 / FPS[action])] * len(gif), loop=0, disposal=2)
        key_frames[action] = frames[KEY_INDEX[action]]

    overview = Image.new('RGB', (640, 360), '#2b2440')
    pen = ImageDraw.Draw(overview)
    pen.text((20, 16), 'ACLAIRE V4 / MOVESET KEY POSES / 640 x 360', fill='#f2efe6')
    pen.text((20, 36), 'Density 2; preview at logical size; review before atlas packing', fill='#b4b2c9')
    for i, (action, frame) in enumerate(key_frames.items()):
        x = 80 + i * 155
        display = frame.resize((48, 64), Image.Resampling.NEAREST)
        overview.paste(display, (x - 24, 158), display)
        pen.line((x - 42, 222, x + 42, 222), fill='#48c9a0')
        pen.text((x - 40, 232), action, fill='#f2efe6')
    overview.save(OUT / '2026-10-25_moveset_keys_640x360.png')
    second = Image.new('RGB', (640, 360), '#2b2440')
    draw = ImageDraw.Draw(second)
    draw.text((20, 16), 'ACLAIRE V4 / IMPACT KEY POSES / 640 x 360', fill='#f2efe6')
    draw.text((20, 36), 'Idle comparison and three proposed keys; not in the game atlas', fill='#b4b2c9')
    idle = Image.open(ROOT / 'art/frames/player/idle_000.png').convert('RGBA')
    comparisons = [('idle', idle)]
    for action, path in SINGLE_KEYS.items():
        frame, scale = normalize_key(path, action)
        frame.save(OUT / f'{action}_key.png')
        colors = {pixel[:3] for pixel in frame.get_flattened_data() if pixel[3]}
        result[action] = {'source': str(path.relative_to(ROOT)).replace('\\', '/'),
                          'scale': scale, 'key': {'bounds': frame.getbbox(),
                          'eye': eye_center(frame), 'colors': len(colors)}}
        comparisons.append((action, frame))
    comparison = Image.new('RGB', (len(comparisons) * 212, 294), '#2b2440')
    comp_pen = ImageDraw.Draw(comparison)
    for i, (action, frame) in enumerate(comparisons):
        x = 80 + i * 155
        display = frame.resize((48, 64), Image.Resampling.NEAREST)
        second.paste(display, (x - 24, 158), display)
        draw.line((x - 42, 222, x + 42, 222), fill='#48c9a0')
        draw.text((x - 40, 232), action, fill='#f2efe6')
        enlarged = frame.resize((192, 256), Image.Resampling.NEAREST)
        comparison.paste(enlarged, (i * 212 + 10, 8), enlarged)
        comp_pen.line((i * 212 + 8, 266, i * 212 + 204, 266), fill='#48c9a0')
        comp_pen.text((i * 212 + 16, 274), action, fill='#f2efe6')
    second.save(OUT / '2026-10-25_moveset_impact_keys_640x360.png')
    comparison.save(OUT / '2026-10-25_moveset_impact_keys_x2.png')
    (OUT / '2026-10-25_moveset_key_metrics.json').write_text(
        json.dumps(result, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'Built {sum(len(item["frames"]) for item in result.values() if "frames" in item)} '
          f'review frames and {len(SINGLE_KEYS)} extra keys in {OUT}')


if __name__ == '__main__':
    build()
