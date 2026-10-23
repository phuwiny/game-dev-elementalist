"""Checks Phase A review deliverables only. NOT the Phase B runtime validator."""
from pathlib import Path
import re
from PIL import Image
from build_phase_a_studies import ROOT, ART, P

names=['style_guide','aclaire_pixel_study','aclaire_48x64_study','aclaire_action_poses','spirits_sheet','enemies_lineup']
names += ['boss_'+s for s in ('bramble_king','magma_serpent','tempest_roc','moat_hydra','hollow_warden')]
names += [f'world_w{n}_keyframe' for n in range(1,6)]
errors=[]
def check(ok,message):
    if not ok:errors.append(message)

palette={tuple(bytes.fromhex(c[1:])) for c in P}
hexfile=ART/'palette/master_palette.hex'
check(hexfile.read_text().splitlines()==P,'Palette hex order differs from handoff')
with Image.open(ART/'palette/master_palette.png') as im:
    check(im.size==(35,1) and im.mode=='RGBA','Palette image must be RGBA 35x1')
    check([im.getpixel((x,0))[:3] for x in range(35)]==[tuple(bytes.fromhex(c[1:])) for c in P],'Palette pixels mismatch')
for name in names:
    p=ART/f'concept/{name}.png'
    check(p.exists(),f'Missing concept: {name}')
    if p.exists():
        with Image.open(p) as im:
            check(im.width>=1920 and im.height>=1080,f'{name}: concept below 1920x1080')
            check(im.mode=='RGBA',f'{name}: not RGBA')
        print(f'CONCEPT {name}: {im.width}x{im.height}')
studies={f'aclaire_{v}_{a}':(64 if a=='attack' else 32,48) for v in ('a','b') for a in ('idle','attack')}
studies['aclaire_48x64_idle']=(48,64)
studies.update({k+'_study':(32,32) for k in ('burnil','wata','valvaliz','eathy')})
for name,size in studies.items():
    with Image.open(ART/f'previews/phase_a/{name}.png') as im:
        check(im.size==size and im.mode=='RGBA',name+': size/mode')
        pixels=list(im.get_flattened_data())
        colors={v[:3] for v in pixels if v[3]}
        check(colors<=palette,name+': outside palette')
        check(len(colors)<=16,name+': more than 16 colors')
        check(all(v[3] in (0,255) for v in pixels),name+': intermediate alpha')
        if name.startswith('aclaire'):
            check(im.getbbox()[3]==size[1],name+': feet must reach bottom row')
            if name=='aclaire_48x64_idle':check(im.getbbox()[1]==9,name+': unexpected top margin')
            else:check(im.getbbox()[1]==8,name+': expected 40 px body')
        if name in ('burnil_study','wata_study','valvaliz_study'):
            b=im.getbbox();check(b[3]-b[1]<=24,name+': body taller than 24 px')
        print(f'PIXEL {name}: {size[0]}x{size[1]}, {len(colors)} colors, binary alpha')
for p in list((ART/'reports').glob('*'))+list((ROOT/'tools/art').glob('*.py'))+[hexfile]:
    if p.is_file():
        data=p.read_bytes();check(not data.startswith(b'\xef\xbb\xbf'),str(p)+': BOM')
        check(b'\r' not in data,str(p)+': CRLF');data.decode('utf-8')
for p in (ART/'concept').glob('*.png'):
    check(bool(re.fullmatch(r'[a-z0-9_]+\.png',p.name)),p.name+': naming')
if errors:
    print('\n'.join('FAIL '+e for e in errors));raise SystemExit(1)
check(Image.open(ART/'previews/phase_a/aclaire_48x64_scale_probe.png').size==(640,360),'48x64 scale probe size')
print(f'PASS: {len(names)} concept boards, {len(studies)} native studies, 35-color palette; Phase B validator not included.')
