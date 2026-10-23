"""Normalize the imagegen Phase A proposal; never changes production assets.

Source is preserved. Nearest sampling, binary alpha, no invented detail.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'art'
OUT = ART / 'previews/phase_a'
PREFIX = '2026-10-23_aclaire_seed_v2'
raw = Image.open(ART / 'concept/aclaire_idle_seed_v2_source.png').convert('RGBA')
alpha = raw.getchannel('A').point(lambda v: 255 if v >= 128 else 0)
box = alpha.getbbox()
crop = raw.crop(box)
size = (round(crop.width * 62 / crop.height), 62)
small = crop.resize(size, Image.Resampling.NEAREST)
small.putalpha(small.getchannel('A').point(lambda v: 255 if v >= 128 else 0))
frame = Image.new('RGBA', (48, 64))
frame.alpha_composite(small, ((48 - size[0]) // 2, 64 - size[1]))
master = [tuple(bytes.fromhex(s[1:])) for s in (ART / 'palette/master_palette.hex').read_text().splitlines()]
# Explicit native-grid cleanup after nearest sampling: restore eye highlights,
# mouth, and a single rigid vertical sword axis. Hair/body occlude the sword.
draw = ImageDraw.Draw(frame)
def ink(index):
    return master[index] + (255,)
# Remove sampled hilt fragments in the exposed gap; preserve orange hair.
for y in range(24, 33):
    for x in range(14, 22):
        p = frame.getpixel((x,y))
        if p[3] and p[0] > 110 and p[1] > 100 and p[2] < 120:
            draw.point((x,y), fill=(0,0,0,0))
draw.rectangle((17,27,19,32),fill=ink(0))
draw.line((18,27,18,31),fill=ink(14))
draw.point((18,29),fill=ink(29))
draw.rectangle((15,32,21,33),fill=ink(0))
draw.line((16,32,20,32),fill=ink(14))
draw.ellipse((16,24,20,27),fill=ink(0))
draw.rectangle((17,25,19,26),fill=ink(12))
draw.point((17,25),fill=ink(34))
# Exposed scabbard below guard. Upper arm overlays its right edge.
draw.rectangle((17,34,19,49),fill=ink(0))
draw.line((18,34,18,49),fill=ink(1))
draw.point((18,50),fill=ink(0))
# Both eyes retain blue iris + highlight; cheerful open mouth uses pink.
draw.point((28,21),fill=ink(5))
draw.point((29,23),fill=ink(17))
draw.point((34,23),fill=ink(5))
draw.point((34,24),fill=ink(17))
draw.point((35,25),fill=ink(16))
draw.line((30,27,32,27),fill=ink(11))
draw.line((30,28,31,28),fill=ink(33))
def mapped(colors):
    im = Image.new('RGBA', frame.size)
    im.putdata([min(colors, key=lambda c: sum((c[i]-p[i])**2 for i in range(3)))+(255,) if p[3] else (0,0,0,0) for p in frame.get_flattened_data()])
    return im

full = mapped(master)
# Shared 16-color option keeps eyes, silver, skin, pink, orange and tan distinct.
limited = mapped([master[i] for i in (0,1,2,4,5,8,9,11,12,13,14,16,17,26,33,34)])
stats = {}
for name, im in [('master',full), ('16color',limited)]:
    im.save(OUT / f'{PREFIX}_{name}.png')
    im.resize((384,512),Image.Resampling.NEAREST).save(OUT / f'{PREFIX}_{name}_x8.png')
    colors = sorted(set(p[:3] for p in im.get_flattened_data() if p[3]))
    stats[name] = {'size':list(im.size),'bbox':list(im.getbbox()),'opaque_colors':len(colors),'colors':['#%02x%02x%02x'%c for c in colors], 'alpha':sorted(set(im.getchannel('A').get_flattened_data()))}

old = Image.open(OUT / 'aclaire_48x64_idle.png').convert('RGBA')
data = json.loads((OUT / '2026-10-23_cq_idle_data.json').read_text())
ids = [int(data['frame']['pixels'][i:i+3],16) for i in range(0,len(data['frame']['pixels']),3)]
cq = Image.new('RGBA',(data['w']*data['density'],data['h']*data['density']))
cq.putdata([tuple(bytes.fromhex(data['palette'][i][1:]))+(255,) if i else (0,0,0,0) for i in ids])
cq.save(OUT / '2026-10-23_cq_idle_decoded.png')
cq.resize((432,384),Image.Resampling.NEAREST).save(OUT / '2026-10-23_cq_idle_x4.png')
board = Image.new('RGBA',(1920,1080),'#202337')
d = ImageDraw.Draw(board)
d.text((40,30),'ACLAIRE / IDLE SEED V2 - PHASE A REVIEW ONLY',fill='white',font_size=32)
for x,im,title in [(50,cq,'Coin Quest: native 108x96 / 481 colors'),(530,old,'Previous 48x64 / 15 colors'),(970,limited,f'New 48x64 / {stats["16color"]["opaque_colors"]} colors'),(1410,full,f'New 48x64 / {stats["master"]["opaque_colors"]} master colors')]:
    d.text((x,110),title,fill='white',font_size=19)
    scale=4 if im is cq else 8
    board.alpha_composite(im.resize((im.width*scale,im.height*scale),Image.Resampling.NEAREST),(x,185))
    board.alpha_composite(im,(x+155,790))
    d.text((x+100,910),'Native 1:1 above',fill='white',font_size=19)
d.text((50,990),'Nearest-neighbor enlargements. Coin Quest costume is not the target. Seed and style are NOT approved.',fill='white',font_size=23)
board.save(ART / 'concept/aclaire_idle_seed_v2_comparison.png')
screen=Image.new('RGBA',(640,360),'#293747');sd=ImageDraw.Draw(screen)
sd.text((16,16),'640 x 360 / static scale probe / not runtime',fill='white')
sd.line((0,285,639,285),fill='#7b7896')
for x,im,label in [(90,old,'Old 48x64'),(290,limited,'V2 16 colors'),(490,full,'V2 master')]:
    screen.alpha_composite(im,(x,286-im.height));sd.text((x-15,305),label,fill='white')
screen.save(OUT / f'{PREFIX}_640x360.png')
(ART/'reports/2026-10-23_aclaire_seed_v2_metrics.json').write_text(json.dumps(stats,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(stats,indent=2))
assert stats['16color']['opaque_colors'] <= 16
for name in stats:
    assert stats[name]['alpha'] == [0,255]
    assert stats[name]['bbox'][3] == 64
    assert all(tuple(bytes.fromhex(c[1:])) in master for c in stats[name]['colors'])
assert screen.size == (640,360)
print('PASS: new Phase A candidates; master option intentionally exceeds 16-color budget, not production-approved.')
