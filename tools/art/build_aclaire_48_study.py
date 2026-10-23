"""Phase A Aclaire v2 48x64 idle proposal. No runtime atlas.
Inspired by Coin Quest's layered shapes and hand-placed facial pixels, not its character artwork.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from build_phase_a_studies import ART, P, text, paste, board

PRE=ART/'previews/phase_a'; CON=ART/'concept'
for folder in (PRE,CON):folder.mkdir(parents=True,exist_ok=True)

# Sixteen colors from the unmodified 35-color master palette.
USED=(0,1,2,4,5,9,11,12,13,14,16,17,26,29,33,34)
C={i:P[i] for i in USED}
im=Image.new('RGBA',(48,64));d=ImageDraw.Draw(im)

def poly(points,fill,outline=0):d.polygon(points,fill=C[fill],outline=C[outline] if outline is not None else None)
def ell(box,fill,outline=0):d.ellipse(box,fill=C[fill],outline=C[outline] if outline is not None else None)
def rect(box,fill):d.rectangle(box,fill=C[fill])
def line(points,fill,width=1):d.line(points,fill=C[fill],width=width)

# All geometry is right-facing 3/4. Both sword grip and sheath share x=11.
# The sheath is intentionally behind hair/body; a partial but straight sword reads better.
poly([(8,20),(14,20),(14,48),(11,52),(8,49)],1)
line([(9,22),(9,46)],2)
rect((10,13,12,20),14)
for yy in (14,17,19):rect((10,yy,12,yy),29)
rect((7,20,15,21),14)
ell((9,10,13,14),12)

# Ponytail with an open notch between tail and face, pink tie, hair shine.
poly([(15,12),(12,9),(8,9),(5,13),(2,14),(4,17),(1,21),(2,26),(0,31),(4,36),(7,33),(9,36),(11,31),(13,26),(16,19)],12)
poly([(13,12),(9,12),(5,16),(4,22),(2,27),(3,31),(7,27),(8,21)],13,None)
poly([(7,12),(11,10),(14,11),(10,13),(7,17)],14,None)
rect((13,12,16,15),33);rect((15,12,16,13),34)

# Rear leg and front leg: bare thigh -> charcoal sock -> black boot with white cuff.
for x in (17,27):
    poly([(x,45),(x+6,45),(x+5,52),(x+1,53)],9)
    poly([(x+1,49),(x+5,49),(x+5,57),(x,57)],2)
    line([(x+1,50),(x+1,55)],4)
    poly([(x,55),(x+6,55),(x+6,60),(x+9,61),(x+9,63),(x-1,63),(x-1,59)],1)
    rect((x,55,x+6,57),5)
    rect((x-1,63,x+8,63),5)

# Cuffed tan shorts, belt, playful asymmetric stance.
poly([(16,42),(34,42),(35,47),(29,49),(26,46),(23,49),(15,47)],26)
line([(16,46),(22,47)],14);line([(29,47),(34,46)],14)
rect((17,42,33,43),1);rect((25,42,27,43),14)

# Sleeveless pink stand collar, clear shoulders and compact silver upper-chest plate.
poly([(17,32),(25,31),(32,34),(34,40),(32,43),(17,43),(15,40)],33)
poly([(21,31),(28,31),(30,34),(20,35)],34,None)
poly([(23,34),(30,34),(32,39),(27,41),(21,39)],4)
poly([(23,34),(29,34),(30,36),(24,37)],5,None)
line([(27,39),(31,39)],2)
line([(19,32),(31,41)],0,2)
rect((26,37,27,38),5)

# Bare forearm and gold bracelet; no sleeves or shoulder armour.
poly([(18,35),(15,35),(13,39),(14,43),(12,45),(14,47),(17,45),(18,40),(21,37)],9)
rect((13,42,16,43),14)
poly([(31,35),(34,35),(37,39),(40,38),(42,40),(40,43),(36,42),(32,39)],9)
rect((38,39,39,42),14)

# Large face, 3/4 view: two visible blue eyes, a rounded cheek and lively smile.
poly([(21,17),(31,16),(40,20),(43,27),(43,31),(41,34),(36,36),(27,36),(22,33),(19,26)],9)
# Warm skin is a broad clean patch. Hair re-enters on top and at cheek edge.
poly([(18,19),(20,15),(26,12),(34,12),(40,16),(44,21),(44,25),(41,24),(40,21),(37,23),(35,19),(31,23),(27,22),(25,26),(21,29),(19,25)],12)
poly([(20,17),(24,13),(29,13),(24,19),(21,22)],13,None)
poly([(24,14),(31,12),(36,14),(39,17),(32,16),(27,19)],13,None)
line([(24,14),(30,12),(33,13)],14,2)
poly([(38,17),(42,19),(44,24),(42,26),(40,23)],11,None)
# Eye whites and irises are placed by hand, with one-pixel light glints.
for x,y in ((31,25),(38,25)):
    rect((x,y,x+3,y+4),5)
    rect((x+1,y+1,x+2,y+4),16)
    rect((x+1,y+2,x+2,y+3),17)
    rect((x+1,y+1,x+1,y+1),5)
    line([(x,y),(x+3,y)],0)
# Cheek and open-mouth smile.
rect((27,31,29,31),34)
rect((40,30,41,30),34)
line([(33,33),(35,34),(38,34),(40,32)],0)
rect((36,34,38,34),11)

im.save(PRE/'aclaire_48x64_idle.png')

# Review board deliberately shows exact pixels. No bilinear filtering anywhere.
out=board('ACLAIRE V2 / 48 x 64 SEED STUDY','Phase A revision after size and reference feedback. Right-facing three-quarter idle, 16 master-palette colors.')
text(out,(78,178),'ORIGINAL / 1:1',26,bold=True)
paste(out,im,(165,255))
text(out,(78,360),'Native transparent frame',20)
text(out,(78,395),'Feet: row 63 / bottom-center origin',20)
text(out,(78,430),'No animation approved yet',20)
text(out,(675,178),'PIXEL CLUSTERS / x8',26,bold=True)
paste(out,im,(780,260),8)
text(out,(1255,178),'FACE & COSTUME',26,bold=True)
paste(out,im.crop((16,13,45,45)),(1390,250),11)
for j,s in enumerate(['Rounded 3/4 face, two blue eyes','Orange ponytail with pink tie','Pink sleeveless top, small silver plate','Bare thigh > charcoal sock > black boot','One straight sheathed sword; no cape']):
    text(out,(1230,680+j*47),s,23)
text(out,(78,720),'WHY 48 x 64?',26,bold=True)
for j,s in enumerate(['The 32 x 48 A study flattened eyes and face.','Added pixels go to facial expression, hair volume','and the clothing boundary; not extra equipment.','This is a new proposal, not a handoff-spec change.']):text(out,(78,774+j*44),s,22)
out.save(CON/'aclaire_48x64_study.png')

# 640x360 screen-size probe: 1:1 actors on a flat field, not a runtime screenshot.
probe=Image.new('RGBA',(640,360),P[1]);pd=ImageDraw.Draw(probe)
pd.rectangle((0,270,639,359),fill=P[2]);pd.rectangle((0,267,639,271),fill=P[29])
paste(probe,Image.open(PRE/'aclaire_a_idle.png'),(200,220))
paste(probe,im,(310,204))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',12)
pd.text((190,286),'32x48 A',fill=P[5],font=font);pd.text((309,286),'48x64 seed',fill=P[5],font=font)
probe.save(PRE/'aclaire_48x64_scale_probe.png')
print('Wrote 48x64 idle seed, review board and 640x360 scale probe')
