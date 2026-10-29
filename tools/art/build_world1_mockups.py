"""Compose World 1 gameplay and boss previews from actual atlas source frames."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[2]
BG=ROOT/'public/assets/backgrounds/w1'
TILES=ROOT/'public/assets/tilesets/tiles_w1_ember_woods.png'
OUT=ROOT/'art/mockups'
COLORS=[tuple(bytes.fromhex(line.strip()[1:])) for line in (ROOT/'art/palette/master_palette.hex').read_text().splitlines() if line.strip()]
P=lambda i:COLORS[i]+(255,)


def tile(sheet:Image.Image,i:int)->Image.Image:
    x,y=1+(i%16)*18,1+(i//16)*18
    return sheet.crop((x,y,x+16,y+16)).resize((24,24),Image.Resampling.NEAREST)


def ground(screen:Image.Image,sheet:Image.Image,level:int=288)->None:
    for x in range(0,640,24):
        for y in range(level,360,24):
            idx=0 if y==level else 1 if (x//24+y//24)%4 else 5
            screen.alpha_composite(tile(sheet,idx),(x,y))


def sprite(screen:Image.Image,path:str,at:tuple[int,int],size:tuple[int,int])->None:
    frame=Image.open(ROOT/path).convert('RGBA').resize(size,Image.Resampling.NEAREST)
    screen.alpha_composite(frame,at)


def hud(screen:Image.Image,boss:bool=False)->None:
    d=ImageDraw.Draw(screen)
    for x in range(14,94,16):
        d.polygon([(x,14),(x+5,11),(x+8,14),(x+11,11),(x+15,15),(x+8,23)],fill=P(11))
    d.rectangle((15,31,114,39),fill=P(0));d.rectangle((17,33,106,37),fill=P(31))
    for i in range(4):
        x=20+22*i
        d.ellipse((x,45,x+17,62),fill=P(0))
        d.ellipse((x+3,48,x+14,59),fill=P(12 if i==0 else 2))
    if boss:
        d.rectangle((178,324,462,339),fill=P(0))
        d.rectangle((182,328,455,335),fill=P(11))
        d.text((278,306),'BRAMBLE KING',fill=P(5))


def build():
    OUT.mkdir(parents=True,exist_ok=True)
    sheet=Image.open(TILES).convert('RGBA')
    far=Image.open(BG/'bg_w1_far.png').convert('RGBA')
    mid=Image.open(BG/'bg_w1_mid.png').convert('RGBA')
    near=Image.open(BG/'bg_w1_near.png').convert('RGBA')
    screen=far.copy();screen.alpha_composite(mid);screen.alpha_composite(near)
    ground(screen,sheet)
    for x in (287,311,335,359):screen.alpha_composite(tile(sheet,17),(x,192))
    for x,idx in ((140,36),(211,37),(472,38),(598,39)):
        screen.alpha_composite(tile(sheet,idx),(x,264))
    for y in range(216,288,24):screen.alpha_composite(tile(sheet,25),(520,y))
    sprite(screen,'art/frames/player/idle_000.png',(76,224),(48,64))
    sprite(screen,'art/frames/enemies_w1/moss_slime_idle_000.png',(218,240),(48,48))
    sprite(screen,'art/frames/enemies_w1/leaf_wisp_fly_000.png',(374,132),(48,48))
    sprite(screen,'art/frames/enemies_w1/thorn_beetle_walk_000.png',(452,240),(48,48))
    hud(screen)
    screen.save(OUT/'2026-10-24_world1_gameplay_mockup.png')
    boss=Image.open(BG/'bg_w1_boss_far.png').convert('RGBA')
    ground(boss,sheet)
    sprite(boss,'art/frames/player/idle_000.png',(143,224),(48,64))
    sprite(boss,'art/frames/boss_bramble_king/idle_000.png',(342,0),(288,288))
    shield=Image.open(ROOT/'art/frames/boss_bramble_king/vine_shield_idle_000.png').convert('RGBA')
    boss.alpha_composite(shield.resize((48,48),Image.Resampling.NEAREST),(380,186))
    hud(boss,True)
    boss.save(OUT/'2026-10-24_world1_boss_mockup.png')
    print('Composed gameplay and Bramble King mockups at 640x360.')


if __name__=='__main__':build()
