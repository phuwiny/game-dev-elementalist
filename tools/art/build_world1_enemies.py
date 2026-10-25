"""Derive the World 1 enemy motion atlas from approved 32px samples."""
from __future__ import annotations

from pathlib import Path
import json
import random
from PIL import Image, ImageDraw
from pack_atlas import pack

ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'art/previews/phase_b/2026-10-24_world1_style_samples'
OUT=ROOT/'art/frames/enemies_w1'
PREVIEW=ROOT/'art/previews/phase_c'
COLORS=[tuple(bytes.fromhex(line.strip()[1:])) for line in (ROOT/'art/palette/master_palette.hex').read_text().splitlines() if line.strip()]
P=lambda i:COLORS[i]+(255,)

ANIMS={
 'moss_slime_idle':(4,6,-1),'moss_slime_move':(6,8,-1),'moss_slime_hurt':(2,10,0),'moss_slime_death':(5,12,0),
 'leaf_wisp_fly':(6,10,-1),'leaf_wisp_dive':(3,12,-1),'leaf_wisp_hurt':(2,10,0),'leaf_wisp_death':(5,12,0),
 'thorn_beetle_walk':(6,8,-1),'thorn_beetle_flipped':(4,8,-1),'thorn_beetle_hurt':(2,10,0),'thorn_beetle_death':(5,12,0),
}


def wisp_base() -> Image.Image:
    image=Image.new('RGBA',(32,32));d=ImageDraw.Draw(image)
    d.polygon([(15,27),(10,21),(8,13),(11,7),(17,3),(22,7),(24,15),(21,22)],fill=P(0))
    d.polygon([(15,25),(11,18),(11,12),(16,5),(20,9),(21,17),(18,22)],fill=P(21))
    d.polygon([(14,18),(14,11),(18,7),(19,15)],fill=P(22))
    d.polygon([(12,11),(4,9),(6,3),(14,6)],fill=P(28))
    d.polygon([(11,9),(5,7),(7,4),(13,7)],fill=P(30))
    d.polygon([(21,11),(27,6),(29,12),(23,15)],fill=P(28))
    d.polygon([(22,12),(27,8),(28,11)],fill=P(30))
    d.polygon([(15,26),(13,31),(18,28),(21,30),(20,22)],fill=P(21))
    d.point((15,14),fill=P(14));d.point((19,14),fill=P(14))
    d.point((16,15),fill=P(0));d.point((20,15),fill=P(0))
    return image


def offset(base: Image.Image, dx=0, dy=0, sx=1.0, sy=1.0) -> Image.Image:
    size=(max(1,round(32*sx)),max(1,round(32*sy)))
    moved=base.resize(size,Image.Resampling.NEAREST)
    image=Image.new('RGBA',(32,32))
    image.alpha_composite(moved,((32-size[0])//2+dx,32-size[1]+dy))
    return image


def hit(base:Image.Image,index:int)->Image.Image:
    frame=base.copy();d=ImageDraw.Draw(frame)
    d.line((5+index,4,2+index,0),fill=P(14))
    d.line((25-index,4,29-index,0),fill=P(14))
    return frame


def dissolve(base:Image.Image,index:int,count:int,seed:int)->Image.Image:
    rng=random.Random(seed)
    frame=base.copy()
    alpha=frame.load()
    amount=index/(count-1)
    for y in range(32):
        for x in range(32):
            if alpha[x,y][3] and rng.random()<amount:
                alpha[x,y]=(0,0,0,0)
    return frame


def build() -> None:
    OUT.mkdir(parents=True,exist_ok=True)
    PREVIEW.mkdir(parents=True,exist_ok=True)
    bases={'moss_slime':Image.open(SRC/'moss_slime.png').convert('RGBA'),
           'leaf_wisp':wisp_base(),
           'thorn_beetle':Image.open(SRC/'thorn_beetle.png').convert('RGBA')}
    board=Image.new('RGBA',(640,240),'#2b2440');d=ImageDraw.Draw(board)
    for name,(count,fps,repeat) in ANIMS.items():
        character,action=name.split('_',1)
        if name.startswith('moss_slime'): character='moss_slime';action=name[len(character)+1:]
        elif name.startswith('leaf_wisp'): character='leaf_wisp';action=name[len(character)+1:]
        else: character='thorn_beetle';action=name[len(character)+1:]
        base=bases[character]
        for i in range(count):
            if action=='idle': frame=offset(base,sy=(.91,1,.97,1)[i])
            elif action=='move': frame=offset(base,dx=(0,1,2,1,0,-1)[i],sy=(1,.94,1,1.03,1,.94)[i])
            elif action=='walk': frame=offset(base,dx=(0,1,1,0,-1,-1)[i],dy=(0,-1,0,0,-1,0)[i])
            elif action=='flipped':
                inverted=base.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
                box=inverted.getbbox()
                cropped=inverted.crop(box)
                frame=Image.new('RGBA',(32,32))
                frame.alpha_composite(cropped,((32-cropped.width)//2,32-cropped.height+(0,-1,0,-1)[i]))
            elif action=='fly': frame=offset(base,dy=(0,-1,-2,-1,0,1)[i])
            elif action=='dive': frame=offset(base,dx=(0,-2,0)[i],dy=(0,2,0)[i])
            elif action=='hurt':frame=hit(offset(base,dx=(-1,1)[i]),i)
            elif action=='death':frame=dissolve(base,i,count,1000+len(name))
            else:raise ValueError(action)
            # All ground enemies retain bottom-row contact in live motion.
            if character!='leaf_wisp' and action in ('idle','move','walk'):
                box=frame.getbbox()
                frame=offset(frame,dy=31-(box[3]-1)) if box and box[3]!=32 else frame
            frame.save(OUT/f'{name}_{i:03}.png')
    expected={f'{name}_{i:03}' for name,(count,_,_) in ANIMS.items() for i in range(count)}
    for path in OUT.glob('*.png'):
        if path.stem not in expected and any(path.stem.startswith(name+'_') for name in ANIMS):
            path.unlink()
    atlas=pack(OUT,ROOT/'public/assets/sprites/enemies/enemies_w1')
    for name,info in atlas['frames'].items():
        if name.startswith('leaf_wisp_'):
            info['pivot']={'x':0.5,'y':0.5}
    (ROOT/'public/assets/sprites/enemies/enemies_w1.json').write_text(
        json.dumps(atlas,indent=2)+'\n',encoding='utf-8',newline='\n')
    manifest=ROOT/'public/assets/animations.json'
    data=json.loads(manifest.read_text())
    for name,(count,fps,repeat) in ANIMS.items():
        data['enemies_w1_'+name]={'atlas':'enemies_w1','prefix':name+'_','frames':count,'frameRate':fps,'repeat':repeat}
    manifest.write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8',newline='\n')
    for n,character in enumerate(('moss_slime','leaf_wisp','thorn_beetle')):
        x=28+n*202
        frame=bases[character]
        board.alpha_composite(frame.resize((128,128),Image.Resampling.NEAREST),(x,48))
        d.text((x+5,184),character,fill=P(5))
    d.text((16,12),'EMBER WOODS / ENEMY ATLAS / 32 x 32',fill=P(5))
    board.save(PREVIEW/'2026-10-24_world1_enemies_review.png')
    print(f"Built {len(atlas['frames'])} enemy frames and {len(ANIMS)} animations.")


if __name__=='__main__':build()
