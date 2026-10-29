"""Aclaire animation check (needs `npm run build` + preview on :4173).

1. every frame of every `player` animation: body is 11x31, feet on the sprite bottom, centred on x
2. real keyboard input plays the expected animations: run, attack_1..3, jump_up -> jump_peak -> fall -> land,
   double_jump, cast, dash, ground_slam, hurt, dead

usage: python3 player_anims.py
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
GS = "window.__game.scene.getScene('GameScene')"
failures = []


def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok:
        failures.append(what)


with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    page = br.new_page(viewport={'width': 640, 'height': 360})
    page.goto(BASE + '?lowres&unlock')
    page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
    page.evaluate("() => { window.__game.scene.getScene('TitleScene').scene.start('GameScene', { level: 'w1_1' }); }")
    page.wait_for_function("() => window.__game.scene.isActive('GameScene')")
    page.wait_for_timeout(800)
    # x = 232 is open ground in 1-1
    page.evaluate(f"() => {{ const g = {GS}; g.enemies.getChildren().forEach(e => e.vanish()); g.player.setPosition(232, 319); }}")
    page.wait_for_timeout(600)

    # ---- 1. frame alignment (player.update frozen, frames set by hand, restored afterwards) ----
    bad = page.evaluate(f"""() => {{
      const g = {GS}, p = g.player, update = p.update;
      p.update = () => {{}}; p.body.setAllowGravity(false);
      const json = g.cache.json.get('animations'), out = [];
      let total = 0;
      for (const v of Object.values(json)) {{
        if (v.atlas !== 'player') continue;
        for (let i = 0; i < v.frames; i++) {{
          const name = v.prefix + String(i).padStart(3, '0'); total++;
          p.anims.stop(); p.setTexture('player', name); p.syncBodyToFrame();
          const b = p.body;
          if (Math.abs(b.bottom - p.y) > 0.51 || Math.abs(b.center.x - p.x) > 0.51 || b.width !== 11 || b.height !== 31) out.push(name);
        }}
      }}
      p.update = update; p.body.setAllowGravity(true);
      return {{ total, out }};
    }}""")
    check(bad['total'] >= 59 and not bad['out'], f"{bad['total']} frames aligned (body 11x31, feet and centre on the sprite pivot) {bad['out']}")
    page.wait_for_timeout(500)

    # ---- 2. real input ----
    page.evaluate(f"""() => {{
      const g = {GS}; window.__seq = []; let last = '';
      g.events.on('postupdate', () => {{
        const a = g.player.anims.currentAnim; const k = a ? a.key.replace('player_', '') : '-';
        if (k !== last) {{ window.__seq.push(k); last = k; }}
      }});
    }}""")
    kb = page.keyboard

    def tap(key, ms=80):
        kb.down(key); page.wait_for_timeout(ms); kb.up(key)

    def sequence(label, expect, action):
        page.evaluate("() => { window.__seq = []; }")
        action()
        seq = page.evaluate("() => window.__seq")
        # expect must appear in order (other animations may be interleaved)
        it = iter(seq)
        ok = all(any(s == e for s in it) for e in expect)
        check(ok, f"{label}: {' > '.join(seq)}")
        page.wait_for_timeout(600)

    def run():
        kb.down('d'); page.wait_for_timeout(400); kb.up('d'); page.wait_for_timeout(300)

    def combo():
        for _ in range(3):
            tap('j', 60); page.wait_for_timeout(230)
        page.wait_for_timeout(500)

    def jump():
        tap('Space', 450); page.wait_for_timeout(1000)

    def double_jump():
        tap('Space'); page.wait_for_timeout(250); tap('Space'); page.wait_for_timeout(1200)

    def cast():
        tap('1'); page.wait_for_timeout(100); tap('k', 60); page.wait_for_timeout(600)

    def dash():
        tap('3'); page.wait_for_timeout(100); tap('Space'); page.wait_for_timeout(200); tap('k', 60); page.wait_for_timeout(1000)

    def slam():
        tap('4'); page.wait_for_timeout(100); tap('Space', 300); page.wait_for_timeout(150); tap('k', 60); page.wait_for_timeout(1400)

    def hurt():
        page.evaluate(f"() => {{ const p = {GS}.player; p.takeHit(p.x - 20); }}"); page.wait_for_timeout(900)

    sequence('run', ['run'], run)
    sequence('combo', ['attack_1', 'attack_2', 'attack_3'], combo)
    sequence('jump', ['jump_up', 'jump_peak', 'fall', 'land'], jump)
    sequence('double jump', ['jump_up', 'double_jump', 'land'], double_jump)
    sequence('fire cast', ['cast'], cast)
    sequence('wind air dash', ['fall', 'dash'], dash)
    sequence('earth slam', ['ground_slam', 'land'], slam)
    sequence('hurt', ['hurt'], hurt)
    page.evaluate(f"() => {{ window.__done = false; {GS}.player.on('player-death-done', () => {{ window.__done = true; }}); }}")
    sequence('death', ['dead'], lambda: (page.evaluate(f"() => {GS}.killPlayer()"), page.wait_for_timeout(1500)))
    check(page.evaluate("() => window.__done"), 'death animation finishes (player-death-done)')
    br.close()

sys.exit(1 if failures else 0)
