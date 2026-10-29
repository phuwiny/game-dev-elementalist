"""One-way platform: feet rise through the deck from below, then land on top and stay (needs `npm run build` + preview on :4173).

usage: python3 oneway.py
The jump key is simulated in-page (stubbed controls) because the point is the physics, not the keyboard.
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
GS = "window.__game.scene.getScene('GameScene')"
DECK_TOP = 280  # one-way deck placed 40 px above the ground (ground top = 320)

with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
    page = br.new_page(viewport={'width': 640, 'height': 360})
    page.goto(BASE + '?lowres')
    page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
    page.evaluate("() => { window.__game.scene.getScene('TitleScene').scene.start('GameScene', { level: 'w1_1' }); }")
    page.wait_for_function("() => window.__game.scene.isActive('GameScene')")
    page.wait_for_timeout(800)
    # x = 232 is open ground in 1-1 (the vine wall at col 18 would block the jump)
    page.evaluate(f"""() => {{
      const g = {GS};
      g.enemies.getChildren().forEach(e => e.vanish());
      g.addOneWayPlatform(232, {DECK_TOP}, 64);
      g.player.setPosition(232, 319); g.player.body.setVelocity(0, 0);
      const c = g.controls, isDown = c.isDown.bind(c), justPressed = c.justPressed.bind(c);
      window.__hold = false; window.__press = false;
      c.isDown = (a) => (a === 'jump' && window.__hold) || isDown(a);
      c.justPressed = (a) => {{ if (a === 'jump' && window.__press) {{ window.__press = false; return true; }} return justPressed(a); }};
    }}""")
    page.wait_for_timeout(500)
    page.evaluate("() => { window.__hold = true; window.__press = true; }")
    highest = 1e9
    for _ in range(20):
        page.wait_for_timeout(50)
        highest = min(highest, page.evaluate(f"() => {GS}.player.body.bottom"))
    page.evaluate("() => { window.__hold = false; }")
    page.wait_for_timeout(1200)
    final, grounded = page.evaluate(f"() => [{GS}.player.body.bottom, {GS}.player.body.blocked.down || {GS}.player.body.touching.down]")
    br.close()

ok = highest < DECK_TOP - 10 and grounded and abs(final - DECK_TOP) < 1.5
print(f"highest feet y {highest:.0f} (deck {DECK_TOP}), final feet y {final:.1f}, grounded {grounded}")
print('PASS one-way: rises through from below, lands on top' if ok else 'FAIL one-way')
sys.exit(0 if ok else 1)
