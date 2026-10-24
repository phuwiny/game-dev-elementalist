"""Compose the requested pre-Phase-C palette/scale test, not a World 1 pack."""
from pathlib import Path
import json
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'art/previews/phase_b/2026-10-24_world1_style_samples'
OUT.mkdir(parents=True,exist_ok=True)
MASTER=[tuple(bytes.fromhex(s.strip()[1:])) for s in (ROOT/'art/palette/master_palette.hex').read_text().splitlines()]
SHEET=Image.open(ROOT/'art/concept/2026-10-24_world1_style_samples_source.png').convert('RGBA')
NAMES=['moss_slime','thorn_beetle','moss_soil','ember_leaves','old_roots','ruin_stone']
tile_indices=[0,1,2,3,4,5,6,7,10,11,12,13,14,24,25,26,27,28,29,30]
groups=[[0,1,3,4,5,6,7,14,24,25,26,28,29,30],
        [0,1,2,3,5,6,7,10,11,12,13,14,24,25,26,27]]+[tile_indices]*4
samples={}
for i,name in enumerate(NAMES):
    x,y=i%3*SHEET.width//3,i//3*SHEET.height//2
    cell=SHEET.crop((x,y,x+SHEET.width//3,y+SHEET.height//2))
    alpha=cell.getchannel('A').point(lambda v:255 if v>=128 else 0)
    cell.putalpha(alpha)
    box=cell.getbbox(); cell=cell.crop(box)
    if i<2:
        factor=min(32/cell.width,32/cell.height)
        small=cell.resize((round(cell.width*factor),round(cell.height*factor)),Image.Resampling.NEAREST)
        frame=Image.new('RGBA',(32,32));frame.alpha_composite(small,((32-small.width)//2,32-small.height))
    else:
        # Full opaque 16px terrain sample; crop edge ornament, no extrusion yet.
        cell=cell.crop((4,4,cell.width-4,cell.height-4))
        frame=cell.resize((16,16),Image.Resampling.NEAREST)
        frame.putalpha(255)
    colors=[MASTER[j] for j in groups[i]]
    palette=Image.new('P',(1,1));palette.putpalette([c for rgb in colors for c in rgb]+list(colors[0])*(256-len(colors)))
    mask=frame.getchannel('A')
    indexed=frame.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');indexed.putalpha(mask)
    clean=Image.new('RGBA',frame.size);clean.paste(indexed,mask=mask)
    clean.save(OUT/f'{name}.png'); samples[name]=clean

screen=Image.new('RGBA',(640,360),'#0f0b1a');d=ImageDraw.Draw(screen)
d.text((20,14),'ELEMENTAL SPIRIT / WORLD 1 STYLE TEST',fill='#f2efe6')
d.text((20,32),'Aclaire V4: 247-color source  |  enemies: <=16  |  tiles: <=24',fill='#b4b2c9')
d.rectangle((0,58,639,215),fill='#2b2440')
# Quiet flat background to judge silhouettes at the real game size.
for x in [18,116,470,568]:
    d.rectangle((x,58,x+12,215),fill='#4a4466')
    d.polygon([(x-22,60),(x+7,80),(x+46,59),(x+9,103)],fill='#4a4466')
for j,name in enumerate(NAMES[2:]):
    tile=samples[name].resize((24,24),Image.Resampling.NEAREST)
    section=Image.new('RGBA',(160,32))
    for x in range(0,160,24):
        for y in (0,24):section.alpha_composite(tile,(x,y))
    screen.alpha_composite(section,(j*160,216))
player=Image.open(ROOT/'art/frames/player/idle_000.png').convert('RGBA').resize((48,64),Image.Resampling.NEAREST)
screen.alpha_composite(player,(236,152))
screen.alpha_composite(samples['moss_slime'].resize((48,48),Image.Resampling.NEAREST),(300,168))
screen.alpha_composite(samples['thorn_beetle'].resize((48,48),Image.Resampling.NEAREST),(358,168))
d.text((236,132),'Aclaire',fill='#f2efe6')
d.text((300,164),'Slime',fill='#f2efe6')
d.text((364,164),'Beetle',fill='#f2efe6')
for j,(name,label) in enumerate(zip(NAMES[2:],['MOSS + SOIL','EMBER LEAVES','OLD ROOTS','RUIN STONE'])):
    x=j*160+14
    d.text((x,261),label,fill='#f2efe6')
    screen.alpha_composite(samples[name].resize((48,48),Image.Resampling.NEAREST),(x,279))
    screen.alpha_composite(samples[name],(x+60,295))
    d.text((x+60,316),'16 x 16',fill='#7b7896')
d.text((14,342),'640 x 360 / world 1.5x / approval required before Phase C',fill='#b4b2c9')
(ROOT/'art/mockups').mkdir(exist_ok=True)
screen.save(ROOT/'art/mockups/2026-10-24_aclaire_v4_world1_style_test.png')
metrics={name:{'size':image.size,'colors':len({p[:3] for p in image.get_flattened_data() if p[3]})} for name,image in samples.items()}
union={p[:3] for name in NAMES[2:] for p in samples[name].get_flattened_data() if p[3]}
assert len(union)<=24
for name,image in samples.items():
    colors={p[:3] for p in image.get_flattened_data() if p[3]}
    assert colors<=set(MASTER)
    assert len(colors)<=(16 if name in NAMES[:2] else 24)
metrics['tile_union_colors']=len(union)
(ROOT/'art/reports/2026-10-24_world1_style_metrics.json').write_text(json.dumps(metrics,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(metrics))
