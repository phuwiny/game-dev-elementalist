"""Normalize approved combat revisions, preserving unrelated production frames.

Raster artwork is generated with imagegen. This script only separates, scales,
palette-maps, anchors, packs and renders the artwork for technical delivery.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw
from build_player_movement_atlas import indexed, eye_center
from pack_atlas import pack

ROOT = Path(__file__).resolve().parents[2]
CONCEPT = ROOT / 'art/concept'
OUT = ROOT / 'art/previews/phase_b/2026-10-29_combat_production'
FRAMES = ROOT / 'art/frames/player'
SPECS = {
    'idle': ('2026-10-29_aclaire_idle_production_source.png', 3, 6, .252, 96),
    'run': ('2026-10-29_aclaire_run_transparent_source.png', 5, 5, .247, 128),
    'attack_1': ('2026-10-29_aclaire_attack_1_clean_source.png', 2, 4, .252, 192),
    'attack_2': ('2026-10-29_aclaire_attack_2_production_source.png', 2, 4, .248, 192),
    'attack_3': ('2026-10-29_aclaire_attack_3_production_source.png', 3, 5, .252, 192),
    'cast': ('2026-10-29_aclaire_cast_right_hand_source.png', 2, 4, .252, 96),
    'hurt': ('2026-10-28_aclaire_hurt_proportions_v2_review.png', 3, 3, 124/741, 96),
    'dead': ('2026-10-29_aclaire_dead_proportions_v3_review.png', 3, 6, 124/474, 96),
}

def figures(path, columns, count):
    """Connected alpha components avoid cutting blades that cross grid lines."""
    im = Image.open(path).convert('RGBA')
    w,h = im.size
    alpha = im.getchannel('A').point(lambda a:255 if a>=128 else 0)
    data = alpha.tobytes(); seen = bytearray(w*h); groups=[]
    for start in range(w*h):
        if seen[start] or not data[start]: continue
        pending=[start]; seen[start]=1; group=[]
        while pending:
            k=pending.pop(); group.append(k); x,y=k%w,k//w
            for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0<=nx<w and 0<=ny<h:
                    n=ny*w+nx
                    if data[n] and not seen[n]: seen[n]=1; pending.append(n)
        if len(group)>1000: groups.append(group)
    groups=sorted(groups,key=len,reverse=True)[:count]
    if len(groups)!=count: raise ValueError((path,len(groups),count))
    rows=(count+columns-1)//columns
    def order(g):
        cx=sum(k%w for k in g)/len(g); cy=sum(k//w for k in g)/len(g)
        return (int(cy/(h/rows)),cx)
    result=[]
    for group in sorted(groups,key=order):
        mask=bytearray(w*h)
        for k in group: mask[k]=255
        a=Image.frombytes('L',im.size,bytes(mask)); box=a.getbbox()
        cell=im.copy();cell.putalpha(a);result.append(cell.crop(box))
    return result

def normalize(cells,scale,width,action):
    sprites=[indexed(c.resize((round(c.width*scale),round(c.height*scale)),Image.Resampling.NEAREST)) for c in cells]
    xs=[]
    for s in sprites:
        eye=eye_center(s)
        xs.append(round(width/2+9-eye[0]) if eye and action not in ('hurt','dead') else (width-s.width)//2)
    if action == 'idle':
        # Closed eyes cannot serve as an eye landmark; retain the preceding
        # pose's horizontal anchor rather than recentering by hair silhouette.
        xs[3] = xs[2]
    # One translation for the entire action; no individual silhouette rescaling.
    low=max(-x for x in xs); high=min(width-x-s.width for x,s in zip(xs,sprites))
    if low>high: raise ValueError(f'{action}: horizontal anchor cannot fit: {[(s.size,x) for s,x in zip(sprites,xs)]}')
    shift=max(low,min(0,high)); frames=[]
    for s,x in zip(sprites,xs):
        if s.height>128: raise ValueError(f'{action}: height {s.height}')
        frame=Image.new('RGBA',(width,128));frame.alpha_composite(s,(x+shift,128-s.height));frames.append(frame)
    return frames

def build():
    OUT.mkdir(parents=True,exist_ok=True)
    baseline={p.name:p.read_bytes() for p in FRAMES.glob('*.png') if not any(p.stem.startswith(a+'_') for a in SPECS)}
    metrics={}; animations=json.loads((ROOT/'public/assets/animations.json').read_text(encoding='utf-8'))
    for action,(source,cols,count,scale,width) in SPECS.items():
        cells=figures(CONCEPT/source,cols,count)
        if action=='run': cells=cells[1:]
        if action=='hurt': cells=[cells[2],cells[2].copy()]
        frames=normalize(cells,scale,width,action)
        metrics[action]=[]; previews=[]
        board=Image.new('RGBA',(len(frames)*width*2,280),'#2b2440');pen=ImageDraw.Draw(board)
        for i,frame in enumerate(frames):
            name=f'{action}_{i:03}'
            frame.save(FRAMES/f'{name}.png')
            metrics[action].append({'frame':name,'bounds':frame.getbbox(),'eye':eye_center(frame),'scale':scale})
            view=Image.new('RGBA',(192,140),'#2b2440');view.alpha_composite(frame,((192-width)//2,0));previews.append(view)
            board.alpha_composite(frame.resize((width*2,256),Image.Resampling.NEAREST),(i*width*2,0));pen.text((i*width*2+5,260),name,fill='white')
        board.save(OUT/f'{action}_strip.png')
        previews[0].save(OUT/f'{action}.png',save_all=True,append_images=previews[1:],duration=round(1000/animations['player_'+action]['frameRate']),loop=0,disposal=2,blend=0)
    assert all((FRAMES/n).read_bytes()==b for n,b in baseline.items()),'Unrelated frame changed'
    data=pack(FRAMES,ROOT/'public/assets/sprites/player/player')
    assert len(data['frames'])==59
    (OUT/'metrics.json').write_text(json.dumps(metrics,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(f'Packed 59 frames; preserved {len(baseline)} unrelated frames')

if __name__=='__main__': build()
