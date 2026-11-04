"""Create review contact sheets and looping GIFs from actual atlas frames."""
from pathlib import Path
import json,math,html,subprocess
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[2];out=R/'art/previews/phase_b/2026-11-04_core';out.mkdir(parents=True,exist_ok=True)
def run():
 defs=json.loads(subprocess.check_output(['node','--experimental-strip-types','--input-type=module','-e',"import {ATLASES} from './src/assets/manifest.ts'; process.stdout.write(JSON.stringify(ATLASES))"],cwd=R,text=True));missing=[];cards=[]
 for atlas in defs:
  if atlas['key'] not in ('spirits','objects','items','fx','ui'):continue
  key=atlas['key'];meta=json.loads((R/'public'/atlas['json']).read_text());sheet=Image.open(R/'public'/atlas['png']);names=[]
  for a in atlas['anims']:names.extend(f"{a['name']}_{i:03}" for i in range(a['frames']))
  names.extend(s['name'] for s in atlas.get('stills',[]))
  for a in atlas['anims']+atlas.get('stills',[]):
   expected=(a.get('width',atlas['frameWidth']),a.get('height',atlas['frameHeight']))
   keys=[f"{a['name']}_{i:03}" for i in range(a['frames'])] if 'frames' in a else [a['name']]
   for name in keys:
    f=meta['frames'][name]['frame'];assert (f['w'],f['h'])==expected,(key,name,expected)
  if key=='ui':assert all('pivot' not in f for f in meta['frames'].values()),'UI frame switches must preserve runtime origins'

  missing.extend(f'{key}/{n}' for n in names if n not in meta['frames'])
  names=sorted(meta['frames']);board=Image.new('RGBA',(720,math.ceil(len(names)/6)*100),'#2b2440');draw=ImageDraw.Draw(board)
  def get(name):
   f=meta['frames'][name]['frame'];return sheet.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']))
  for i,name in enumerate(names):
   im=get(name);scale=max(1,min(3,112//im.width,70//im.height));im=im.resize((im.width*scale,im.height*scale),Image.Resampling.NEAREST);x=i%6*120;y=i//6*100;board.alpha_composite(im,(x+(120-im.width)//2,y+72-im.height));draw.text((x+2,y+76),name[:19],fill='#f2efe6')
  board.save(out/f'{key}_contact.png')
  for a in atlas['anims']:
   if a['frames']<2:continue
   imgs=[]
   for i in range(a['frames']):
    im=get(f"{a['name']}_{i:03}");scale=min(4,160//im.width,160//im.height);im=im.resize((im.width*scale,im.height*scale),Image.Resampling.NEAREST);bg=Image.new('RGBA',(192,192),'#2b2440');bg.alpha_composite(im,((192-im.width)//2,170-im.height));imgs.append(bg.convert('RGB'))
   name=f"{key}_{a['name']}.gif";imgs[0].save(out/name,save_all=True,append_images=imgs[1:],duration=round(1000/a['frameRate']),loop=0);cards.append(f'<figure><img src="{name}"><figcaption>{key} / {a["name"]}</figcaption></figure>')
 (out/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Core assets review</title><style>body{background:#171222;color:#f2efe6;font:14px monospace;margin:28px}main{display:flex;flex-wrap:wrap;gap:16px}figure{margin:0;background:#2b2440;padding:8px}img{image-rendering:pixelated}figcaption{max-width:192px}</style><h1>Core assets / animation review</h1><p>Review loops repeat one-shot actions for inspection.</p><main>'+''.join(cards)+'</main>')
 print('Runtime core frame coverage:', 'PASS' if not missing else missing)
 assert not missing
if __name__=='__main__':run()
