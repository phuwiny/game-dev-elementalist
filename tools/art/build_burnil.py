"""Normalize the generated Burnil source into the handoff's 32px atlas."""
from pathlib import Path
import json
from PIL import Image
from pack_atlas import pack
ROOT=Path(__file__).resolve().parents[2]
src=Image.open(ROOT/'art/concept/2026-11-04_burnil_source.png').convert('RGBA')
colors=[tuple(bytes.fromhex(s.strip()[1:])) for s in (ROOT/'art/palette/master_palette.hex').read_text().splitlines() if s.strip()]
colors=[colors[i] for i in (0,5,10,11,12,13,14)]
out=ROOT/'art/frames/spirits';out.mkdir(parents=True,exist_ok=True)
preview=ROOT/'art/previews/phase_b/2026-11-04_core';preview.mkdir(parents=True,exist_ok=True)
frames=[]
for i in range(11):
    col,row=i%4,i//4
    cell=src.crop((col*src.width//4,row*src.height//3,(col+1)*src.width//4,(row+1)*src.height//3))
    cell.putalpha(cell.getchannel('A').point(lambda a:255 if a>=128 else 0))
    cell=cell.crop(cell.getbbox())
    scale=min(28/cell.width,24/cell.height)
    cell=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.NEAREST)
    cell.putdata([min(colors,key=lambda c:sum((c[j]-p[j])**2 for j in range(3)))+(255,) if p[3] else (0,0,0,0) for p in cell.get_flattened_data()])
    frame=Image.new('RGBA',(32,32));frame.alpha_composite(cell,((32-cell.width)//2,(32-cell.height)//2))
    name=f'burnil_idle_{i:03}' if i<6 else f'burnil_cast_{i-6:03}' if i<10 else 'burnil_icon'
    frame.save(out/f'{name}.png');frames.append(frame)
data=pack(out,ROOT/'public/assets/sprites/spirits/spirits',256)
for f in data['frames'].values():f['pivot']={'x':.5,'y':.5}
(ROOT/'public/assets/sprites/spirits/spirits.json').write_text(json.dumps(data,indent=2)+'\n')
board=Image.new('RGBA',(384,288),'#2b2440')
for i,f in enumerate(frames):board.alpha_composite(f.resize((96,96),Image.Resampling.NEAREST),((i%4)*96,(i//4)*96))
board.save(preview/'burnil_review.png')
for name,seq,duration in [('idle',frames[:6],125),('cast',frames[6:10],83)]:
    enlarged=[]
    for f in seq:
        bg=Image.new('RGBA',(128,128),'#2b2440');bg.alpha_composite(f.resize((128,128),Image.Resampling.NEAREST));enlarged.append(bg.convert('RGB'))
    enlarged[0].save(preview/f'burnil_{name}.gif',save_all=True,append_images=enlarged[1:],duration=duration,loop=0)
print('Burnil: 11 frames packed; other spirits use runtime fallback.')
