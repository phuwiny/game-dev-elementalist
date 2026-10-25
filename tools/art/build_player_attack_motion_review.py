"""Normalize generated sword-combo strips against approved V4 impact keys."""
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image, ImageDraw
from build_player_movement_atlas import eye_center, indexed

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/previews/phase_b/2026-10-25_attack_motion'
KEYS = ROOT / 'art/previews/phase_b/2026-10-25_attack_keys'
SOURCES = {
    'attack_1': ROOT / 'art/concept/2026-10-25_aclaire_attack_1_strip_source.png',
    'attack_2': ROOT / 'art/concept/2026-10-25_aclaire_attack_2_strip_source.png',
    'attack_3': ROOT / 'art/concept/2026-10-25_aclaire_attack_3_strip_source_v2.png',
}
BOXES = {
    'attack_1': [(0, 0, 768, 512), (768, 0, 1536, 512),
                 (0, 512, 768, 1024), (768, 512, 1536, 1024)],
    'attack_2': [(0, 0, 768, 512), (768, 0, 1536, 490),
                 (0, 512, 768, 1024), (768, 490, 1536, 1024)],
    'attack_3': [(0, 0, 512, 560), (512, 0, 1024, 560),
                 (1024, 0, 1536, 560), (0, 560, 575, 1024),
                 (575, 560, 1024, 1024)],
}
SCALE = {'attack_1': .224, 'attack_2': .245, 'attack_3': .232}
COUNT = {'attack_1': 4, 'attack_2': 4, 'attack_3': 5}
SIZE = (192, 128)
EYE_X = 105
RIGHT_LIMIT = 176


def shorten_tip(frame: Image.Image) -> Image.Image:
    """Keep the blade's pointed end inside the approved 40 logical px reach."""
    if frame.getbbox()[2] <= RIGHT_LIMIT:
        return frame
    result = frame.copy()
    pixels = result.load()
    # Only the blade occupies the far-right strip in these right-facing poses.
    ys = [y for y in range(128) if pixels[172, y][3]]
    if not ys:
        raise ValueError('Cannot find sword edge for reach correction')
    center = round(sum(ys) / len(ys))
    for x in range(173, 192):
        for y in range(128):
            if x >= 176 or (x == 175 and y != center) or (x == 174 and abs(y-center) > 1):
                pixels[x, y] = (0, 0, 0, 0)
    return result


def normalize(cell: Image.Image, scale: float) -> Image.Image:
    alpha = cell.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
    box = alpha.getbbox()
    eye = eye_center(cell)
    if box is None or eye is None:
        raise ValueError(f'Missing sprite or eye in source cell: {box}, {eye}')
    cropped = cell.crop(box)
    resized = indexed(cropped.resize((round(cropped.width*scale), round(cropped.height*scale)),
                                     Image.Resampling.NEAREST))
    eye_after = eye_center(resized)
    x = round(EYE_X - eye_after[0])
    y = SIZE[1] - resized.getbbox()[3]
    if x < 0 or y < 0 or x + resized.width > SIZE[0]:
        raise ValueError(f'Frame clips: {(x,y)}, {resized.size}')
    frame = Image.new('RGBA', SIZE)
    frame.alpha_composite(resized, (x, y))
    return shorten_tip(frame)


def build() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    metrics = {}
    all_frames = {}
    for action, count in COUNT.items():
        sheet = Image.open(SOURCES[action]).convert('RGBA')
        frames = [normalize(sheet.crop(box), SCALE[action]) for box in BOXES[action]]
        # Keep the owner-approved impact pose, not imagegen's approximation.
        frames[2] = Image.open(KEYS / f'{action}_key.png').convert('RGBA')
        if action == 'attack_2':
            # The first pose continues exactly from attack_1's last frame.
            frames[0] = all_frames['attack_1'][-1].copy()
        assert len(frames) == count
        all_frames[action] = frames
        metrics[action] = []
        for i, frame in enumerate(frames):
            name = f'{action}_{i:03}'
            bounds = frame.getbbox()
            if (frame.size != SIZE or bounds[3] != 128 or bounds[2] > RIGHT_LIMIT
                    or set(frame.getchannel('A').get_flattened_data()) - {0,255}):
                raise ValueError(f'Invalid {name}: {bounds}')
            frame.save(OUT / f'{name}.png')
            metrics[action].append({'frame': name, 'bounds': bounds,
                                    'eye': eye_center(frame),
                                    'colors': len({p[:3] for p in frame.get_flattened_data() if p[3]})})

        board = Image.new('RGB', (count*208, 188), '#2b2440')
        pen = ImageDraw.Draw(board)
        for i, frame in enumerate(frames):
            logical = frame.resize((192,128), Image.Resampling.NEAREST)
            board.paste(logical, (i*208+8, 15), logical)
            pen.line((i*208+8, 143, i*208+200, 143), fill='#48c9a0')
            pen.text((i*208+15, 152), f'{action}_{i:03}', fill='#f2efe6')
        board.save(OUT / f'{action}_strip_review.png')

        # GIFs loop for review; the game animation metadata remains one-shot.
        gif = [Image.new('RGBA', SIZE, '#2b2440') for _ in frames]
        for dst, src in zip(gif, frames):
            dst.alpha_composite(src)
        gif[0].save(OUT / f'{action}_motion.gif', save_all=True, append_images=gif[1:],
                    duration=[63]*len(gif), loop=0, disposal=2)

    (OUT / '2026-10-25_attack_motion_metrics.json').write_text(
        json.dumps(metrics, indent=2)+'\n', encoding='utf-8', newline='\n')
    print(f'Built {sum(COUNT.values())} review frames in {OUT}')


if __name__ == '__main__':
    build()
