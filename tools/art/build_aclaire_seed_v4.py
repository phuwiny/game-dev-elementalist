"""Phase A density-2 quality probe: 48x64 logical frame, 96x128 raster."""
from pathlib import Path
from PIL import Image, ImageDraw
import json

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'art'
OUT=ART/'previews/phase_a'
NAME='2026-10-23_aclaire_seed_v4'
source=Image.open(ART/'concept/aclaire_idle_seed_v4_aligned_source.png').convert('RGBA')
alpha=source.getchannel('A').point(lambda v:255 if v>=128 else 0)
crop=source.crop(alpha.getbbox())
target_h=124
target_w=round(crop.width*target_h/crop.height)
resampled=crop.resize((target_w,target_h),Image.Resampling.LANCZOS)
frame=Image.new('RGBA',(96,128))
frame.alpha_composite(resampled,((96-target_w)//2,128-target_h))
alpha=frame.getchannel('A').point(lambda v:255 if v>=128 else 0)
frame.putalpha(alpha)

def color_limited(count):
    rgb=Image.new('RGB',frame.size,'#ffffff')
    rgb.paste(frame,mask=alpha)
    q=rgb.quantize(colors=count,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGB')
    q.putalpha(alpha)
    return q

alt=color_limited(64)
alt.save(OUT/f'{NAME}_64color_density2.png')
alt.resize((384,512),Image.Resampling.NEAREST).save(OUT/f'{NAME}_64color_x4.png')
candidate=color_limited(256)
candidate.save(OUT/f'{NAME}_256color_density2.png')
candidate.resize((384,512),Image.Resampling.NEAREST).save(OUT/f'{NAME}_256color_x4_nearest.png')
candidate.resize((384,512),Image.Resampling.BICUBIC).save(OUT/f'{NAME}_256color_x4_display.png')
soft=candidate.resize((48,64),Image.Resampling.LANCZOS)
soft.save(OUT/f'{NAME}_logical_soft_preview.png')

v3=Image.open(OUT/'2026-10-23_aclaire_seed_v3_16color.png').convert('RGBA')
board=Image.new('RGBA',(1160,760),'#273247')
d=ImageDraw.Draw(board)
d.text((34,24),'ACLAIRE / NATIVE PIXELS VS DENSITY 2',fill='white',font_size=30)
d.text((70,90),'V3 48x64 / 16 colors',fill='white',font_size=21)
d.text((595,90),'V4 96x128 / 256-color cap',fill='white',font_size=21)
board.alpha_composite(v3.resize((384,512),Image.Resampling.NEAREST),(70,145))
board.alpha_composite(candidate.resize((384,512),Image.Resampling.BICUBIC),(595,145))
d.text((70,675),'Logical 1:1:',fill='white',font_size=20)
board.alpha_composite(v3,(190,677))
board.alpha_composite(soft,(720,677))
d.text((595,675),'Smoothed logical 1:1:',fill='white',font_size=20)
board.save(ART/'concept/aclaire_idle_seed_v4_comparison.png')

screen=Image.new('RGBA',(640,360),'#293747')
sd=ImageDraw.Draw(screen)
sd.text((14,14),'640 x 360 / static display probe, not Phaser runtime',fill='white')
sd.line((0,285,639,285),fill='#7b7896')
for x,im,label in ((175,v3,'V3 native'),(420,soft,'V4 density 2')):
    screen.alpha_composite(im,(x,222))
    sd.text((x-15,307),label,fill='white')
screen.save(OUT/f'{NAME}_640x360.png')

data={'physical_size':list(candidate.size),'logical_size':[48,64],
      'bbox':list(candidate.getbbox()),'opaque_colors':len({p[:3] for p in candidate.get_flattened_data() if p[3]}),
      'alt_64color_opaque_colors':len({p[:3] for p in alt.get_flattened_data() if p[3]}),
      'alpha':sorted(set(candidate.getchannel('A').get_flattened_data()))}
(ART/'reports/2026-10-23_aclaire_seed_v4_metrics.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8',newline='\n')
assert data['physical_size']==[96,128] and data['alpha']==[0,255] and data['opaque_colors']<=256
assert data['bbox'][3]==128
print(json.dumps(data,indent=2))
