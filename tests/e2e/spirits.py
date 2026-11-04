"""Spirit size check (needs `npm run build` + preview on :4173).

Valvaliz and Eathy use the density-2 atlas `spirits_hd` (64x64 frames), Burnil and Wata stay in `spirits` (32x32).
Every appearance must still be 32x32 in-game:

1. animations: frame count, fps and real texture (not a placeholder) for all 4 spirits
2. pickups in the Elements Lab: 32x32 sprite and 32x32 static body; picking one up shows a 32x32 icon
3. companion: real keys 1-4 / Q / E switch spirits and K casts; recorded every frame:
   size stays 32x32, position does not jump on a switch, the expected texture plays
4. screenshots of every spirit idle + cast at full resolution (SHOT_DIR) to judge the faces by eye

usage: python3 spirits.py
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
SHOT_DIR = os.environ.get('SHOT_DIR', '/tmp/spirits_shots')
GS = "window.__game.scene.getScene('GameScene')"
SPIRITS = {'fire': ('burnil', 'spirits'), 'water': ('wata', 'spirits'),
           'wind': ('valvaliz', 'spirits_hd'), 'earth': ('eathy', 'spirits_hd')}
failures = []


def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok:
        failures.append(what)


def start(page, level, query):
    page.goto(BASE + query)
    page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
    page.evaluate(f"() => {{ window.__game.scene.getScene('TitleScene').scene.start('GameScene', {{ level: '{level}' }}); }}")
    page.wait_for_function("() => window.__game.scene.isActive('GameScene')")
    page.wait_for_timeout(800)


os.makedirs(SHOT_DIR, exist_ok=True)
with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    page = br.new_page(viewport={'width': 1280, 'height': 720})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))

    # ---- 1 + 2. Elements Lab: animations, pickups, joined icon ----
    start(page, 'lab', '')
    anims = page.evaluate(f"""() => {{
      const g = {GS}, out = {{}};
      for (const [k, atlas] of {json.dumps(list(SPIRITS.values()))}) {{
        for (const a of ['idle', 'cast']) {{
          const anim = g.anims.get(atlas + '_' + k + '_' + a);
          out[k + '_' + a] = anim ? {{ n: anim.frames.length, fps: anim.frameRate, repeat: anim.repeat,
            tex: [...new Set(anim.frames.map(f => f.textureKey))],
            size: [...new Set(anim.frames.map(f => f.frame.width + 'x' + f.frame.height))] }} : null;
        }}
      }}
      return out;
    }}""")
    for el, (k, atlas) in SPIRITS.items():
        px = '64x64' if atlas == 'spirits_hd' else '32x32'
        i, c = anims.get(f'{k}_idle'), anims.get(f'{k}_cast')
        check(i == {'n': 6, 'fps': 8, 'repeat': -1, 'tex': [atlas], 'size': [px]}, f'{k}_idle 6 frames 8 fps from {atlas} {px}: {i}')
        check(c == {'n': 4, 'fps': 12, 'repeat': 0, 'tex': [atlas], 'size': [px]}, f'{k}_cast 4 frames 12 fps from {atlas} {px}: {c}')

    pickups = page.evaluate(f"""() => {{
      const g = {GS};
      return g.children.list.filter(o => o.body && o.texture && o.texture.key.startsWith('spirits'))
        .map(o => ({{ tex: o.texture.key, frame: o.frame.name, w: o.displayWidth, h: o.displayHeight,
                      bw: o.body.width, bh: o.body.height, x: o.x, y: o.y, bx: o.body.center.x }}));
    }}""")
    check(len(pickups) == 4, f'4 spirit pickups in the lab: {len(pickups)}')
    for p in pickups:
        k = p['frame'].split('_')[0]
        atlas = [a for kk, a in SPIRITS.values() if kk == k]
        check(atlas and p['tex'] == atlas[0] and p['w'] == 32 and p['h'] == 32 and p['bw'] == 32 and p['bh'] == 32
              and abs(p['bx'] - p['x']) < 0.51, f"pickup {k}: {p['tex']} sprite {p['w']}x{p['h']} body {p['bw']}x{p['bh']}")

    for k in ('valvaliz', 'burnil'):
        icon = page.evaluate(f"""() => {{
          const g = {GS};
          const s = g.children.list.find(o => o.body && o.frame && o.frame.name.startsWith('{k}_'));
          if (!s) return null;
          g.player.body.reset(s.x - 48, s.y + 8);
          window.__pickup = [s.x, s.y];
          return true;
        }}""")
        page.wait_for_timeout(900)  # camera catches up before the pickup
        page.evaluate(f"() => {{ const [x, y] = window.__pickup; {GS}.player.body.reset(x, y + 8); }}")
        page.wait_for_timeout(250)
        icon = page.evaluate(f"""() => {{
          const i = {GS}.children.getByName('spirit-joined-icon');
          return i ? {{ tex: i.texture.key, frame: i.frame.name, w: i.displayWidth, h: i.displayHeight }} : null;
        }}""")
        atlas = 'spirits_hd' if k == 'valvaliz' else 'spirits'
        check(icon == {'tex': atlas, 'frame': f'{k}_icon', 'w': 32, 'h': 32}, f'{k} joined icon 32x32 from {atlas}: {icon}')
        page.screenshot(path=f'{SHOT_DIR}/joined_{k}.png')
        page.wait_for_timeout(1400)

    # ---- 3. companion: switch with real keys, cast, record every frame ----
    start(page, 'w1_1', '?unlock')
    page.evaluate(f"() => {{ const g = {GS}; g.enemies.getChildren().forEach(e => e.vanish()); g.player.setPosition(232, 319); }}")
    # companion lerps toward the player after the teleport; start recording only once it has arrived,
    # otherwise the catch-up movement (not a switch) shows up as a jump. software GL runs the game slower than real time
    page.wait_for_function(f"() => {{ const g = {GS}, s = g.companion.sprite; return Math.abs(s.x - (g.player.x - g.player.facing * 18)) < 0.1; }}", timeout=20000)
    page.evaluate(f"""() => {{
      const g = {GS}, s = g.companion.sprite; window.__rec = [];
      g.events.on('postupdate', () => {{
        const a = s.anims.currentAnim;
        window.__rec.push({{ el: g.elements.selector.selected, tex: s.texture.key, frame: s.frame.name,
          anim: a ? a.key : '-', w: s.displayWidth, h: s.displayHeight, ox: s.originX, oy: s.originY,
          x: s.x, y: s.y, vis: s.visible }});
      }});
    }}""")
    kb = page.keyboard

    def tap(key, ms=80):
        kb.down(key)
        page.wait_for_timeout(ms)
        kb.up(key)

    order = [('Digit1', 'fire'), ('Digit3', 'wind'), ('Digit2', 'water'), ('Digit4', 'earth'),
             ('Digit3', 'wind'), ('Digit1', 'fire'), ('KeyE', 'water'), ('KeyE', 'wind'), ('KeyE', 'earth'), ('KeyQ', 'wind')]
    for key, el in order:
        tap(key)
        page.wait_for_timeout(350)
        sel = page.evaluate(f"() => {GS}.elements.selector.selected")
        check(sel == el, f'{key} selects {el}: {sel}')
        if el in ('wind', 'earth', 'fire', 'water') and key.startswith('Digit'):
            page.evaluate(f"() => {{ {GS}.elements.energy.refill(); }}")
            tap('KeyK')
            page.wait_for_timeout(700)

    rec = page.evaluate("() => window.__rec")
    vis = [r for r in rec if r['vis']]
    check(len(vis) > 100, f'{len(vis)} frames recorded')
    bad_size = [r for r in vis if abs(r['w'] - 32) > 0.01 or abs(r['h'] - 32) > 0.01]
    check(not bad_size, f'companion 32x32 on every frame ({len(bad_size)} bad: {bad_size[:2]})')
    bad_origin = [r for r in vis if r['ox'] != 0.5 or r['oy'] != 0.5]
    check(not bad_origin, f'companion origin stays centred ({len(bad_origin)} bad)')
    bad_tex = [r for r in vis if r['el'] and r['tex'] != SPIRITS[r['el']][1]]
    # the selection changes during update, the sprite follows in the same frame
    check(len(bad_tex) <= len(order), f'texture follows the selected spirit ({len(bad_tex)} lagging frames)')
    jumps = []
    for a, b in zip(vis, vis[1:]):
        d = max(abs(b['x'] - a['x']), abs(b['y'] - a['y']))
        if d > 0.6:
            jumps.append((a['tex'], b['tex'], round(d, 2)))
    check(not jumps, f'no position jump between frames, including {len(order)} switches: {jumps[:4]}')
    switches = sum(1 for a, b in zip(vis, vis[1:]) if a['tex'] != b['tex'])
    check(switches >= 6, f'{switches} atlas changes (spirits <-> spirits_hd) recorded')
    played = {r['anim'] for r in vis}
    for el, (k, atlas) in SPIRITS.items():
        check(f'{atlas}_{k}_cast' in played and f'{atlas}_{k}_idle' in played, f'{k} played idle and cast from {atlas}')

    # ---- 4. screenshots: companion idle + cast of every spirit, cropped around it ----
    for key, el in [('Digit1', 'fire'), ('Digit2', 'water'), ('Digit3', 'wind'), ('Digit4', 'earth')]:
        tap(key)
        page.wait_for_timeout(600)
        box = page.evaluate(f"""() => {{
          const g = {GS}, s = g.companion.sprite, cam = g.cameras.main, scale = window.__game.scale;
          const k = scale.displaySize.width / scale.gameSize.width;
          const x = (s.x - cam.worldView.x) * cam.zoom * k, y = (s.y - cam.worldView.y) * cam.zoom * k;
          return {{ x: x - 120, y: y - 70, width: 240, height: 150 }};
        }}""")
        k = SPIRITS[el][0]
        page.screenshot(path=f'{SHOT_DIR}/{k}_idle.png', clip=box)
        page.evaluate(f"() => {{ {GS}.elements.energy.refill(); }}")
        tap('KeyK', 60)
        page.wait_for_timeout(120)
        page.screenshot(path=f'{SHOT_DIR}/{k}_cast.png', clip=box)
        page.wait_for_timeout(600)

    check(not errors, f'no page errors {errors[:2]}')
    br.close()

print(f'\n{len(failures)} failures' if failures else '\nALL PASS')
print(f'screenshots: {SHOT_DIR}')
sys.exit(1 if failures else 0)
