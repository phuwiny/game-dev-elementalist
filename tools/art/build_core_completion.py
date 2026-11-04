"""Deterministic master-palette core sprites following the approved ember/brass concept."""
from pathlib import Path
import math,json,xml.etree.ElementTree as ET
from PIL import Image,ImageDraw,ImageFont
from pack_atlas import pack
R=Path(__file__).resolve().parents[2]
C=[tuple(bytes.fromhex(s[1:]))+(255,) for s in (R/'art/palette/master_palette.hex').read_text().split()]
AN={}
def canvas(w,h):
 im=Image.new('RGBA',(w,h));return im,ImageDraw.Draw(im)
def save(group,name,im):
 p=R/'art/frames'/group;p.mkdir(parents=True,exist_ok=True);im.save(p/f'{name}.png')
def anim(group,name,n,size,fps,loop,paint):
 AN[f'{group}_{name}']={'atlas':group,'prefix':name+'_','frames':n,'frameRate':fps,'repeat':-1 if loop else 0}
 for i in range(n):
  im,d=canvas(*size);paint(d,i,n,*size);save(group,f'{name}_{i:03}',im)
def poly(d,points,c):d.polygon(points,fill=C[c])
def rect(d,box,c):d.rectangle(box,fill=C[c])
def ellipse(d,box,c):d.ellipse(box,fill=C[c])
def gem(d,x,y,r,c):
 poly(d,[(x,y-r),(x+r,y),(x,y+r),(x-r,y)],0);poly(d,[(x,y-r+1),(x+r-1,y),(x,y+r-1),(x-r+1,y)],c);d.line((x,y-r+2,x-2,y),fill=C[5])
def heart(d,x,y,c):
 pts=[(x,y+3),(x-6,y-3),(x-6,y-6),(x-3,y-8),(x,y-5),(x+3,y-8),(x+6,y-6),(x+6,y-3)]
 poly(d,pts,0);poly(d,[(x,y+1),(x-5,y-4),(x-4,y-6),(x-2,y-6),(x,y-3),(x+2,y-6),(x+4,y-6),(x+5,y-4)],c);d.line((x-4,y-5,x-2,y-5),fill=C[5])
def frame(d,w,h):
 rect(d,(0,0,w-1,h-1),0);rect(d,(1,1,w-2,h-2),26);rect(d,(2,2,w-3,h-3),1);d.line((2,1,w-3,1),fill=C[14]);d.point((1,h-2),fill=C[7])
def items():
 def coin(d,i,n,w,h):
  r=[4,3,1,2,4,5][i];ellipse(d,(6-r,1,6+r,10),0);ellipse(d,(7-r,2,5+r,9),26);d.line((6-r+1,3,6-r+1,7),fill=C[14]);d.line((6,3,6,7),fill=C[14])
 anim('items','coin_spin',6,(12,12),10,True,coin)
 def fruit(d,i,n,w,h):
  y=[0,-1,0,1][i];heart(d,8,11+y,12);d.line((8,4+y,9,1+y),fill=C[6]);poly(d,[(9,2+y),(13,1+y),(12,4+y),(9,4+y)],30)
 anim('items','heart_fruit_bob',4,(16,16),6,True,fruit)
 for name,n in [('spirit_orb_pulse',4),('oneup_feather_float',4),('spirit_shard_shine',6)]:
  def item(d,i,n,w,h,name=name):
   y=int(round(math.sin(i*2*math.pi/n)))
   if 'orb' in name:ellipse(d,(3,3+y,12,12+y),0);ellipse(d,(4,4+y,11,11+y),31);ellipse(d,(5,5+y,8,7+y),5)
   elif 'shard' in name:gem(d,8,8+y,6,18);d.point((11,2+i%3),fill=C[5])
   else:poly(d,[(3,13+y),(5,4+y),(10,1+y),(13,3+y),(10,10+y)],0);poly(d,[(4,12+y),(6,5+y),(10,2+y),(12,3+y),(9,9+y)],14);d.line((3,14,10,4+y),fill=C[5])
  anim('items',name,n,(16,16),8,True,item)
 def shrine(d,i,n,w,h,lit):
  poly(d,[(3,45),(3,16),(8,8),(16,3),(24,8),(29,16),(29,45)],0)
  poly(d,[(5,43),(5,17),(10,10),(16,6),(22,10),(27,17),(27,43)],3)
  poly(d,[(8,42),(8,19),(12,14),(20,14),(24,19),(24,42)],1)
  rect(d,(0,44,31,47),0);rect(d,(2,44,29,45),4)
  for y in (19,29,39):d.line((4,y,7,y),fill=C[4]);d.line((25,y+4,28,y+4),fill=C[2])
  color=14 if lit else 3;d.line((16,37,16,21),fill=C[color],width=2);d.line((16,29,11,24),fill=C[color]);d.line((16,25,21,19),fill=C[color]);gem(d,16,19,3,color)
  if lit:
   for j in range(3):d.point((10+(j*7+i*3)%14,39-(i*4+j*9)%30),fill=C[14])
 for name,n,lit in [('unlit',1,False),('lighting',6,True),('lit',4,True)]:anim('items','checkpoint_shrine_'+name,n,(32,48),12 if name=='lighting' else 8,name=='lit',lambda d,i,n,w,h,lit=lit:shrine(d,i,n,w,h,lit))
 def flag(d,i,n,w,h):
  rect(d,(4,7,6,60),0);rect(d,(5,7,5,60),26);gem(d,5,5,4,14);rect(d,(1,61,12,63),3)
  dy=[0,1,2,1,0,-1][i];poly(d,[(7,10),(29,12+dy),(24,20+dy),(30,29+dy),(7,27)],0);poly(d,[(8,12),(27,14+dy),(22,20+dy),(27,27+dy),(8,25)],11);d.line((8,12,26,14+dy),fill=C[14]);gem(d,15,20,4,14)
 anim('items','goal_flag_wave',6,(32,64),8,True,flag)
def objects():
 def ice(d,i,n,w,h):
  hh=max(2,15-i*2);rect(d,(1,16-hh,14,15),15);rect(d,(2,17-hh,13,14),18);d.line((3,18-hh,11,18-hh),fill=C[19]);d.line((4,14,10,max(17-hh,5)),fill=C[19])
 anim('objects','ice_block_idle',1,(16,16),1,False,ice);anim('objects','ice_block_melt',5,(16,16),12,False,ice)
 for name,n in [('water',4),('frozen',1)]:
  def water(d,i,n,w,h,name=name):
   rect(d,(0,5,15,15),16 if name=='water' else 18)
   for x in range(16):y=4+round(math.sin((x+i*3)*math.pi/8));d.line((x,y,x,y+1),fill=C[18 if name=='water' else 19])
  anim('objects','water_surface_'+name,n,(16,16),6,name=='water',water)
 def plant(d,i,n,w,h):
  t=0 if n==1 else (i+1)/n;top=60-round(t*58)
  ellipse(d,(5,59,11,63),6);ellipse(d,(6,59,10,61),27)
  if t:
   d.line((8,60,8,top),fill=C[28],width=3);d.line((7,59,7,top),fill=C[30])
   for y in (32,1):
    if top<=y+5:poly(d,[(0,y+3),(5,y),(8,y+2),(11,y),(15,y+3),(13,y+5),(2,y+5)],28);d.line((1,y+3,14,y+3),fill=C[30])
 anim('objects','magic_seed_seed',1,(16,64),1,False,plant);anim('objects','magic_seed_grow',8,(16,64),12,False,plant)
 anim('objects','magic_seed_grown',1,(16,64),1,False,lambda d,i,n,w,h:plant(d,7,8,w,h))
 def mill(d,i,n,w,h):
  poly(d,[(17,47),(20,20),(28,20),(31,47)],0);poly(d,[(20,46),(22,22),(26,22),(28,46)],7)
  for k in range(4):
   a=i*math.pi/16+k*math.pi/2
   pts=[(round(24+r*math.cos(a+off)),round(22+r*math.sin(a+off))) for r,off in [(4,-.2),(19,-.17),(21,.17),(5,.45)]]
   poly(d,pts,0);d.line((24,22,round(24+19*math.cos(a)),round(22+19*math.sin(a))),fill=C[27],width=3)
  ellipse(d,(20,18,28,26),0);ellipse(d,(22,20,26,24),14)
 anim('objects','windmill_idle',1,(48,48),1,False,mill);anim('objects','windmill_spin',8,(48,48),14,True,mill)
 def wall(d,i,n,w,h):
  for yy in range(4):
   for xx in range(4):
    if i and (xx*3+yy*5)%7<i:continue
    x=xx*8;y=yy*8;rect(d,(x,y,x+7,y+7),0);rect(d,(x+1,y+1,x+6,y+6),3);d.line((x+1,y+1,x+6,y+1),fill=C[4])
  d.line((16,0,12,8,19,15,13,24,16,31),fill=C[0],width=2)
 anim('objects','cracked_wall_idle',1,(32,32),1,False,wall);anim('objects','cracked_wall_break',6,(32,32),14,False,wall)
def fx():
 defs=[('slash_1',3,32,32,20,0),('slash_2',3,32,32,20,0),('slash_3',3,32,32,20,0),('hit_spark',4,16,16,20,0),('poof',6,32,32,16,0),('fireball',4,16,16,12,1),('fire_burst',6,32,32,16,0),('burn_status',4,16,16,10,1),('water_bubble',4,16,16,10,1),('water_splash',5,32,32,16,0),('freeze_overlay',1,32,32,1,0),('freeze_shatter',5,32,32,16,0),('wind_wave',5,32,32,16,0),('dash_trail',3,32,48,16,0),('ground_slam_wave',6,64,32,16,0),('stone_shield_appear',4,16,32,16,0),('stone_shield_idle',1,16,32,1,0),('stone_shield_break',4,16,32,14,0),('earth_block_appear',4,32,32,16,0),('earth_block_idle',1,32,32,1,0),('earth_block_crumble',4,32,32,14,0),('checkpoint_spark',5,16,16,12,0)]
 defs += [('element_switch_aura_'+el,5,32,48,16,0) for el in ('fire','water','wind','earth')]
 for name,n,w,h,fps,loop in defs:
  def paint(d,i,n,w,h,name=name):
   t=(i+1)/n;cx=w//2;cy=h//2
   if name.startswith('slash'):
    a=int(name[-1])*45+i*30;d.arc((2,2,w-3,h-3),a,a+170,fill=C[12],width=max(1,5-i));d.arc((4,4,w-5,h-5),a+10,a+155,fill=C[14],width=max(1,3-i));d.arc((5,5,w-6,h-6),a+15,a+140,fill=C[5],width=1)
   elif name.startswith(('stone_shield','earth_block')):
    rockw=w-4;rockh=h-4
    if 'appear' in name:rockh=max(3,round(rockh*t))
    for y in range(h-rockh,h-1,6):
     for x in range(2,w-2,6):
      if ('break' in name or 'crumble' in name) and (x+y)%5<i:continue
      rect(d,(x,y,min(x+5,w-2),min(y+5,h-1)),24);rect(d,(x+1,y+1,min(x+4,w-2),min(y+3,h-1)),26);d.point((x+1,y+1),fill=C[27])
   elif name=='freeze_overlay':
    poly(d,[(1,h-1),(3,12),(8,19),(12,5),(18,13),(25,3),(30,h-1)],18);d.line((4,h-2,12,9,18,17,25,7),fill=C[19])
   elif 'aura' in name or name in ('wind_wave','ground_slam_wave'):
    col={'fire':12,'water':17,'wind':22,'earth':26}.get(name.split('_')[-1],22)
    if name=='ground_slam_wave':col=26;cy=h-2
    rx=min(w//2-2,3+i*4);ry=min(h//2-1,5+i*5)
    d.arc((cx-rx,max(0,cy-ry),cx+rx,min(h-1,cy+ry)),180+i*35,490+i*35,fill=C[col],width=2)
    d.arc((cx-rx+2,max(0,cy-ry+2),cx+rx-2,min(h-1,cy+ry-2)),190+i*35,410+i*35,fill=C[5],width=1)
   elif name=='water_bubble':
    r=5+(i%2);ellipse(d,(cx-r,cy-r,cx+r,cy+r),15);ellipse(d,(cx-r+1,cy-r+1,cx+r-1,cy+r-1),17);d.arc((cx-r+2,cy-r+2,cx+r-2,cy+r-2),190,290,fill=C[19],width=2)
   elif name=='fireball':
    poly(d,[(0,3+i%2),(7,5),(10,3),(14,5),(15,8),(13,11),(9,12),(4,10),(0,12),(3,8)],11)
    poly(d,[(2,5),(8,6),(11,4),(14,7),(14,9),(11,11),(7,9),(2,10),(5,8)],12)
    ellipse(d,(8,5,13,10),14);d.line((10,6,12,6),fill=C[5])
   elif name=='dash_trail':
    for j in range(4):
     y=9+j*9;x=2+i*3+j%2*3
     d.line((x,y,min(w-2,x+22-i*4),y),fill=C[22],width=2)
     d.line((x+5,y+2,min(w-2,x+18-i*3),y+2),fill=C[23])
   elif name in ('fire_burst','burn_status'):
    for j in range(3 if name!='fireball' else 1):
     x=(j+1)*w//4 if name!='fireball' else w-6;y=h-2;top=3+(i+j)%3
     poly(d,[(x-4,y),(x-5,y-6),(x-1,top+3),(x,top),(x+2,top+5),(x+5,y-4),(x+3,y)],11)
     poly(d,[(x-3,y-1),(x-2,y-7),(x,top+3),(x+3,y-3),(x+2,y-1)],12);poly(d,[(x-1,y-1),(x,y-6),(x+2,y-2)],14)
   else:
    color=18 if name in ('water_splash','freeze_shatter') else 4 if name=='poof' else 14
    for j in range(6):
     a=j*math.pi/3+i*.13;r=2+i*(min(w,h)/2-3)/max(n-1,1);x=round(cx+math.cos(a)*r);y=round(cy+math.sin(a)*r)
     if name=='poof':ellipse(d,(x-2,y-2,x+2,y+2),3);d.point((x-1,y-1),fill=C[4])
     elif name=='freeze_shatter':gem(d,x,y,max(1,3-i//2),color)
     else:d.line((x,y,round(cx+math.cos(a)*(r+2)),round(cy+math.sin(a)*(r+2))),fill=C[color],width=2)
  anim('fx',name,n,(w,h),fps,bool(loop),paint)
def ui():
 names={'heart_full':(16,16),'heart_empty':(16,16),'energy_bar_frame':(96,12),'energy_bar_fill_normal':(92,8),'energy_bar_fill_flash':(92,8),'element_slot_select':(28,28),'lives_icon':(16,16),'coin_icon':(12,12),'boss_bar_frame':(240,12),'boss_bar_fill':(236,8),'panel_9slice':(48,48),'cursor_arrow':(8,8)}
 names.update({f'element_icon_{el}_{st}':(24,24) for el in ('fire','water','wind','earth') for st in ('normal','locked')})
 names.update({f'world_map_node_{s}':(16,16) for s in ('locked','open','cleared')});names.update({f'button_{s}':(96,24) for s in ('normal','hover','pressed')})
 for name,(w,h) in names.items():
  im,d=canvas(w,h)
  if name.startswith('heart'):heart(d,8,12,12 if name.endswith('full') else 1)
  elif name=='lives_icon':heart(d,8,12,33)
  elif name=='coin_icon':ellipse(d,(1,1,10,10),0);ellipse(d,(2,2,9,9),26);d.line((5,3,5,8),fill=C[14])
  elif 'fill' in name:rect(d,(0,0,w-1,h-1),11 if 'boss' in name else 17 if 'normal' in name else 14);d.line((0,0,w-1,0),fill=C[5]);d.line((0,h-1,w-1,h-1),fill=C[15 if 'normal' in name else 10])
  elif name.startswith('element_icon'):
   locked=name.endswith('locked');el=name.split('_')[2];col=3 if locked else {'fire':12,'water':17,'wind':22,'earth':26}[el]
   ellipse(d,(1,1,22,22),0);ellipse(d,(2,2,21,21),26);ellipse(d,(4,4,19,19),1)
   if el=='fire':poly(d,[(8,17),(7,12),(12,6),(12,11),(16,9),(17,15),(14,18)],col)
   elif el=='water':poly(d,[(12,6),(7,13),(8,17),(12,19),(16,17),(17,13)],col)
   elif el=='wind':d.arc((6,7,17,15),170,480,fill=C[col],width=2);d.line((7,17,16,17),fill=C[col])
   else:gem(d,12,12,6,col)
   if locked:rect(d,(10,13,14,17),4);d.arc((10,9,14,15),180,360,fill=C[4])
  elif name=='element_slot_select':d.rectangle((0,0,27,27),outline=C[14],width=1);d.rectangle((2,2,25,25),outline=C[27]);
  elif name.startswith('world_map_node'):
   ellipse(d,(1,1,14,14),0);ellipse(d,(2,2,13,13),26);ellipse(d,(4,4,11,11),1 if name.endswith('locked') else 14 if name.endswith('open') else 21)
   if name.endswith('cleared'):d.line((5,8,7,10,11,5),fill=C[5],width=1)
   elif name.endswith('locked'):rect(d,(6,7,10,11),3);d.arc((6,4,10,9),180,360,fill=C[4])
  elif name=='cursor_arrow':poly(d,[(0,0),(7,4),(0,7)],0);poly(d,[(1,1),(5,4),(1,6)],14)
  else:
   frame(d,w,h)
   if name.startswith('button'):rect(d,(4,4,w-5,h-5),31 if name.endswith('hover') else 2 if name.endswith('pressed') else 1)
   if name=='panel_9slice':d.rectangle((5,5,w-6,h-6),outline=C[31]);gem(d,8,8,3,27);gem(d,w-9,h-9,3,27)
  save('ui',name,im)
def font():
 # Hand-authored 3x5 capitals expanded only vertically through the BMFont metrics.
 patterns='A:010/101/111/101/101 B:110/101/110/101/110 C:011/100/100/100/011 D:110/101/101/101/110 E:111/100/110/100/111 F:111/100/110/100/100 G:011/100/101/101/011 H:101/101/111/101/101 I:111/010/010/010/111 J:001/001/001/101/010 K:101/101/110/101/101 L:100/100/100/100/111 M:101/111/101/101/101 N:101/111/111/111/101 O:010/101/101/101/010 P:110/101/110/100/100 Q:010/101/101/111/011 R:110/101/110/101/101 S:011/100/010/001/110 T:111/010/010/010/010 U:101/101/101/101/111 V:101/101/101/101/010 W:101/101/111/111/101 X:101/101/010/101/101 Y:101/101/010/010/010 Z:111/001/010/100/111 0:111/101/101/101/111 1:010/110/010/010/111 2:110/001/010/100/111 3:110/001/010/001/110 4:101/101/111/001/001 5:111/100/110/001/110 6:011/100/111/101/111 7:111/001/010/010/010 8:111/101/111/101/111 9:111/101/111/001/110 ×:000/101/010/101/000 ::000/010/000/010/000 /:001/001/010/100/100 -:000/000/111/000/000 +:000/010/111/010/000 !:010/010/010/000/010'
 entries=[(s[0],s[2:].split('/')) for s in patterns.split()];im,d=canvas(128,24);root=ET.Element('font');ET.SubElement(root,'info',face='Ember HUD',size='8');ET.SubElement(root,'common',lineHeight='8',base='7',scaleW='128',scaleH='24',pages='1',packed='0');pages=ET.SubElement(root,'pages');ET.SubElement(pages,'page',id='0',file='font_hud.png');chars=ET.SubElement(root,'chars',count=str(len(entries)+1))
 for i,(char,rows) in enumerate(entries):
  x=i%16*8;y=i//16*8
  for yy,row in enumerate(rows):
   for xx,v in enumerate(row):
    if v=='1':d.point((x+xx+2,y+yy+1),fill=C[5])
  ET.SubElement(chars,'char',id=str(ord(char)),x=str(x),y=str(y),width='8',height='8',xoffset='0',yoffset='0',xadvance='5',page='0',chnl='15')
 ET.SubElement(chars,'char',id='32',x='120',y='16',width='8',height='8',xoffset='0',yoffset='0',xadvance='4',page='0',chnl='15')
 out=R/'public/assets/ui';out.mkdir(parents=True,exist_ok=True);im.save(out/'font_hud.png');ET.indent(root);ET.ElementTree(root).write(out/'font_hud.xml',encoding='utf-8',xml_declaration=True)
def build():
 items();objects();fx();ui();font()
 for group in ('items','objects','fx','ui'):
  dest=R/'public/assets'/('ui/ui' if group=='ui' else f'sprites/{group}/{group}')
  metadata=pack(R/'art/frames'/group,dest,1024 if group!='ui' else 512)
  for entry in metadata['frames'].values():entry.pop('pivot',None)
  dest.with_suffix('.json').write_text(json.dumps(metadata,indent=2)+'\n')
 path=R/'public/assets/animations.json';data=json.loads(path.read_text());data.update(AN);path.write_text(json.dumps(data,indent=2)+'\n')
 print('Built core items, remaining puzzle objects, all elemental FX, UI and font.')
if __name__=='__main__':build()
