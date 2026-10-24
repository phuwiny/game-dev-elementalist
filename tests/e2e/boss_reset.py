"""Boss state checks: arena closes on entry, death resets boss + reopens gate, phases log, HUD bar."""
import os
BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
SHOT_DIR = os.environ.get('SHOT_DIR', 'tests/e2e/shots')
os.makedirs(SHOT_DIR, exist_ok=True)
from playwright.sync_api import sync_playwright
GS = "window.__game.scene.getScene('GameScene')"
def st(page):
    return page.evaluate(f"""() => {{ const g = {GS}, b = g.boss; return {{ x: Math.round(g.player.x), active: b.isActive, state: b.phases.state,
      phase: b.phases.phase, hp: b.hp, shields: b.shields.filter(s=>!s.removed).length, gate: g.arenaGate.isClosed,
      hud: g.hudState().boss, goal: g.goalFlag.visible, lives: g.vitals.lives,
      bar: window.__game.scene.getScene('UIScene').bossLayer.visible }} }}""")
with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    page = br.new_page(); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
    page.goto(BASE + '?lowres')
    page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
    page.evaluate("() => window.__game.scene.getScene('TitleScene').scene.start('GameScene', { level: 'w1_3' })")
    page.wait_for_function("() => window.__game.scene.isActive('GameScene')"); page.wait_for_timeout(500)
    page.evaluate(f"() => {{ {GS}.enemies.getChildren().forEach(e=>e.vanish()); {GS}.player.respawn(161*16, 320); }}"); page.wait_for_timeout(300)
    print('before   ', st(page))
    page.keyboard.down("d"); page.wait_for_timeout(2000); page.keyboard.up('d'); page.wait_for_timeout(300)
    print('entered  ', st(page)); page.wait_for_timeout(2600); page.screenshot(path=f'{SHOT_DIR}/boss.png')
    # รอให้บอสโจมตีสักครั้ง แล้วเผาโล่ชั้นล่าง
    page.wait_for_timeout(3500)
    print('attacked ', st(page))
    page.evaluate(f"() => {GS}.killPlayer()")
    page.wait_for_function(f"() => !{GS}.player.isDead", timeout=8000); page.wait_for_timeout(600)
    print('respawned', st(page))
    page.keyboard.down("d"); page.wait_for_timeout(2000); page.keyboard.up('d'); page.wait_for_timeout(300)
    print('re-entered', st(page))
    # phase progression via the real API (sword/fire paths are covered by the bot run)
    for i in range(3):
        page.evaluate(f"() => {{ const b = {GS}.boss; b.shields.filter(s=>!s.removed).forEach(s => s.onElementHit('fire')); }}")
        page.wait_for_timeout(100)
        page.evaluate(f"() => {{ const b = {GS}.boss; for (let k = 0; k < 4; k++) b.hitWeakPoint(1); }}")
        page.wait_for_timeout(200)
        print(f'phase {i+1} done', st(page))
    page.wait_for_timeout(1500)
    print('after    ', st(page))
    print('errors', errs)
    br.close()
