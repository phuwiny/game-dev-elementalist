"""Normalize Bramble King and create readable 16-color animated boss parts."""
from __future__ import annotations

from pathlib import Path
import json
import math
import random
from PIL import Image, ImageDraw
from pack_atlas import pack

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'art/concept/2026-10-24_bramble_king_sprite_source.png'
VINE_SOURCE=ROOT/'art/concept/2026-10-25_vine_whip_detailed_source.png'
OUT=ROOT/'art/frames/boss_bramble_king'
PREVIEW=ROOT/'art/previews/phase_c'
MASTER=[tuple(bytes.fromhex(s.strip()[1:])) for s in (ROOT/'art/palette/master_palette.hex').read_text().splitlines() if s.strip()]
IDS=(0,1,3,5,6,7,8,9,10,11,12,13,14,28,29,30)
PAL=[MASTER[i] for i in IDS]
P=lambda index: MASTER[index]+(255,)
TABLE=Image.new('P',(1,1))
TABLE.putpalette([v for color in PAL for v in color]+list(PAL[0])*(256-len(PAL)))
ANIMS={'idle':(6,6,-1),'vine_attack':(8,12,0),'roar':(6,8,0),
       'weak_exposed':(4,8,-1),'hurt':(2,10,0),'death':(10,10,0),
       'vine_whip':(6,12,-1),'vine_shield_idle':(1,1,0),
       'vine_shield_burn':(6,12,0),'thorn_seed':(2,8,-1)}


def indexed(source:Image.Image)->Image.Image:
    mask=source.getchannel('A').point(lambda a:255 if a>=128 else 0)
    image=source.convert('RGB').quantize(palette=TABLE,dither=Image.Dither.NONE).convert('RGBA')
    image.putalpha(mask)
    clean=Image.new('RGBA',image.size)
    clean.paste(image,mask=mask)
    return clean


def base_boss() -> Image.Image:
    source=Image.open(SOURCE).convert('RGBA')
    box=source.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
    source=source.crop(box).resize((188,190),Image.Resampling.NEAREST)
    result=Image.new('RGBA',(192,192))
    result.alpha_composite(indexed(source),(2,2))
    return result


def boss_pose(base:Image.Image,action:str,i:int,count:int)->Image.Image:
    frame=base.copy();d=ImageDraw.Draw(frame)
    if action=='idle':
        # Autumn leaves drift above the branches. Trunk/roots stay anchored.
        for j in range(3):
            x=48+j*32+(i+j)%3;y=9+j*8+i%2
            d.rectangle((x,y,x+2,y+2),fill=P((11,12,13)[j]))
    elif action=='vine_attack':
        x=round(50-5*min(i,5))
        d.line((78,110,50,120,x,144),fill=P(0),width=7)
        d.line((78,110,50,120,x,144),fill=P(29),width=5)
        for j in range(3):
            px=x+j*11;py=141-j*8
            d.polygon([(px,py),(px-4,py-6),(px+3,py-2)],fill=P(30))
    elif action=='roar':
        for j in range(2+i%3):
            x=113+j*7;y=61+j*4
            d.polygon([(x,y),(x+3,y-2),(x+4,y+2)],fill=P(14))
        d.ellipse((115,61,126,72),fill=P(0))
        d.rectangle((119,65,122,67),fill=P(13))
    elif action=='weak_exposed':
        # The target is placed in the game's x=20..64, height=16..68 zone.
        d.ellipse((25,124,61,160),fill=P(0))
        d.ellipse((28,127,58,157),fill=P(11))
        d.ellipse((32,130,54,153),fill=P(13))
        d.ellipse((39,135,49,146),fill=P(14))
        d.point((42+i%3,137),fill=P(5))
    elif action=='hurt':
        d.line((21,123,28,115),fill=P(14),width=3)
        d.line((62,132,70,123),fill=P(14),width=3)
    elif action=='death':
        rng=random.Random(690)
        pixels=frame.load();fraction=i/(count-1)
        for y in range(192):
            for x in range(192):
                if pixels[x,y][3] and rng.random()<fraction:
                    pixels[x,y]=(0,0,0,0)
    return frame


def vine_base()->Image.Image:
    source=Image.open(VINE_SOURCE).convert('RGBA')
    box=source.getchannel('A').point(lambda a:255 if a>=96 else 0).getbbox()
    return indexed(source.crop(box).resize((64,16),Image.Resampling.NEAREST))


def vine_whip(i:int,base:Image.Image)->Image.Image:
    reach=(18,27,36,45,54,64)[i]
    left=64-reach
    frame=Image.new('RGBA',(64,16))
    frame.alpha_composite(base.crop((left,0,64,16)),(left,0))
    if i<5:
        d=ImageDraw.Draw(frame)
        d.rectangle((left,0,left+3,15),fill=(0,0,0,0))
        d.polygon([(left,9),(left+5,6),(left+5,12)],fill=P(0))
        d.line((left+2,9,left+5,8),fill=P(29),width=2)
    return frame


def shield(i:int,burning:bool)->Image.Image:
    frame=Image.new('RGBA',(32,32));d=ImageDraw.Draw(frame)
    d.ellipse((2,2,29,29),fill=P(0))
    d.ellipse((5,5,26,26),fill=P(28 if not burning else 11))
    d.ellipse((10,10,21,21),fill=P(29 if not burning else 13))
    for angle in range(0,360,45):
        cx=16+round(12*math.cos(math.radians(angle)))
        cy=16+round(12*math.sin(math.radians(angle)))
        d.line((16,16,cx,cy),fill=P(30 if not burning else 14),width=2)
    if burning:
        rng=random.Random(905)
        a=frame.load()
        for y in range(32):
            for x in range(32):
                if a[x,y][3] and rng.random()<i/5:
                    a[x,y]=(0,0,0,0)
    return frame


def seed(i:int)->Image.Image:
    frame=Image.new('RGBA',(16,16));d=ImageDraw.Draw(frame)
    d.ellipse((4,4+i,11,11+i),fill=P(0))
    d.ellipse((6,6+i,9,9+i),fill=P(29))
    for x in (4,8,11):
        d.polygon([(x,6+i),(x-1,1+i),(x+2,4+i)],fill=P(30))
    return frame


def build() -> None:
    OUT.mkdir(parents=True,exist_ok=True);PREVIEW.mkdir(parents=True,exist_ok=True)
    base=base_boss()
    whip_base=vine_base()
    for name,(count,fps,repeat) in ANIMS.items():
        for i in range(count):
            if name=='vine_whip':frame=vine_whip(i,whip_base)
            elif name=='vine_shield_idle':frame=shield(0,False)
            elif name=='vine_shield_burn':frame=shield(i,True)
            elif name=='thorn_seed':frame=seed(i)
            else:frame=boss_pose(base,name,i,count)
            frame.save(OUT/f'{name}_{i:03}.png')
    dest=ROOT/'public/assets/sprites/bosses/boss_bramble_king'
    atlas=pack(OUT,dest)
    for name,info in atlas['frames'].items():
        if name.startswith(('idle_','vine_attack_','roar_','weak_exposed_','hurt_','death_')):
            info['pivot']={'x':0.0,'y':1.0}
    dest.with_suffix('.json').write_text(json.dumps(atlas,indent=2)+'\n',encoding='utf-8',newline='\n')
    path=ROOT/'public/assets/animations.json';manifest=json.loads(path.read_text())
    for name,(count,fps,repeat) in ANIMS.items():
        manifest['boss_bramble_king_'+name]={'atlas':'boss_bramble_king','prefix':name+'_','frames':count,'frameRate':fps,'repeat':repeat}
    path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8',newline='\n')
    board=Image.new('RGBA',(640,360),'#2b2440');d=ImageDraw.Draw(board)
    d.text((12,12),'BRAMBLE KING / WORLD 1 / 192 x 192',fill=P(5))
    for i,name in enumerate(('idle','vine_attack','weak_exposed')):
        frame=Image.open(OUT/f'{name}_000.png').convert('RGBA')
        board.alpha_composite(frame,(14+i*206,63))
        d.text((15+i*206,260),name,fill=P(5))
    board.save(PREVIEW/'2026-10-24_bramble_king_review.png')
    strip=Image.new('RGB',(640,6*112),'#2b2440')
    labels=ImageDraw.Draw(strip)
    for i in range(6):
        frame=Image.open(OUT/f'vine_whip_{i:03}.png').convert('RGBA')
        labels.text((12,i*112+8),f'vine_whip_{i:03}',fill=P(5))
        enlarged=frame.resize((384,96),Image.Resampling.NEAREST)
        strip.paste(enlarged,(120,i*112+16),enlarged)
    strip.save(PREVIEW/'2026-10-25_vine_whip_animation_strip.png')
    print(f"Built {len(atlas['frames'])} boss/part frames and {len(ANIMS)} animations: {atlas['meta']['size']}")


if __name__=='__main__':build()
