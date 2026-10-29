"""Current player atlas contract and approved combat revision checks."""
from pathlib import Path
import json
import unittest
from PIL import Image
from build_player_movement_atlas import eye_center, COLORS
ROOT=Path(__file__).resolve().parents[2]
class CombatTests(unittest.TestCase):
 def test_packet(self):
  data=json.loads((ROOT/'public/assets/sprites/player/player.json').read_text())
  anims=json.loads((ROOT/'public/assets/animations.json').read_text())
  expected={f"{a['prefix']}{i:03}" for a in anims.values() if a.get('atlas')=='player' for i in range(a['frames'])}
  self.assertEqual(59,len(expected));self.assertEqual(expected,set(data['frames']))
  atlas=Image.open(ROOT/'public/assets/sprites/player/player.png').convert('RGBA')
  for name,info in data['frames'].items():
   with self.subTest(frame=name):
    r=info['frame'];w,h=r['w'],r['h']
    self.assertFalse(info['trimmed']);self.assertFalse(info['rotated'])
    self.assertEqual({'x':.5,'y':1.0},info['pivot'])
    frame=atlas.crop((r['x'],r['y'],r['x']+w,r['y']+h))
    source=Image.open(ROOT/f'art/frames/player/{name}.png').convert('RGBA')
    self.assertEqual(source.tobytes(),frame.tobytes());self.assertEqual(128,frame.getbbox()[3])
    self.assertEqual((192 if name.startswith('attack_') else 128 if name.startswith('run_') else 96,128),frame.size)
    self.assertLessEqual(set(frame.getchannel('A').get_flattened_data()),{0,255})
    self.assertLessEqual({p[:3] for p in frame.get_flattened_data() if p[3]},set(COLORS))
    if name.startswith('attack_'):self.assertLessEqual(frame.getbbox()[2],176)
 def test_idle_anchor_and_hurt(self):
  eyes=[eye_center(Image.open(ROOT/f'art/frames/player/idle_{i:03}.png').convert('RGBA')) for i in (0,1,2,4,5)]
  for axis in (0,1):
   values=[p[axis] for p in eyes];self.assertLessEqual(max(values)-min(values),1.5)
  self.assertEqual(Image.open(ROOT/'art/frames/player/hurt_000.png').tobytes(),Image.open(ROOT/'art/frames/player/hurt_001.png').tobytes())
if __name__=='__main__':unittest.main()
