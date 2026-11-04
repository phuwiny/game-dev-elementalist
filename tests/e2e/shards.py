"""Spirit Shards are reachable with real input, collected only on clear, saved, and shown (needs `npm run build` + preview on :4173).

usage: python3 shards.py [level ...]       (default: w1_1 w1_2 w1_3)
Each shard has a start spot (a stand-on tile near it) and a way to get it:
  hop  - bunny-hop toward it (jump ledges, one-way platforms)
  burn - walk up to a crate nest, cast fire until the crates burn, then step in
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
GS = "window.__game.scene.getScene('GameScene')"
T = 16

# level -> slot -> (start col, start feet y px, shard col, shard row, mode, stops)
# hop stops: (centre x px, deck feet y px) to land on before the next hop; burn: crate nest right of the start
PLAN = {
    'w1_1': {
        0: (3, 320, 12, 10, 'hop', [(104, 277), (152, 229), (200, 181)]),
        1: (46, 245, 48, 11, 'hop', []),
        2: (145, 320, 147, 19, 'burn', []),
    },
    'w1_2': {0: (31, 272, 29, 9, 'hop', [(472, 229)]), 1: (42, 320, 45, 19, 'burn', []), 2: (135, 245, 136, 11, 'hop', [])},
    'w1_3': {0: (28, 288, 30, 10, 'hop', [(488, 245)]), 1: (50, 320, 53, 19, 'burn', []), 2: (130, 272, 129, 9, 'hop', [(2064, 229)])},
}
failures = []


def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok:
        failures.append(what)


levels = sys.argv[1:] or list(PLAN)

with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    for level in levels:
        page = br.new_page(viewport={'width': 640, 'height': 360})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(BASE + '?lowres&unlock')
        page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
        kb = page.keyboard
        wait = page.wait_for_timeout

        def start():
            page.evaluate(f"() => {{ window.__game.scene.getScene('TitleScene').scene.start('GameScene', {{ level: '{level}' }}); }}")
            page.wait_for_function("() => window.__game.scene.isActive('GameScene')")
            wait(900)

        def state(slot=None):
            st = page.evaluate(f"""() => {{ const g = {GS}, b = g.player.body;
              return {{ x: b.center.x, y: b.bottom, vy: b.velocity.y, grounded: b.blocked.down || b.touching.down,
                        n: g.stageShards.size, slots: [...g.stageShards], dead: g.player.isDead }}; }}""")
            st['has'] = slot is not None and slot in st['slots']
            return st

        def teleport(col, y):
            page.evaluate(f"() => {{ const g = {GS}; g.player.setPosition({col * T + T / 2}, {y - 1}); g.player.body.setVelocity(0, 0); }}")
            wait(500)

        def collect(slot, plan):
            # a leaf wisp can knock the bot off a ledge, like a player: allow three tries from the start spot
            for _ in range(3):
                if attempt(slot, plan):
                    return True
            return False

        def attempt(slot, plan):
            col, y, tcol, trow, mode, stops = plan
            if state()['dead']:
                wait(2500)                                # respawn
            teleport(col, y)
            if mode == 'burn':
                kb.down('1'); wait(80); kb.up('1'); wait(100)
                kb.down('d'); wait(500); kb.up('d')
                for _ in range(40):                       # fire every 400 ms until the ring is gone
                    page.evaluate(f"() => {GS}.elements.energy.refill()")
                    kb.down('k'); wait(70); kb.up('k'); wait(330)
                    # the crate just left of the shard is the door: stop firing once it is gone
                    if not page.evaluate(f"() => {GS}.puzzleObjects.some(o => o.kind === 'crate' && o.col === {tcol - 1} && o.row === {trow} && !o.removed)"):
                        break
                kb.down('d')
                for _ in range(40):
                    wait(100)
                    if state(slot)['has']:
                        break
                kb.up('d')
                return state(slot)['has']
            # hop: jump toward each stop (a ledge to land on), then toward the shard; brake in the air near the goal
            goals = [(sx, sy) for sx, sy in stops] + [(tcol * T + T / 2, None)]
            holding = None
            space = False

            def release_all():
                nonlocal holding, space
                if holding:
                    kb.up(holding); holding = None
                if space:
                    kb.up('Space'); space = False

            for gx, gy in goals:
                for _ in range(120):                      # ~6 s per stop
                    s = state()
                    if s['dead']:
                        release_all()
                        return False
                    if slot in s['slots']:
                        release_all()
                        return True
                    dx = gx - s['x']
                    if gy is not None and s['grounded'] and abs(dx) < 20 and abs(s['y'] - gy) < 4:
                        break
                    airborne = not s['grounded']
                    near = abs(dx) < (40 if s['vy'] > 0 else 14)
                    d = None if (airborne and near) or abs(dx) < 5 else ('d' if dx > 0 else 'a')
                    if d != holding:
                        if holding:
                            kb.up(holding)
                        if d:
                            kb.down(d)
                        holding = d
                    if s['grounded'] and not space:
                        kb.down('Space'); space = True   # hold while rising for the full jump
                    elif space and (s['vy'] >= 0):
                        kb.up('Space'); space = False
                    wait(50)
                else:
                    release_all()
                    return state(slot)['has']
            release_all()
            return state(slot)['has']

        for slot, plan in PLAN[level].items():
            start()
            check(collect(slot, plan), f'{level} shard {slot} reachable ({plan[4]})')

        # ---- collected shards are banked only when the level is cleared ----
        start()
        page.evaluate(f"() => window.__game.registry.get('progress').reset()")
        page.evaluate(f"() => {{ const g = {GS}; g.stageShards.add(0); g.stageShards.add(2); }}")
        hud = page.evaluate(f"() => {GS}.hudState().shards")
        check(hud == {'have': 2, 'total': 3}, f'{level} HUD counts shards of this run {hud}')
        saved_before = page.evaluate(f"() => window.__game.registry.get('progress').collectedShards('{level}')")
        check(saved_before == [], f'{level} nothing banked before the clear {saved_before}')
        page.evaluate(f"() => {GS}.reachGoal()")
        page.wait_for_function("() => window.__game.scene.isActive('StageClearScene')")
        wait(300)
        texts = page.evaluate("() => window.__game.scene.getScene('StageClearScene').children.list.filter(o => typeof o.text === 'string').map(o => o.text)")
        check(any('Spirit Shards: 2/3  (+2 new)' in t for t in texts), f'{level} clear screen shows the shards {texts}')
        saved = page.evaluate(f"() => window.__game.registry.get('progress').collectedShards('{level}')")
        check(saved == [0, 2], f'{level} banked on clear {saved}')
        raw = page.evaluate("() => JSON.parse(localStorage.getItem('elemental-spirit:progress')).shards")
        check(raw.get(level) == [0, 2], f'{level} written to the save {raw}')

        # ---- replay: banked shards are ghosts (not collectible), the missing one still is ----
        start()
        hud = page.evaluate(f"() => {GS}.hudState().shards")
        check(hud == {'have': 2, 'total': 3}, f'{level} replay HUD starts from the saved shards {hud}')
        slot, plan = 1, PLAN[level][1]
        check(collect(slot, plan), f'{level} the missing shard 1 can still be collected on replay')
        hud = page.evaluate(f"() => {GS}.hudState().shards")
        check(hud == {'have': 3, 'total': 3}, f'{level} replay HUD {hud}')

        # ---- dying and giving up does not bank anything ----
        page.evaluate(f"() => window.__game.registry.get('progress').reset()")
        start()
        page.evaluate(f"() => {GS}.stageShards.add(1)")
        page.evaluate("() => { window.__game.scene.stop('UIScene'); window.__game.scene.stop('GameScene'); window.__game.scene.start('WorldMapScene'); }")
        wait(300)
        check(page.evaluate(f"() => window.__game.registry.get('progress').collectedShards('{level}')") == [], f'{level} leaving the level without clearing banks nothing')
        check(not errors, f'{level} no page errors {errors}')
        page.close()
    br.close()

sys.exit(1 if failures else 0)
