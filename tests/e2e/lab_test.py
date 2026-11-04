"""Scripted headless playtest of the Elements Lab (Phase 2)."""
import os
BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
SHOT_DIR = os.environ.get('SHOT_DIR', 'tests/e2e/shots')
os.makedirs(SHOT_DIR, exist_ok=True)
import json
import sys
from playwright.sync_api import sync_playwright

URL = BASE + '?lowres'
SHOTS = SHOT_DIR
results = []
errors = []

GS = "window.__game.scene.getScene('GameScene')"


def check(name, ok, detail=''):
    results.append((name, bool(ok), detail))
    print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail else ''), flush=True)


with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    page = b.new_page(viewport={'width': 1280, 'height': 720})
    page.on('console', lambda m: errors.append(f'{m.type}: {m.text}') if m.type in ('error',) else None)
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e}'))
    page.goto(URL)
    page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')", timeout=15000)
    page.wait_for_timeout(300); page.keyboard.press('ArrowDown'); page.wait_for_timeout(150); page.keyboard.press('ArrowDown'); page.wait_for_timeout(150); page.keyboard.press('Enter')  # Adventure, Settings, Elements Lab
    page.wait_for_function("() => window.__game.scene.isActive('GameScene')", timeout=5000)
    page.wait_for_timeout(600)

    def ev(js):
        return page.evaluate(js)

    def state():
        return ev(f"""() => {{ const g = {GS}; const p = g.player; const h = g.hudState();
          return {{ x: Math.round(p.x), y: Math.round(p.y), col: Math.floor(p.x / 16), grounded: p.isGrounded,
                   dead: p.isDead, mode: p.mode, hp: h.hp, lives: h.lives, energy: Math.round(h.energy),
                   selected: h.selected, unlocked: h.unlocked, denied: h.energyDenied }}; }}""")

    def tp(col, row=19, face=1):
        ev(f"""() => {{ const g = {GS}; const p = g.player; p.respawn({col} * 16 + 8, {row + 1} * 16);
              p.setFlipX({str(face < 0).lower()}); g.energy.refill(); }}""")
        page.wait_for_timeout(250)

    def objs(kind):
        return ev(f"""() => {GS}.puzzleObjects.filter(o => o.kind === '{kind}')
              .map(o => ({{ col: o.col, row: o.row, removed: o.removed, frozen: o.frozen === true,
                           active: o.isActive === true, open: o.isOpen === true }}))""")

    def press(key, hold=60):
        page.keyboard.down(key)
        page.wait_for_timeout(hold)
        page.keyboard.up(key)

    def walk(key, ms):
        page.keyboard.down(key)
        page.wait_for_timeout(ms)
        page.keyboard.up(key)

    # ---- start: no spirits, K does nothing --------------------------------
    s = state()
    check('starts with no spirits', s['unlocked'] == [] and s['selected'] is None, s)
    press('k')
    page.wait_for_timeout(100)
    check('K without spirits does nothing', ev(f"() => {GS}.projectiles.getLength()") == 0)

    # ---- Burnil ------------------------------------------------------------
    walk('d', 700)
    page.wait_for_timeout(300)
    s = state()
    check('pick up Burnil', s['selected'] == 'fire' and s['unlocked'] == ['fire'], s)
    page.wait_for_timeout(300)
    page.screenshot(path=f'{SHOTS}/lab_01_burnil.png')

    tp(15)
    press('k')
    page.wait_for_timeout(1400)
    vines = [v for v in objs('vine') if v['col'] == 18]
    check('fireball burns the whole vine wall', all(v['removed'] for v in vines), f"{sum(v['removed'] for v in vines)}/{len(vines)}")
    walk('d', 600)
    check('can walk past the burned vines', state()['col'] > 18, state()['col'])

    tp(22)
    press('k')
    page.wait_for_timeout(1300)
    crates = objs('crate')
    check('fire spreads through the crate pile', all(c['removed'] for c in crates), f"{sum(c['removed'] for c in crates)}/{len(crates)}")

    tp(29)
    gate = [g for g in objs('gate') if g['col'] == 38][0]
    check('torch gate starts closed', not gate['open'])
    press('k')
    page.wait_for_timeout(1200)
    torch = objs('torch')[0]
    gate = [g for g in objs('gate') if g['col'] == 38][0]
    check('fireball lights the torch and opens its gate', torch['active'] and gate['open'], (torch, gate))
    page.screenshot(path=f'{SHOTS}/lab_02_torch_gate.png')

    tp(43)
    press('k')
    page.wait_for_timeout(1300)
    ice = [i for i in objs('ice') if i['col'] == 46]
    check('fireball melts the ice wall', all(i['removed'] for i in ice), f"{sum(i['removed'] for i in ice)}/{len(ice)}")

    # ---- Wata ---------------------------------------------------------------
    tp(52)
    walk('d', 400)
    page.wait_for_timeout(300)
    s = state()
    check('pick up Wata (auto-selected)', s['selected'] == 'water' and 'water' in s['unlocked'], s)

    tp(58)
    press('k')
    page.wait_for_timeout(1300)
    water = [w for w in objs('water') if 60 <= w['col'] <= 69]
    frozen = [w['col'] for w in water if w['frozen']]
    check('water bubble freezes part of the pool', len(frozen) >= 3, frozen)
    page.screenshot(path=f'{SHOTS}/lab_03_frozen_pool.png')
    if frozen:
        tp(frozen[len(frozen) // 2], 19)
        page.wait_for_timeout(500)
        s = state()
        check('can stand on frozen water', s['grounded'] and not s['dead'], s)

    tp(59)
    lives_before = state()['lives']
    ev(f"() => {GS}.puzzleObjects.filter(o => o.kind === 'water').forEach(o => o.setFrozen(false))")
    walk('d', 500)
    page.wait_for_timeout(1500)
    check('falling into unfrozen water costs a life', state()['lives'] == lives_before - 1, (lives_before, state()['lives']))

    tp(73)
    press('k')
    page.wait_for_timeout(1500)
    leaves = ev(f"() => {GS}.oneWays.getLength()")
    check('water grows the magic seed into 2 leaf platforms', leaves == 2, leaves)
    page.screenshot(path=f'{SHOTS}/lab_04_seed.png')
    # climb: leaf 1 -> leaf 2 -> ledge
    tp(77, 17)
    page.wait_for_timeout(400)
    check('can stand on the lower leaf', state()['grounded'], state())
    ev(f"() => {{ const p = {GS}.player; p.respawn(77 * 16 + 8, 16 * 16); }}")
    page.wait_for_timeout(400)
    check('can stand on the upper leaf', state()['grounded'] and state()['y'] == 256, state())
    page.keyboard.down('d')
    press('Space', 400)
    page.wait_for_timeout(700)
    page.keyboard.up('d')
    page.wait_for_timeout(300)
    s = state()
    check('can jump from the upper leaf onto the ledge', s['grounded'] and s['y'] == 208 and 80 <= s['col'] <= 88, s)

    ev(f"""() => {{ const g = {GS}; const e = g.enemies.getChildren().filter(e => e.isAlive).sort((a, b) => Math.abs(a.x - 1528) - Math.abs(b.x - 1528))[0];
          g.player.respawn(e.x - 72, 320); g.player.setFlipX(false); g.energy.refill(); }}""")
    page.wait_for_timeout(150)
    hp_before = state()['hp']
    press('k')
    page.wait_for_timeout(700)
    frozen_slime = ev(f"() => {GS}.enemies.getChildren().some(e => e.isFrozen)")
    check('water bubble freezes a slime', frozen_slime)
    if frozen_slime:
        ev(f"""() => {{ const g = {GS}; const e = g.enemies.getChildren().find(e => e.isFrozen);
              g.player.respawn(e.x, e.y - 14); }}""")
        page.wait_for_timeout(300)
        s = state()
        check('frozen slime is a safe platform', s['grounded'] and s['hp'] == hp_before, s)

    # ---- Valvaliz -----------------------------------------------------------
    tp(107)
    walk('d', 400)
    page.wait_for_timeout(300)
    s = state()
    check('pick up Valvaliz', s['selected'] == 'wind', s)
    check('double jump unlocked', ev(f"() => {GS}.player.doubleJumpUnlocked"))

    # double jump height vs single jump
    def apex(double):
        tp(130)
        y0 = state()['y']
        ev(f"() => {{ window.__minY = 1e9; window.__iv = setInterval(() => {{ window.__minY = Math.min(window.__minY, {GS}.player.y); }}, 5); }}")
        page.keyboard.down('Space')
        page.wait_for_timeout(330)
        if double:
            page.keyboard.up('Space')
            page.wait_for_timeout(20)
            page.keyboard.down('Space')
        page.wait_for_timeout(500)
        page.keyboard.up('Space')
        page.wait_for_timeout(700)
        return round(y0 - ev("() => { clearInterval(window.__iv); return window.__minY; }"))
    single_h, double_h = apex(False), apex(True)
    check('double jump goes higher than a single jump', double_h > single_h + 30, (single_h, double_h))

    # cross the 13-tile gap: run, jump, double jump, dash, glide
    tp(108)
    page.keyboard.down('d')
    page.wait_for_function(f"() => {GS}.player.x >= 113 * 16 + 6", timeout=3000)
    page.keyboard.down('Space')
    page.wait_for_timeout(300)
    page.keyboard.up('Space')
    page.wait_for_timeout(30)
    press('Space', 250)
    page.wait_for_timeout(150)
    page.keyboard.down('k')
    page.wait_for_timeout(1600)
    page.keyboard.up('k')
    page.wait_for_timeout(600)
    page.keyboard.up('d')
    s = state()
    check('crosses the wide gap with double jump + dash + glide', s['col'] > 126 and not s['dead'], s)
    page.screenshot(path=f'{SHOTS}/lab_05_after_gap.png')

    # glide slows the fall
    tp(130, 10)
    ev(f"() => {{ window.__vy = 0; window.__iv = setInterval(() => {{ window.__vy = Math.max(window.__vy, {GS}.player.body.velocity.y); }}, 5); }}")
    page.keyboard.down('k')  # in air: dash first, then glide while held
    page.wait_for_timeout(900)
    page.keyboard.up('k')
    vy = ev("() => { clearInterval(window.__iv); return Math.round(window.__vy); }")
    check('glide caps fall speed', vy <= 60, vy)

    tp(130)
    press('k')
    page.wait_for_timeout(900)
    mill = objs('windmill')[0]
    gate = [g for g in objs('gate') if g['col'] == 140][0]
    check('gust spins the windmill and opens its gate', mill['active'] and gate['open'], (mill, gate))

    tp(144)
    page.wait_for_timeout(300)
    slime_x0 = ev(f"() => {{ const e = {GS}.enemies.getChildren().filter(e => e.isAlive).sort((a,b) => Math.abs(a.x - 2368) - Math.abs(b.x - 2368))[0]; return e ? Math.round(e.x) : null; }}")
    ev(f"() => {{ const g = {GS}; const e = g.enemies.getChildren().filter(e => e.isAlive).sort((a,b) => Math.abs(a.x - 2368) - Math.abs(b.x - 2368))[0]; g.player.respawn(e.x - 30, 320); g.player.setFlipX(false); g.energy.refill(); }}")
    page.wait_for_timeout(200)
    press('k')
    page.wait_for_timeout(250)
    vx = ev(f"() => {{ const g = {GS}; const e = g.enemies.getChildren().filter(e => e.isAlive).sort((a,b) => Math.abs(a.x - g.player.x) - Math.abs(b.x - g.player.x))[0]; return e ? Math.round(e.body.velocity.x) : null; }}")
    check('gust pushes a slime away', vx is not None and vx > 150, (slime_x0, vx))

    # ---- Eathy --------------------------------------------------------------
    tp(160)
    walk('d', 400)
    page.wait_for_timeout(300)
    s = state()
    check('pick up Eathy', s['selected'] == 'earth' and len(s['unlocked']) == 4, s)

    tp(168)
    press('k')
    page.wait_for_timeout(600)
    plate = objs('plate')[0]
    gate = [g for g in objs('gate') if g['col'] == 178][0]
    check('earth block on the plate opens the gate', plate['active'] and gate['open'], (plate, gate))
    page.keyboard.down('d')
    press('Space', 300)  # hop over the block standing on the plate
    page.wait_for_timeout(1500)
    page.keyboard.up('d')
    check('can walk through the plate gate', state()['col'] > 179, state()['col'])
    page.screenshot(path=f'{SHOTS}/lab_06_plate.png')

    tp(186)
    blocks = ev(f"() => {GS}.earthBlocks.length")
    press('k')
    page.wait_for_timeout(300)
    press('k')  # second block would need a new spot; turn and place behind
    page.wait_for_timeout(300)
    ev(f"() => {GS}.energy.refill()")
    tp(185, face=-1)
    press('k')
    page.wait_for_timeout(400)
    check('at most 2 earth blocks exist', ev(f"() => {GS}.earthBlocks.length") <= 2, ev(f"() => {GS}.earthBlocks.length"))

    ev(f"() => {{ const g = {GS}; while (g.earthBlocks.length) g.crumbleEarthBlock(g.earthBlocks[0]); }}")
    tp(188)
    press('Space', 250)
    page.wait_for_timeout(120)
    press('k')
    page.wait_for_timeout(1000)
    walls = [w for w in objs('crackedWall') if w['col'] == 190]
    check('ground slam breaks the stacked cracked walls', all(w['removed'] for w in walls), walls)
    walk('d', 900)
    check('can walk through the broken wall', state()['col'] > 192, state()['col'])
    page.screenshot(path=f'{SHOTS}/lab_07_slam.png')

    # ---- mixed room -> goal --------------------------------------------------
    tp(200)
    press('2')
    page.wait_for_timeout(300)
    check('1-4 selects an element directly', state()['selected'] == 'water', state())
    press('k')
    page.wait_for_timeout(1300)
    frozen2 = [w['col'] for w in objs('water') if w['col'] >= 202 and w['frozen']]
    check('mixed room: pool partly frozen', len(frozen2) >= 3, frozen2)
    tp(211)  # past the pool
    page.wait_for_timeout(300)
    press('1')
    page.wait_for_timeout(300)
    tp(213)
    press('k')
    page.wait_for_timeout(1300)
    vines2 = [v for v in objs('vine') if v['col'] == 216]
    check('mixed room: vines burned', all(v['removed'] for v in vines2))
    tp(218)
    press('k')
    page.wait_for_timeout(900)
    tp(221)
    press('3')
    page.wait_for_timeout(300)
    press('k')
    page.wait_for_timeout(900)
    gate = [g for g in objs('gate') if g['col'] == 228][0]
    check('mixed gate needs torch AND windmill', gate['open'], gate)
    tp(232)
    press('4')
    page.wait_for_timeout(300)
    press('Space', 250)
    page.wait_for_timeout(120)
    press('k')
    page.wait_for_timeout(1000)
    walk('d', 2000)
    page.wait_for_timeout(900)
    active = ev("() => window.__game.scene.getScenes(true).map(s => s.sys.settings.key)")
    check('reaches the goal', 'StageClearScene' in active, active)

    # ---- energy denial --------------------------------------------------------
    page.keyboard.press('Enter')
    page.wait_for_function("() => window.__game.scene.isActive('GameScene')", timeout=5000)
    page.wait_for_timeout(400)
    ev(f"() => {{ const g = {GS}; ['fire','water','wind','earth'].forEach(e => g.elements.unlock(e)); g.elements.selector.selectSlot(0); }}")
    page.wait_for_timeout(300)
    ev(f"() => {{ const e = {GS}.energy; e.trySpend(e.value - 5); }}")
    press('k')
    page.wait_for_timeout(50)
    s = state()
    check('not enough energy: no cast and HUD flashes', s['denied'] and ev(f"() => {GS}.projectiles.getLength()") == 0, s)
    page.screenshot(path=f'{SHOTS}/lab_08_hud_denied.png')

    fps = ev("() => Math.round(window.__game.loop.actualFps)")
    b.close()

passed = sum(1 for r in results if r[1])
print(f'\n{passed}/{len(results)} checks passed, fps ~{fps}')
print('console errors:', errors[:20])
