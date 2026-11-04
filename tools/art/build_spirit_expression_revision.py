"""Versioned density-2 expression review. Does not replace the runtime 32px atlas."""
from pathlib import Path
import json
from PIL import Image,ImageDraw
from pack_atlas import pack
R=Path(__file__).resolve().parents[2]
OUT=R/'art/previews/phase_b/2026-11-04_spirit_expressions_v2'
def build():
 src=Image.open(R/'art/concept/2026-11-04_spirit_expressions_v2_source.png').convert('RGBA')
 palette=[tuple(bytes.fromhex(s[1:])) for s in (R/'art/palette/master_palette.hex').read_text().split()]
 ramps={'valvaliz':[0,1,5,8,9,15,17,18,19,20,21,22,23,28,29,30],'eathy':[0,1,2,3,4,5,6,7,8,9,24,25,26,27]}
 OUT.mkdir(parents=True,exist_ok=True);framesdir=OUT/'frames';framesdir.mkdir(exist_ok=True)
 board=Image.new('RGBA',(768,544),'#2b2440');draw=ImageDraw.Draw(board)
 for j,key in enumerate(ramps):
  cells=[]
  for i in range(11):
   x=i%6;y=j*2+i//6;c=src.crop((x*src.width//6,y*src.height//4,(x+1)*src.width//6,(y+1)*src.height//4));c.putalpha(c.getchannel('A').point(lambda a:255 if a>=180 else 0));cells.append(c)
  boxes=[c.getbbox() for c in cells];scale=min(60/max(b[2]-b[0] for b in boxes),56/max(b[3]-b[1] for b in boxes));colors=[palette[k] for k in ramps[key]];frames=[]
  for i,(c,box) in enumerate(zip(cells,boxes)):
   c=c.crop(box);c=c.resize((max(1,round(c.width*scale)),max(1,round(c.height*scale))),Image.Resampling.NEAREST)
   c.putdata([min(colors,key=lambda q:sum((q[k]-p[k])**2 for k in range(3)))+(255,) if p[3] else (0,0,0,0) for p in c.get_flattened_data()]);f=Image.new('RGBA',(64,64));f.alpha_composite(c,((64-c.width)//2,(64-c.height)//2))
   name=f'{key}_idle_{i:03}' if i<6 else f'{key}_cast_{i-6:03}' if i<10 else f'{key}_icon';f.save(framesdir/f'{name}.png');frames.append(f)
   x=i%6*128;y=(j*2+i//6)*136;board.alpha_composite(f.resize((128,128),Image.Resampling.NEAREST),(x,y));draw.text((x+3,y+123),name,fill='#f2efe6')
  for action,seq,fps in [('idle',frames[:6],8),('cast',frames[6:10],12)]:
   displays=[]
   for f in seq:
    bg=Image.new('RGBA',(192,192),'#2b2440');bg.alpha_composite(f.resize((192,192),Image.Resampling.NEAREST));displays.append(bg.convert('RGB'))
   displays[0].save(OUT/f'{key}_{action}.gif',save_all=True,append_images=displays[1:],duration=round(1000/fps),loop=0)
 board.save(OUT/'expression_review.png')
 atlas=pack(framesdir,OUT/'spirits_expression_v2',512)
 for f in atlas['frames'].values():f['pivot']={'x':.5,'y':.5}
 (OUT/'spirits_expression_v2.json').write_text(json.dumps(atlas,indent=2)+'\n')
 comparison=Image.new('RGBA',(512,192),'#2b2440');d=ImageDraw.Draw(comparison)
 for j,key in enumerate(ramps):
  old=Image.open(R/f'art/frames/spirits/{key}_idle_000.png');new=Image.open(framesdir/f'{key}_idle_000.png')
  comparison.alpha_composite(old.resize((128,128),Image.Resampling.NEAREST),(j*256,32));comparison.alpha_composite(new.resize((128,128),Image.Resampling.NEAREST),(j*256+128,32));d.text((j*256+8,12),key+' / old 32 / new 64',fill='#f2efe6')
 comparison.save(OUT/'before_after.png')
 for p in framesdir.glob('*.png'):
  f=Image.open(p);pixels=list(f.get_flattened_data());assert f.size==(64,64);assert {p[3] for p in pixels}<={0,255};assert len({p[:3] for p in pixels if p[3]})<=16;assert all(p[:3] in palette for p in pixels if p[3])
 print('22 revised frames; 64x64, palette, binary alpha, <=16 colors: PASS')
if __name__=='__main__':build()
