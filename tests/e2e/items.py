"""Spirit Orb and 1UP Feather with real input (needs `npm run build` + preview on :4173).

1. every World 1 level has 2 orbs and 1-2 has the only feather (real items atlas frames, animation playing)
2. orb: walking into it with low energy refills +50 (ItemBalance.orbEnergy); with full energy it stays for later
3. feather: climb the three one-way ledges above the 1-2 checkpoint with real jumps and take it: lives +1, "1UP" text;
   at the life cap (9) it stays; from the ground below the ledges the feather is outside the camera view
4. the feather is saved the moment it is taken: replaying 1-2 (also after a page reload) shows a ghost that gives no life

usage: python3 items.py
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
GS = "window.__game.scene.getScene('GameScene')"
T = 16
failures = []


def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok:
        failures.append(what)


with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    page = br.new_page(viewport={'width': 640, 'height': 360})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE + '?lowres&unlock')
    page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
    kb = page.keyboard
    wait = page.wait_for_timeout

    def start(level):
        page.evaluate(f"() => {{ window.__game.scene.start('GameScene', {{ level: '{level}' }}); }}")
        page.wait_for_function(f"() => window.__game.scene.isActive('GameScene') && {GS}.def.key === '{level}'")
        wait(900)
        page.evaluate(f"() => {{ {GS}.enemies.getChildren().forEach(e => e.vanish()); }}")

    def items(prefix):
        return page.evaluate(f"""() => {GS}.children.list
          .filter(o => o.active && o.anims && o.anims.currentAnim && o.anims.currentAnim.key === 'items_{prefix}')
          .map(o => ({{ x: o.x, y: o.y, tex: o.texture.key, frame: o.frame.name, alpha: o.alpha }}))""")

    def teleport(col, y):
        page.evaluate(f"() => {{ const g = {GS}; g.player.setPosition({col * T + T / 2}, {y - 1}); g.player.body.setVelocity(0, 0); }}")
        wait(500)

    def walk_right(ms):
        kb.down('d')
        wait(ms)
        kb.up('d')
        wait(200)

    # ---- 1. placement ----
    for level, n_orbs, n_feathers in (('w1_1', 2, 0), ('w1_2', 2, 1), ('w1_3', 2, 0)):
        start(level)
        orbs, feathers = items('spirit_orb_pulse'), items('oneup_feather_float')
        check(len(orbs) == n_orbs and all(o['tex'] == 'items' and o['frame'].startswith('spirit_orb_pulse_') for o in orbs),
              f'{level}: {len(orbs)} Spirit Orbs from the items atlas')
        check(len(feathers) == n_feathers and all(f['tex'] == 'items' for f in feathers), f'{level}: {len(feathers)} 1UP Feather')

    # ---- 2. orb in 1-1 at col 72 ----
    start('w1_1')
    teleport(69, 320)
    walk_right(700)
    check(len(items('spirit_orb_pulse')) == 2, 'full energy: the orb stays')
    teleport(69, 320)
    page.evaluate(f"() => {{ {GS}.elements.energy.trySpend(80); }}")
    before = page.evaluate(f"() => {GS}.elements.energy.value")
    walk_right(700)
    after = page.evaluate(f"() => {GS}.elements.energy.value")
    left = len(items('spirit_orb_pulse'))
    # regen waits 1.5 s after spending, so the gain is the orb alone
    check(left == 1 and 49 <= after - before <= 51, f'low energy: orb taken, energy {before:.0f} -> {after:.0f} (+50)')

    # ---- 3. feather in 1-2: real jumps up three one-way ledges ----
    start('w1_2')

    def state():
        return page.evaluate(f"""() => {{ const g = {GS}, b = g.player.body;
          return {{ x: b.center.x, y: b.bottom, vy: b.velocity.y, grounded: b.blocked.down || b.touching.down,
                    lives: g.vitals.lives, dead: g.player.isDead }}; }}""")

    def climb(goals, done):
        """hop toward each (x, deck y) stop, landing on it, then toward the final x; same bot as shards.py"""
        holding, space = None, False

        def release():
            nonlocal holding, space
            if holding:
                kb.up(holding)
                holding = None
            if space:
                kb.up('Space')
                space = False

        for gx, gy in goals:
            for _ in range(120):
                s = state()
                if s['dead'] or done(s):
                    release()
                    return not s['dead']
                dx = gx - s['x']
                if gy is not None and s['grounded'] and abs(dx) < 20 and abs(s['y'] - gy) < 4:
                    break
                near = abs(dx) < (40 if s['vy'] > 0 else 14)
                d = None if (not s['grounded'] and near) or abs(dx) < 5 else ('d' if dx > 0 else 'a')
                if d != holding:
                    if holding:
                        kb.up(holding)
                    if d:
                        kb.down(d)
                    holding = d
                if s['grounded'] and not space:
                    kb.down('Space')
                    space = True
                elif space and s['vy'] >= 0:
                    kb.up('Space')
                    space = False
                wait(50)
            else:
                release()
                return done(state())
        release()
        return done(state())

    # ledges: cols 118-120 row 17, 121-123 row 14, 124-126 row 11, 127-129 row 8 (deck 5 px below the tile top);
    # feather col 128 row 7
    plan = [(119 * T + 8, 17 * T + 5), (122 * T + 8, 14 * T + 5), (125 * T + 8, 11 * T + 5), (128 * T + 8, 8 * T + 5), (128 * T + 8, None)]
    page.evaluate(f"() => {{ const g = {GS}; g.player.setPosition(122 * {T} + 8, 319); }}")
    page.wait_for_function(f"() => Math.abs({GS}.cameras.main.worldView.centerX - {GS}.player.x) < 60", timeout=10000)
    wait(800)
    view = page.evaluate(f"() => {{ const v = {GS}.cameras.main.worldView; return [v.top, v.bottom]; }}")
    check(not (view[0] <= 7 * T + 8 <= view[1]), f'feather hidden from the ground (camera rows {view[0] / T:.0f}-{view[1] / T:.0f})')
    # life cap first, while the feather is still untaken in this save
    page.evaluate(f"() => {{ const v = {GS}.vitals; for (let i = 0; i < 9; i++) v.addLife(); }}")
    page.evaluate(f"() => {{ const g = {GS}; g.player.body.setAllowGravity(false); g.player.setPosition(128 * {T} + 8, 8 * {T}); g.player.body.setVelocity(0, 0); }}")
    wait(400)
    check(len(items('oneup_feather_float')) == 1 and state()['lives'] == 9 and page.evaluate(f"() => {GS}.progress.collectedFeathers('w1_2')") == [],
          'life cap (9): the feather stays and is not saved')
    page.evaluate(f"() => {{ const g = {GS}; g.vitals.resetForContinue(); g.player.body.setAllowGravity(true); }}")
    start('w1_2')
    lives0 = state()['lives']
    got = False
    for _ in range(3):
        teleport(115, 320)
        if climb(plan, lambda s: s['lives'] > lives0):
            got = True
            break
    s = state()
    check(got and s['lives'] == lives0 + 1 and len(items('oneup_feather_float')) == 0, f'feather reached with real jumps: lives {lives0} -> {s["lives"]}')
    page.screenshot(path=os.path.join(os.environ.get('SHOT_DIR', '/tmp'), 'feather_ledge.png'))

    # ---- 4. taken once per save: ghost on replay, after a reload too; nothing more to take ----
    saved = page.evaluate(f"() => {GS}.progress.collectedFeathers('w1_2')")
    stored = page.evaluate("() => JSON.parse(localStorage.getItem('elemental-spirit:progress') || '{}').feathers")
    check(saved == [0] and stored == {'w1_2': [0]}, f'feather saved the moment it was taken {saved} {stored}')
    for label, reload in (('replay', False), ('after reload', True)):
        if reload:
            page.reload()
            page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
        start('w1_2')
        f = items('oneup_feather_float')
        lives = state()['lives']
        page.evaluate(f"() => {{ const g = {GS}; g.player.body.setAllowGravity(false); g.player.setPosition(128 * {T} + 8, 8 * {T}); g.player.body.setVelocity(0, 0); }}")
        wait(400)
        check(len(f) == 1 and f[0]['alpha'] == 0.3 and state()['lives'] == lives and len(items('oneup_feather_float')) == 1,
              f'{label}: feather shown as a ghost and gives no life ({f}, lives {lives} -> {state()["lives"]})')

    check(not errors, f'no page errors {errors[:2]}')
    br.close()

print(f'\n{len(failures)} failures' if failures else '\nALL PASS')
sys.exit(1 if failures else 0)
