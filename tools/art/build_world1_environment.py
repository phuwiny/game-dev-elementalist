"""Build Ember Woods tile art, Tiled metadata, and four looping backgrounds."""
from __future__ import annotations

from pathlib import Path
import math
import random
from xml.etree import ElementTree as ET
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
COLORS = [tuple(bytes.fromhex(line.strip()[1:])) for line in
          (ROOT/'art/palette/master_palette.hex').read_text().splitlines() if line.strip()]
P = lambda i: COLORS[i] + (255,)
TRANSPARENT = (0, 0, 0, 0)
TILE_DIR = ROOT/'public/assets/tilesets'
BG_DIR = ROOT/'public/assets/backgrounds/w1'
SAMPLES = ROOT/'art/previews/phase_b/2026-10-24_world1_style_samples'


def tile(index: int) -> Image.Image:
    rng = random.Random(1200 + index)
    image = Image.new('RGBA', (16, 16), TRANSPARENT)
    draw = ImageDraw.Draw(image)
    if index < 16:
        # 0/1 top, 2/3 fill, 4/5 sides, 6 ceiling,
        # 7-10 outer corners, 11-14 inner corners, 15 single-tile cap.
        sample = ('moss_soil' if index % 2 == 0 else 'old_roots')
        image.alpha_composite(Image.open(SAMPLES/f'{sample}.png').convert('RGBA'))
        if index not in (0, 1, 7, 8, 11, 12, 15):
            image = Image.new('RGBA', (16, 16), P(24 if index % 2 == 0 else 6))
            soil = ImageDraw.Draw(image)
            for _ in range(40):
                x, y = rng.randrange(16), rng.randrange(16)
                soil.rectangle((x, y, min(x + rng.randrange(1, 4), 15), y),
                               fill=P(rng.choice((24, 25, 6, 7, 26))))
        draw = ImageDraw.Draw(image)
        if index in (0, 1, 7, 8, 11, 12, 15):
            draw.rectangle((0, 0, 15, 2), fill=P(0))
            draw.line((0, 0, 15, 0), fill=P(30))
            for x in (1, 4, 9, 13):
                draw.point((x, 1), fill=P(29 if x % 2 else 27))
        if index in (6, 9, 10, 13, 14):
            draw.rectangle((0, 13, 15, 15), fill=P(0))
            draw.line((0, 14, 15, 14), fill=P(27))
        if index in (4, 7, 9, 11, 13, 15):
            draw.rectangle((0, 0, 1, 15), fill=P(0))
            draw.line((1, 2, 1, 12), fill=P(27))
        if index in (5, 8, 10, 12, 14, 15):
            draw.rectangle((14, 0, 15, 15), fill=P(0))
            draw.line((14, 2, 14, 12), fill=P(27))
        if index in (11, 12, 13, 14):
            x0 = 2 if index in (11, 13) else 10
            y0 = 2 if index in (11, 12) else 10
            draw.rectangle((x0, y0, x0 + 3, y0 + 3), fill=P(24))
            draw.line((x0, y0 + 3, x0 + 3, y0 + 3), fill=P(27))
    elif index < 19:  # one-way timber bridges: left, middle, right
        draw.rectangle((0, 5, 15, 8), fill=P(0))
        draw.rectangle((0, 5, 15, 6), fill=P(26))
        for x in (3, 9, 14):
            draw.line((x, 6, x, 8), fill=P(6))
        if index == 16: draw.line((0, 5, 0, 8), fill=P(27), width=2)
        if index == 18: draw.line((14, 5, 15, 8), fill=P(27), width=2)
    elif index < 22:  # two spike variants and burning ember thorn
        for x in range(0, 16, 5):
            draw.polygon([(x, 15), (x+2, 3+(index-19)%3), (x+5, 15)], fill=P(0))
            draw.line((x+2, 4+(index-19)%3, x+1, 11), fill=P(11 if index==21 else 27))
        draw.rectangle((0, 14, 15, 15), fill=P(24))
    elif index < 34:  # quiet ruined masonry walls
        image.alpha_composite(Image.open(SAMPLES/'ruin_stone.png').convert('RGBA'))
        draw = ImageDraw.Draw(image)
        for y in (4+(index%3), 11):
            draw.line((0, y, 15, y), fill=P(0))
        for x in ((index*5)%15, (index*7+4)%15):
            draw.line((x, 1, x, 4), fill=P(2))
        if index % 4 == 0:
            draw.line((4, 1, 5, 1), fill=P(30))
    elif index < 58:  # leaves, roots, vines, stone shards, mushrooms, lamps
        kind = (index-34)//4
        variant = index%4
        if kind == 0:  # fallen leaf clusters
            for j in range(5):
                x, y = rng.randrange(2,14), rng.randrange(4,14)
                draw.polygon([(x,y-2),(x+2,y),(x,y+2),(x-1,y)],fill=P((11,12,13,14)[(j+variant)%4]))
        elif kind == 1:  # roots
            draw.line((2+variant,15,4+variant,7,9+variant,3),fill=P(0),width=3)
            draw.line((5+variant,10,13,15),fill=P(6),width=2)
            draw.line((4+variant,7,9+variant,3),fill=P(27),width=1)
        elif kind == 2:  # vertical wall vines
            x=4+variant*2
            draw.line((x,0,x+2,6,x,15),fill=P(28),width=2)
            for y in (3,8,12): draw.polygon([(x,y),(x+5,y-1),(x+2,y+2)],fill=P(30))
        elif kind == 3:  # stone rubble
            draw.polygon([(1,15),(3,7),(10,5),(15,12),(13,15)], fill=P(2))
            draw.line((3,7,10,5,13,8),fill=P(4),width=2)
            draw.line((2,14,12,14),fill=P(0))
        elif kind == 4:  # mushrooms / red caps
            x=3+variant*2
            draw.rectangle((x,8,x+3,15),fill=P(4))
            draw.polygon([(x-3,9),(x,4),(x+3,4),(x+6,9)],fill=P(11 if variant%2 else 13))
            draw.point((x+1,6),fill=P(14))
        else:  # ember brazier flowers
            x=4+variant*2
            draw.line((x,15,x,7),fill=P(28),width=2)
            draw.ellipse((x-4,1,x+4,8),fill=P(11))
            draw.ellipse((x-2,2,x+2,6),fill=P(14))
    return image


def tileset() -> None:
    TILE_DIR.mkdir(parents=True,exist_ok=True)
    target=TILE_DIR/'tiles_w1_ember_woods.png'
    sheet=Image.new('RGBA',(288,72),TRANSPARENT)
    for i in range(64):
        image=tile(i) if i<58 else Image.new('RGBA',(16,16),TRANSPARENT)
        x,y=1+(i%16)*18,1+(i//16)*18
        sheet.alpha_composite(image,(x,y))
        for dx in range(16):
            sheet.putpixel((x+dx,y-1),image.getpixel((dx,0)))
            sheet.putpixel((x+dx,y+16),image.getpixel((dx,15)))
        for dy in range(16):
            sheet.putpixel((x-1,y+dy),image.getpixel((0,dy)))
            sheet.putpixel((x+16,y+dy),image.getpixel((15,dy)))
        for px,py,sx,sy in ((x-1,y-1,0,0),(x+16,y-1,15,0),(x-1,y+16,0,15),(x+16,y+16,15,15)):
            sheet.putpixel((px,py),image.getpixel((sx,sy)))
    sheet.save(target)
    ts=ET.Element('tileset',{'version':'1.10','tiledversion':'1.11.0','name':'tiles_w1_ember_woods',
                             'tilewidth':'16','tileheight':'16','tilecount':'64','columns':'16','margin':'1','spacing':'2'})
    ET.SubElement(ts,'image',{'source':target.name,'width':'288','height':'72'})
    for i in range(22):
        entry=ET.SubElement(ts,'tile',{'id':str(i)})
        props=ET.SubElement(entry,'properties')
        kind='collides' if i<16 else 'oneWay' if i<19 else 'hazard'
        ET.SubElement(props,'property',{'name':kind,'type':'bool','value':'true'})
    ET.indent(ts,space='  ')
    target.with_suffix('.tsx').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(ts,encoding='unicode')+'\n',
        encoding='utf-8',newline='\n')


def finish(image: Image.Image, path: Path) -> None:
    # The engine loops horizontally. Match the extreme columns exactly.
    for y in range(image.height):
        image.putpixel((image.width-1,y),image.getpixel((0,y)))
    image.save(path)


def backgrounds() -> None:
    BG_DIR.mkdir(parents=True,exist_ok=True)
    source=Image.open(ROOT/'art/concept/2026-10-24_ember_woods_far_source.png').convert('RGB')
    reduced=source.resize((640,360),Image.Resampling.LANCZOS)
    luminance=reduced.convert('L')
    far=Image.new('RGBA',(640,360))
    out=far.load();levels=luminance.load()
    for y in range(360):
        for x in range(640):
            value=levels[x,y]
            out[x,y]=P(1 if value<60 else 2 if value<105 else 3 if value<185 else 4)
    # A single small warm accent keeps the far layer quiet behind gameplay.
    ImageDraw.Draw(far).ellipse((499,126,528,155),fill=P(13))
    finish(far,BG_DIR/'bg_w1_far.png')
    mid=Image.new('RGBA',(640,360),TRANSPARENT);d=ImageDraw.Draw(mid)
    rng=random.Random(401)
    for x in range(-40,660,92):
        h=rng.randrange(88,140)
        d.polygon([(x+9,350),(x+10,350-h),(x+19,350-h),(x+23,350)],fill=P(1))
        d.line((x+15,350-h+18,x-14,350-h-10),fill=P(1),width=5)
        d.line((x+17,350-h+27,x+45,350-h-13),fill=P(1),width=5)
        for yy in range(350-h+18,350,22):d.rectangle((x+9,yy,x+20,yy+2),fill=P(3))
        for j in range(35):
            lx=x+rng.randrange(-31,56)
            ly=350-h+rng.randrange(-35,36)
            if ((lx-x-12)/46)**2+((ly-(350-h))/42)**2>1:continue
            d.rectangle((lx,ly,lx+rng.randrange(4,11),ly+rng.randrange(2,6)),fill=P(rng.choice((28,28,10,11,12))))
    for x in range(30,640,205):
        d.rectangle((x,215,x+19,342),fill=P(2))
        d.rectangle((x-6,207,x+25,214),fill=P(3))
    finish(mid,BG_DIR/'bg_w1_mid.png')
    near=Image.new('RGBA',(640,360),TRANSPARENT);d=ImageDraw.Draw(near)
    rng=random.Random(509)
    for x in range(-24,680,74):
        d.line((x+12,0,x+19,46,x+52,67),fill=P(6),width=5)
        d.line((x+20,38,x-10,65),fill=P(0),width=2)
        for _ in range(15):
            lx=x+rng.randrange(-18,68);ly=rng.randrange(0,72)
            d.polygon([(lx,ly),(lx+6,ly-3),(lx+10,ly+2),(lx+4,ly+5)],fill=P(rng.choice((10,11,12,13,28))))
    for x in range(20,640,116):
        d.line((x,356,x+8,327,x+26,319),fill=P(0),width=4)
        d.line((x+7,335,x+28,347),fill=P(28),width=2)
    finish(near,BG_DIR/'bg_w1_near.png')
    boss=Image.new('RGBA',(640,360),P(2));d=ImageDraw.Draw(boss)
    for y in range(0,360):
        d.line((0,y,639,y),fill=P(2 if y<170 else 1))
    d.ellipse((260,60,384,184),fill=P(10))
    d.ellipse((282,84,360,162),fill=P(11))
    for x in range(-45,710,125):
        d.rectangle((x+22,125,x+41,359),fill=P(0))
        d.line((x+30,155,x+6,95),fill=P(0),width=5)
        d.line((x+30,148,x+66,85),fill=P(0),width=5)
        for j in range(20):
            lx=x+random.Random(x*17+j).randrange(-38,98)
            ly=random.Random(x*19+j).randrange(55,137)
            d.rectangle((lx,ly,lx+8,ly+5),fill=P(28 if j%3 else 10))
    d.rectangle((0,340,639,359),fill=P(6))
    finish(boss,BG_DIR/'bg_w1_boss_far.png')


if __name__=='__main__':
    tileset();backgrounds()
    print('Built 64-tile World 1 set, TSX properties, and four backgrounds.')
