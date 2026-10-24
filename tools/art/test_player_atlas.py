"""Production packet checks: frame coverage, lossless packing and anchors."""
from pathlib import Path
import json
import unittest
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]


class MovementPacketTests(unittest.TestCase):
    def test_idle_run_face_scale_and_idle_horizontal_stability(self):
        def eyes(name):
            frame = Image.open(ROOT/f'art/frames/player/{name}.png').convert('RGBA')
            points = [(x,y) for y in range(65) for x in range(frame.width)
                      if (lambda p: p[3] and p[2] > p[0]+25 and p[2] > p[1]+8)(frame.getpixel((x,y)))]
            return (min(x for x,y in points), min(y for x,y in points),
                    max(x for x,y in points), max(y for x,y in points))
        base = eyes('idle_000')
        for i in (1,2,4,5):
            box = eyes(f'idle_{i:03}')
            self.assertEqual((base[0],base[2]), (box[0],box[2]))
            self.assertLessEqual(abs(box[1]-base[1]), 1)
            self.assertEqual(base[3]-base[1], box[3]-box[1])
        for i in range(4):
            box = eyes(f'run_{i:03}')
            self.assertEqual((base[2]-base[0],base[3]-base[1]),
                             (box[2]-box[0],box[3]-box[1]))

    def test_roundtrip_coverage_and_baseline(self):
        data=json.loads((ROOT/'public/assets/sprites/player/player.json').read_text())
        atlas=Image.open(ROOT/'public/assets/sprites/player/player.png').convert('RGBA')
        counts={'idle':6,'run':4,'jump_up':2,'jump_peak':2,'fall':2,'land':2}
        expected={f'{anim}_{i:03}' for anim,count in counts.items() for i in range(count)}
        self.assertEqual(expected,set(data['frames']))
        for name,info in data['frames'].items():
            with self.subTest(frame=name):
                r=info['frame']; w,h=r['w'],r['h']
                self.assertFalse(info['trimmed'])
                self.assertFalse(info['rotated'])
                self.assertEqual({'w':w,'h':h},info['sourceSize'])
                self.assertEqual({'x':0,'y':0,'w':w,'h':h},info['spriteSourceSize'])
                self.assertEqual({'x':.5,'y':1.0},info['pivot'])
                frame=atlas.crop((r['x'],r['y'],r['x']+w,r['y']+h))
                source=Image.open(ROOT/f'art/frames/player/{name}.png').convert('RGBA')
                self.assertEqual(source.tobytes(),frame.tobytes())
                self.assertEqual(h,frame.getbbox()[3])
                self.assertEqual((128 if name.startswith('run_') else 96,128),frame.size)

    def test_idle_seed_opaque_pixels_are_unchanged(self):
        seed=Image.open(ROOT/'art/previews/phase_a/2026-10-23_aclaire_seed_v4_256color_density2.png').convert('RGBA')
        frame=Image.open(ROOT/'art/frames/player/idle_000.png').convert('RGBA')
        self.assertEqual(seed.getchannel('A').tobytes(),frame.getchannel('A').tobytes())
        for original,current in zip(seed.get_flattened_data(),frame.get_flattened_data()):
            if original[3]:
                self.assertEqual(original,current)

    def test_manifest_uses_approved_counts_and_timing(self):
        data=json.loads((ROOT/'public/assets/animations.json').read_text())
        expected={'idle':(6,8,-1),'run':(4,8,-1),'jump_up':(2,10,0),
                  'jump_peak':(2,10,0),'fall':(2,10,-1),'land':(2,14,0)}
        for anim,(count,fps,repeat) in expected.items():
            self.assertEqual({'atlas':'player','prefix':anim+'_','frames':count,'frameRate':fps,'repeat':repeat},data['player_'+anim])


if __name__ == '__main__':
    unittest.main()
