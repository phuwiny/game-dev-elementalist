"""World Map pages per world (needs `npm run build` + preview on :4173).

usage: python3 worldmap.py
 - opens on World 1; LEFT/RIGHT move inside the world, then cross to the neighbouring world
 - World 2 has no stages yet: "Coming soon", ENTER is refused
 - both ends of the map stop; coming back from World 2 lands on the last stage of World 1
 - the map opens on the latest unlocked stage; DEL DEL on another page resets and returns to World 1
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
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
    page.goto(BASE + '?lowres')
    page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
    page.evaluate("() => localStorage.clear()")
    page.reload()
    page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
    page.wait_for_timeout(300)
    kb = page.keyboard

    def tap(key, ms=80):
        kb.down(key); page.wait_for_timeout(ms); kb.up(key); page.wait_for_timeout(250)

    def sel():
        s = page.evaluate("() => window.__game.scene.getScene('WorldMapScene').selection")
        return (s['world'], s['level'])

    def texts():
        return page.evaluate("() => window.__game.scene.getScene('WorldMapScene').children.list.filter(o => typeof o.text === 'string').map(o => o.text)")

    def on_map():
        return page.evaluate("() => window.__game.scene.isActive('WorldMapScene')")

    def open_map(data='{}'):
        page.evaluate(f"() => {{ window.__game.scene.getScenes(true).forEach(s => window.__game.scene.stop(s.sys.settings.key)); window.__game.scene.start('WorldMapScene', {data}); }}")
        page.wait_for_function("() => window.__game.scene.isActive('WorldMapScene')")
        page.wait_for_timeout(300)

    tap('Enter')                                      # Title: Adventure
    page.wait_for_function("() => window.__game.scene.isActive('WorldMapScene')")
    page.wait_for_timeout(300)
    check(sel() == (0, 0), f'fresh save opens on 1-1 {sel()}')
    check(any(t == 'WORLD 1 · EMBER WOODS' for t in texts()), 'World 1 title')
    check(any(t == 'Tidal Caverns >' for t in texts()) and not any(t.startswith('< ') for t in texts()), 'only the next world is hinted on the first page')

    tap('ArrowLeft')
    check(sel() == (0, 0), f'LEFT at the first stage stays {sel()}')
    tap('ArrowRight'); tap('ArrowRight')
    check(sel() == (0, 2), f'RIGHT moves inside the world {sel()}')
    check(any('Locked' in t for t in texts()), 'a locked stage says so')

    tap('ArrowRight')
    check(sel() == (1, -1), f'RIGHT past the last stage opens World 2 {sel()}')
    t = texts()
    check(any(x == 'WORLD 2 · TIDAL CAVERNS' for x in t) and any(x == 'Coming soon' for x in t), f'World 2 page {t[:2]}')
    check(any(x == '< Ember Woods' for x in t) and not any(x.endswith(' >') for x in t), 'only the previous world is hinted on the last page')
    tap('ArrowRight')
    check(sel() == (1, -1), f'RIGHT at the end of the map stays {sel()}')
    tap('Enter'); page.wait_for_timeout(300)
    check(on_map(), 'ENTER on a world without stages is refused')

    tap('ArrowLeft')
    check(sel() == (0, 2), f'LEFT from World 2 lands on the last stage of World 1 {sel()}')

    # latest unlocked stage, and the focus passed by other screens
    page.evaluate("() => window.__game.registry.get('progress').markCleared('w1_1')")
    open_map()
    check(sel() == (0, 1), f'opens on the latest unlocked stage {sel()}')
    open_map("{ focus: 'w1_1' }")
    check(sel() == (0, 0), f'opens on the focused stage {sel()}')

    # reset from another page
    tap('ArrowRight'); tap('ArrowRight'); tap('ArrowRight')
    check(sel() == (1, -1), f'back on World 2 {sel()}')
    tap('Delete'); tap('Delete'); page.wait_for_timeout(300)
    cleared = page.evaluate("() => window.__game.registry.get('progress').toJSON().cleared")
    check(cleared == [] and sel() == (0, 0), f'DEL DEL erases progress and returns to 1-1 {cleared} {sel()}')

    # play from the map still works
    tap('Enter')
    page.wait_for_function("() => window.__game.scene.isActive('UIScene')", timeout=8000)
    check(page.evaluate("() => window.__game.scene.getScene('GameScene').def.key") == 'w1_1', 'ENTER starts the selected stage')
    check(not errors, f'no page errors {errors}')
    br.close()

sys.exit(1 if failures else 0)
