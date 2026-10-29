"""Save-failure warning (needs `npm run build` + preview on :4173).

usage: python3 save_warning.py
 - control: working storage -> no warning
 - localStorage blocked (private mode): warning on Title, still shows on the World Map, game keeps running
 - setItem throws (quota): no warning until the first failed save, then it appears in the active scene and in the in-game HUD
"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GAME_URL', 'http://localhost:4173/')
TEXT = '! Cannot save progress'
BLOCK_STORAGE = "Object.defineProperty(window, 'localStorage', { get() { throw new Error('SecurityError'); } });"
THROW_ON_WRITE = "Storage.prototype.setItem = function () { throw new Error('QuotaExceededError'); };"
failures = []


def check(ok, what):
    print(('PASS ' if ok else 'FAIL ') + what)
    if not ok:
        failures.append(what)


def warning_visible(page):
    return page.evaluate(
        """(text) => window.__game.scene.getScenes(true).some(
          s => s.children.list.some(o => o.text === text && o.visible))""",
        TEXT,
    )


def new_page(br, init=None):
    page = br.new_page(viewport={'width': 640, 'height': 360})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    if init:
        page.add_init_script(init)
    page.goto(BASE + '?lowres')
    page.wait_for_function("() => window.__game && window.__game.scene.isActive('TitleScene')")
    page.wait_for_timeout(300)
    return page, errors


with sync_playwright() as pw:
    br = pw.chromium.launch(args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])

    page, errors = new_page(br)
    check(not warning_visible(page), 'working storage: no warning on Title')
    page.close()

    page, errors = new_page(br, BLOCK_STORAGE)
    check(warning_visible(page), 'blocked localStorage: warning on Title')
    page.keyboard.down('Enter'); page.wait_for_timeout(80); page.keyboard.up('Enter')
    page.wait_for_function("() => window.__game.scene.isActive('WorldMapScene')")
    page.wait_for_timeout(300)
    check(warning_visible(page), 'blocked localStorage: warning on the World Map')
    check(not errors, f'blocked localStorage: no page errors {errors}')
    page.close()

    page, errors = new_page(br, THROW_ON_WRITE)
    check(not warning_visible(page), 'write quota error: nothing shown before the first save')
    page.evaluate("() => window.__game.registry.get('progress').markCleared('w1_1')")
    page.wait_for_timeout(200)
    check(warning_visible(page), 'write quota error: warning appears right after the failed save')
    page.evaluate("() => { window.__game.scene.getScene('TitleScene').scene.start('GameScene', { level: 'w1_1' }); }")
    page.wait_for_function("() => window.__game.scene.isActive('UIScene')")
    page.wait_for_timeout(500)
    check(warning_visible(page), 'write quota error: warning in the in-game HUD')
    check(not errors, f'write quota error: no page errors {errors}')
    br.close()

sys.exit(1 if failures else 0)
