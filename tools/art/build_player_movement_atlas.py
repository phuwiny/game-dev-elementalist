"""Build the first 18 V4 movement frames; preserve all approved study files.

Generated peak/fall/land poses share one 0.25 scale (never fit each pose).
Existing jump poses share one 0.94 scale to allow a common body/face x anchor
without clipping the ponytail. All frames use last-row sole contact.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw
from pack_atlas import pack

ROOT = Path(__file__).resolve().parents[2]
PREVIEW = ROOT / 'art/previews/phase_b'
DEST = ROOT / 'art/frames/player'
REVIEW = PREVIEW / '2026-10-24_player_movement'
ANIMS = {'idle': (6, 8, -1), 'run': (4, 8, -1), 'jump_up': (2, 10, 0),
         'jump_peak': (2, 10, 0), 'fall': (2, 10, -1), 'land': (2, 14, 0)}
COLORS = [tuple(bytes.fromhex(s.strip()[1:])) for s in
          (ROOT / 'art/palette/2026-10-24_aclaire_v4_palette.hex').read_text().splitlines() if s.strip()]
PALETTE = Image.new('P', (1, 1))
PALETTE.putpalette([c for rgb in COLORS for c in rgb] + list(COLORS[0]) * (256-len(COLORS)))


def eye_center(image):
    points = [(x, y) for y in range(round(image.height * .55)) for x in range(image.width)
              if (lambda p: p[3] >= 128 and p[2] > p[0]+25 and p[2] > p[1]+8)(image.getpixel((x, y)))]
    if not points:
        return None
    return [sum(p[i] for p in points)/len(points) for i in range(2)]


def indexed(image):
    alpha = image.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
    colors = {p[:3] for p in image.get_flattened_data() if p[3] >= 128}
    # Preserve approved pixels exactly; Pillow's quantizer may remap even
    # colors already in a supplied palette due to its lookup approximation.
    out = image.copy() if colors <= set(COLORS) else image.convert('RGB').quantize(palette=PALETTE, dither=Image.Dither.NONE).convert('RGBA')
    out.putalpha(alpha)
    # Clear invisible RGB; make exports deterministic and bleed-safe.
    clean = Image.new('RGBA', out.size)
    clean.paste(out, mask=alpha)
    return clean


def anchor(source, size, scale=1.0):
    image = source.resize((round(source.width*scale), round(source.height*scale)), Image.Resampling.NEAREST)
    image = indexed(image)
    box = image.getbbox()
    eye = eye_center(image)
    dx = round(size[0]/2+9-eye[0])
    dy = size[1]-box[3]
    if not (box[0]+dx >= 0 and box[2]+dx <= size[0] and box[1]+dy >= 0):
        raise ValueError(f'Would clip source: {box}, {size}, offset {(dx,dy)}')
    frame = Image.new('RGBA', size)
    frame.alpha_composite(image, (dx, dy))
    return frame


def build():
    DEST.mkdir(parents=True, exist_ok=True)
    REVIEW.mkdir(parents=True, exist_ok=True)
    result = {}
    folders = {'idle':'2026-10-24_aclaire_idle', 'run':'2026-10-24_aclaire_run_v4_redraw',
               'jump_up':'2026-10-24_aclaire_jump_up_v4_study'}
    for anim, folder in folders.items():
        for i, path in enumerate(sorted((PREVIEW/folder).glob('*.png'))):
            source = Image.open(path).convert('RGBA')
            if anim == 'idle':
                frame = indexed(source)
            else:
                frame = anchor(source, (128 if anim == 'run' else 96, 128), .94 if anim == 'jump_up' else 1)
            result[f'{anim}_{i:03}'] = frame
    sheet = Image.open(ROOT / 'art/concept/2026-10-24_aclaire_movement_batch_source.png').convert('RGBA')
    names = ['jump_peak_000','jump_peak_001','fall_000','fall_001','land_000','land_001']
    cw, ch = sheet.width//3, sheet.height//2
    for i, name in enumerate(names):
        x, y = (i%3)*cw, (i//3)*ch
        result[name] = anchor(sheet.crop((x,y,x+cw,y+ch)), (96,128), .25)
    metrics = {}
    for name, frame in result.items():
        frame.save(DEST/f'{name}.png')
        metrics[name] = {'size':frame.size, 'bounds':frame.getbbox(), 'eyes':eye_center(frame),
                         'opaque_colors':len({p[:3] for p in frame.get_flattened_data() if p[3]}),
                         'sole_row':frame.getbbox()[3]-1}
    assert len(result) == 18
    for anim, (count, fps, repeat) in ANIMS.items():
        frames = [result[f'{anim}_{i:03}'] for i in range(count)]
        frames[0].save(REVIEW/f'{anim}_motion.png',save_all=True,append_images=frames[1:],
                       duration=[round(1000/fps)]*count,loop=0,disposal=2,blend=0)
        board = Image.new('RGBA', (count*256, 292), '#2b2440')
        draw = ImageDraw.Draw(board)
        for i, frame in enumerate(frames):
            board.alpha_composite(frame.resize((frame.width*2,256),Image.Resampling.NEAREST),
                                  (i*256+(256-frame.width*2)//2,16))
            draw.line((i*256,272,(i+1)*256-1,272),fill='#48c9a0')
            draw.text((i*256+12,276),f'{anim}_{i:03}',fill='#f2efe6')
        board.save(REVIEW/f'{anim}_review.png')
    overview = Image.new('RGBA',(640,360),'#2b2440')
    draw = ImageDraw.Draw(overview)
    draw.text((20,20),'ACLAIRE V4 / MOVEMENT ATLAS / 640 x 360',fill='#f2efe6')
    draw.text((20,40),'Density 2 | scale 0.5 | bottom-center | 18 frames',fill='#b4b2c9')
    for j,anim in enumerate(ANIMS):
        frame=result[f'{anim}_000']
        x=60+j*104
        overview.alpha_composite(frame.resize((frame.width//2,64),Image.Resampling.NEAREST),(x-frame.width//4,150))
        draw.line((x-38,214,x+38,214),fill='#48c9a0')
        draw.text((x-28,225),anim,fill='#f2efe6')
    draw.text((20,290),'Art size preview; gameplay checked separately at world scale 1.5.',fill='#b4b2c9')
    overview.save(REVIEW/'overview_640x360.png')
    pack(DEST,ROOT/'public/assets/sprites/player/player')
    manifest_path=ROOT/'public/assets/animations.json'
    manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    for anim,(count,fps,repeat) in ANIMS.items():
        manifest[f'player_{anim}']={'atlas':'player','prefix':f'{anim}_','frames':count,'frameRate':fps,'repeat':repeat}
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8',newline='\n')
    (ROOT/'art/reports/2026-10-24_player_movement_metrics.json').write_text(json.dumps(metrics,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(f'Built {len(result)} frames, six animations, atlas and previews.')


if __name__ == '__main__':
    build()
