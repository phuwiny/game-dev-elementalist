"""Export the generated 7x4 fire puzzle source into fixed-size frames."""
from pathlib import Path
import json
from PIL import Image
from pack_atlas import pack
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'art/concept/2026-11-04_fire_objects_source.png'
GROUPS=[('burnable_vine_idle',0,1,(16,16),1),('burnable_vine_burn',1,6,(16,16),12),('wooden_crate_idle',7,1,(16,16),1),('wooden_crate_burn',8,6,(16,16),12),('torch_unlit',14,1,(16,32),1),('torch_lit',15,4,(16,32),10),('pressure_plate_up',19,1,(32,8),1),('pressure_plate_down',20,1,(32,8),1),('gate_door_closed',21,1,(32,48),1),('gate_door_open',22,6,(32,48),12)]
def build():
    src=Image.open(SOURCE).convert('RGBA')
    if src.getchannel('A').getextrema()==(255,255):raise ValueError('Source has no transparency; cannot export safely')
    colors=[tuple(bytes.fromhex(s.strip()[1:])) for s in (ROOT/'art/palette/master_palette.hex').read_text().splitlines() if s.strip()]
    colors=[colors[i] for i in (0,1,3,4,5,6,7,8,10,11,12,13,14,28,29,30)]
    out=ROOT/'art/frames/objects';out.mkdir(parents=True,exist_ok=True)
    preview=ROOT/'art/previews/phase_b/2026-11-04_core';preview.mkdir(parents=True,exist_ok=True)
    cells=[]
    for i in range(28):
        x,y=i%7,i//7
        c=src.crop((x*src.width//7,round([0,245,465,710][y]*src.height/1024),(x+1)*src.width//7,round([245,465,710,1024][y]*src.height/1024)))
        c.putalpha(c.getchannel('A').point(lambda a:255 if a>=128 else 0));cells.append(c)
    board=Image.new('RGBA',(672,480),'#2b2440')
    for name,start,count,size,fps in GROUPS:
        family=range(0,7) if start<7 else range(7,14) if start<14 else range(14,19) if start<19 else range(19,21) if start<21 else range(21,28)
        boxes=[cells[i].getbbox() for i in family if cells[i].getbbox()]
        box=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes))
        scale=min(size[0]/(box[2]-box[0]),size[1]/(box[3]-box[1]))
        target=(max(1,round((box[2]-box[0])*scale)),max(1,round((box[3]-box[1])*scale)))
        gifs=[]
        for n in range(count):
            c=cells[start+n].crop(box).resize(target,Image.Resampling.NEAREST)
            c.putdata([min(colors,key=lambda q:sum((q[j]-p[j])**2 for j in range(3)))+(255,) if p[3] else (0,0,0,0) for p in c.get_flattened_data()])
            f=Image.new('RGBA',size);f.alpha_composite(c,((size[0]-c.width)//2,size[1]-c.height));f.save(out/f'{name}_{n:03}.png')
            display=Image.new('RGBA',(96,120),'#2b2440');zoom=min(4,80//size[0],100//size[1]);z=f.resize((size[0]*zoom,size[1]*zoom),Image.Resampling.NEAREST);display.alpha_composite(z,((96-z.width)//2,110-z.height));gifs.append(display.convert('RGB'))
            i=start+n;board.alpha_composite(display,((i%7)*96,(i//7)*120))
        if count>1:gifs[0].save(preview/f'{name}.gif',save_all=True,append_images=gifs[1:],duration=round(1000/fps),loop=0)
    pack(out,ROOT/'public/assets/sprites/objects/objects',512)
    board.save(preview/'fire_objects_review.png')
    print('Exported 28 fire puzzle frames')
if __name__=='__main__':build()
