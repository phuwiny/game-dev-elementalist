"""Export reference-derived Wata, Valvaliz and Eathy with a shared scale per character."""
from pathlib import Path
from PIL import Image
import json
from pack_atlas import pack
R=Path(__file__).resolve().parents[2]
def build():
 src=Image.open(R/'art/concept/2026-11-04_remaining_spirits_source.png').convert('RGBA')
 palette=[tuple(bytes.fromhex(s[1:])) for s in (R/'art/palette/master_palette.hex').read_text().split()]
 out=R/'art/frames/spirits';out.mkdir(parents=True,exist_ok=True)
 ramps=[[0,5,15,16,17,18,19,33,34],[0,1,5,8,9,15,17,18,19,20,21,22,23,28,29,30],[0,1,2,3,4,5,6,7,8,9,24,25,26,27]]
 for j,key in enumerate(('wata','valvaliz','eathy')):
  cells=[]
  for i in range(11):
   x=i%6;y=j*2+i//6;c=src.crop((x*src.width//6,y*src.height//6,(x+1)*src.width//6,(y+1)*src.height//6));c.putalpha(c.getchannel('A').point(lambda a:255 if a>=180 else 0));cells.append(c)
  boxes=[c.getbbox() for c in cells];maxw=max(b[2]-b[0] for b in boxes);maxh=max(b[3]-b[1] for b in boxes);scale=min(30/maxw,24/maxh);colors=[palette[k] for k in ramps[j]]
  for i,(cell,box) in enumerate(zip(cells,boxes)):
   c=cell.crop(box);c=c.resize((round(c.width*scale),round(c.height*scale)),Image.Resampling.NEAREST);c.putdata([min(colors,key=lambda q:sum((q[k]-p[k])**2 for k in range(3)))+(255,) if p[3] else (0,0,0,0) for p in c.get_flattened_data()]);f=Image.new('RGBA',(32,32));f.alpha_composite(c,((32-c.width)//2,(32-c.height)//2));name=f'{key}_idle_{i:03}' if i<6 else f'{key}_cast_{i-6:03}' if i<10 else f'{key}_icon';f.save(out/f'{name}.png')
 data=pack(out,R/'public/assets/sprites/spirits/spirits',512)
 for f in data['frames'].values():f['pivot']={'x':.5,'y':.5}
 (R/'public/assets/sprites/spirits/spirits.json').write_text(json.dumps(data,indent=2)+'\n')
 print('Spirits atlas:',len(data['frames']),'frames')
if __name__=='__main__':build()
