"""Build a low-noise 48x64 Phase A idle candidate from the saved cel-art source."""
from pathlib import Path
from collections import Counter
from PIL import Image, ImageFilter, ImageDraw
import json

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT/'art'
OUT = ART/'previews/phase_a'
NAME = '2026-10-23_aclaire_seed_v3'
raw = Image.open(ART/'concept/aclaire_idle_seed_v3_source.png').convert('RGBA')
box = raw.getchannel('A').point(lambda v: 255 if v >= 128 else 0).getbbox()
crop = raw.crop(box)
size = (round(crop.width * 61 / crop.height),61)
sample = crop.resize(size,Image.Resampling.LANCZOS)
sample = sample.filter(ImageFilter.GaussianBlur(0.45))
frame = Image.new('RGBA',(48,64))
frame.alpha_composite(sample,((48-size[0])//2,64-size[1]))
master = [tuple(bytes.fromhex(line[1:])) for line in (ART/'palette/master_palette.hex').read_text().splitlines()]
budget = (0,1,2,4,5,8,9,11,12,13,14,16,17,26,29,33)

def nearest(rgb, ids):
    return min(ids,key=lambda n:sum((rgb[c]-master[n][c])**2 for c in range(3)))

def classify(x,y,p):
    r,g,b,a=p
    if a<126:return -1
    # Preserve the illustrated material boundaries while choosing one of
    # the exact master colors; segmentation is by broad region and hue.
    if y<=30 and 5<=x<=43 and r>g*1.34 and g>b*1.30 and r>130:
        return nearest(p,(11,12,13))
    if 35<=y<=48 and 18<=x<=39 and r>100 and g>65 and b<125 and r>g*1.17:
        return 26
    if 18<=y<=31 and 22<=x<=39 and r>g*1.05 and g>b*1.2 and r>145:
        return nearest(p,(8,9))
    return nearest(p,budget)

pixels=[classify(x,y,frame.getpixel((x,y))) for y in range(64) for x in range(48)]

# Consolidate isolated flecks in the broad hair mass without blurring face,
# costume boundaries or silhouette. Only replace orange within orange.
hair={11,12,13}
for _ in range(2):
    previous=pixels[:]
    for y in range(3,29):
        for x in range(5,42):
            i=y*48+x
            if previous[i] not in hair:continue
            ns=[previous[(y+dy)*48+x+dx] for dy in (-1,0,1) for dx in (-1,0,1) if 0<=x+dx<48 and 0<=y+dy<64]
            h=[n for n in ns if n in hair]
            if len(h)>=7:
                common,count=Counter(h).most_common(1)[0]
                if count>=6:pixels[i]=common

im=Image.new('RGBA',(48,64))
im.putdata([master[i]+(255,) if i>=0 else (0,0,0,0) for i in pixels])
draw=ImageDraw.Draw(im)
def color(i):return master[i]+(255,)
# Clean native-grid face: contiguous eye whites/iris and a small smile.
draw.rectangle((27,21,30,25),fill=color(5))
draw.line((27,21,30,21),fill=color(0))
draw.rectangle((28,22,29,24),fill=color(17))
draw.line((29,23,29,24),fill=color(16))
draw.point((28,22),fill=color(5))
draw.rectangle((34,22,36,25),fill=color(5))
draw.line((34,22,36,22),fill=color(0))
draw.line((35,23,35,25),fill=color(17))
draw.point((35,23),fill=color(5))
draw.point((36,25),fill=color(16))
draw.line((31,27,33,27),fill=color(11))
draw.line((31,28,32,28),fill=color(33))
# A visible straight hilt, guard and scabbard behind the near shoulder.
draw.rectangle((17,29,19,48),fill=color(0))
draw.line((18,35,18,47),fill=color(1))
draw.rectangle((17,27,19,33),fill=color(14))
for yy in (28,30,32):draw.point((18,yy),fill=color(29))
draw.rectangle((15,33,21,34),fill=color(14))
draw.ellipse((16,24,20,28),fill=color(0))
draw.rectangle((17,25,19,27),fill=color(11))
draw.point((17,25),fill=color(5))
# The central seam and two cuff strokes keep tan shorts from reading as a skirt.
draw.line((28,40,27,46),fill=color(1))
draw.line((21,45,26,46),fill=color(1))
draw.line((29,46,35,45),fill=color(1))
im.save(OUT/f'{NAME}_16color.png')
im.resize((384,512),Image.Resampling.NEAREST).save(OUT/f'{NAME}_16color_x8.png')

old=Image.open(OUT/'2026-10-23_aclaire_seed_v2_16color.png').convert('RGBA')
board=Image.new('RGBA',(1120,760),'#273247')
d=ImageDraw.Draw(board)
d.text((34,24),'ACLAIRE / CLEANER IDLE STUDY / 48 x 64',fill='white',font_size=28)
for x,src,label in ((85,old,'V2 - noisy sampling'),(610,im,'V3 - clean color clusters')):
    d.text((x,100),label,fill='white',font_size=22)
    board.alpha_composite(src.resize((384,512),Image.Resampling.NEAREST),(x,145))
    board.alpha_composite(src,(x+180,685))
board.save(ART/'concept/aclaire_idle_seed_v3_comparison.png')

screen=Image.new('RGBA',(640,360),'#293747')
sd=ImageDraw.Draw(screen)
sd.text((14,14),'640 x 360 / native-size static probe',fill='white')
sd.line((0,285,639,285),fill='#7b7896')
for x,src,label in ((190,old,'V2'),(410,im,'V3')):
    screen.alpha_composite(src,(x,222));sd.text((x,302),label,fill='white')
screen.save(OUT/f'{NAME}_640x360.png')

used=sorted(set(master.index(p[:3]) for p in im.get_flattened_data() if p[3]))
metrics={'size':[48,64],'bbox':list(im.getbbox()),'opaque_colors':len(used),'palette_indices':used,'alpha':sorted(set(im.getchannel('A').get_flattened_data()))}
(ART/'reports/2026-10-23_aclaire_seed_v3_metrics.json').write_text(json.dumps(metrics,indent=2)+'\n',encoding='utf-8',newline='\n')
assert len(used)<=16 and set(used)<=set(budget)
assert metrics['alpha']==[0,255] and metrics['bbox'][3]==64
print(json.dumps(metrics,indent=2))
