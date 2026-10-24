"""Deterministic Phase A studies only; no production atlases or animations.
Run from any directory: python3 tools/art/build_phase_a_studies.py
Requires Pillow. Illustration concepts are separate image-generation outputs.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'art'
HEX = '0f0b1a 2b2440 4a4466 7b7896 b4b2c9 f2efe6 5a3a2e 9c5f45 d99a6c f5d0a9 6e1a1a b8321f e8572a ff9a3c ffd36b 12305a 1f5f9e 2f9ed9 7fd6f5 d4f4ff 12483f 1f8a6c 48c9a0 a8f0cf 3d2a17 6e4a26 a8772f d9a94a 1e3d1f 3a6b2e 6fa83c 6b3fa0 8c2a55 e0508a ff9ec4'.split()
P = ['#' + h for h in HEX]
BG, INK, MUTED = '#f2efe6', '#2b2440', '#7b7896'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

def text(im, xy, s, size=24, color=INK, bold=False):
    ImageDraw.Draw(im).text(xy, s, fill=color, font=ImageFont.truetype(BOLD if bold else FONT, size))

def board(title, subtitle):
    im = Image.new('RGBA', (1920,1080), BG)
    d=ImageDraw.Draw(im)
    d.rectangle((48,48,62,128),fill=P[33])
    text(im,(84,42),title,46,bold=True)
    text(im,(86,103),subtitle,21,MUTED)
    d.line((48,148,1872,148), fill=P[4], width=2)
    text(im,(48,1030),'ELEMENTAL SPIRIT   /   PHASE A   /   PROPOSAL — AWAITING STYLE APPROVAL',18,MUTED)
    return im

def paste(im, sprite, xy, scale=1):
    im.alpha_composite(sprite.resize((sprite.width*scale,sprite.height*scale),Image.Resampling.NEAREST),xy)

def aclaire(variant='a', attack=False):
    im=Image.new('RGBA',(64 if attack else 32,48))
    d=ImageDraw.Draw(im); off=16 if attack else 0
    def poly(points,c,outline=0):
        d.polygon([(x+off,y) for x,y in points],fill=P[c],outline=P[outline] if outline is not None else None)
    def rect(box,c):
        x,y,X,Y=box;d.rectangle((x+off,y,X+off,Y),fill=P[c])
    def line(points,c,width=1):d.line([(x+off,y) for x,y in points],fill=P[c],width=width)
    # One rigid vertical sword axis; attack keeps only an empty sheath.
    sx=8 if variant=='a' else 9
    poly([(sx-2,24),(sx+2,24),(sx+2,39),(sx,42),(sx-2,40)],1)
    line([(sx-1,25),(sx-1,38)],2)
    if not attack:
        rect((sx-1,16,sx+1,22),14)
        for y in (18,20,22):rect((sx-1,y,sx+1,y),29)
        rect((sx-3,23,sx+3,24),14)
        poly([(sx-1,13),(sx+1,13),(sx+2,15),(sx,17),(sx-2,15)],12)
    # Ponytail, springy and separated from the sheathed sword.
    poly([(10,9),(6,8),(7,10),(3,11),(4,13),(1,16),(3,16),(1,20),(3,24),(6,27),(6,23),(9,24),(9,19),(12,14)],12)
    poly([(5,13),(8,11),(10,12),(7,16),(4,19),(3,18)],13,None)
    line([(6,12),(8,11),(9,11)],14)
    # Rear leg and front leg: thigh / sock / white cuff / black boot.
    for x,y in [(11,35),(18,35)]:
        poly([(x,y),(x+4,y),(x+3,43),(x-1,43)],9)
        rect((x,y+4,x+3,42),2)
        if variant=='b':line([(x+1,39),(x+1,41)],4)
        poly([(x-1,42),(x+3,42),(x+3,45),(x+5,46),(x+5,47),(x-2,47),(x-2,45)],1)
        rect((x-1,42,x+3,43),5)
        rect((x-1,47,x+4,47),5)
    # Torso and shorts; collar/shoulders remain pink around the small plate.
    poly([(13,24),(19,24),(22,27),(21,33),(12,33),(11,28)],33)
    rect((14,24,18,25),34)
    poly([(12,33),(21,33),(22,36),(17,37),(16,35),(14,37),(10,36)],26)
    line([(11,36),(14,36)],14)
    line([(18,36),(21,35)],14)
    rect((12,32,21,33),1);rect((17,32,18,33),14)
    if variant=='a':
        poly([(16,26),(20,26),(21,29),(17,30),(15,28)],4)
        line([(16,26),(19,26)],5)
    else:
        poly([(15,26),(20,26),(22,28),(20,30),(16,29)],2)
        poly([(16,26),(20,27),(20,29),(17,28)],4,None)
        line([(16,26),(18,26)],5)
    line([(20,25),(12,31)],0,2)
    rect((17,28,18,28),4)
    # Exposed arms, gold wrist cuff; right-facing open/cheerful pose.
    if attack:
        poly([(20,27),(24,28),(27,25),(30,26),(28,30),(23,31),(20,30)],9)
        rect((27,26,28,28),14)
        # Single drawn sword horizontal; all parts lie on y=27.
        rect((29,26,33,28),14);rect((31,26,31,28),29)
        rect((33,23,34,31),14)
        poly([(35,24),(43,24),(47,27),(43,30),(35,30)],4)
        line([(35,24),(42,24),(46,27)],5)
        line([(35,29),(42,29)],2)
        rect((28,26,29,28),12)
    else:
        poly([(12,26),(13,28),(11,31),(12,33),(10,34),(8,32),(10,28)],9)
        rect((9,31,11,31),14)
        poly([(21,27),(23,29),(25,27),(27,28),(26,31),(23,32),(21,30)],9)
        rect((24,30,25,30),14)
    # Head and face (2.5-head chibi); bright blue eye, small smile.
    poly([(13,13),(20,12),(24,16),(24,20),(26,21),(23,24),(19,26),(14,24),(11,20)],9)
    rect((22,18,23,21),5);rect((23,19,23,21),17)
    rect((24,18,24,20),0);rect((22,23,23,23),11)
    poly([(10,13),(10,10),(13,10),(13,8),(16,10),(21,9),(25,12),(27,16),(25,16),(25,19),(22,17),(22,14),(20,17),(18,18),(18,15),(15,19),(14,22),(12,20),(11,17)],12)
    poly([(12,12),(16,11),(21,11),(24,13),(20,12),(17,15),(17,13),(14,16)],13,None)
    line([(13,12),(15,11),(18,11)],14)
    line([(12,19),(13,21)],11)
    rect((9,11,11,12),33)
    return im

def spirit(kind, expression=0):
    im=Image.new('RGBA',(32,32));d=ImageDraw.Draw(im)
    def pol(p,c,o=0):d.polygon(p,fill=P[c],outline=P[o] if o is not None else None)
    def ell(b,c,o=None):d.ellipse(b,fill=P[c],outline=P[o] if o is not None else None)
    def rec(b,c):d.rectangle(b,fill=P[c])
    if kind=='burnil':
        pol([(5,24),(3,18),(5,19),(4,11),(8,14),(9,5),(13,10),(18,5),(18,10),(25,6),(22,14),(28,11),(25,19),(28,17),(25,25),(19,28),(11,28)],12)
        pol([(7,22),(7,16),(11,18),(12,10),(15,16),(20,11),(20,18),(24,16),(23,23),(18,26),(11,25)],14,None)
        pol([(9,16),(13,19),(10,20),(8,19)],0,None);pol([(18,19),(23,16),(22,20),(19,21)],0,None)
        d.arc((10,19,22,25),0,170,fill=P[0]);rec((11,23,12,24),5);rec((20,22,20,23),5)
    elif kind=='wata':
        pol([(4,25),(3,21),(5,15),(11,11),(18,10),(24,13),(28,21),(27,25),(23,28),(9,28)],17)
        ell((5,12,25,26),18);ell((13,6,20,12),18,0);rec((14,7,16,8),19)
        for x in (10,20):ell((x,16,x+3,22),15);rec((x+1,17,x+2,18),19)
        rec((7,23,9,23),34);rec((23,23,25,23),34)
        d.line([(13,23),(14,25),(16,24),(18,25),(20,23)],fill=P[15])
    elif kind=='valvaliz':
        for pts in [[(12,13),(2,7),(3,15),(10,19)],[(11,18),(1,17),(5,24),(12,23)],[(20,13),(29,7),(28,15),(21,19)],[(21,18),(30,17),(26,24),(20,23)]]:pol(pts,5,18)
        pol([(9,12),(9,6),(14,5),(20,5),(23,9),(23,25),(20,23),(18,27),(12,25),(8,27)],21)
        ell((11,8,21,17),9,0)
        pol([(10,8),(12,5),(19,5),(22,9),(21,12),(18,9),(16,12),(15,9),(12,12)],22)
        rec((13,12,13,14),20);rec((19,12,19,14),20)
        pol([(13,17),(19,17),(22,24),(18,23),(16,25),(14,23),(11,24)],18)
        rec((13,25,14,28),1);rec((18,25,19,28),1)
        rec((12,18,12,20),9);rec((20,18,20,20),9)
    else:
        ell((6,7,25,26),9,0);ell((7,7,24,17),25);d.arc((8,8,21,15),180,270,fill=P[26],width=2)
        pol([(7,13),(12,15),(21,15),(24,13),(24,16),(19,18),(11,17),(7,16)],5)
        rec((14,14,18,18),4);rec((15,15,17,17),5)
        rec((10,19,12,22),0);rec((20,19,22,22),0)
        d.line([(9,18),(13,19)],fill=P[25]);d.line([(19,19),(23,18)],fill=P[25])
        pol([(15,23),(17,23),(18,25),(14,25)],11)
        for x,y in [(2,6),(27,8),(3,25),(26,27)]:ell((x-2,y-2,x+2,y+2),1,0);rec((x-1,y-1,x,y-1),3)
    return im

def main():
    for p in ('palette','concept','previews/phase_a'): (ART/p).mkdir(parents=True,exist_ok=True)
    pal=Image.new('RGBA',(35,1))
    for x,h in enumerate(P):pal.putpixel((x,0),tuple(bytes.fromhex(h[1:]))+(255,))
    pal.save(ART/'palette/master_palette.png')
    (ART/'palette/master_palette.hex').write_text('\n'.join(P)+'\n',encoding='utf-8')
    studies={}
    for v in ('a','b'):
        for action in ('idle','attack'):
            sp=aclaire(v,action=='attack');studies[v,action]=sp
            sp.save(ART/f'previews/phase_a/aclaire_{v}_{action}.png')
    im=board('ACLAIRE / TWO PIXEL STUDIES','Same v2 identity. Two reductions of plate, sock fabric and the rigid sword axis. Right-facing only.')
    d=ImageDraw.Draw(im)
    for col,v in enumerate(('a','b')):
        x=64+col*944
        text(im,(x,175),f'{v.upper()} / '+('CLEAN CLUSTERS' if v=='a' else 'FACETED DETAIL'),32,bold=True)
        text(im,(x,223),'32 x 48 idle / 64 x 48 attack     •     actual pixels + nearest x8',19,MUTED)
        paste(im,studies[v,'idle'],(x+24,290),8)
        paste(im,studies[v,'attack'],(x+330,290),8)
        paste(im,studies[v,'idle'],(x+120,715));paste(im,studies[v,'attack'],(x+514,715))
        text(im,(x+20,680),'IDLE x8',19);text(im,(x+330,680),'ATTACK x8',19)
        text(im,(x+20,777),'1:1 samples above — feet on row 47',21)
        lines = ['Two-tone plate / broad silver read','Flat charcoal socks / clear white cuffs','Vertical sword at x=8; empty sheath in attack'] if v=='a' else ['Three-tone plate / small angled facet','One-pixel sock seam / more fabric information','Vertical sword at x=9; stronger back overlap']
        for j,s in enumerate(lines):text(im,(x+20,831+j*39),s,22)
    d.line((960,170,960,987),fill=P[4],width=2)
    im.save(ART/'concept/aclaire_pixel_study.png')
    # 3x3 tile sample is a study, not a production tileset.
    tile=Image.new('RGBA',(48,48),P[25]);td=ImageDraw.Draw(tile)
    for x in range(0,48,16):
        td.rectangle((x,0,x+15,3),fill=P[30]);td.rectangle((x,4,x+15,7),fill=P[29])
    for y in range(10,48,8):
        for x in range((y//8%2)*8,48,16):
            td.line((x,y,x+9,y),fill=P[26],width=2);td.point((x+3,y+3),fill=P[24])
    tile.save(ART/'previews/phase_a/tile_nine_patch.png')
    im=board('STYLE GUIDE / WARM, BRIGHT, READABLE','16-bit pixel language  /  640 x 360 base  /  16 x 16 tiles  /  light from upper-left')
    for i,h in enumerate(P):
        x=60+(i%18)*100;y=185+(i//18)*100
        ImageDraw.Draw(im).rectangle((x,y,x+76,y+45),fill=h)
        text(im,(x,y+49),f'{i:02} {h}',13)
    text(im,(60,405),'01 / PIXEL RULES',28,bold=True)
    for j,s in enumerate(['1 px outline #0f0b1a; never black.','Selective material edges; no anti-aliasing.','2–3 cel values; no foreground dithering.','Opaque or clear pixels only (255 / 0).','16 colors per character; 24 per tileset.']):text(im,(60,456+j*39),s,23)
    text(im,(690,405),'02 / LIGHT & MATERIAL',28,bold=True)
    for j,(label,ids) in enumerate([('Silver',(2,4,5)),('Hair',(11,12,13)),('Pink',(32,33,34))]):
        text(im,(690,460+j*80),label,22)
        for k,c in enumerate(ids):ImageDraw.Draw(im).rectangle((800+k*100,452+j*80,890+k*100,507+j*80),fill=P[c])
    gem=Image.new('RGBA',(16,16));gd=ImageDraw.Draw(gem)
    gd.polygon([(3,1),(12,1),(15,6),(12,14),(3,14),(0,6)],fill=P[2],outline=P[0])
    gd.polygon([(3,2),(11,2),(13,6),(10,11),(3,11),(1,6)],fill=P[4])
    gd.polygon([(3,2),(11,2),(8,5),(2,6)],fill=P[5])
    paste(im,gem,(65,735),8)
    text(im,(220,748),'1 px outline + 3-value cel planes',21)
    text(im,(220,786),'Light hits upper-left face',21)
    text(im,(690,695),'LIGHT  ↘',30,bold=True)
    paste(im,tile,(695,730),4)
    text(im,(905,795),'3 x 3 tile study',22);text(im,(905,832),'48 x 48 shown x4',20,MUTED)
    paste(im,studies['a','idle'],(1475,450),8)
    paste(im,studies['a','idle'],(1410,790))
    text(im,(1350,875),'Aclaire A: actual + x8',22)
    text(im,(60,975),'IDENTITIES:  FIRE #e8572a   WATER #2f9ed9   WIND #48c9a0   EARTH #a8772f',24,bold=True)
    im.save(ART/'concept/style_guide.png')
    im=board('SPIRITS / NATIVE PIXEL STUDIES','32 x 32 frames  /  center origin  /  companion bodies at most 24 px  /  nearest x8')
    for j,kind in enumerate(('burnil','wata','valvaliz','eathy')):
        sp=spirit(kind);sp.save(ART/f'previews/phase_a/{kind}_study.png')
        x=76+j*470;text(im,(x,210),kind.upper(),30,bold=True)
        paste(im,sp,(x+55,310),8);paste(im,sp,(x+165,640))
        text(im,(x+60,720),'x8 above / 1:1 below',22)
    im.save(ART/'previews/phase_a/spirits_pixel_studies.png')
    # Static fire readability probe, explicitly NOT an in-game mockup.
    im=board('FIRE / READABILITY PROBE','Phase A color stress test only — no game assets, HUD or runtime mockup claimed')
    for j,bg in enumerate((P[1],P[7],P[13])):
        x=100+j*600;ImageDraw.Draw(im).rectangle((x,240,x+510,820),fill=bg)
        paste(im,studies['a','idle'],(x+70,360),8)
        paste(im,spirit('burnil'),(x+310,420),5)
        text(im,(x,850),['Cool dark backdrop','Warm wood backdrop','Bright fire backdrop'][j],24)
    text(im,(100,940),'Keep the dark silhouette edge and pink torso; detach flame FX from the orange ponytail.',24)
    im.save(ART/'previews/phase_a/fire_readability_probe.png')

if __name__=='__main__':main()
